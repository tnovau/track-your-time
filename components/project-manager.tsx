"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type ProjectRole = "ADMIN" | "TRACKER" | "READER";

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
  currency: string | null;
  hourlyRate: number | null;
  userId: string;
  role: ProjectRole;
}

interface ProjectMember {
  id: string;
  role: ProjectRole;
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
}

interface ProjectFormState {
  name: string;
  description: string;
  color: string;
  currency: string;
  hourlyRate: string;
}

const DEFAULT_COLOR = "#6366f1";

const PRESET_COLORS = [
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
  "#8b5cf6",
  "#14b8a6",
];

const ROLE_LABELS: Record<ProjectRole, string> = {
  ADMIN: "Admin",
  TRACKER: "Tracker",
  READER: "Reader",
};

const ROLE_COLORS: Record<ProjectRole, string> = {
  ADMIN: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300",
  TRACKER: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
  READER: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

function emptyForm(): ProjectFormState {
  return { name: "", description: "", color: DEFAULT_COLOR, currency: "", hourlyRate: "" };
}

function validateName(name: string): string | null {
  if (!name.trim()) return "Project name is required.";
  return null;
}

interface ProjectFormProps {
  form: ProjectFormState;
  onChange: (form: ProjectFormState) => void;
  error: string | null;
  loading: boolean;
  submitLabel: string;
  onSubmit: () => void;
  onCancel: () => void;
}

function ProjectForm({
  form,
  onChange,
  error,
  loading,
  submitLabel,
  onSubmit,
  onCancel,
}: ProjectFormProps) {
  return (
    <div className="space-y-3">
      <input
        type="text"
        placeholder="Project name"
        value={form.name}
        onChange={(e) => onChange({ ...form, name: e.target.value })}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <input
        type="text"
        placeholder="Description (optional)"
        value={form.description}
        onChange={(e) => onChange({ ...form, description: e.target.value })}
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 dark:text-gray-400">Color:</span>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange({ ...form, color: c })}
            className="h-6 w-6 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: c,
              borderColor: form.color === c ? "white" : "transparent",
              outline: form.color === c ? `2px solid ${c}` : "none",
            }}
            aria-label={`Select color ${c}`}
          />
        ))}
        <input
          type="color"
          value={form.color}
          onChange={(e) => onChange({ ...form, color: e.target.value })}
          className="h-6 w-6 rounded cursor-pointer border border-gray-200 dark:border-gray-700"
          aria-label="Custom color"
        />
      </div>
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Currency symbol (e.g. €, $)"
          value={form.currency}
          onChange={(e) => onChange({ ...form, currency: e.target.value })}
          className="w-40 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Currency symbol"
        />
        <input
          type="number"
          placeholder="Price per hour (optional)"
          value={form.hourlyRate}
          min="0"
          step="0.01"
          onChange={(e) => onChange({ ...form, hourlyRate: e.target.value })}
          className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          aria-label="Price per hour"
        />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg px-4 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="rounded-xl px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/25 hover:shadow-indigo-600/40 disabled:opacity-60"
        >
          {submitLabel}
        </button>
      </div>
    </div>
  );
}

interface MembersManagerProps {
  project: Project;
  onClose: () => void;
}

