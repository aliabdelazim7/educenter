<?php

use Illuminate\Database\Migrations\Migration;
use App\Models\Tenant;
use App\Models\Grade;

return new class extends Migration {
    public function up(): void
    {
        // Seed default grades for all existing tenants to ensure they have valid UUIDs
        $tenants = Tenant::all();
        foreach ($tenants as $tenant) {
            \App\Tenant\TenantManager::setTenant($tenant);

            $defaults = [
                'الصف الأول الثانوي',
                'الصف الثاني الثانوي',
                'الصف الثالث الثانوي',
                'Grade 11',
                'Grade 12'
            ];

            foreach ($defaults as $name) {
                Grade::firstOrCreate([
                    'tenant_id' => $tenant->id,
                    'name' => $name
                ]);
            }
        }
    }

    public function down(): void
    {
        // No rollback required for data seeding migration
    }
};
