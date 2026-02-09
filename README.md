# Pineapple Studios Consent Form

## Install the PWA
1. Open the hosted site in Edge or Chrome (https://ashleychristopherson2508.github.io/ps_consentform/). 
2. Click the install icon in the address bar (or Menu → Install this site as an app).
3. Launch the app from the desktop/start menu.

## First-time setup (photographer)
1. Open the app.
2. On the Setup screen, click “Choose save folder.”
3. Select a parent folder where consent forms should be stored (such as the Desktop or Documents Folder).
	- The app will create a “consent forms” folder and a dated subfolder inside it.

## User guide (during a session)
1. Enter participant details (name, email, phone, session date).
2. Read the terms and conditions.
3. Tick the consent checkbox.
4. Type the signature.
5. Click “Submit consent.”
	- A PDF consent form is saved into the dated folder.

## Notes
- The app works offline once installed.
- If saving fails, return to Setup and reselect the save folder.
- Photographer details are loaded from photographer.json.

## Local development
Run a local server (required for service worker):
- `npx http-server . -p 5173 -c-1`
Then open http://localhost:5173
