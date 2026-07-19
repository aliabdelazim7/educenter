<?php

namespace App\Http\Requests;

use App\Services\InvitationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasAnyRole(['Owner', 'Admin']) ?? false;
    }

    public function rules(): array
    {
        $tenantId = $this->user()->tenant_id;

        $rules = [
            'name' => ['required', 'string', 'max:255'],
            'role' => ['required', Rule::in(InvitationService::INVITABLE_ROLES)],
            'phone' => ['required', 'string', 'max:32'],
            'email' => [
                'required',
                'email',
                'max:255',
                // Email is unique per tenant, matching the users table constraint.
                Rule::unique('users', 'email')->where('tenant_id', $tenantId)->whereNull('deleted_at'),
            ],
        ];

        // Students may be enrolled without an address of their own.
        if ($this->input('role') === 'Student') {
            $rules['email'][0] = 'nullable';
            $rules['profile.grade'] = ['required', 'string', 'max:255'];
            $rules['profile.school'] = ['nullable', 'string', 'max:255'];
            $rules['profile.parent_id'] = ['nullable', 'uuid', 'exists:users,id'];
            $rules['profile.branch_id'] = ['required', 'uuid', 'exists:branches,id'];
            // Groups carry the subject and teacher, so enrolling here is what
            // gives the student their teachers, schedule and content.
            $rules['profile.group_ids'] = ['nullable', 'array'];
            $rules['profile.group_ids.*'] = ['uuid', 'exists:groups,id'];
        }

        if ($this->input('role') === 'Teacher') {
            $rules['profile.subject_id'] = ['required', 'uuid', 'exists:subjects,id'];
            $rules['profile.branch_id'] = ['required', 'uuid', 'exists:branches,id'];
            $rules['profile.contract_type'] = ['required', Rule::in(['salary', 'percentage'])];
            $rules['profile.compensation'] = ['required', 'numeric', 'min:0'];
        }

        if (in_array($this->input('role'), ['Admin', 'Reception', 'Accountant', 'Teacher Assistant'], true)) {
            $rules['profile.job_title'] = ['nullable', 'string', 'max:255'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => 'الاسم مطلوب.',
            'email.required' => 'البريد الإلكتروني مطلوب.',
            'email.email' => 'صيغة البريد الإلكتروني غير صحيحة.',
            'email.unique' => 'هذا البريد مستخدم بالفعل في هذا المركز.',
            'phone.required' => 'رقم الهاتف مطلوب.',
            'role.required' => 'نوع المستخدم مطلوب.',
            'role.in' => 'نوع المستخدم غير صالح.',
            'profile.grade.required' => 'الصف الدراسي مطلوب.',
            'profile.branch_id.required' => 'الفرع مطلوب.',
            'profile.subject_id.required' => 'المادة مطلوبة.',
            'profile.contract_type.required' => 'نوع التعاقد مطلوب.',
            'profile.compensation.required' => 'المرتب أو النسبة مطلوب.',
        ];
    }
}
