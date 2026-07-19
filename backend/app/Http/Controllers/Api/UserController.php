<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\StudentProfile;
use App\Models\User;
use App\Support\RoleLabels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $users = User::with('roles:id,name')
            ->latest()
            ->get()
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'phone' => $u->phone,
                'status' => $u->status,
                'roles' => $u->roles->pluck('name'),
                'role_labels' => $u->roles->pluck('name')->map(fn ($r) => RoleLabels::for($r)),
                'created_at' => $u->created_at,
            ]);

        return response()->json(['data' => $users]);
    }

    /**
     * Activate / deactivate / suspend. Never deletes: history must survive.
     */
    public function updateStatus(Request $request, User $user): JsonResponse
    {
        $this->authorizeAdmin($request);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'message' => 'لا يمكنك تغيير حالة حسابك الخاص.',
            ], Response::HTTP_CONFLICT);
        }

        if ($user->hasRole('Owner')) {
            return response()->json([
                'message' => 'لا يمكن تغيير حالة مالك المركز.',
            ], Response::HTTP_CONFLICT);
        }

        $data = $request->validate([
            'status' => ['required', Rule::in([
                User::STATUS_ACTIVE,
                User::STATUS_INACTIVE,
                User::STATUS_SUSPENDED,
            ])],
        ]);

        // A user who never accepted their invitation has no password to log in with.
        if ($data['status'] === User::STATUS_ACTIVE && $user->password === null) {
            return response()->json([
                'message' => 'لم يقبل هذا المستخدم الدعوة بعد. أعد إرسال الدعوة بدلاً من ذلك.',
            ], Response::HTTP_CONFLICT);
        }

        $from = $user->status;
        $user->update(['status' => $data['status']]);

        // Revoke live sessions when access is withdrawn.
        if ($data['status'] !== User::STATUS_ACTIVE) {
            $user->tokens()->delete();
        }

        AuditLog::create([
            'tenant_id' => $user->tenant_id,
            'user_id' => $request->user()->id,
            'action' => 'user.status_changed',
            'model_type' => User::class,
            'model_id' => $user->id,
            'payload' => ['from' => $from, 'to' => $data['status']],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => 'تم تحديث حالة المستخدم.',
            'data' => ['id' => $user->id, 'status' => $user->status],
        ]);
    }

    /**
     * Attach (or detach) a student to a parent account.
     *
     * This is the link the parent portal reads: a parent sees exactly the
     * student profiles whose parent_id is their user id.
     */
    public function linkParent(Request $request, string $studentProfileId): JsonResponse
    {
        $this->authorizeAdmin($request);

        $profile = StudentProfile::findOrFail($studentProfileId);

        $data = $request->validate([
            'parent_id' => ['nullable', 'uuid', 'exists:users,id'],
        ]);

        if (!empty($data['parent_id'])) {
            $parent = User::find($data['parent_id']);

            if (!$parent?->hasRole('Parent')) {
                return response()->json([
                    'message' => 'الحساب المحدد ليس ولي أمر.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        $from = $profile->parent_id;
        $profile->update(['parent_id' => $data['parent_id'] ?? null]);

        AuditLog::create([
            'tenant_id' => $profile->tenant_id,
            'user_id' => $request->user()->id,
            'action' => 'student.parent_linked',
            'model_type' => StudentProfile::class,
            'model_id' => $profile->id,
            'payload' => ['from' => $from, 'to' => $data['parent_id'] ?? null],
            'ip_address' => $request->ip(),
        ]);

        return response()->json([
            'message' => empty($data['parent_id'])
                ? 'تم إلغاء ربط ولي الأمر.'
                : 'تم ربط الطالب بولي الأمر.',
        ]);
    }

    /**
     * Students with their current parent link, for the linking screen.
     */
    public function studentLinks(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $students = StudentProfile::with(['user:id,name,email', 'parent:id,name'])
            ->get()
            ->map(fn (StudentProfile $p) => [
                'profile_id' => $p->id,
                'name' => $p->user?->name,
                'email' => $p->user?->email,
                'parent_id' => $p->parent_id,
                'parent_name' => $p->parent?->name,
            ]);

        return response()->json(['data' => $students]);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->hasAnyRole(['Owner', 'Admin']),
            Response::HTTP_FORBIDDEN,
            'غير مصرح لك بإدارة المستخدمين.'
        );
    }
}