function MembersManager({ project, onClose }: MembersManagerProps) {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ProjectRole>("READER");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const fetchMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${project.id}/members`);
      if (res.ok) {
        setMembers(await res.json());
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? `Failed to load members (HTTP ${res.status}).`);
      }
    } finally {
      setLoading(false);
    }
  }, [project.id]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  const handleInvite = async () => {
    setInviteError(null);
    if (!inviteEmail.trim()) {
      setInviteError("Email is required.");
      return;
    }
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      if (res.ok) {
        setInviteEmail("");
        setInviteRole("READER");
        await fetchMembers();
      } else {
        const data = await res.json();
        setInviteError(data.error ?? "Failed to invite member.");
      }
    } finally {
      setInviteLoading(false);
    }
  };

  const handleRoleChange = async (memberId: string, role: ProjectRole) => {
    const res = await fetch(
      `/api/projects/${project.id}/members/${memberId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      }
    );
    if (res.ok) {
      await fetchMembers();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to update role.");
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!confirm("Remove this member from the project?")) return;
    const res = await fetch(
      `/api/projects/${project.id}/members/${memberId}`,
      { method: "DELETE" }
    );
    if (res.ok || res.status === 204) {
      await fetchMembers();
    } else {
      const data = await res.json();
      alert(data.error ?? "Failed to remove member.");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="h-3 w-3 rounded-full shrink-0"
            style={{ backgroundColor: project.color }}
          />
          <h3 className="text-sm font-semibold">
            Members — {project.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Close members panel"
        >
          Close
        </button>
      </div>

      {/* Invite form */}
      {project.role === "ADMIN" && (
        <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Invite member
          </p>
          <div className="flex gap-2 flex-wrap">
            <input
              type="email"
              placeholder="Email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 min-w-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as ProjectRole)}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="READER">Reader</option>
              <option value="TRACKER">Tracker</option>
              <option value="ADMIN">Admin</option>
            </select>
            <button
              onClick={handleInvite}
              disabled={inviteLoading}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-60"
            >
              {inviteLoading ? "Inviting…" : "Invite"}
            </button>
          </div>
          {inviteError && <p className="text-xs text-red-500">{inviteError}</p>}
        </div>
      )}

      {/* Members list */}
      <div className="space-y-2 border-t border-gray-100 dark:border-gray-800 pt-3">
        {loading && (
          <p className="text-sm text-gray-400">Loading members…</p>
        )}
        {!loading && error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && members.length === 0 && (
          <p className="text-sm text-gray-400">No members yet.</p>
        )}
        {!loading &&
          members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  {member.user.name || member.user.email}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {member.user.email}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {project.role === "ADMIN" ? (
                  <select
                    value={member.role}
                    onChange={(e) =>
                      handleRoleChange(member.id, e.target.value as ProjectRole)
                    }
                    className="rounded border border-gray-200 dark:border-gray-700 bg-transparent text-xs px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="READER">Reader</option>
                    <option value="TRACKER">Tracker</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                ) : (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[member.role]}`}
                  >
                    {ROLE_LABELS[member.role]}
                  </span>
                )}
                {project.role === "ADMIN" && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                    aria-label={`Remove ${member.user.name || member.user.email}`}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function ProjectManager() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState<ProjectFormState>(emptyForm());
  const [createError, setCreateError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ProjectFormState>(emptyForm());
  const [editError, setEditError] = useState<string | null>(null);
  const [managingMembersId, setManagingMembersId] = useState<string | null>(null);

  const fetchProjects = useCallback(async () => {
    setFetching(true);
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        setProjects(await res.json());
        setFetchError(null);
      } else {
        setFetchError("Failed to load projects. Please refresh the page.");
      }
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    setCreateError(null);
    const err = validateName(createForm.name);
    if (err) { setCreateError(err); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name.trim(),
          description: createForm.description.trim() || null,
          color: createForm.color,
          currency: createForm.currency.trim() || null,
          hourlyRate: createForm.hourlyRate !== "" ? Number(createForm.hourlyRate) : null,
        }),
      });
      if (res.ok) {
        setShowCreateForm(false);
        setCreateForm(emptyForm());
        await fetchProjects();
      } else {
        const data = await res.json();
        setCreateError(data.error ?? "Failed to create project.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (project: Project) => {
    setEditingId(project.id);
    setEditForm({
      name: project.name,
      description: project.description ?? "",
      color: project.color,
      currency: project.currency ?? "",
      hourlyRate: project.hourlyRate != null ? String(project.hourlyRate) : "",
    });
    setEditError(null);
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditError(null);
  };

  const handleEditSave = async (id: string) => {
    setEditError(null);
    const err = validateName(editForm.name);
    if (err) { setEditError(err); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editForm.name.trim(),
          description: editForm.description.trim() || null,
          color: editForm.color,
          currency: editForm.currency.trim() || null,
          hourlyRate: editForm.hourlyRate !== "" ? Number(editForm.hourlyRate) : null,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchProjects();
      } else {
        const data = await res.json();
        setEditError(data.error ?? "Failed to update project.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? Time entries linked to it will be unlinked.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (res.ok || res.status === 204) {
        await fetchProjects();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Projects</h2>
        <button
          onClick={() => {
            setShowCreateForm((v) => !v);
            setCreateError(null);
            setCreateForm(emptyForm());
          }}
          className="rounded-lg px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {showCreateForm ? "Cancel" : "+ New project"}
        </button>
      </div>

      {showCreateForm && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <h3 className="text-sm font-semibold">New Project</h3>
          <ProjectForm
            form={createForm}
            onChange={setCreateForm}
            error={createError}
            loading={loading}
            submitLabel="Create"
            onSubmit={handleCreate}
            onCancel={() => { setShowCreateForm(false); setCreateError(null); }}
          />
        </div>
      )}

      <div className="space-y-2">
        {fetching && (
          <div className="space-y-2 animate-pulse" aria-label="Loading projects">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3"
              >
                <div className="h-3 w-3 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 w-1/3 rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        )}
        {!fetching && fetchError && (
          <p className="text-center py-4 text-sm text-red-500">{fetchError}</p>
        )}
        {!fetching && !fetchError && projects.length === 0 && (
          <p className="text-center py-8 text-gray-400 text-sm">
            No projects yet. Create one to organize your time entries.
          </p>
        )}
        {!fetching && projects.map((project) => (
          <div key={project.id}>
            {editingId === project.id ? (
              <div className="rounded-xl border border-indigo-300 dark:border-indigo-700 px-4 py-3 space-y-3">
                <ProjectForm
                  form={editForm}
                  onChange={setEditForm}
                  error={editError}
                  loading={loading}
                  submitLabel="Save"
                  onSubmit={() => handleEditSave(project.id)}
                  onCancel={handleEditCancel}
                />
              </div>
            ) : (
              <div className="rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{project.name}</p>
                      {project.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {project.description}
                        </p>
                      )}
                      {project.hourlyRate != null && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          {project.currency ? `${project.currency} ` : ""}{project.hourlyRate.toFixed(2)}/hr
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${ROLE_COLORS[project.role]}`}
                    >
                      {ROLE_LABELS[project.role]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                      aria-label="View project analytics"
                    >
                      Analytics
                    </Link>
                    <button
                      onClick={() =>
                        setManagingMembersId(
                          managingMembersId === project.id ? null : project.id
                        )
                      }
                      className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                      aria-label="Manage members"
                    >
                      Members
                    </button>
                    {project.role === "ADMIN" && (
                      <>
                        <button
                          onClick={() => handleEditStart(project)}
                          className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                          aria-label="Edit project"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(project.id)}
                          disabled={loading}
                          className="text-xs text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-60"
                          aria-label="Delete project"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
            {managingMembersId === project.id && (
              <div className="mt-1">
                <MembersManager
                  project={project}
                  onClose={() => setManagingMembersId(null)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
