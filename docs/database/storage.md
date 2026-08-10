# Supabase Storage requirements

Purpose: separate private evidence from publishable media.

| Content | Classification | Suggested access |
| --- | --- | --- |
| Insurance/qualification/identity evidence | Highly private | Private bucket; owner and authorised admin; short-lived signed URL |
| Job photos before/after matching | Private | Customer; matched/selected access only under relationship policy |
| Quote/case attachments | Private/high sensitivity | Job/case participants and authorised admin |
| Portfolio images | Public-safe after moderation | Separate public bucket or controlled delivery |
| Review images | Public-safe after moderation | Separate reviewed projection/object |

Use unguessable owner/resource/object paths, validate MIME by content where possible, cap size/count, strip risky metadata, scan/contain unsafe formats, prohibit executable content and clean orphaned uploads. Database rows should authorise objects; object names must not contain contact or sensitive data.
