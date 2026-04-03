# CivicSnap Frontend

## Env

Create a `.env` file in the frontend root:

```bash
VITE_API_BASE=http://localhost:5000
```

If `VITE_API_BASE` is missing, the app falls back to `http://localhost:5000`.

## Local Dev

1. Start the backend separately on `http://localhost:5000`.
2. Install frontend dependencies:

```bash
npm install
```

3. Start Vite:

```bash
npm run dev
```

4. Open the frontend URL shown by Vite.

## Citizen Accounts

- Citizen sign up and sign in are available on both desktop and mobile login screens.
- Citizens can create an account with either a 10-digit mobile number or a Gmail address.
- These citizen accounts are stored locally in the frontend because the current backend does not expose citizen signup/login endpoints.

## Mobile Install

- On supported mobile browsers, CivicSnap now shows an `Install App` button.
- On iPhone/iPad, the button shows the manual `Share -> Add to Home Screen` instruction because Safari does not expose the standard install prompt event.

## Curl Examples

1. Admin login

```bash
curl -X POST http://localhost:5000/api/auth/admin-login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"admin@example.com\",\"password\":\"your-admin-password\"}"
```

2. Get departments

```bash
curl http://localhost:5000/api/admin/departments \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

3. Create department

```bash
curl -X POST http://localhost:5000/api/admin/departments \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Water Supply\",\"departmentName\":\"Water Supply\"}"
```

4. Create officer

```bash
curl -X POST http://localhost:5000/api/admin/officers \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Officer One\",\"email\":\"officer1@example.com\",\"password\":\"secret123\",\"department\":\"<DEPARTMENT_ID>\",\"departmentId\":\"<DEPARTMENT_ID>\",\"departmentName\":\"Water Supply\"}"
```

5. Guest complaint submission

```bash
curl -X POST http://localhost:5000/api/complaints \
  -F "image=@/absolute/path/to/complaint.jpg" \
  -F "citizenType=guest" \
  -F "description=Overflowing drain near bus stop" \
  -F "category=Municipal / GHMC" \
  -F "department=<DEPARTMENT_ID>" \
  -F "latitude=17.3850" \
  -F "longitude=78.4867" \
  -F "mapsLink=https://www.google.com/maps?q=17.3850,78.4867" \
  -F "priority=Normal"
```

6. Officer login

```bash
curl -X POST http://localhost:5000/api/auth/officer-login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"officer1@example.com\",\"password\":\"secret123\"}"
```

7. Officer reject complaint

```bash
curl -X PUT http://localhost:5000/api/officer/reject/<COMPLAINT_ID> \
  -H "Authorization: Bearer <OFFICER_TOKEN>" \
  -H "Content-Type: application/json" \
  -d "{\"rejectionReason\":\"Image is unclear and does not show the issue.\"}"
```

8. Get flagged accounts

```bash
curl http://localhost:5000/api/admin/flagged \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

## Manual Check List

1. Run backend and frontend, then confirm `GET /api/health` returns success.
2. Sign in as admin from the desktop login and confirm departments load in the admin dashboard.
3. Create a department and verify it appears in the departments table.
4. Create an officer and verify the success toast appears.
5. Submit a guest complaint from the complaint form and confirm it appears in MongoDB and in the frontend status view.
6. Sign in as officer and confirm assigned complaints load from `GET /api/officer/complaints`.
7. Accept, reject, resolve, and transfer a complaint from the officer dashboard and confirm the UI refreshes after each action.
8. Reject complaints multiple times and confirm the backend eventually returns the officer in `GET /api/admin/flagged`.
9. Resolve a complaint with a proof image and confirm the proof renders in complaint details.
10. Turn the network off, submit a complaint, confirm the "Saved locally - will retry" flow, then reconnect and verify it syncs.
