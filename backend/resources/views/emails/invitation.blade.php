<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>دعوة للانضمام</title>
</head>
<body style="margin:0; padding:0; background-color:#f1f5f9; font-family:'Segoe UI', Tahoma, Arial, sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9; padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; background-color:#ffffff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden;">
                    <tr>
                        <td style="background-color:#7c3aed; padding:24px; text-align:center;">
                            <h1 style="margin:0; color:#ffffff; font-size:20px;">{{ $centerName }}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px 28px; text-align:right; color:#0f172a;">
                            <p style="margin:0 0 16px; font-size:16px;">أهلاً {{ $name }} 👋</p>

                            <p style="margin:0 0 16px; font-size:14px; line-height:1.9; color:#334155;">
                                تمت دعوتك للانضمام إلى <strong>{{ $centerName }}</strong>
                                بصفة <strong>{{ $roleLabel }}</strong>.
                            </p>

                            <p style="margin:0 0 24px; font-size:14px; line-height:1.9; color:#334155;">
                                اضغط على الزر بالأسفل لإكمال إنشاء حسابك وتعيين كلمة المرور. لن يستغرق الأمر أكثر من دقيقتين.
                            </p>

                            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                                <tr>
                                    <td style="border-radius:8px; background-color:#7c3aed;">
                                        <a href="{{ $url }}"
                                           style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:bold; color:#ffffff; text-decoration:none; border-radius:8px;">
                                            إكمال إنشاء الحساب
                                        </a>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:0 0 8px; font-size:13px; color:#64748b; line-height:1.8;">
                                ⏰ هذا الرابط صالح لمدة <strong>{{ $expiresHours }} ساعة</strong> فقط، ويُستخدم مرة واحدة.
                            </p>

                            <p style="margin:0; font-size:13px; color:#64748b; line-height:1.8;">
                                إذا لم تكن تتوقع هذه الدعوة، يمكنك تجاهل هذه الرسالة بأمان.
                            </p>

                            <hr style="border:none; border-top:1px solid #e2e8f0; margin:24px 0;">

                            <p style="margin:0; font-size:12px; color:#94a3b8; line-height:1.8;">
                                لو الزر لا يعمل، انسخ هذا الرابط والصقه في المتصفح:<br>
                                <span style="color:#7c3aed; word-break:break-all;">{{ $url }}</span>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
