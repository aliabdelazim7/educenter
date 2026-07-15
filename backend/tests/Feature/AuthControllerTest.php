<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Tenant\TenantManager;
use Spatie\Permission\PermissionRegistrar;

class AuthControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        TenantManager::clear();
    }

    public function test_user_can_register_new_tenant_and_owner()
    {
        $response = $this->postJson('/api/v1/register', [
            'tenant_name' => 'Delta Center',
            'subdomain' => 'delta',
            'name' => 'John Owner',
            'email' => 'john@delta.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $response->assertJsonStructure([
            'message',
            'user' => ['id', 'name', 'email', 'roles', 'permissions'],
            'tenant' => ['id', 'name', 'subdomain'],
            'access_token',
            'token_type'
        ]);

        // Verify in database
        $this->assertDatabaseHas('tenants', [
            'subdomain' => 'delta',
            'name' => 'Delta Center',
        ]);

        $tenant = Tenant::where('subdomain', 'delta')->first();

        // Scope to tenant to check user creation
        TenantManager::setTenant($tenant);
        $this->assertDatabaseHas('users', [
            'tenant_id' => $tenant->id,
            'email' => 'john@delta.com',
        ]);

        $user = User::where('email', 'john@delta.com')->first();
        app(PermissionRegistrar::class)->setPermissionsTeamId($tenant->id);
        $this->assertTrue($user->hasRole('Owner'));
    }

    public function test_user_cannot_login_without_resolving_tenant()
    {
        $response = $this->postJson('/api/v1/login', [
            'email' => 'john@delta.com',
            'password' => 'password123',
        ]);

        // Unresolved tenant should block the request with 404
        $response->assertStatus(404);
        $response->assertJsonStructure(['error']);
    }

    public function test_user_can_login_with_resolved_tenant()
    {
        // 1. Register a tenant and owner
        $this->postJson('/api/v1/register', [
            'tenant_name' => 'Delta Center',
            'subdomain' => 'delta',
            'name' => 'John Owner',
            'email' => 'john@delta.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $tenant = Tenant::where('subdomain', 'delta')->first();

        // 2. Try logging in with the tenant header
        $response = $this->postJson('/api/v1/login', [
            'email' => 'john@delta.com',
            'password' => 'password123',
        ], [
            'X-Tenant-ID' => $tenant->id
        ]);

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'message',
            'user',
            'access_token',
            'token_type'
        ]);

        // 3. Try logging in with wrong password
        $response = $this->postJson('/api/v1/login', [
            'email' => 'john@delta.com',
            'password' => 'wrongpassword',
        ], [
            'X-Tenant-ID' => $tenant->id
        ]);

        $response->assertStatus(401);
    }

    public function test_user_can_get_profile_and_logout()
    {
        // 1. Register and get token
        $registerRes = $this->postJson('/api/v1/register', [
            'tenant_name' => 'Delta Center',
            'subdomain' => 'delta',
            'name' => 'John Owner',
            'email' => 'john@delta.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $token = $registerRes['access_token'];
        $tenantId = $registerRes['tenant']['id'];

        // 2. Fetch profile (/me)
        $response = $this->getJson('/api/v1/me', [
            'Authorization' => 'Bearer ' . $token,
            'X-Tenant-ID' => $tenantId,
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'email' => 'john@delta.com',
        ]);
        $response->assertJsonStructure([
            'user' => ['id', 'name', 'email', 'roles', 'permissions']
        ]);

        // 3. Logout
        $logoutRes = $this->postJson('/api/v1/logout', [], [
            'Authorization' => 'Bearer ' . $token,
            'X-Tenant-ID' => $tenantId,
        ]);

        $logoutRes->assertStatus(200);
        $logoutRes->assertJson([
            'message' => 'Logged out successfully.'
        ]);

        // Clear resolved user in auth guard for testing subsequent request
        auth()->forgetUser();

        // 4. Try fetching profile again -> should be unauthorized
        $response = $this->getJson('/api/v1/me', [
            'Authorization' => 'Bearer ' . $token,
            'X-Tenant-ID' => $tenantId,
        ]);
        $response->assertStatus(401);
    }
}
