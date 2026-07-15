<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // Tenant details
            'tenant_name' => ['required', 'string', 'max:255'],
            'subdomain' => [
                'required',
                'string',
                'max:50',
                'unique:tenants,subdomain',
                'regex:/^[a-z0-9\-]+$/' // Lowercase alphanumeric and hyphens only
            ],
            
            // Owner User details
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function messages(): array
    {
        return [
            'subdomain.regex' => 'The subdomain must only contain lowercase letters, numbers, and hyphens.',
            'subdomain.unique' => 'This subdomain is already taken.',
        ];
    }
}
