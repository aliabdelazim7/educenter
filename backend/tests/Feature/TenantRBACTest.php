<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Tenant\TenantManager;
use App\Actions\InitializeTenantRBACAction;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class TenantRBACTest extends TestCase
{
    use RefreshDatabase;

    protected InitializeTenantRBACAction $initRBAC;

    protected function setUp(): void
    {
        parent::setUp();
        $this->initRBAC = new InitializeTenantRBACAction();
        TenantManager::clear();
    }

    public function test_roles_and_permissions_are_isolated_by_tenant()
    {
        // 1. Create Tenant A and initialize RBAC
        $tenantA = Tenant::create([
            'name' => 'Tenant A',
            'subdomain' => 'tenant-a',
        ]);
        $this->initRBAC->execute($tenantA);

        // 2. Create Tenant B and initialize RBAC
        $tenantB = Tenant::create([
            'name' => 'Tenant B',
            'subdomain' => 'tenant-b',
        ]);
        $this->initRBAC->execute($tenantB);

        // 3. Create User A in Tenant A and User B in Tenant B
        TenantManager::setTenant($tenantA);
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenantA->id);
        $userA = User::create([
            'name' => 'User A',
            'email' => 'user-a@example.com',
            'password' => bcrypt('password'),
        ]);

        TenantManager::setTenant($tenantB);
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenantB->id);
        $userB = User::create([
            'name' => 'User B',
            'email' => 'user-b@example.com',
            'password' => bcrypt('password'),
        ]);

        // 4. Under Tenant A: Assign 'Owner' to User A, and 'Reception' to User B (wait, User B is in Tenant B, but let's test isolation)
        TenantManager::setTenant($tenantA);
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenantA->id);

        $userA->assignRole('Owner');

        $this->assertTrue($userA->hasRole('Owner'));
        $this->assertTrue($userA->can('manage branches'));

        // 5. Switch to Tenant B context
        TenantManager::setTenant($tenantB);
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenantB->id);

        $userB->assignRole('Reception');

        $this->assertTrue($userB->hasRole('Reception'));
        $this->assertFalse($userB->hasRole('Owner'));
        // Reception does not have 'manage branches' permission
        $this->assertFalse($userB->can('manage branches'));
        // Reception does have 'manage pos' permission
        $this->assertTrue($userB->can('manage pos'));

        // 6. Verify cross-tenant isolation: User A has NO roles or permissions under Tenant B context!
        $userA->unsetRelation('roles');
        $userA->unsetRelation('permissions');
        $this->assertFalse($userA->hasRole('Owner'));
        $this->assertFalse($userA->can('manage branches'));
    }
}
