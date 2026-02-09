# Photographer Consent PWA

Starting point for a photographer consent form PWA with a terms & conditions page.

## What is included
- Consent form page
- Terms & conditions template page
- PWA manifest and service worker for offline caching
- Black background theme

## Run locally
Open [index.html](index.html) in a local web server so the service worker can register. This project does not require a build step.

### Node option
Run a simple local server with Node:
- `npx http-server . -p 5173 -c-1`
Then open http://localhost:5173

## Next steps
- Replace the template terms with your official policy
- Decide how submissions should be stored (email, API, CRM)
- Update branding and copy
- Drop your logo at assets/logo_trans.png
