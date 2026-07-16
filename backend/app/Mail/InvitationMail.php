<?php

namespace App\Mail;

use App\Models\Invitation;
use App\Models\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvitationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Invitation $invitation,
        public ?Tenant $tenant,
        public string $url,
    ) {}

    public function envelope(): Envelope
    {
        $center = $this->tenant?->name ?? config('app.name');

        return new Envelope(
            subject: "دعوة للانضمام إلى {$center}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.invitation',
            with: [
                'centerName' => $this->tenant?->name ?? config('app.name'),
                'roleLabel' => __('roles.' . $this->invitation->role),
                'name' => $this->invitation->user?->name,
                'url' => $this->url,
                'expiresHours' => Invitation::TTL_HOURS,
            ],
        );
    }
}
