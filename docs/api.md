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

### Get project analytics

```
GET /api/projects/:id/analytics
```

Returns aggregated hours and earnings for the project, split into the **current** and **previous** periods so they can be compared. The caller must be a member of the project.

**Query parameters**

| Parameter | Values | Default | Description |
|---|---|---|---|
| `period` | `week` \| `month` \| `year` | `week` | Determines the time window and bucket granularity. |

**Bucket granularity per period**

| `period` | Current / previous window | Bucket labels |
|---|---|---|
| `week` | Mon–Sun of the current / previous ISO week | Mon, Tue, Wed, Thu, Fri, Sat, Sun |
| `month` | Current / previous calendar month | Wk 1, Wk 2, … (7-day buckets from the 1st) |
| `year` | Current / previous calendar year | Jan, Feb, …, Dec |

**Response `200`**
```json
{
  "project": {
    "id": "clxxx",
    "name": "My Project",
    "color": "#6366f1",
    "hourlyRate": 75.00,
    "currency": "€"
  },
  "period": "week",
  "current": {
    "start": "2026-04-06T00:00:00.000Z",
    "end": "2026-04-13T00:00:00.000Z",
    "data": [
      { "label": "Mon", "hours": 4.5, "earnings": 337.50 },
      { "label": "Tue", "hours": 3.0, "earnings": 225.00 }
    ],
    "totalHours": 7.5,
    "totalEarnings": 562.50
  },
  "previous": {
    "start": "2026-03-30T00:00:00.000Z",
    "end": "2026-04-06T00:00:00.000Z",
    "data": [
      { "label": "Mon", "hours": 6.0, "earnings": 450.00 }
    ],
    "totalHours": 6.0,
    "totalEarnings": 450.00
  }
}
```

- `earnings` is `0` for all buckets when the project has no `hourlyRate` set.
- Only **completed** entries (those with an `endTime`) are included in aggregations.
- `start` is inclusive; `end` is exclusive.

**Response `400`** if `period` is not one of the accepted values.

**Response `404`** if the project is not found or the caller is not a member.

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

## Analytics

### Overall analytics (all projects)

```
GET /api/analytics
```

Returns aggregated time and earnings data for **all** projects the authenticated user is a member of, within a single period window. Useful for cross-project charts and pie/donut breakdowns.

**Query parameters**

| Parameter | Values | Default | Description |
|---|---|---|---|
| `period` | `week` \| `month` \| `year` | `month` | Determines the time window and bucket granularity (same rules as the per-project endpoint). |

**Response `200`**
```json
{
  "period": "month",
  "start": "2026-04-01T00:00:00.000Z",
  "end": "2026-05-01T00:00:00.000Z",
  "labels": ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5"],
  "projects": [
    {
      "id": "clxxx",
      "name": "Project A",
      "color": "#6366f1",
      "hours": 12.5,
      "earnings": 937.50
    },
    {
      "id": "clyyy",
      "name": "Project B",
      "color": "#10b981",
      "hours": 4.0,
      "earnings": 0
    }
  ],
  "series": [
    {
      "id": "clxxx",
      "name": "Project A",
      "color": "#6366f1",
      "currency": "€",
      "hourlyRate": 75.00,
      "hours": [4.0, 3.5, 3.0, 2.0, 0.0],
      "earnings": [300.00, 262.50, 225.00, 150.00, 0.0]
    }
  ]
}
```

- `projects` – per-project totals for the period; useful for pie/donut charts.
- `series` – per-project arrays indexed by `labels`, one value per bucket; useful for bar/line charts.
- `earnings` is `0` for buckets / projects without an `hourlyRate`.
- Only **completed** entries are included.

**Response `400`** if `period` is not one of the accepted values.

## Expenses

### List expenses

```
GET /api/expenses
```

Returns expenses for the authenticated user.

**Query parameters** (all optional)

| Parameter | Description |
|---|---|
| `projectId` | Filter by project. Use `none` to return expenses with no project, or a project ID. |
| `dateFrom` | Return expenses on or after this date (ISO 8601). |
| `dateTo` | Return expenses on or before this date (ISO 8601). |

**Behaviour notes**

- Without filters, returns the authenticated user's 100 most recent expenses.
- When filtering by a **shared project**, expenses from **all members** are returned.

**Response `200`**
```json
[
  {
    "id": "clxxx",
    "description": "Software subscription",
    "amount": 29.99,
    "date": "2026-04-01T00:00:00.000Z",
    "fileUrl": "https://ufs.sh/f/abc123...",
    "fileKey": "abc123...",
    "fileName": "receipt.pdf",
    "project": { "id": "clyyy", "name": "My Project", "color": "#6366f1", "currency": "€" },
    "user": { "id": "clzzz", "name": "Jane", "email": "jane@example.com" }
  }
]
```

`fileUrl`, `fileKey`, and `fileName` are `null` when no file is attached.

### Create expense

```
POST /api/expenses
Content-Type: application/json
```

**Request body**
```json
{
  "description": "Software subscription",
  "amount": 29.99,
  "date": "2026-04-01T00:00:00.000Z",
  "projectId": "clyyy",
  "fileUrl": "https://ufs.sh/f/abc123...",
  "fileKey": "abc123...",
  "fileName": "receipt.pdf"
}
```

`projectId`, `fileUrl`, `fileKey`, and `fileName` are optional. Upload a file first via `POST /api/expenses/upload` (see [File Storage](./file-storage.md#api-reference)) to obtain the file fields.

**Response `201`** – the created expense object.

**Response `400`** if description is empty, amount is not a positive number, or date is invalid.

**Response `403`** if assigning to a project where the caller has only the Reader role.

**Response `404`** if the specified project is not found.

### Update an expense

```
PATCH /api/expenses/:id
Content-Type: application/json
```

Partially updates an expense. All fields are optional; omitted fields retain their current values. When `fileUrl` is provided, the previous file (if any) is deleted from Uploadthing.

**Request body**
```json
{
  "description": "Updated description",
  "amount": 35.00,
  "date": "2026-04-02T00:00:00.000Z",
  "projectId": "clyyy",
  "fileUrl": "https://ufs.sh/f/def456...",
  "fileKey": "def456...",
  "fileName": "new-receipt.pdf"
}
```

Pass `fileUrl: null`, `fileKey: null`, `fileName: null` to remove an attached file.

**Response `200`** – the updated expense object.

**Response `404`** if the expense is not found or does not belong to the authenticated user.

### Delete an expense

```
DELETE /api/expenses/:id
```

Permanently deletes the expense. If a file is attached, it is also deleted from Uploadthing.

**Response `204`** – no content.

**Response `404`** if the expense is not found or does not belong to the authenticated user.

### Upload expense file

See [File Storage — API reference](./file-storage.md#api-reference).
