# API Reference

All endpoints are under `/api` and require an authenticated session (cookie-based). Unauthenticated requests receive a `401 Unauthorized` response.

## Authentication

Better Auth exposes its own endpoints under `/api/auth/*`. These are handled automatically by the catch-all route.

| Method | Path | Description |
|---|---|---|
| GET/POST | `/api/auth/*` | Better Auth internal endpoints |

## Projects

> For full details on role-based access and membership management see [Project Sharing](./project-sharing.md).

### List projects

```
GET /api/projects
```

Returns all projects the authenticated user is a **member of**, including their `role` in each project.

**Response `200`**
```json
[
  {
    "id": "clxxx",
    "name": "My Project",
    "description": null,
    "color": "#6366f1",
    "currency": "€",
    "hourlyRate": 75.00,
    "userId": "clyyy",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "role": "ADMIN"
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
  "color": "#6366f1",
  "currency": "€",
  "hourlyRate": 75.00
}
```

`description`, `color`, `currency`, and `hourlyRate` are all optional. `currency` is a free-form string (e.g. `€`, `$`, `GBP`); `hourlyRate` is a positive number representing the billing rate per hour.

**Response `201`** – the created project object. The creator is automatically assigned the **Admin** role.

### Update a project

```
PATCH /api/projects/:id
Content-Type: application/json
```

Requires **Admin** role. Partially updates a project. All fields are optional; omitted fields retain their current values.

**Request body**
```json
{
  "name": "Renamed Project",
  "description": "Updated description",
  "color": "#f59e0b",
  "currency": "$",
  "hourlyRate": 100.00
}
```

- `name` must be a non-empty string if provided.
- `color` must be a valid 6-digit hex color (e.g. `#a1b2c3`) if provided.
- `currency` is a free-form string (e.g. `€`, `$`, `GBP`). Pass `null` to clear it.
- `hourlyRate` is a positive number. Pass `null` to clear it.

**Response `200`** – the updated project object.

**Response `400`** if `name` is empty or `color` format is invalid.

**Response `403`** if the caller does not have Admin role.

**Response `404`** if the project is not found or the caller is not a member.

### Delete a project

```
DELETE /api/projects/:id
```

Requires **Admin** role. Permanently deletes a project. Any time entries that referenced this project will have their `projectId` set to `null` (they are **not** deleted).

**Response `204`** – no content.

**Response `403`** if the caller does not have Admin role.

**Response `404`** if the project is not found or the caller is not a member.

### Member endpoints

See [Project Sharing → API reference](./project-sharing.md#api-reference) for the full member management API:

- `GET /api/projects/:id/members` – list members
- `POST /api/projects/:id/members` – invite a member by email
- `PATCH /api/projects/:id/members/:memberId` – change a member's role
- `DELETE /api/projects/:id/members/:memberId` – remove a member

## Time Entries

### List entries

```
GET /api/time-entries
```

Returns time entries for the authenticated user.

**Query parameters** (all optional)

| Parameter | Description |
|---|---|
| `projectId` | Filter by project. Use `none` to return entries with no project, or a project ID to return entries for a specific project. |
| `dateFrom` | Return entries whose `startTime` is **on or after** this value (ISO 8601 timestamp). |
| `dateTo` | Return entries whose `startTime` is **on or before** this value (ISO 8601 timestamp). |

**Behaviour notes**

- When **no filter** is provided, returns the **50 most recent** entries for the authenticated user.
- When **any filter** is active, the 50-entry cap is lifted and all matching entries are returned.
- The currently running entry (if any) is **always included** when a filter is active, so the live timer is never interrupted.
- When filtering by a **shared project** (`projectId=<id>`), entries from **all members** of that project are returned (not just the authenticated user's). See [Project Sharing](./project-sharing.md#time-entries-and-shared-projects).

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

### Start / create an entry

```
POST /api/time-entries
Content-Type: application/json
```

Supports two distinct modes depending on the request body.

#### Timer mode (live timer)

When `startTime` and `endTime` are **not** provided, stops any currently running entry and starts a new live timer.

**Request body**
```json
{
  "description": "Working on feature X",
  "projectId": "clyyy"
}
```

Both fields are optional.

**Response `201`** – the created entry object (with `endTime: null` and `duration: null`).

#### Manual mode (retroactive entry)

When both `startTime` **and** `endTime` are provided, creates a completed entry immediately. Duration is auto-calculated. Does not affect any running timer.

**Request body**
```json
{
  "description": "Working on feature X",
  "projectId": "clyyy",
  "startTime": "2026-01-01T09:00:00.000Z",
  "endTime": "2026-01-01T10:30:00.000Z"
}
```

`description` and `projectId` are optional.

**Response `201`** – the created entry object.

**Response `400`** if the dates are unparseable or `endTime` is not after `startTime`.

### Edit an entry

```
PATCH /api/time-entries/:id
Content-Type: application/json
```

Partially updates a time entry. All fields are optional; omitted fields retain their current values. Duration is automatically recalculated whenever `startTime` or `endTime` changes.

**Request body**
```json
{
  "description": "Updated description",
  "projectId": "clyyy",
  "startTime": "2026-01-01T09:00:00.000Z",
  "endTime": "2026-01-01T10:30:00.000Z"
}
```

**Response `200`** – the updated entry object.

**Response `404`** if the entry is not found or does not belong to the authenticated user.

### Stop a running entry

```
PATCH /api/time-entries/:id/stop
```

Sets `endTime` to now and calculates `duration`.

**Response `200`** – the updated entry object.

**Response `404`** if the entry is not found or already stopped.
