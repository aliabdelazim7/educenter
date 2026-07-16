<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StudentTimelineEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentTimelineController extends Controller
{
    public function show($studentId): JsonResponse
    {
        $events = StudentTimelineEvent::where('student_profile_id', $studentId)
            ->latest()
            ->get();

        return response()->json(['data' => $events]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'student_profile_id' => 'required|uuid|exists:student_profiles,id',
            'event_type' => 'required|string',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
        ]);

        $event = StudentTimelineEvent::create($validated);

        return response()->json(['data' => $event], 201);
    }
}
