<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Claude Code Deployment Protocol (TruthAI)

Use this exact flow so deploys always go to the correct Vercel project/domain and can also be triggered by git push.

### Target project/domain
- Vercel project: `truthai`
- Production domain: `https://www.truth-ai.studio`

### 1) Pre-deploy checks (always)
Run from repo root:
- `npm run build`
- If build fails, fix before any deploy/push.

### 2) Commit + push (for auto Vercel trigger)
If user asks to push/deploy through git:
- `git status`
- `git add -A`
- `git commit -m "<message>"`
- `git push origin main`

This should trigger Vercel Git integration deployment for `truthai`.

### 3) Manual production deploy (fallback or immediate release)
Use when user explicitly asks to deploy now:
- Ensure workspace is linked to `truthai`:
  - `vercel link --project truthai --yes`
- Deploy:
  - `vercel --prod --yes`

### 4) Verify deployment actually reached the live domain
After deploy:
- `vercel inspect www.truth-ai.studio`
- Confirm deployment is `target: production` and alias includes `https://www.truth-ai.studio`.

### 5) Environment variables (must be in Vercel Production)
At minimum keep these correct:
- `NEXT_PUBLIC_APP_URL=https://www.truth-ai.studio`
- `ADMIN_EMAILS=truthaistudio@gmail.com`
- Supabase, Anthropic, Polar, webhook secrets, and product IDs.

If env vars change, redeploy production.
