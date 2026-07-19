<?php

namespace App\Actions;

use App\Models\Tenant;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class InitializeTenantRBACAction
{
    public function execute(Tenant $tenant): void
    {
        // Bind Spatie permissions context to this tenant
        $registrar = app(PermissionRegistrar::class);
        $registrar->setPermissionsTeamId($tenant->id);

        // Define permissions
        $permissions = [
            // Branches
            'manage branches',
            'view branches',

            // Academic
            'manage academic', // courses, groups, sessions, subjects, grades
            'view academic',

            // Students
            'manage students',
            'view students',

            // Teachers
            'manage teachers',
            'view teachers',

            // Attendance
            'mark attendance',
            'view attendance',

            // Homework & Exams
            'manage homework',
            'grade homework',
            'manage exams',
            'grade exams',

            // Financials
            'manage financial', // invoices, payments, expenses, ledger
            'view financial',

            // POS
            'manage pos',
            'view pos',

            // Inventory
            'manage inventory',
            'view inventory',

            // Media
            'manage media',

            // System Logs & Settings
            'view audit logs',
            'manage settings',
        ];

        // Create permissions for this guard (api)
        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // Create roles and assign permissions
        $ownerRole = Role::findOrCreate('Owner', 'web');
        $ownerRole->syncPermissions(Permission::all());

        $adminRole = Role::findOrCreate('Admin', 'web');
        $adminRole->syncPermissions([
            'view branches',
            'manage branches',
            'view academic',
            'manage academic',
            'view students',
            'manage students',
            'view teachers',
            'manage teachers',
            'view attendance',
            'mark attendance',
            'manage homework',
            'grade homework',
            'manage exams',
            'grade exams',
            'view financial',
            'manage financial',
            'view pos',
            'manage pos',
            'view inventory',
            'manage inventory',
            'manage media',
            'view audit logs',
            'manage settings',
        ]);

        $receptionRole = Role::findOrCreate('Reception', 'web');
        $receptionRole->syncPermissions([
            'view branches',
            'view academic',
            'view students',
            'manage students',
            'view teachers',
            'view attendance',
            'mark attendance',
            'view pos',
            'manage pos',
            // The POS screen lists products to sell, so selling requires
            // reading the catalogue.
            'view inventory',
            'view financial',
        ]);

        $accountantRole = Role::findOrCreate('Accountant', 'web');
        $accountantRole->syncPermissions([
            'view branches',
            'view financial',
            'manage financial',
            'view pos',
            'view inventory',
            // Payroll reporting computes teacher commissions from the roster.
            'view teachers',
        ]);

        $teacherRole = Role::findOrCreate('Teacher', 'web');
        $teacherRole->syncPermissions([
            'view academic',
            'view students',
            'view attendance',
            'mark attendance',
            'manage homework',
            'grade homework',
            'grade exams',
        ]);

        $assistantRole = Role::findOrCreate('Teacher Assistant', 'web');
        $assistantRole->syncPermissions([
            'view academic',
            'view students',
            'view attendance',
            'mark attendance',
            'grade homework',
        ]);

        // Students and parents get no directory-wide permissions: 'view students'
        // would expose the whole roster. Their access is limited to their own
        // records through the dedicated /portal endpoints.
        $parentRole = Role::findOrCreate('Parent', 'web');
        $parentRole->syncPermissions([]);

        $studentRole = Role::findOrCreate('Student', 'web');
        $studentRole->syncPermissions([]);

        // Seed default grades for the tenant
        $defaults = [
            'الصف الأول الثانوي',
            'الصف الثاني الثانوي',
            'الصف الثالث الثانوي',
            'Grade 11',
            'Grade 12'
        ];
        foreach ($defaults as $name) {
            \App\Models\Grade::firstOrCreate([
                'tenant_id' => $tenant->id,
                'name' => $name
            ]);
        }
    }
}
