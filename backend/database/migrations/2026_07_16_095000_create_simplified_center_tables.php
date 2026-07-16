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
        // 1. Add commission percentage to teacher profiles
        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->decimal('commission_percentage', 5, 2)->default(0.00)->after('user_id');
        });

        // 2. Educational Content (Google Drive links sharing)
        Schema::create('educational_contents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('group_id');
            $table->string('title');
            $table->string('content_type'); // homework, book, pdf, video, exam
            $table->text('drive_link');
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
        });

        // 3. Exams
        Schema::create('exams', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('group_id');
            $table->string('title');
            $table->date('exam_date');
            $table->integer('max_score')->default(100);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('group_id')->references('id')->on('groups')->onDelete('cascade');
        });

        // 4. Exam Grades (Student grades)
        Schema::create('exam_grades', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('exam_id');
            $table->uuid('student_profile_id');
            $table->decimal('score', 5, 2)->default(0.00);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('exam_id')->references('id')->on('exams')->onDelete('cascade');
            $table->foreign('student_profile_id')->references('id')->on('student_profiles')->onDelete('cascade');
        });

        // 5. Student Timeline Events
        Schema::create('student_timeline_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('student_profile_id');
            $table->string('event_type'); // payment, attendance, absence, homework, exam, renewal
            $table->string('title');
            $table->text('description')->nullable();
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('student_profile_id')->references('id')->on('student_profiles')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('student_timeline_events');
        Schema::dropIfExists('exam_grades');
        Schema::dropIfExists('exams');
        Schema::dropIfExists('educational_contents');

        Schema::table('teacher_profiles', function (Blueprint $table) {
            $table->dropColumn('commission_percentage');
        });
    }
};
