# Private internet deployment on Fly.io

This app needs a running Node server, a persistent SQLite database, and
persistent storage for uploaded speaking recordings. The Fly image bundles a
clean question bank (32 tests, including 30 full mocks) and all 609 generated
exam audio files. It does not bundle local candidate attempts or recordings.

## Before deployment

1. Sign in to the intended Fly.io account and add a payment card in Fly's own
   dashboard if it asks. Fly states that organizations require a card on file.
   Check the account's cost controls and billing before launching a Machine and
   a persistent volume.
2. From this workspace, authenticate the Fly CLI with `fly auth login` and
   confirm the account with `fly auth whoami` and `fly orgs list`.
3. Replace the example app name in `fly.toml` with a unique name for your own
   deployment. Check existing Machines and volumes before creating anything.
4. Set one strong site password as the Fly secret `PTE_SITE_PASSWORD`. The
   browser sign-in username is `practice`. Do not put the password in Git,
   `fly.toml`, shell history, or this document.

## Release sequence

For a new Fly app, create the app and one encrypted volume named `data` in its
primary region. The configured app name and region are in `fly.toml`; check
availability and choose the region before creating either resource. Deploy
from this local workspace so the generated audio and source corpus are in the
build context. The remote builder receives only the files allowed by
`.dockerignore`.

After setting `PTE_SITE_PASSWORD`, deploy with `fly deploy`. Fly mounts the
volume at `/data`. On first boot, the server copies the clean database template
to `/data/practice.db`; later starts retain the existing database. Uploaded
recordings go to `/data/uploads/audio`.

Keep one app Machine for this SQLite volume. Scaling to multiple independent
Machines without changing data storage will split practice history.

## Acceptance checks

- `fly status` shows a healthy Machine and the intended release.
- Anonymous requests to the homepage and `/api/attempts` return HTTP 401.
- Authenticated requests to `/api/tests` return 32 tests; a generated exam MP3
  loads over HTTPS.
- Complete a short test on one device. Confirm the score report and recording
  from another device using the same site password.
- Restart the Machine and confirm the attempt and recording still exist.
- Check Fly billing and volume snapshots after deployment.

The site is private through a shared password. It does not have separate user
accounts: anyone with that password can see the shared attempt history and
recordings. The local candidate history is not transferred automatically.
