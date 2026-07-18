# Hackathon-monitoring-environment-protocol-gwl

## Backend

### Auth Endpoints

#### `POST /api/auth/register`

Register a new user as organizer or judge.

**Request body:**
```json
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "securepassword",
  "role": "organizer"
}
```

`role` must be `"organizer"` or `"judge"`.

**Response `201`:**
```json
{
  "status": "success",
  "message": "User registered as organizer.",
  "data": {
    "id": "user-a1b2c3d4",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "organizer",
    "createdAt": "2026-07-18T10:00:00.000Z"
  }
}
```

#### `POST /api/auth/login`

Login with email and password.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response `200`:**
```json
{
  "status": "success",
  "data": {
    "id": "user-a1b2c3d4",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "organizer"
  }
}
```

See `BACKEND_API_SPEC.md` for all other API endpoints.
