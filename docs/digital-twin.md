# TruongHA Digital Twin — MVP

Interactive 3D apartment built with Three.js and Home Assistant WebSocket API.

## Run

1. Check out `feature/digital-twin` and run `docker compose up -d`.
2. Open Home Assistant at `http://localhost:8123` and complete setup if needed.
3. Open `http://localhost:8123/local/digital-twin/index.html` (Home Assistant serves files in `homeassistant/www` under `/local`).
4. In Home Assistant, create a **Long-Lived Access Token** from your profile. Paste it into the Digital Twin page and click **Kết nối**. The token is held in the page's memory only.
5. Toggle a light in Home Assistant: the matching 3D bulb should update. Click a 3D bulb or a sidebar button to call the corresponding Home Assistant service.

## Scope

- Stylized four-zone 3D floorplan: living room, master bedroom, kids room, kitchen. Hallway and bathroom light points are currently represented in the kitchen zone. This is a conceptual layout, **not an architectural plan**.
- State sync: `get_states` + `state_changed` WebSocket events.
- Light on/off, curtain open/close, door lock/unlock, climate on/off; sensors displayed read-only.
- No command is sent while disconnected. UI uses the **confirmed state** from Home Assistant, not optimistic local toggles.
- Existing Home Assistant packages and automations are unchanged.

## Security / limitations

- Use only on a trusted local network. Do **not** expose port 8123 or your long-lived token to the public internet.
- Token is never written to localStorage or committed. For a production release, use Home Assistant authentication/session integration instead of manually pasted long-lived tokens.
- The page imports Three.js modules from a CDN; initial rendering requires internet access. Vendor dependencies locally for an offline deployment.
- Browser WebSocket connectivity may depend on network reachability, origin and TLS settings.
- A Home Assistant runtime / browser test has **not yet been performed**; this is an initial implementation for review.
- Treat lock controls as security-sensitive; production deployment should add confirmation/authorization UX.

## Next milestones

1. Replace conceptual rooms with an accurate 2-bedroom apartment floorplan and furniture.
2. Embed the view in a Home Assistant dashboard, use Home Assistant authenticated session rather than a pasted token.
3. Add camera presets, curtains and doors animations, temperature overlays, alarm states.
4. Automated tests against a simulated Home Assistant instance.
