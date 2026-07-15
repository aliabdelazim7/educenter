<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Tenant\TenantManager;
use Illuminate\Support\Facades\Route;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Clear tenant manager state before each test
        TenantManager::clear();
    }

    public function test_it_filters_queries_by_active_tenant()
    {
        // 1. Create two tenants
        $tenantA = Tenant::create([
            'name' => 'Tenant A',
            'subdomain' => 'tenant-a',
        ]);

        $tenantB = Tenant::create([
            'name' => 'Tenant B',
            'subdomain' => 'tenant-b',
        ]);

        // 2. Create users under respective tenants
        // We temporarily set the active tenant to create the users, or we can set it explicitly
        TenantManager::setTenant($tenantA);
        $userA = User::create([
            'name' => 'User A',
            'email' => 'user@example.com',
            'password' => bcrypt('password'),
        ]);

        TenantManager::setTenant($tenantB);
        $userB = User::create([
            'name' => 'User B',
            'email' => 'user@example.com', // same email is allowed in different tenants!
            'password' => bcrypt('password'),
        ]);

        // 3. Verify that querying under Tenant A only returns User A
        TenantManager::setTenant($tenantA);
        $usersForA = User::all();
        $this->assertCount(1, $usersForA);
        $this->assertEquals($userA->id, $usersForA->first()->id);
        $this->assertEquals('User A', $usersForA->first()->name);

        // 4. Verify that querying under Tenant B only returns User B
        TenantManager::setTenant($tenantB);
        $usersForB = User::all();
        $this->assertCount(1, $usersForB);
        $this->assertEquals($userB->id, $usersForB->first()->id);
        $this->assertEquals('User B', $usersForB->first()->name);

        // 5. Verify that when no tenant is active, all users are returned (or query scope is skipped)
        // Wait, our TenantScope only applies when TenantManager::isResolved() is true.
        TenantManager::clear();
        $allUsers = User::all();
        $this->assertCount(2, $allUsers);
    }

    public function test_it_automatically_assigns_tenant_id_on_creation()
    {
        $tenant = Tenant::create([
            'name' => 'Alpha Center',
            'subdomain' => 'alpha',
        ]);

        TenantManager::setTenant($tenant);

        $user = User::create([
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => bcrypt('password'),
        ]);

        $this->assertEquals($tenant->id, $user->tenant_id);
    }

    public function test_it_resolves_tenant_via_header()
    {
        $tenant = Tenant::create([
            'name' => 'Alpha Center',
            'subdomain' => 'alpha',
        ]);

        // Define a test route protected by the tenant middleware
        Route::middleware('tenant')->get('/test-tenant', function () {
            return response()->json([
                'resolved' => TenantManager::isResolved(),
                'tenant_id' => TenantManager::getTenantId(),
            ]);
        });

        // Test request without header -> Should return 404
        $response = $this->getJson('/test-tenant');
        $response->assertStatus(404);
        $response->assertJsonStructure(['error']);

        // Test request with valid header -> Should return 200
        $response = $this->getJson('/test-tenant', [
            'X-Tenant-ID' => $tenant->id
        ]);
        $response->assertStatus(200);
        $response->assertJson([
            'resolved' => true,
            'tenant_id' => $tenant->id,
        ]);
    }

    public function test_it_resolves_tenant_via_subdomain()
    {
        $tenant = Tenant::create([
            'name' => 'Alpha Center',
            'subdomain' => 'alpha',
        ]);

        // Define a test route protected by the tenant middleware
        Route::middleware('tenant')->get('/test-subdomain', function () {
            return response()->json([
                'resolved' => TenantManager::isResolved(),
                'subdomain' => TenantManager::getTenant()->subdomain,
            ]);
        });

        // Test request on subdomain using absolute URL
        $response = $this->getJson('http://alpha.educenter.com/test-subdomain');

        $response->assertStatus(200);
        $response->assertJson([
            'resolved' => true,
            'subdomain' => 'alpha',
        ]);
    }
}
