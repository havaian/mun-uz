<template>
    <div class="py-10">
        <h1 class="text-4xl font-bold text-center text-gray-900 mb-8">Welcome to MUN.UZ</h1>

        <div class="max-w-3xl mx-auto">
            <div class="card mb-8">
                <h2 class="text-2xl font-bold mb-4">Platform for Model UN Events</h2>
                <p class="mb-4">MUN.UZ provides a comprehensive platform for organizing and conducting Model UN events,
                    with features for administrators, presidium members, and delegates.</p>

                <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                    <router-link to="/login" class="btn btn-primary text-center">
                        Admin/Presidium Login
                    </router-link>
                    <router-link to="/delegate/auth" class="btn btn-secondary text-center">
                        Delegate Access
                    </router-link>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="card">
                    <h3 class="text-xl font-bold mb-2">Administrators</h3>
                    <ul class="list-disc list-inside space-y-1">
                        <li>Create and manage events</li>
                        <li>Set up committees</li>
                        <li>Assign presidium members</li>
                        <li>Generate QR codes for delegates</li>
                    </ul>
                </div>

                <div class="card">
                    <h3 class="text-xl font-bold mb-2">Presidium</h3>
                    <ul class="list-disc list-inside space-y-1">
                        <li>Manage committee sessions</li>
                        <li>Conduct roll calls</li>
                        <li>Review resolutions and amendments</li>
                        <li>Manage voting procedures</li>
                    </ul>
                </div>

                <div class="card">
                    <h3 class="text-xl font-bold mb-2">Delegates</h3>
                    <ul class="list-disc list-inside space-y-1">
                        <li>Access via QR code</li>
                        <li>Submit resolutions</li>
                        <li>Propose amendments</li>
                        <li>Participate in voting</li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    name: 'HomeView'
}
</script>