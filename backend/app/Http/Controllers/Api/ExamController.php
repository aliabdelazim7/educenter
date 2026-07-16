<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamGrade;
use App\Models\StudentTimelineEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ExamController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $groupId = $request->query('group_id');
        $query = Exam::with('group');

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
            'exam_date' => 'required|date',
            'max_score' => 'required|integer|min:1',
        ]);

        $exam = Exam::create($validated);

        return response()->json(['data' => $exam], 201);
    }

    public function grade(Request $request, $id): JsonResponse
    {
        $exam = Exam::findOrFail($id);
        
        $validated = $request->validate([
            'grades' => 'required|array',
            'grades.*.student_profile_id' => 'required|uuid|exists:student_profiles,id',
            'grades.*.score' => 'required|numeric|min:0',
        ]);

        DB::transaction(function () use ($exam, $validated) {
            foreach ($validated['grades'] as $g) {
                // Upsert grade
                ExamGrade::updateOrCreate(
                    [
                        'exam_id' => $exam->id,
                        'student_profile_id' => $g['student_profile_id'],
                    ],
                    [
                        'score' => $g['score'],
                    ]
                );

                // Log chronological student timeline event
                StudentTimelineEvent::logEvent(
                    $g['student_profile_id'],
                    'exam',
                    "رصد درجة امتحان: {$exam->title}",
                    "حصل الطالب على درجة {$g['score']} من إجمالي {$exam->max_score} في الامتحان."
                );
            }
        });

        return response()->json(['message' => 'Grades recorded and timeline updated successfully.']);
    }

    public function getGrades($id): JsonResponse
    {
        $grades = ExamGrade::with('student.user')
            ->where('exam_id', $id)
            ->get();

        return response()->json(['data' => $grades]);
    }
}
