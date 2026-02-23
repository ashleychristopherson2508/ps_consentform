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
1. If the app launches offline, choose whether to start a new session or continue the most recent session log.
2. Enter participant details (name and phone).
3. Read the terms and conditions.
4. Tick the consent checkbox.
5. Type the signature.
6. Click “Submit consent.”
	- A PDF consent form is saved into the dated folder.
	- The active session log file is updated in the `consent forms` folder.

## Session logs
- Session logs are stored as `session-log-<unique-id>.json` in the `consent forms` folder.
- Each log tracks only non-personal session metadata with user-friendly fields (for example `sessionName`, `sessionDate`, `totalConsents`, `totalSignedTerms`).
- If you continue an existing session, the app appends to the most recent session log.
- When closing the PWA, the app prompts for confirmation before closing the active session.

## Distribution page (photographer)
- Open **Distribution** from Setup.
- Select the required session log from the dropdown.
- The app opens the matching dated folder, reads consent details from PDF files, and displays one record at a time.
- Use **Previous** and **Next** buttons to navigate records; the counter shows position (for example `1 of 100`).

## Notes
- The app works offline once installed.
- If saving fails, return to Setup and reselect the save folder.
- Photographer details are loaded from photographer.json.

## Local development
Run a local server (required for service worker):
- `npx http-server . -p 5173 -c-1`
Then open http://localhost:5173
