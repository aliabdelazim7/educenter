<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EducationalContent;
use App\Models\Invoice;
use App\Models\StudentProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Self-service endpoints for students and parents.
 *
 * These roles hold no directory permissions, so every query here is scoped to
 * the caller's own profile (or their children) rather than gated by a
 * permission check. Never widen these to accept an arbitrary student id.
 */
class PortalController extends Controller
{
    /**
     * The signed-in student's own record.
     */
    public function me(Request $request): JsonResponse
    {
        $profile = $this->ownProfile($request);

        if (!$profile) {
            return response()->json(['message' => 'لا يوجد ملف طالب مرتبط بهذا الحساب.'], Response::HTTP_NOT_FOUND);
        }

        return response()->json(['data' => $this->present($profile)]);
    }

    /**
     * Children of the signed-in parent.
     */
    public function children(Request $request): JsonResponse
    {
        $children = StudentProfile::with(['user:id,name,email', 'groups.subject', 'groups.teacherProfile.user'])
            ->where('parent_id', $request->user()->id)
            ->get()
            ->map(fn (StudentProfile $p) => $this->present($p));

        return response()->json(['data' => $children]);
    }

    /**
     * Learning material for the groups the student is enrolled in.
     */
    public function content(Request $request): JsonResponse
    {
        $profile = $this->ownProfile($request);

        if (!$profile) {
            return response()->json(['data' => []]);
        }

        $groupIds = $profile->groups->pluck('id');

        $content = EducationalContent::whereIn('group_id', $groupIds)
            ->latest()
            ->get();

        return response()->json(['data' => $content]);
    }

    /**
     * Invoices raised against the student, for the subscription view.
     */
    public function invoices(Request $request): JsonResponse
    {
        $profile = $this->ownProfile($request);

        if (!$profile) {
            return response()->json(['data' => []]);
        }

        return response()->json([
            'data' => Invoice::where('student_profile_id', $profile->id)->latest()->get(),
        ]);
    }

    private function ownProfile(Request $request): ?StudentProfile
    {
        return StudentProfile::with(['user:id,name,email', 'groups.subject', 'groups.teacherProfile.user'])
            ->where('user_id', $request->user()->id)
            ->first();
    }

    private function present(StudentProfile $p): array
    {
        $attendance = $p->attendances()
            ->with('academicSession')
            ->latest()
            ->limit(30)
            ->get();

        $total = $attendance->count();
        $present = $attendance->whereIn('status', ['present', 'late'])->count();

        return [
            'id' => $p->id,
            'name' => $p->user?->name,
            'email' => $p->user?->email,
            'groups' => $p->groups->map(fn ($g) => [
                'id' => $g->id,
                'name' => $g->name,
                'subject' => $g->subject?->name,
                'teacher' => $g->teacherProfile?->user?->name,
            ]),
            'attendance' => [
                'rate' => $total > 0 ? round($present / $total * 100) : null,
                'records' => $attendance->map(fn ($a) => [
                    'status' => $a->status,
                    'date' => $a->academicSession?->date,
                    'remarks' => $a->remarks,
                ]),
            ],
        ];
    }
}
