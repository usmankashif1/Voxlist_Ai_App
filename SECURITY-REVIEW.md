# Security Review

**Review date:** 2026-11-10  
**Scope:** Repository review for the planned Google Play release. The Supabase `ai-proxy` Edge Function had not been deployed at review time.

## Follow-up

The app code keeps the task-extraction prompt in the Edge Function and checks each valid guest or account request against server-side limits: 10 requests per guest per UTC day, 40 per account per UTC day, 5 per user per minute, and 200 requests total per UTC day. The migration in `supabase/migrations/20261110150000_ai_usage_limits.sql` is applied remotely, and the `ai-proxy` function is deployed. A live anonymous-session smoke test returned the new task/subtask response shape.

The smoke test confirms basic function behavior, not all failure modes or Play Store compliance.

## Findings

### Medium — AI proxy relies on correctly deployed limits and secrets

**Files:** `supabase/functions/ai-proxy/index.ts`, `supabase/migrations/20261110150000_ai_usage_limits.sql`, `supabase/config.toml`
**Confidence:** 9/10

The function authenticates callers, applies per-user and project-wide usage limits using a server-only RPC, and keeps the task prompt server-side. The migration and function have been deployed and the basic task-extraction flow was smoke-tested. Provider secrets and project settings still need to remain correct, and provider spending limits are an additional safeguard.

**Recommendation:** Periodically verify deployed secrets and test that each limit rejects further requests. Keep provider spending limits and alerts enabled as an additional safeguard.

### Medium — Local Android release uses the debug signing key

**File:** `android/app/build.gradle` (lines 100-115)  
**Confidence:** 10/10

The local generated Gradle project configures `release` to use the debug signing key and standard debug credentials. This is not an appropriate Play Store upload key. The `android/` directory is ignored by Git, so this finding describes only the local generated project; it does not establish how EAS or Play Console signing is configured.

**Recommendation:** Before release, use a dedicated upload key or verified EAS-managed credentials, and verify the certificate of the bundle submitted to Play Console.

## Verification notes

- No Gemini, Groq, or Supabase service-role credentials were found in tracked app source. A Supabase publishable key is expected to be public.
- The AI proxy and usage migration have been deployed at follow-up time; a live smoke test verified an anonymous request and the new task/subtask response shape.
- Audio is sent to Groq for transcription, and its transcription is sent to Gemini. Repository contents do not establish provider retention settings or the disclosures made to users.
- The generated Android manifest has `allowBackup="true"`. Decide whether local task data should be included in device backups.
- Play Store policy compliance cannot be certified from repository contents. Review the Play Console Data safety declarations, privacy policy, microphone/audio disclosures, target SDK requirements, signing configuration, and actual release bundle.
- Supabase project settings, deployed secrets, anonymous-sign-in configuration, provider quotas, Play Console declarations, and production signing credentials were not independently verified.
