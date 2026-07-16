<?php

namespace Tests\Feature;

use App\Models\AcademicYear;
use App\Models\Branch;
use App\Models\EducationalContent;
use App\Models\Exam;
use App\Models\ExamGrade;
use App\Models\Grade;
use App\Models\Group;
use App\Models\StudentProfile;
use App\Models\StudentTimelineEvent;
use App\Models\Subject;
use App\Models\TeacherProfile;
use App\Models\Tenant;
use App\Models\User;
use App\Tenant\TenantManager;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SimplifiedFlowTest extends TestCase
{
    use RefreshDatabase;

    protected string $token;
    protected Tenant $tenant;
    protected User $owner;

    protected function setUp(): void
    {
        parent::setUp();
        TenantManager::clear();

        // Sign up a tenant and user
        $response = $this->postJson('/api/v1/register', [
            'tenant_name' => 'Elite Academy',
            'subdomain' => 'elite',
            'name' => 'Super Admin',
            'email' => 'admin@elite.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);

        $this->token = $response['access_token'];
        $this->tenant = Tenant::where('subdomain', 'elite')->first();
        
        TenantManager::setTenant($this->tenant);
        $this->owner = User::where('email', 'admin@elite.com')->first();
    }

    public function test_educational_content_google_drive_link_creation()
    {
        $branch = Branch::create(['name' => 'Main Campus']);
        $year = AcademicYear::create(['name' => '2026', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $subject = Subject::create(['name' => 'Math']);
        $grade = Grade::create(['name' => 'Grade 10']);

        $group = Group::create([
            'name' => 'Group A',
            'branch_id' => $branch->id,
            'academic_year_id' => $year->id,
            'subject_id' => $subject->id,
            'grade_id' => $grade->id,
        ]);

        $response = $this->postJson('/api/v1/educational-contents', [
            'group_id' => $group->id,
            'title' => 'Calculus Homework 1',
            'content_type' => 'homework',
            'drive_link' => 'https://drive.google.com/file/d/123/view',
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('educational_contents', [
            'tenant_id' => $this->tenant->id,
            'title' => 'Calculus Homework 1',
            'drive_link' => 'https://drive.google.com/file/d/123/view',
        ]);
    }

    public function test_exam_creation_grading_and_chronological_timeline()
    {
        $branch = Branch::create(['name' => 'Main Campus']);
        $year = AcademicYear::create(['name' => '2026', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $subject = Subject::create(['name' => 'Math']);
        $grade = Grade::create(['name' => 'Grade 10']);

        $group = Group::create([
            'name' => 'Group A',
            'branch_id' => $branch->id,
            'academic_year_id' => $year->id,
            'subject_id' => $subject->id,
            'grade_id' => $grade->id,
        ]);

        $studentUser = User::create([
            'name' => 'Student Billy',
            'email' => 'billy@elite.com',
            'password' => bcrypt('password'),
        ]);

        $student = StudentProfile::create([
            'user_id' => $studentUser->id,
        ]);

        // 1. Create Exam
        $examRes = $this->postJson('/api/v1/exams', [
            'group_id' => $group->id,
            'title' => 'Midterm Exam',
            'exam_date' => '2026-07-16',
            'max_score' => 100,
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $examRes->assertStatus(201);
        $examId = $examRes['data']['id'];

        // 2. Grade Student
        $gradeRes = $this->postJson("/api/v1/exams/{$examId}/grade", [
            'grades' => [
                [
                    'student_profile_id' => $student->id,
                    'score' => 85.50,
                ]
            ]
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $gradeRes->assertStatus(200);

        // 3. Verify Grade Database
        $this->assertDatabaseHas('exam_grades', [
            'exam_id' => $examId,
            'student_profile_id' => $student->id,
            'score' => 85.50,
        ]);

        // 4. Verify Student Timeline Log
        $this->assertDatabaseHas('student_timeline_events', [
            'student_profile_id' => $student->id,
            'event_type' => 'exam',
            'title' => 'رصد درجة امتحان: Midterm Exam',
        ]);
    }

    public function test_student_and_teacher_registration()
    {
        // 1. Post new student
        $studentRes = $this->postJson('/api/v1/students', [
            'name' => 'Billy Student',
            'email' => 'billy.student@elite.com',
            'barcode' => 'BAR-BILLY-88',
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);
        $studentRes->assertStatus(201);
        $this->assertDatabaseHas('student_profiles', [
            'barcode' => 'BAR-BILLY-88',
        ]);
        $this->assertDatabaseHas('users', [
            'name' => 'Billy Student',
            'email' => 'billy.student@elite.com',
        ]);

        // 2. Post new teacher
        $teacherRes = $this->postJson('/api/v1/teachers', [
            'name' => 'Professor Smith',
            'email' => 'smith.prof@elite.com',
            'commission_percentage' => 45.00,
        ], [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);
        $teacherRes->assertStatus(201);
        $this->assertDatabaseHas('teacher_profiles', [
            'commission_percentage' => 45.00,
        ]);
    }
}
