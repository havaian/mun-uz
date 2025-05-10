const AuthModel = require('../auth/model');

const seedUsers = [
    {
        username: process.env.ADMIN_USER,
        password: process.env.ADMIN_PASS,
        role: 'admin'
    },
    // You can add more initial users here
];

async function seedDatabase() {
    try {
        console.log('Starting database seeding...');

        // Seed users
        for (const userData of seedUsers) {
            const existingUser = await AuthModel.findUserByUsername(userData.username);
            if (!existingUser) {
                await AuthModel.createUser(userData);
                console.log(`Created user: ${userData.username}`);
            } else {
                console.log(`User already exists: ${userData.username}`);
            }
        }

        console.log('Database seeding completed');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
}

module.exports = seedDatabase;