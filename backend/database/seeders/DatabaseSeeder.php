<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(TenantDemoSeeder::class);
        // Depends on the demo tenant above; safe to re-run.
        $this->call(DemoAccountsSeeder::class);
    }
}
