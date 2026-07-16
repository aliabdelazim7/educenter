<?php

namespace App\Support;

/**
 * Arabic display names for the RBAC roles.
 *
 * Deliberately a plain map rather than a translation file: the app locale is
 * 'en' (validation messages resolve against it) while the UI is Arabic-only,
 * so routing these through __() would silently return the key.
 */
class RoleLabels
{
    public const MAP = [
        'Owner' => 'مالك المركز',
        'Admin' => 'مدير',
        'Reception' => 'موظف استقبال',
        'Accountant' => 'محاسب',
        'Teacher' => 'مدرس',
        'Teacher Assistant' => 'مساعد مدرس',
        'Student' => 'طالب',
        'Parent' => 'ولي أمر',
    ];

    public static function for(?string $role): string
    {
        return self::MAP[$role] ?? (string) $role;
    }
}
