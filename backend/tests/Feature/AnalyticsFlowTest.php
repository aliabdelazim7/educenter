<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\Tenant;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\Payment;
use App\Models\Attendance;
use App\Models\AcademicSession;
use App\Models\Branch;
use App\Models\AcademicYear;
use App\Models\Subject;
use App\Models\Grade;
use App\Models\Group;
use App\Tenant\TenantManager;

class AnalyticsFlowTest extends TestCase
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
            'tenant_name' => 'Metrics Academy',
            'subdomain' => 'metrics',
            'name' => 'Analyst John',
            'email' => 'john@metrics.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);

        $this->token = $response['access_token'];
        $this->tenant = Tenant::where('subdomain', 'metrics')->first();
        
        // Scope TenantManager for model setup in test
        TenantManager::setTenant($this->tenant);
        $this->owner = User::where('email', 'john@metrics.com')->first();
    }

    public function test_analytics_summary_kpi_and_chart_calculations()
    {
        // 2. Setup mock students (2 students)
        $studentUser1 = User::create(['name' => 'Student A', 'email' => 'a@metrics.com', 'password' => 'password']);
        $studentProfile1 = StudentProfile::create(['user_id' => $studentUser1->id]);

        $studentUser2 = User::create(['name' => 'Student B', 'email' => 'b@metrics.com', 'password' => 'password']);
        $studentProfile2 = StudentProfile::create(['user_id' => $studentUser2->id]);

        // 3. Record a payment today ($75.00)
        Payment::create([
            'amount' => 75.00,
            'payment_method' => 'cash',
            'payment_date' => now()->toDateString(),
        ]);

        // 4. Setup mock academic group and session
        $branch = Branch::create(['name' => 'Main']);
        $year = AcademicYear::create(['name' => '2026', 'start_date' => '2026-01-01', 'end_date' => '2026-12-31']);
        $subject = Subject::create(['name' => 'Math']);
        $grade = Grade::create(['name' => '10']);
        $group = Group::create([
            'name' => 'Calculus Group',
            'branch_id' => $branch->id,
            'academic_year_id' => $year->id,
            'subject_id' => $subject->id,
            'grade_id' => $grade->id,
        ]);

        $session1 = AcademicSession::create([
            'group_id' => $group->id,
            'date' => now()->toDateString(),
            'start_time' => '09:00:00',
            'end_time' => '10:00:00',
            'status' => 'completed',
        ]);

        $session2 = AcademicSession::create([
            'group_id' => $group->id,
            'date' => now()->addDay()->toDateString(), // tomorrow (upcoming)
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'status' => 'scheduled',
        ]);

        // 5. Setup Attendance (1 Present, 1 Absent = 50.0% attendance rate)
        Attendance::create([
            'academic_session_id' => $session1->id,
            'student_profile_id' => $studentProfile1->id,
            'status' => 'present',
        ]);

        Attendance::create([
            'academic_session_id' => $session1->id,
            'student_profile_id' => $studentProfile2->id,
            'status' => 'absent',
        ]);

        // 6. Query Analytics API
        $response = $this->getJson('/api/v1/analytics/summary', [
            'Authorization' => 'Bearer ' . $this->token,
            'X-Tenant-ID' => $this->tenant->id,
        ]);

        $response->assertStatus(200);

        // Assert KPIs
        $this->assertEquals(2, $response['data']['kpis']['active_students']);
        $this->assertEquals(75.00, $response['data']['kpis']['weekly_revenue']);
        $this->assertEquals(50.0, $response['data']['kpis']['attendance_rate']);
        $this->assertEquals(1, $response['data']['kpis']['upcoming_sessions']);

        // Assert daily chart contains today's payment
        $chartData = $response['data']['daily_revenue'];
        $todayLabel = now()->format('D');
        $todayRecord = collect($chartData)->firstWhere('day', $todayLabel);
        
        $this->assertNotNull($todayRecord);
        $this->assertEquals(75.00, $todayRecord['revenue']);
    }
}
