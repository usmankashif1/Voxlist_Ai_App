# Reminder reliability

## Current behavior

Task reminders are scheduled as local notifications by `expo-notifications` and
reconciled from the local SQLite task store when the app loads or resumes. Android
alarm-clock delivery uses exact alarms when permitted; Android may use inexact
delivery when exact-alarm access is unavailable. The app does not use a
foreground service for reminders.

## Future push-delivery investigation

FCM is not currently implemented as a reminder-delivery fallback. Before adding
it, evaluate it as a supplementary recovery path rather than a replacement for
local scheduling: network delivery is not guaranteed to be immediate, and push
delivery should not be represented as an exact alarm.

A future design would need to define:

- Secure device-token registration, rotation, sign-out, and invalid-token cleanup.
- A server-side source of truth for eligible reminders and idempotent scheduling.
- Cancellation/update behavior when a task changes, completes, or is deleted.
- Duplicate suppression between local notifications and push messages.
- User-facing permission, privacy, and Play Console/Data safety disclosures.
- Delivery monitoring and tests for offline devices, delayed pushes, and token loss.

Do not add push permissions, token registration, backend jobs, or FCM code as part
of this design note.
