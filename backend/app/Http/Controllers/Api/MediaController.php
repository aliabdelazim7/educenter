<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Media;
use App\Tenant\TenantManager;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MediaController extends Controller
{
    /**
     * Upload and store a media file.
     */
    public function upload(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'max:5120', 'mimes:jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,zip,txt'], // Max 5MB, safe file types only
            'mediable_id' => ['nullable', 'uuid'],
            'mediable_type' => ['nullable', 'string'],
        ]);

        $file = $request->file('file');
        $tenant = TenantManager::getTenant();

        if (!$tenant) {
            return response()->json(['message' => 'No active tenant resolved.'], Response::HTTP_BAD_REQUEST);
        }

        // Store file securely isolating by tenant ID folder
        $filename = time() . '_' . preg_replace('/\s+/', '_', $file->getClientOriginalName());
        $path = $file->storeAs("uploads/{$tenant->id}", $filename, 'public');

        $media = Media::create([
            'file_name' => $file->getClientOriginalName(),
            'file_path' => '/storage/' . $path,
            'mime_type' => $file->getClientMimeType(),
            'file_size' => $file->getSize(),
            'mediable_id' => $request->mediable_id ?? null,
            'mediable_type' => $request->mediable_type ?? null,
        ]);

        return response()->json([
            'message' => 'File uploaded successfully.',
            'data' => $media
        ], Response::HTTP_CREATED);
    }
}
