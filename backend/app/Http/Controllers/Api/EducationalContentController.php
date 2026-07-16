<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EducationalContent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EducationalContentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $groupId = $request->query('group_id');
        $query = EducationalContent::query();

        if ($groupId) {
            $query->where('group_id', $groupId);
        }

        return response()->json(['data' => $query->latest()->get()]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'group_id' => 'required|uuid|exists:groups,id',
            'title' => 'required|string|max:255',
            'content_type' => 'required|string|in:homework,book,pdf,video,exam',
            'drive_link' => 'required|string',
        ]);

        $content = EducationalContent::create($validated);

        return response()->json(['data' => $content], 201);
    }

    public function destroy($id): JsonResponse
    {
        $content = EducationalContent::findOrFail($id);
        $content->delete();
        return response()->json(null, 204);
    }
}
