<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\Group;
use App\Models\Notification;
use App\Services\AuditLogger;
use App\Tenant\TenantManager;

class SystemUtilityFlowTest extends TestCase
{
    use RefreshDatabase;

    protected string $token;
    protected Tenant $tenant;
    protected User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        TenantManager::clear();

        // 1. Sign up a tenant and user to obtain token
        $response = $this->postJson('/api/v1/register', [
            'tenant_name' => 'Utility Academy',
            'subdomain' => 'utility',
            'name' => 'Super Admin',
            'email' => 'admin@utility.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);

        $this->token = $response['access_token'];
        $this->tenant = Tenant::where('subdomain', 'utility')->first();
        
        // Scope TenantManager for model setup in test
        TenantManager::setTenant($this->tenant);
        $this->owner = User::where('email', 'admin@utility.com')->first();
    }

    public function test_media_upload_endpoint()
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->image('avatar.jpg');

        $response = $this->postJson('/api/v1/media/upload', [
            'file' => $file,
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('media', [
            'tenant_id' => $this->tenant->id,
            'file_name' => 'avatar.jpg',
        ]);

        // Assert file is stored in a tenant-specific folder
        $filePath = str_replace('/storage/', '', $response['data']['file_path']);
        Storage::disk('public')->assertExists($filePath);
    }

    public function test_audit_logs_endpoint()
    {
        // 1. Log an action using AuditLogger service
        AuditLogger::log('create', 'App\Models\Branch', 'some-uuid', ['name' => 'Secondary Branch']);

        // 2. Query logs via API
        $response = $this->getJson('/api/v1/audit-logs', [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'action' => 'create',
            'model_type' => 'App\Models\Branch',
        ]);
    }

    public function test_notifications_lifecycle()
    {
        // 1. Create a notification for the owner
        $notification = Notification::create([
            'user_id' => $this->owner->id,
            'title' => 'Low Stock Warning',
            'message' => 'Notebook stock count is low',
            'type' => 'low_stock',
        ]);

        // 2. Fetch unread notifications
        $getRes = $this->getJson('/api/v1/notifications', [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $getRes->assertStatus(200);
        $getRes->assertJsonCount(1, 'data');
        $this->assertEquals('Low Stock Warning', $getRes['data'][0]['title']);

        // 3. Mark notification as read
        $readRes = $this->postJson("/api/v1/notifications/{$notification->id}/read", [], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $readRes->assertStatus(200);

        // 4. Verify unread count is now 0
        $getResAfter = $this->getJson('/api/v1/notifications', [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);
        $getResAfter->assertJsonCount(0, 'data');
    }

    public function test_global_search_endpoint()
    {
        // 1. Create Student Billy and Group Calculus
        $billyUser = User::create([
            'name' => 'Billy The Kid',
            'email' => 'billy@utility.com',
            'password' => bcrypt('password'),
        ]);
        StudentProfile::create([
            'user_id' => $billyUser->id,
            'qr_code' => 'BILLY-QR-99',
        ]);

        // Create mock dependencies for Group creation
        $branch = \App\Models\Branch::create(['name' => 'Primary Branch']);
        $year = \App\Models\AcademicYear::create(['name' => '2026', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $subject = \App\Models\Subject::create(['name' => 'Advanced Math']);
        $grade = \App\Models\Grade::create(['name' => 'Grade 10']);

        Group::create([
            'name' => 'Calculus Alpha Group',
            'branch_id' => $branch->id,
            'academic_year_id' => $year->id,
            'subject_id' => $subject->id,
            'grade_id' => $grade->id,
        ]);

        // 2. Search for student "Billy"
        $searchBilly = $this->getJson('/api/v1/search?query=Billy', [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $searchBilly->assertStatus(200);
        $this->assertCount(1, $searchBilly['data']['students']);
        $this->assertEquals('Billy The Kid', $searchBilly['data']['students'][0]['user']['name']);

        // 3. Search for group "Calc"
        $searchCalc = $this->getJson('/api/v1/search?query=Calc', [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $searchCalc->assertStatus(200);
        $this->assertCount(1, $searchCalc['data']['groups']);
        $this->assertEquals('Calculus Alpha Group', $searchCalc['data']['groups'][0]['name']);
    }

    public function test_media_upload_rejects_unsafe_extensions()
    {
        Storage::fake('public');

        $file = UploadedFile::fake()->create('malicious.php', 100, 'text/x-php');

        $response = $this->postJson('/api/v1/media/upload', [
            'file' => $file,
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_all_students_and_teachers_endpoints()
    {
        // 1. Create a student
        $studentUser = User::create([
            'name' => 'Student Billy',
            'email' => 'billy.kid@utility.com',
            'password' => bcrypt('password'),
        ]);
        StudentProfile::create([
            'user_id' => $studentUser->id,
            'qr_code' => 'BILLY-QR-99',
        ]);

        // 2. Create a teacher
        $teacherUser = User::create([
            'name' => 'Teacher Smith',
            'email' => 'smith@utility.com',
            'password' => bcrypt('password'),
        ]);
        \App\Models\TeacherProfile::create([
            'user_id' => $teacherUser->id,
        ]);

        // 3. Fetch all students
        $resStudents = $this->getJson('/api/v1/students', [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);
        $resStudents->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($resStudents['data']));

        // 4. Fetch all teachers
        $resTeachers = $this->getJson('/api/v1/teachers', [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);
        $resTeachers->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, count($resTeachers['data']));
    }
}
