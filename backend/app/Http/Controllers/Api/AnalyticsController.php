<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentProfile;
use App\Models\Payment;
use App\Models\Attendance;
use App\Models\AcademicSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    /**
     * Retrieve live KPI statistics and daily revenue charts for the dashboard.
     */
    public function summary(Request $request): JsonResponse
    {
        $branchId = $request->query('branch_id');

        // 1. Active Students Count
        $activeStudentsCount = StudentProfile::when($branchId, function ($query) use ($branchId) {
            $query->whereHas('groups', function ($g) use ($branchId) {
                $g->where('branch_id', $branchId);
            });
        })->count();

        // 2. Weekly Revenue sum
        $weeklyRevenue = (float) Payment::where('payment_date', '>=', now()->subDays(7))
            ->when($branchId, function ($query) use ($branchId) {
                $query->whereHas('invoice.studentProfile.groups', function ($g) use ($branchId) {
                    $g->where('branch_id', $branchId);
                });
            })->sum('amount');

        // 3. Attendance Rate
        $totalAttendanceRecords = Attendance::when($branchId, function ($query) use ($branchId) {
            $query->whereHas('academicSession.group', function ($g) use ($branchId) {
                $g->where('branch_id', $branchId);
            });
        })->count();

        $presentCount = Attendance::whereIn('status', ['present', 'late'])
            ->when($branchId, function ($query) use ($branchId) {
                $query->whereHas('academicSession.group', function ($g) use ($branchId) {
                    $g->where('branch_id', $branchId);
                });
            })->count();

        $attendanceRate = $totalAttendanceRecords > 0
            ? round(($presentCount / $totalAttendanceRecords) * 100, 1)
            : 100.0;

        // 4. Upcoming Sessions (Scheduled sessions in the next 7 days)
        $upcomingSessionsCount = AcademicSession::where('status', 'scheduled')
            ->whereBetween('date', [now()->toDateString(), now()->addDays(7)->toDateString()])
            ->when($branchId, function ($query) use ($branchId) {
                $query->whereHas('group', function ($g) use ($branchId) {
                    $g->where('branch_id', $branchId);
                });
            })->count();

        // 5. Daily Revenue metrics for the last 7 days (to feed the dashboard line chart)
        $dailyRevenue = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $label = now()->subDays($i)->format('D'); // Mon, Tue...
            
            $revenue = (float) Payment::whereDate('payment_date', $date)
                ->when($branchId, function ($query) use ($branchId) {
                    $query->whereHas('invoice.studentProfile.groups', function ($g) use ($branchId) {
                        $g->where('branch_id', $branchId);
                    });
                })->sum('amount');
            
            $dailyRevenue[] = [
                'day' => $label,
                'revenue' => $revenue
            ];
        }

        return response()->json([
            'data' => [
                'kpis' => [
                    'active_students' => $activeStudentsCount,
                    'weekly_revenue' => $weeklyRevenue,
                    'attendance_rate' => $attendanceRate,
                    'upcoming_sessions' => $upcomingSessionsCount
                ],
                'daily_revenue' => $dailyRevenue
            ]
        ]);
    }
}
