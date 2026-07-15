<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tenant_id' => $this->tenant_id,
            'name' => $this->name,
            'email' => $this->email,
            'roles' => $this->getRoleNames(), // Spatie Permission method
            'permissions' => $this->getAllPermissions()->pluck('name'), // Spatie Permission method
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
