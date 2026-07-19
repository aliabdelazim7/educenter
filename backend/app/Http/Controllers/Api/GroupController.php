<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\StudentProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class GroupController extends Controller
{
    public function index(): JsonResponse
    {
        $groups = Group::with(['branch', 'academicYear', 'subject', 'grade', 'teacherProfile.user'])
            ->latest()
            ->get();
            
        return response()->json(['data' => $groups]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'subject_id' => ['required', 'uuid', 'exists:subjects,id'],
            'grade_id' => ['required', 'uuid', 'exists:grades,id'],
            'teacher_profile_id' => ['nullable', 'uuid', 'exists:teacher_profiles,id'],
            'weekly_schedule' => ['nullable', 'array'],
            'weekly_schedule.*.day' => ['required', 'string', 'in:Saturday,Sunday,Monday,Tuesday,Wednesday,Thursday,Friday'],
            'weekly_schedule.*.start_time' => ['required', 'string'],
            'weekly_schedule.*.end_time' => ['required', 'string'],
        ]);

        $group = Group::create($validated);
        
        $this->generateSessions($group);

        return response()->json([
            'message' => 'Class Group created successfully.',
            'data' => $group->load(['branch', 'academicYear', 'subject', 'grade', 'teacherProfile.user'])
        ], Response::HTTP_CREATED);
    }

    public function show(Group $group): JsonResponse
    {
        return response()->json([
            'data' => $group->load(['branch', 'academicYear', 'subject', 'grade', 'teacherProfile.user'])
        ]);
    }

    public function update(Request $request, Group $group): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'branch_id' => ['required', 'uuid', 'exists:branches,id'],
            'academic_year_id' => ['required', 'uuid', 'exists:academic_years,id'],
            'subject_id' => ['required', 'uuid', 'exists:subjects,id'],
            'grade_id' => ['required', 'uuid', 'exists:grades,id'],
            'teacher_profile_id' => ['nullable', 'uuid', 'exists:teacher_profiles,id'],
            'weekly_schedule' => ['nullable', 'array'],
            'weekly_schedule.*.day' => ['required', 'string', 'in:Saturday,Sunday,Monday,Tuesday,Wednesday,Thursday,Friday'],
            'weekly_schedule.*.start_time' => ['required', 'string'],
            'weekly_schedule.*.end_time' => ['required', 'string'],
        ]);

        $group->update($validated);
        
        $this->generateSessions($group);

        return response()->json([
            'message' => 'Class Group updated successfully.',
            'data' => $group->load(['branch', 'academicYear', 'subject', 'grade', 'teacherProfile.user'])
        ]);
    }

    /**
     * Auto-generates academic sessions for the next 30 days matching the weekly schedule.
     */
    protected function generateSessions(Group $group): void
    {
        $schedule = $group->weekly_schedule;
        if (empty($schedule) || !is_array($schedule)) {
            return;
        }

        $startDate = now();
        $endDate = now()->addDays(30);

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            $dayOfWeek = $date->format('l'); // e.g. "Saturday"
            
            foreach ($schedule as $slot) {
                if (isset($slot['day']) && strtolower($slot['day']) === strtolower($dayOfWeek)) {
                    \App\Models\AcademicSession::firstOrCreate([
                        'tenant_id' => $group->tenant_id,
                        'group_id' => $group->id,
                        'date' => $date->format('Y-m-d'),
                        'start_time' => $slot['start_time'],
                        'end_time' => $slot['end_time'],
                    ], [
                        'classroom_id' => null,
                        'teacher_profile_id' => $group->teacher_profile_id,
                        'status' => 'scheduled',
                    ]);
                }
            }
        }
    }

    public function destroy(Group $group): JsonResponse
    {
        $group->delete();
        return response()->json(['message' => 'Class Group deleted successfully.']);
    }

    /**
     * Enrolls students to a group.
     */
    public function enrollStudents(Request $request, Group $group): JsonResponse
    {
        $validated = $request->validate([
            'student_profile_ids' => ['required', 'array'],
            'student_profile_ids.*' => ['required', 'uuid', 'exists:student_profiles,id'],
        ]);

        $group->students()->syncWithoutDetaching($validated['student_profile_ids']);

        return response()->json([
            'message' => 'Students enrolled in group successfully.',
            'data' => $group->students()->with('user')->get()
        ]);
    }

    /**
     * Removes a student from a group.
     */
    public function removeStudent(Group $group, StudentProfile $student): JsonResponse
    {
        $group->students()->detach($student->id);

        return response()->json([
            'message' => 'Student removed from group successfully.'
        ]);
    }

    /**
     * Lists students in a group.
     */
    public function students(Group $group): JsonResponse
    {
        $students = $group->students()->with('user')->get();
        return response()->json(['data' => $students]);
    }
}
