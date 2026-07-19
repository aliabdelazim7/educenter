<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\LedgerEntry;
use App\Models\TeacherEarning;
use App\Models\TeacherProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * What each teacher has earned from selling their own material, and settling it.
 */
class TeacherEarningController extends Controller
{
    /**
     * Per-teacher totals plus the centre's own share, so the split is visible
     * on one screen.
     */
    public function index(Request $request): JsonResponse
    {
        $rows = TeacherEarning::with(['teacherProfile.user:id,name', 'product:id,name'])
            ->latest()
            ->get();

        $byTeacher = $rows
            ->groupBy('teacher_profile_id')
            ->map(function ($group) {
                $pending = $group->where('status', TeacherEarning::STATUS_PENDING);
                $settled = $group->where('status', TeacherEarning::STATUS_SETTLED);
                $first = $group->first();

                return [
                    'teacher_profile_id' => $first->teacher_profile_id,
                    'teacher' => $first->teacherProfile?->user?->name,
                    'pending_amount' => round((float) $pending->sum('amount'), 2),
                    'settled_amount' => round((float) $settled->sum('amount'), 2),
                    'total_amount' => round((float) $group->sum('amount'), 2),
                    'units_sold' => (int) $group->sum('quantity'),
                    // Gross value of their material sold, before the split.
                    'gross_sales' => round((float) $group->sum(fn ($e) => $e->unit_price * $e->quantity), 2),
                ];
            })
            ->values();

        $grossSales = round((float) $rows->sum(fn ($e) => $e->unit_price * $e->quantity), 2);
        $teacherTotal = round((float) $rows->sum('amount'), 2);

        return response()->json([
            'data' => [
                'teachers' => $byTeacher,
                'summary' => [
                    'gross_sales' => $grossSales,
                    'teacher_share' => $teacherTotal,
                    // What the centre keeps from selling teachers' material.
                    'centre_share' => round($grossSales - $teacherTotal, 2),
                    'pending_payout' => round(
                        (float) $rows->where('status', TeacherEarning::STATUS_PENDING)->sum('amount'),
                        2
                    ),
                ],
            ],
        ]);
    }

    /**
     * Individual accruals for one teacher.
     */
    public function show(Request $request, string $teacherProfileId): JsonResponse
    {
        $entries = TeacherEarning::with('product:id,name')
            ->where('teacher_profile_id', $teacherProfileId)
            ->latest()
            ->get()
            ->map(fn (TeacherEarning $e) => [
                'id' => $e->id,
                'product' => $e->product?->name,
                'quantity' => $e->quantity,
                'unit_price' => $e->unit_price,
                'share_percentage' => $e->share_percentage,
                'amount' => $e->amount,
                'status' => $e->status,
                'settled_at' => $e->settled_at,
                'created_at' => $e->created_at,
            ]);

        return response()->json(['data' => $entries]);
    }

    /**
     * Pay out everything currently pending for a teacher.
     *
     * Settling is when the money actually leaves the centre, so this is the
     * point the expense hits the ledger — not the moment of sale.
     */
    public function settle(Request $request, string $teacherProfileId): JsonResponse
    {
        $teacher = TeacherProfile::with('user:id,name')->findOrFail($teacherProfileId);

        $result = DB::transaction(function () use ($teacher, $request) {
            $pending = TeacherEarning::where('teacher_profile_id', $teacher->id)
                ->where('status', TeacherEarning::STATUS_PENDING)
                ->lockForUpdate()
                ->get();

            if ($pending->isEmpty()) {
                return null;
            }

            $total = round((float) $pending->sum('amount'), 2);

            TeacherEarning::whereIn('id', $pending->pluck('id'))->update([
                'status' => TeacherEarning::STATUS_SETTLED,
                'settled_at' => now(),
            ]);

            LedgerEntry::create([
                'type' => 'debit',
                'amount' => $total,
                'category' => 'expense',
                'description' => 'تصفية مستحقات مبيعات المدرس: ' . ($teacher->user?->name ?? ''),
                'reference_id' => $teacher->id,
                'reference_type' => 'TeacherProfile',
            ]);

            AuditLog::create([
                'tenant_id' => $teacher->tenant_id,
                'user_id' => $request->user()->id,
                'action' => 'teacher_earnings.settled',
                'model_type' => TeacherProfile::class,
                'model_id' => $teacher->id,
                'payload' => ['amount' => $total, 'entries' => $pending->count()],
                'ip_address' => $request->ip(),
            ]);

            return ['amount' => $total, 'count' => $pending->count()];
        });

        if (!$result) {
            return response()->json([
                'message' => 'لا توجد مستحقات معلقة لهذا المدرس.',
            ], Response::HTTP_CONFLICT);
        }

        return response()->json([
            'message' => "تم تصفية {$result['amount']} ج للمدرس.",
            'data' => $result,
        ]);
    }
}
