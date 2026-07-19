<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add indexes to student_timeline_events
        Schema::table('student_timeline_events', function (Blueprint $table) {
            $table->index(['student_profile_id', 'event_type'], 'idx_stud_timeline_type');
        });

        // Add indexes to exam_grades
        Schema::table('exam_grades', function (Blueprint $table) {
            $table->index(['student_profile_id', 'exam_id'], 'idx_exam_grades_stud_exam');
        });

        // Add indexes to educational_contents
        Schema::table('educational_contents', function (Blueprint $table) {
            $table->index(['group_id', 'content_type'], 'idx_edu_content_group_type');
        });

        // Add indexes to exams
        Schema::table('exams', function (Blueprint $table) {
            $table->index(['group_id', 'exam_date'], 'idx_exams_group_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('exams', function (Blueprint $table) {
            $table->dropIndex('idx_exams_group_date');
        });

        Schema::table('educational_contents', function (Blueprint $table) {
            $table->dropIndex('idx_edu_content_group_type');
        });

        Schema::table('exam_grades', function (Blueprint $table) {
            $table->dropIndex('idx_exam_grades_stud_exam');
        });

        Schema::table('student_timeline_events', function (Blueprint $table) {
            $table->dropIndex('idx_stud_timeline_type');
        });
    }
};
