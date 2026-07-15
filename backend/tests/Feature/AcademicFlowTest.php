<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\Branch;
use App\Models\AcademicYear;
use App\Models\Subject;
use App\Models\Grade;
use App\Models\Classroom;
use App\Models\TeacherProfile;
use App\Models\StudentProfile;
use App\Models\Group;
use App\Models\AcademicSession;
use App\Models\Attendance;
use App\Tenant\TenantManager;

class AcademicFlowTest extends TestCase
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
            'tenant_name' => 'Oxford Academy',
            'subdomain' => 'oxford',
            'name' => 'Headmaster John',
            'email' => 'admin@oxford.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);

        $this->token = $response['access_token'];
        $this->tenant = Tenant::where('subdomain', 'oxford')->first();
        
        // Scope TenantManager for model setup in test
        TenantManager::setTenant($this->tenant);
        $this->owner = User::where('email', 'admin@oxford.com')->first();
    }

    public function test_complete_academic_and_attendance_flow()
    {
        // 2. Create a Branch via API
        $branchRes = $this->postJson('/api/v1/branches', [
            'name' => 'Main Campus',
            'address' => '123 Oxford Rd',
            'phone' => '+1234567890',
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $branchRes->assertStatus(201);
        $branchId = $branchRes['data']['id'];

        // 3. Create an Academic Year via API
        $yearRes = $this->postJson('/api/v1/academic-years', [
            'name' => '2026/2027',
            'start_date' => '2026-09-01',
            'end_date' => '2027-06-30',
            'status' => 'active',
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $yearRes->assertStatus(201);
        $yearId = $yearRes['data']['id'];

        // 4. Create Subject and Grade directly (simple database entries for lookup)
        $subject = Subject::create(['name' => 'Advanced Algebra', 'code' => 'MATH-301']);
        $grade = Grade::create(['name' => 'Grade 11']);
        $classroom = Classroom::create(['branch_id' => $branchId, 'name' => 'Room 204', 'capacity' => 30]);

        // 5. Create Teacher User and Student User under this tenant
        $teacherUser = User::create([
            'name' => 'Teacher Sarah',
            'email' => 'sarah@oxford.com',
            'password' => bcrypt('password'),
        ]);
        $teacherProfile = TeacherProfile::create([
            'user_id' => $teacherUser->id,
            'salary' => 3500.00,
            'commission_rate' => 15.00,
        ]);

        $studentUser = User::create([
            'name' => 'Student Billy',
            'email' => 'billy@oxford.com',
            'password' => bcrypt('password'),
        ]);
        $studentProfile = StudentProfile::create([
            'user_id' => $studentUser->id,
            'qr_code' => 'STUD-9028',
            'barcode' => '90280018',
        ]);

        // 6. Create a Class Group via API
        $groupRes = $this->postJson('/api/v1/groups', [
            'name' => 'Grade 11 Math - Alpha',
            'branch_id' => $branchId,
            'academic_year_id' => $yearId,
            'subject_id' => $subject->id,
            'grade_id' => $grade->id,
            'teacher_profile_id' => $teacherProfile->id,
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $groupRes->assertStatus(201);
        $groupId = $groupRes['data']['id'];

        // 7. Enroll Student into the Group via API
        $enrollRes = $this->postJson("/api/v1/groups/{$groupId}/enroll", [
            'student_profile_ids' => [$studentProfile->id]
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $enrollRes->assertStatus(200);

        // 8. Schedule an Academic Session via API
        $sessionRes = $this->postJson('/api/v1/academic-sessions', [
            'group_id' => $groupId,
            'classroom_id' => $classroom->id,
            'teacher_profile_id' => $teacherProfile->id,
            'date' => '2026-07-20',
            'start_time' => '10:00:00',
            'end_time' => '11:30:00',
            'status' => 'scheduled',
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $sessionRes->assertStatus(201);
        $sessionId = $sessionRes['data']['id'];

        // 9. Mark Attendance via API
        $attendanceRes = $this->postJson("/api/v1/academic-sessions/{$sessionId}/attendance", [
            'records' => [
                [
                    'student_profile_id' => $studentProfile->id,
                    'status' => 'present',
                    'remarks' => 'On time',
                ]
            ]
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $attendanceRes->assertStatus(200);

        // 10. Assert database changes
        $this->assertDatabaseHas('attendances', [
            'tenant_id' => $this->tenant->id,
            'academic_session_id' => $sessionId,
            'student_profile_id' => $studentProfile->id,
            'status' => 'present',
        ]);

        // Verify that session status automatically updated to 'completed'
        $this->assertDatabaseHas('academic_sessions', [
            'id' => $sessionId,
            'status' => 'completed',
        ]);

        // 11. Query Attendance via API
        $queryRes = $this->getJson("/api/v1/academic-sessions/{$sessionId}/attendance", [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $queryRes->assertStatus(200);
        $queryRes->assertJsonCount(1, 'data');
        $this->assertEquals('present', $queryRes['data'][0]['status']);
        $this->assertEquals('Student Billy', $queryRes['data'][0]['student_profile']['user']['name']);
    }
}
