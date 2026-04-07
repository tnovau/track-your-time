"use client";

import { useState, useEffect, useCallback } from "react";

interface Project {
  id: string;
  name: string;
  description: string | null;
  color: string;
}

interface ProjectFormState {
  name: string;
  description: string;
  color: string;
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

function emptyForm(): ProjectFormState {
  return { name: "", description: "", color: DEFAULT_COLOR };
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
          className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-60"
        >
          {submitLabel}
        </button>
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
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
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
                className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3"
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
        {!fetching && projects.map((project) =>
          editingId === project.id ? (
            <div
              key={project.id}
              className="rounded-lg border border-indigo-300 dark:border-indigo-700 px-4 py-3 space-y-3"
            >
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
            <div
              key={project.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3"
            >
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
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
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
              </div>
            </div>
          )
        )}
      </div>
    </div>
  );
}
