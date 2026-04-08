# Project Sharing

Track Your Time supports sharing projects between users with role-based access control. Every project has a list of **members**, each assigned one of three roles.

## Roles

| Role | Description |
|---|---|
| **Admin** | Full control: edit project settings, invite/remove members, change roles, delete the project |
| **Tracker** | Can view the project and log time entries against it |
| **Reader** | Can view the project and see all time entries logged by any member |

> A project creator is automatically assigned the **Admin** role.

## How membership works

- When a project is created, the creator receives an `ADMIN` `ProjectMember` record.
- Admins can invite any registered user by their email address.
- A user must have an account before they can be added to a project.
- Each user can only have one role per project (a unique constraint enforces `projectId + userId`).

## Project visibility

`GET /api/projects` returns **all** projects the authenticated user is a member of (regardless of role), along with their current `role` in each project.

## Managing members (UI)

On the **Projects** page, each project row shows:

- A **role badge** (Admin / Tracker / Reader) indicating your current role.
- A **Members** button that opens an inline panel beneath the project.

Inside the Members panel:

- **All members** can see the full member list with each person's name, email, and role.
- **Admins** see an invite form, role selectors, and a Remove button per member.

### Inviting a member

1. Open the Members panel for a project.
2. Enter the invitee's **email address** (they must already have an account).
3. Select a **role** (Reader, Tracker, or Admin).
4. Click **Invite**.

### Changing a member's role

Admins can change any member's role using the role selector in the Members panel. To prevent losing access, the last remaining Admin cannot be demoted.

### Removing a member

Admins can remove any member using the **Remove** button. A user can also remove themselves (leave the project) via the Members panel. The last Admin cannot be removed; transfer the Admin role first.

## API reference

### List members

```
GET /api/projects/:id/members
```

Requires the caller to be a member of the project (any role).

**Response `200`**
```json
[
  {
    "id": "clxxx",
    "role": "ADMIN",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "updatedAt": "2026-01-01T00:00:00.000Z",
    "user": {
      "id": "clyyy",
      "name": "Jane Doe",
      "email": "jane@example.com",
      "image": null
    }
  }
]
```

**Response `404`** if the project does not exist or the caller is not a member.

### Invite a member

```
POST /api/projects/:id/members
Content-Type: application/json
```

Requires **Admin** role.

**Request body**
```json
{
  "email": "jane@example.com",
  "role": "TRACKER"
}
```

- `email` – required. Must match an existing user account.
- `role` – optional. One of `ADMIN`, `TRACKER`, `READER`. Defaults to `READER`.

**Response `201`** – the created `ProjectMember` object (including the user's name and email).

**Response `400`** if `email` is missing or the user is already a member of the project.

**Response `403`** if the caller does not have Admin role.

**Response `404`** if no user account exists with that email, or the project is not found.

**Response `409`** if the user is already a member of this project.

### Change a member's role

```
PATCH /api/projects/:id/members/:memberId
Content-Type: application/json
```

Requires **Admin** role.

**Request body**
```json
{
  "role": "READER"
}
```

`role` must be one of `ADMIN`, `TRACKER`, `READER`.

**Response `200`** – the updated `ProjectMember` object.

**Response `400`** if the role value is invalid, or the caller is the only remaining Admin (self-demotion blocked).

**Response `403`** if the caller does not have Admin role.

**Response `404`** if the project or member is not found.

### Remove a member

```
DELETE /api/projects/:id/members/:memberId
```

Admins can remove any member. Non-admin members can only remove themselves (leave the project).

**Response `204`** – no content.

**Response `400`** if the target member is the last Admin.

**Response `403`** if the caller is not an Admin and is not removing themselves.

**Response `404`** if the member is not found.

## Time entries and shared projects

When filtering time entries by a **shared project** (`GET /api/time-entries?projectId=<id>`), the response includes entries from **all members** of that project, not just the authenticated user. The caller's currently running entry (if any) is always included.

## Database schema

```prisma
enum ProjectRole {
  ADMIN
  TRACKER
  READER
}

model ProjectMember {
  id        String      @id @default(cuid())
  projectId String
  project   Project     @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      ProjectRole @default(READER)
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt

  @@unique([projectId, userId])
  @@index([userId])
  @@index([projectId])
}
```

- Deleting a project cascades and removes all `ProjectMember` rows.
- Deleting a user cascades and removes their `ProjectMember` rows.
