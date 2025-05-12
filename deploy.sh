#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting MUN.UZ deployment process..."

# Function to check if docker compose command exists and use appropriate version
check_docker_compose() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

DOCKER_COMPOSE=$(check_docker_compose)

# Pull latest changes
echo "📥 Pulling latest changes from repository..."
git pull origin main || { echo "❌ Git pull failed"; exit 1; }

# Build new images without affecting running containers
echo "🏗️  Building new images..."
$DOCKER_COMPOSE build

# If builds succeeded, stop and recreate containers
echo "🔄 Swapping to new containers..."
$DOCKER_COMPOSE down
$DOCKER_COMPOSE up -d --force-recreate

# Check if services are running
echo "🔍 Checking service status..."
sleep 15  # Wait for services to initialize

# Check each service with improved health check logic
check_service() {
    local service=$1
    # Use a simpler approach that works with both docker-compose and docker compose
    local running=$($DOCKER_COMPOSE ps --services --filter "status=running" | grep -w "$service" || true)
    
    if [[ -n "$running" ]]; then
        echo "✅ $service is up and running"
    else
        echo "❌ $service failed to start properly"
        echo "Logs for $service:"
        $DOCKER_COMPOSE logs --tail=50 $service
        exit 1
    fi
}

# Check MUN.UZ services
check_service "api"
check_service "mongo"

# Check if backend is responding
echo "🔍 Checking backend API health..."
if curl -sf http://localhost:2223/health > /dev/null; then
    echo "✅ Backend API is responding"
else
    echo "❌ Backend API is not responding"
    $DOCKER_COMPOSE logs --tail=50 api
    exit 1
fi

# Check if frontend is accessible
echo "🔍 Checking frontend accessibility..."
if curl -sf http://localhost:80 > /dev/null; then
    echo "✅ Frontend is accessible"
else
    echo "⚠️  Frontend might not be accessible"
    # This could be normal if using a separate frontend server or if not yet deployed
fi

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

# Display service URLs
echo "
📋 MUN.UZ Services:
🌐 Frontend: http://localhost:2222
🔧 Backend API: http://localhost:2223
🗄️ MongoDB: mongodb://localhost:2227
"

echo "🎉 MUN.UZ deployment completed successfully!"

# Run any database migrations or additional setup if needed
echo "🔄 Performing post-deployment checks..."

# Check MongoDB connection
echo "🔍 Checking MongoDB connection..."
if $DOCKER_COMPOSE exec -T api node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/mun-uz')
  .then(() => { console.log('Connected to MongoDB'); process.exit(0); })
  .catch(err => { console.error('Failed to connect to MongoDB', err); process.exit(1); })
" &> /dev/null; then
    echo "✅ MongoDB connection successful"
else
    echo "❌ MongoDB connection failed"
    exit 1
fi

# Remind about setting up admin user if needed
echo "
💡 Reminder: Make sure an admin user is set up in the database.
   You can create one manually or through the application's initial setup process.
"

echo "📢🏁 Deployment complete! MUN.UZ platform is now running."