# Operations and data handling

The application runs as a Cloudflare Worker. D1 holds roster and app records. R2 holds original photos and cached responsive thumbnails. The Worker checks access before serving private media. The Images binding generates thumbnails when available.

## Deployment configuration

Cloudflare’s Git integration deploys main with the production `wrangler.toml`. For local commands use `--config wrangler.local.toml`. Use a separate configuration for any other hosted environment. Fill in its own D1 database, R2 bucket, and application origin. Configure `MAIL_FROM` and `SITE_ORIGIN` for the intended environment and supply `RESEND_API_KEY` as a Worker secret. Keep database exports, member records, photos, local environment files, and credentials out of Git. Use dedicated test addresses and verify the sender domain and its DNS authentication before enabling mail.

`ACCESS_MODE=pilot` restricts entry to invited members and admins. `ACCESS_MODE=batch` lets eligible roster members sign in with the unique address on file. Sending the link to a small group in batch mode limits invitations only.

## Database changes

New local databases can apply the checked-in migrations in order. Existing environments may have had earlier migrations applied directly. Inspect the database and its migration history, back it up, and reconcile applied changes before running the migration runner against a hosted environment.

`0002_publish_imports.sql` is a historical data migration. It creates published profiles and memories from legacy rows and approves pending seeds. Review changes against an isolated copy first if a target contains any unpublished data. Treat legacy submissions and enrichment sources as distinct from owner edits. Profile pages resolve owner edits ahead of published yearbook data and selected enrichment. An explicitly blank owner value hides a fallback.

`0014_meet_wishes.sql` adds the "Looking forward to meeting" table. It only creates a table and an index, so it is safe to run on its own against production: `npx wrangler d1 execute iima-2006-alumni --remote --file migrations/0014_meet_wishes.sql`. Until it runs, the Worker hides the feature rather than failing.

## WhatsApp story

WhatsApp Insights require a signed-in member with all seven profile requirements complete: dorm number, dorm name, current city, Life, Lately, family, a Then photo and a Now photo. Home, the owner profile and the locked Insights page show a checklist. Both story pages and all `/wa/api/` endpoints enforce this on the server; no admin bypass is applied. Existing published profile values and Then/Now photos count; explicit blank owner text values override imported values. Optional prompts are not required.

`/wa/` shows each signed-in classmate their own WhatsApp story. `/wa/batch` is the batch story. It is not in any menu; personal pages link to it. Both come from the batch WhatsApp pipeline's microsite kit, which holds every batchmate's personal data. The kit lives only in R2 under `whatsapp-v1/` and must never be committed. Load or refresh it from an unzipped kit:

```sh
tools/import-whatsapp.sh path/to/iima06-whatsapp-microsite-kit --remote
```

The script uploads people files first and the login index last, and skips `organiser/` and `data/pages/`. Until a kit is loaded, `/wa/` says the story isn't up yet.

- A classmate is matched to their story by the emails in `reminder_contacts`, then the numbers in `reminder_mobiles` (normalised to E.164), against the kit's `data/index.json`. The person id always comes from the session. Admins can preview anyone with `/wa/?person=P123`.
- Classmates with fewer than 30 messages (`QUIET_BELOW` in `whatsapp.mjs`), including those who never posted, get a short page of their own ("You're a quiet one…") with a link to the batch story. So do classmates who weren't in the group, can't be matched, or opted out, each with their own wording.
- The Worker reskins the kit pages as it serves them: site fonts instead of Google Fonts, site colours in both themes, the validated chart palette, and the site's bar. It adds a per-response nonce for their inline scripts. Responses are `private, no-store` and `noindex`.

## Theme

Pages are dark unless the visitor chooses light. The choice is a `theme` cookie, set by `POST /theme`, and the Worker flips `data-theme` on the `<html>` element before sending the page.

## Pilot checks

- Request a link to a test address, check Inbox and Junk, open the link once, and confirm that signing out invalidates the session.
- On a phone, check profile and Then / Now uploads, album creation, and a photo mention.
- Confirm that a notification opens the relevant photo or comment, and that only admins can open the admin dashboard and exports.
- Check the reunion form for a confirmed attendee and for an account without a confirmed RSVP.
- Check Admin View coverage and the analytics dashboard. Email acceptance indicates that the provider accepted the send request. Verify inbox placement separately.


## Catch-up requests and persistent notifications

Apply `0015_catchup_notifications.sql` once, followed by `0016_notification_history.sql`, before deploying the catch-up acceptance UI. Migration 0015 preserves notification IDs and read flags while extending event kinds, adds stable request IDs and acceptance timestamps, and turns existing picks into notified requests. Database triggers enqueue one request alert and one acceptance alert per request, including for roster members who have not created an account. Only the recipient may accept an exact request ID. Retrying is idempotent; withdrawn requests cannot be accepted through old links. Read and withdrawn events remain in history.

Migration 0016 backfills genuine historical likes, comments and mentions using the same deduplication keys as live events. It is safe to rerun; existing read flags remain unchanged. The actor of a historical tag edit is left unknown rather than attributed to the wrong person. Legacy events use the associated memory timestamp when their exact event time was not recorded. Signing in does not delete notifications or mark them read. The notification bell counts unread events; the inbox shows the latest 100 by timestamp with Accept request controls. Owners can also accept from Requests received on their profile. Catch-up request recipients now see the sender’s name; the previous anonymous-count behavior has been replaced.


## Mobile navigation

`navigation.mjs` owns the shared five-tab mobile bar and its styles. It is a direct child of the body on both main-site and reskinned WhatsApp pages, outside sticky headers and content containers. Keep its dimensions and safe-area padding in this shared module. The desktop menu remains in the header. At phone widths, full-width main containers must not also have horizontal outer margins: that creates a horizontal scrollbar which reduces the usable viewport and shifts fixed navigation.
