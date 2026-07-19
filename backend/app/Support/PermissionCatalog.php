<?php

namespace App\Support;

/**
 * Arabic labels and grouping for the permission list, so the management screen
 * can render something a centre administrator understands rather than raw
 * permission strings.
 */
class PermissionCatalog
{
    /**
     * group label => [permission => label]
     */
    public const GROUPS = [
        'الفروع' => [
            'view branches' => 'عرض الفروع',
            'manage branches' => 'إضافة وتعديل الفروع',
        ],
        'الشؤون الأكاديمية' => [
            'view academic' => 'عرض المجموعات والحصص',
            'manage academic' => 'إدارة المجموعات والحصص',
        ],
        'الطلاب' => [
            'view students' => 'عرض الطلاب',
            'manage students' => 'إضافة وتعديل الطلاب',
        ],
        'المدرسون' => [
            'view teachers' => 'عرض المدرسين',
            'manage teachers' => 'إضافة وتعديل المدرسين',
        ],
        'الحضور والغياب' => [
            'view attendance' => 'عرض سجل الحضور',
            'mark attendance' => 'تسجيل الحضور',
        ],
        'الواجبات والامتحانات' => [
            'manage homework' => 'إدارة الواجبات',
            'grade homework' => 'تصحيح الواجبات',
            'manage exams' => 'إدارة الامتحانات',
            'grade exams' => 'رصد الدرجات',
        ],
        'الحسابات والمالية' => [
            'view financial' => 'عرض الحسابات والتقارير',
            'manage financial' => 'تسجيل الفواتير والمصروفات',
        ],
        'الكاشير' => [
            'view pos' => 'عرض الكاشير',
            'manage pos' => 'تنفيذ عمليات البيع',
        ],
        'المخزون' => [
            'view inventory' => 'عرض المخزون',
            'manage inventory' => 'إدارة المخزون',
        ],
        'المحتوى التعليمي' => [
            'manage media' => 'رفع وإدارة المحتوى',
        ],
        'النظام' => [
            'view audit logs' => 'عرض سجل العمليات',
            'manage settings' => 'إدارة الإعدادات والمستخدمين',
        ],
    ];

    /**
     * Flat permission => label map.
     */
    public static function labels(): array
    {
        return array_merge(...array_values(self::GROUPS));
    }

    public static function all(): array
    {
        return array_keys(self::labels());
    }

    public static function label(string $permission): string
    {
        return self::labels()[$permission] ?? $permission;
    }
}
