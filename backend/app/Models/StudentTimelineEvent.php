<?php

namespace App\Models;

use App\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StudentTimelineEvent extends Model
{
    use HasFactory, HasUuids, BelongsToTenant;

    protected $fillable = [
        'tenant_id',
        'student_profile_id',
        'event_type',
        'title',
        'description',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(StudentProfile::class, 'student_profile_id');
    }

    /**
     * Log a student timeline event safely under the active tenant.
     */
    public static function logEvent(string $studentProfileId, string $type, string $title, ?string $description = null): void
    {
        self::create([
            'student_profile_id' => $studentProfileId,
            'event_type' => $type,
            'title' => $title,
            'description' => $description,
        ]);
    }
}
