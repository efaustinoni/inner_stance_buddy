# Deployment Checklist

## How deployment works

- **Frontend (Netlify)**: bolt.new deploys automatically when you pull the latest commits from GitHub.
- **Supabase migrations**: bolt.new applies any new migration files in `supabase/migrations/` automatically when you pull.
- **Supabase Edge Functions**: bolt.new deploys any new or updated functions in `supabase/functions/` automatically when you pull.
- **Supabase Edge Function secrets**: must be set manually in the Supabase dashboard under **Settings → Edge Functions → Secrets**.

---

## Standard deploy (no migrations, no new Edge Functions)

1. Oz commits and pushes to GitHub.
2. Open bolt.new → Git panel → **Pull**.
3. bolt.new redeploys frontend automatically.
4. Verify the version number in the bottom-left of the app matches the latest CHANGELOG entry.

---

## Deploy with a new SQL migration

> **IMPORTANT: Always apply the migration BEFORE deploying frontend code that depends on it.**
> If you deploy the frontend first and the migration hasn't run yet, the app will break for users.

1. Oz commits the migration file only (no frontend changes yet) and pushes.
2. Open bolt.new → Git panel → **Pull** → bolt.new applies the migration automatically.
3. Verify in Supabase (Table Editor or SQL Editor) that the migration took effect.
4. Tell Oz the migration is confirmed — Oz then commits the frontend changes.
5. Open bolt.new → Git panel → **Pull** again → frontend deploys.

---

## Deploy with a new Edge Function

1. Oz commits the Edge Function file in `supabase/functions/` and pushes.
2. Open bolt.new → Git panel → **Pull** → bolt.new deploys the function.
3. If the function requires secrets (`OPENAI_API_KEY`, etc.), set them in:
   **Supabase dashboard → Settings → Edge Functions → Secrets**
   _(Note: bolt.new frontend secrets and Supabase Edge Function secrets are separate stores)_
4. Test the function by triggering it from the app.

---

## Verifying the deployed version

- Check the version badge in the **bottom-left corner** of the app.
- Cross-reference with the latest `docs/CHANGELOG.md` entry timestamp and version number.
- If the version is stale, do **one** Ctrl+Shift+R to clear the old service worker cache. After that, updates are automatic.

---

## Rollback

If a deployment breaks the app:

1. Oz reverts the relevant commits and pushes.
2. Open bolt.new → Git panel → **Pull** → rollback deploys.
3. If a migration also ran and needs to be undone, that must be handled manually in the Supabase SQL Editor.

---

## Version bumping

Use the bump script to update all three version locations atomically:

```bash
npm run version:bump 1.5.1
```

This updates in one pass:

1. `package.json` — `"version": "1.5.1"`
2. `src/lib/appConfig.ts` — `versionLabel: 'v.1.5.1 Beta'`
3. `public/service-worker.js` — `CACHE_NAME = 'exercise-journal-v1.5.1'`

Then commit all three files together:

```bash
git add package.json src/lib/appConfig.ts public/service-worker.js
git commit -m "chore: bump version to 1.5.1"
```

If the service worker cache name is not updated, users' browsers will keep serving the old bundle and the version badge will show the wrong number.

---

## SHA-256 salt deployment order

> **IMPORTANT**: The salt feature requires two separate pulls in bolt.new.

1. Pull commit `feat(db): add security_answer_salt column...` — applies both migrations.
2. Verify `security_answer_salt` column exists in `user_profiles` (Supabase Table Editor).
3. Only then pull commit `feat: add SHA-256 salted security answers` — deploys edge function + frontend.

If step 3 is pulled before step 2 completes, the `password-reset` edge function will fail to read the new column and return an error for any password reset attempt.

---

## Lessons learned

| Date       | Lesson                                                                                                                                                                                                      |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-04-02 | Never deploy frontend code that reads from `decrypted_*` views before the migration that creates those views has been applied. Always separate migration commits from frontend commits and deploy in order. |
| 2026-04-02 | bolt.new secrets ≠ Supabase Edge Function secrets. Set Edge Function secrets in the Supabase dashboard, not in bolt.new.                                                                                    |
| 2026-04-02 | bolt.new does not auto-pull from GitHub — you must manually pull in the Git panel after Oz pushes.                                                                                                          |
