# API Reference

All endpoints are under `/api` and require an authenticated session (cookie-based). Unauthenticated requests receive a `401 Unauthorized` response.

## Authentication

Better Auth exposes its own endpoints under `/api/auth/*`. These are handled automatically by the catch-all route.

| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/auth/*` | Better Auth internal endpoints |

## Projects

### List projects

```
GET /api/projects
```

Returns all projects belonging to the authenticated user.

**Response `200`**
```json
[
  {
    "id": "clxxx",
    "name": "My Project",
    "description": null,
    "color": "#6366f1",
    "userId": "clyyy",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z"
  }
]
```

### Create project

```
POST /api/projects
Content-Type: application/json
```

**Request body**
```json
{
  "name": "My Project",
  "description": "Optional description",
  "color": "#6366f1"
}
```

**Response `201`** – the created project object.

## Time Entries

### List entries

```
GET /api/time-entries
```

Returns the 50 most recent time entries (including the currently running one if any).

**Response `200`**
```json
[
  {
    "id": "clxxx",
    "description": "Writing docs",
    "startTime": "2026-01-01T09:00:00.000Z",
    "endTime": "2026-01-01T10:30:00.000Z",
    "duration": 5400,
    "project": { "id": "clyyy", "name": "My Project", "color": "#6366f1" }
  }
]
```

A running entry has `endTime: null` and `duration: null`.

### Start a new entry

```
POST /api/time-entries
Content-Type: application/json
```

Stops any currently running entry, then starts a new one.

**Request body**
```json
{
  "description": "Working on feature X",
  "projectId": "clyyy"
}
```

Both fields are optional.

**Response `201`** – the created entry object.

### Stop a running entry

```
PATCH /api/time-entries/:id/stop
```

Sets `endTime` to now and calculates `duration`.

**Response `200`** – the updated entry object.

**Response `404`** if the entry is not found or already stopped.
