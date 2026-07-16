<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreInvitationRequest;
use App\Models\Invitation;
use App\Services\InvitationService;
use App\Support\RoleLabels;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class InvitationController extends Controller
{
    public function __construct(private InvitationService $invitations) {}

    /**
     * Tenant-scoped list of invitations for the admin UI.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeAdmin($request);

        $invitations = Invitation::with(['user:id,name,email,status', 'inviter:id,name'])
            ->latest()
            ->get()
            ->map(fn (Invitation $i) => $this->present($i));

        return response()->json(['data' => $invitations]);
    }

    public function store(StoreInvitationRequest $request): JsonResponse
    {
        $result = $this->invitations->invite($request->validated(), $request->user());

        return response()->json([
            'message' => 'تم إرسال الدعوة بنجاح.',
            'data' => $this->present($result['invitation']),
            // Returned so the admin can share it manually when there is no email.
            'invite_url' => $result['url'],
        ], Response::HTTP_CREATED);
    }

    public function resend(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorizeAdmin($request);

        try {
            $result = $this->invitations->resend($invitation, $request->user());
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], Response::HTTP_CONFLICT);
        }

        return response()->json([
            'message' => 'تم إرسال الدعوة مرة أخرى.',
            'data' => $this->present($result['invitation']),
            'invite_url' => $result['url'],
        ]);
    }

    public function destroy(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorizeAdmin($request);

        try {
            $this->invitations->cancel($invitation, $request->user());
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], Response::HTTP_CONFLICT);
        }

        return response()->json(['message' => 'تم إلغاء الدعوة.']);
    }

    public function updateEmail(Request $request, Invitation $invitation): JsonResponse
    {
        $this->authorizeAdmin($request);

        $data = $request->validate([
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->where('tenant_id', $request->user()->tenant_id)
                    ->ignore($invitation->user_id)
                    ->whereNull('deleted_at'),
            ],
        ], [
            'email.unique' => 'هذا البريد مستخدم بالفعل في هذا المركز.',
        ]);

        try {
            $result = $this->invitations->changeEmail($invitation, $data['email'], $request->user());
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], Response::HTTP_CONFLICT);
        }

        return response()->json([
            'message' => 'تم تحديث البريد وإرسال دعوة جديدة.',
            'data' => $this->present($result['invitation']),
            'invite_url' => $result['url'],
        ]);
    }

    /**
     * Public: resolve an invitation token for the acceptance page.
     */
    public function show(string $token): JsonResponse
    {
        $invitation = Invitation::findByToken($token);

        if (!$invitation) {
            return response()->json(['message' => 'رابط الدعوة غير صالح.'], Response::HTTP_NOT_FOUND);
        }

        if ($invitation->status === Invitation::STATUS_ACCEPTED) {
            return response()->json(['message' => 'تم استخدام هذه الدعوة بالفعل.'], Response::HTTP_GONE);
        }

        if ($invitation->status === Invitation::STATUS_CANCELLED) {
            return response()->json(['message' => 'تم إلغاء هذه الدعوة.'], Response::HTTP_GONE);
        }

        if ($invitation->isExpired()) {
            return response()->json(['message' => 'انتهت صلاحية رابط الدعوة.'], Response::HTTP_GONE);
        }

        return response()->json([
            'data' => [
                'name' => $invitation->user?->name,
                'email' => $invitation->email,
                'phone' => $invitation->user?->phone,
                'role' => $invitation->role,
                'role_label' => RoleLabels::for($invitation->role),
                'center_name' => $invitation->tenant?->name,
                'subdomain' => $invitation->tenant?->subdomain,
                'expires_at' => $invitation->expires_at,
            ],
        ]);
    }

    /**
     * Public: complete the account. Single-use.
     */
    public function accept(Request $request, string $token): JsonResponse
    {
        $invitation = Invitation::findByToken($token);

        if (!$invitation || !$invitation->isAcceptable()) {
            return response()->json([
                'message' => 'رابط الدعوة غير صالح أو منتهي الصلاحية.',
            ], Response::HTTP_GONE);
        }

        $data = $request->validate([
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:32'],
        ], [
            'password.required' => 'كلمة المرور مطلوبة.',
            'password.min' => 'كلمة المرور يجب ألا تقل عن 8 أحرف.',
            'password.confirmed' => 'تأكيد كلمة المرور غير متطابق.',
        ]);

        $this->invitations->accept($invitation, $data['password'], $data['phone'] ?? null);

        return response()->json([
            'message' => 'تم إنشاء حسابك بنجاح. يمكنك تسجيل الدخول الآن.',
            'subdomain' => $invitation->tenant?->subdomain,
        ]);
    }

    private function authorizeAdmin(Request $request): void
    {
        abort_unless(
            $request->user()?->hasAnyRole(['Owner', 'Admin']),
            Response::HTTP_FORBIDDEN,
            'غير مصرح لك بإدارة الدعوات.'
        );
    }

    private function present(Invitation $invitation): array
    {
        return [
            'id' => $invitation->id,
            'name' => $invitation->user?->name,
            'email' => $invitation->email,
            'role' => $invitation->role,
            'role_label' => RoleLabels::for($invitation->role),
            'status' => $invitation->displayStatus(),
            'user_status' => $invitation->user?->status,
            'invited_by' => $invitation->inviter?->name,
            'expires_at' => $invitation->expires_at,
            'accepted_at' => $invitation->accepted_at,
            'created_at' => $invitation->created_at,
        ];
    }
}
