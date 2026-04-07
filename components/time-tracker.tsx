"use client";

import { useState, useEffect, useCallback } from "react";

interface TimeEntry {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  project: { id: string; name: string; color: string } | null;
}

interface Project {
  id: string;
  name: string;
  color: string;
}

interface TimeTrackerProps {
  userId: string;
}

interface EntryFormState {
  description: string;
  projectId: string;
  startTime: string;
  endTime: string;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

/** Converts an ISO date string to the YYYY-MM-DDTHH:mm format required by datetime-local inputs. */
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TimeTracker({ userId }: TimeTrackerProps) {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [runningEntry, setRunningEntry] = useState<TimeEntry | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [description, setDescription] = useState("");
  const [selectedProject, setSelectedProject] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EntryFormState>({
    description: "",
    projectId: "",
    startTime: "",
    endTime: "",
  });
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualEntry, setManualEntry] = useState<EntryFormState>({
    description: "",
    projectId: "",
    startTime: "",
    endTime: "",
  });
  const [manualError, setManualError] = useState<string | null>(null);

  // Filter state
  const [showFilter, setShowFilter] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const isFilterActive = !!(filterProjectId || filterDateFrom || filterDateTo);

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterProjectId) params.set("projectId", filterProjectId);
    if (filterDateFrom)
      params.set("dateFrom", new Date(`${filterDateFrom}T00:00:00`).toISOString());
    if (filterDateTo)
      params.set("dateTo", new Date(`${filterDateTo}T23:59:59.999`).toISOString());
    const qs = params.toString();

    const [entriesRes, projectsRes] = await Promise.all([
      fetch(`/api/time-entries${qs ? `?${qs}` : ""}`),
      fetch("/api/projects"),
    ]);
    if (entriesRes.ok) {
      const data: TimeEntry[] = await entriesRes.json();
      setEntries(data.filter((e) => e.endTime !== null));
      const running = data.find((e) => e.endTime === null) ?? null;
      setRunningEntry(running);
      if (running) {
        setDescription(running.description ?? "");
        setSelectedProject(running.project?.id ?? "");
      }
    }
    if (projectsRes.ok) {
      setProjects(await projectsRes.json());
    }
  }, [filterProjectId, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!runningEntry) {
      setElapsed(0);
      return;
    }
    const start = new Date(runningEntry.startTime).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [runningEntry]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          projectId: selectedProject || null,
        }),
      });
      if (res.ok) {
        await fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (!runningEntry) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/time-entries/${runningEntry.id}/stop`, {
        method: "PATCH",
      });
      if (res.ok) {
        setRunningEntry(null);
        setDescription("");
        setSelectedProject("");
        await fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setEditState({
      description: entry.description ?? "",
      projectId: entry.project?.id ?? "",
      startTime: toDatetimeLocal(entry.startTime),
      endTime: entry.endTime ? toDatetimeLocal(entry.endTime) : "",
    });
  };

  const handleEditCancel = () => {
    setEditingId(null);
  };

  const handleEditSave = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/time-entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editState.description || null,
          projectId: editState.projectId || null,
          startTime: editState.startTime
            ? new Date(editState.startTime).toISOString()
            : undefined,
          endTime: editState.endTime
            ? new Date(editState.endTime).toISOString()
            : undefined,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        await fetchData();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleManualCreate = async () => {
    setManualError(null);
    if (!manualEntry.startTime || !manualEntry.endTime) {
      setManualError("Start time and end time are required.");
      return;
    }
    const start = new Date(manualEntry.startTime);
    const end = new Date(manualEntry.endTime);
    if (end <= start) {
      setManualError("End time must be after start time.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/time-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: manualEntry.description || null,
          projectId: manualEntry.projectId || null,
          startTime: start.toISOString(),
          endTime: end.toISOString(),
        }),
      });
      if (res.ok) {
        setShowManualForm(false);
        setManualEntry({ description: "", projectId: "", startTime: "", endTime: "" });
        await fetchData();
      } else {
        const data = await res.json();
        setManualError(data.error ?? "Failed to create entry.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilter = () => {
    setFilterProjectId("");
    setFilterDateFrom("");
    setFilterDateTo("");
  };

  const totalToday = entries.reduce((acc, e) => {
    const start = new Date(e.startTime);
    const today = new Date();
    if (
      start.getFullYear() === today.getFullYear() &&
      start.getMonth() === today.getMonth() &&
      start.getDate() === today.getDate()
    ) {
      return acc + (e.duration ?? 0);
    }
    return acc;
  }, 0);

  const totalFiltered = entries.reduce((acc, e) => acc + (e.duration ?? 0), 0);

  return (
    <div className="space-y-6">
      {/* Timer Bar */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <input
            type="text"
            placeholder="What are you working on?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={!!runningEntry}
            className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            disabled={!!runningEntry}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
          >
            <option value="">No project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {runningEntry && (
            <span className="font-mono text-lg font-semibold tabular-nums">
              {formatDuration(elapsed)}
            </span>
          )}
          <button
            onClick={runningEntry ? handleStop : handleStart}
            disabled={loading}
            className={`rounded-lg px-5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-60 ${
              runningEntry
                ? "bg-red-500 hover:bg-red-400"
                : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {runningEntry ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">
            {isFilterActive ? "Filtered Entries" : "Today"}
          </h2>
          {isFilterActive && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
              {entries.length} result{entries.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-sm text-gray-500 dark:text-gray-400">
            Total: {formatDuration(isFilterActive ? totalFiltered : totalToday)}
          </span>
          <button
            onClick={() => { setShowManualForm((v) => !v); setManualError(null); }}
            className="rounded-lg px-3 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            {showManualForm ? "Cancel" : "+ Add entry"}
          </button>
          <button
            onClick={() => setShowFilter((v) => !v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium border transition-colors ${
              isFilterActive
                ? "border-indigo-400 dark:border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {showFilter ? "Hide Filter" : isFilterActive ? "Filter ●" : "Filter"}
          </button>
        </div>
      </div>

      {/* Filter bar */}
      {showFilter && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-end flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Project</label>
              <select
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Projects</option>
                <option value="none">No Project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">From</label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">To</label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            {isFilterActive && (
              <button
                onClick={handleClearFilter}
                className="rounded-lg px-3 py-2 text-sm font-medium text-red-500 hover:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Manual entry form */}
      {showManualForm && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
          <h3 className="text-sm font-semibold">Add Manual Entry</h3>
          <input
            type="text"
            placeholder="Description (optional)"
            value={manualEntry.description}
            onChange={(e) => setManualEntry((s) => ({ ...s, description: e.target.value }))}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={manualEntry.projectId}
              onChange={(e) => setManualEntry((s) => ({ ...s, projectId: e.target.value }))}
              className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">Start</label>
              <input
                type="datetime-local"
                value={manualEntry.startTime}
                onChange={(e) => setManualEntry((s) => ({ ...s, startTime: e.target.value }))}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <label className="text-xs text-gray-500 dark:text-gray-400">End</label>
              <input
                type="datetime-local"
                value={manualEntry.endTime}
                onChange={(e) => setManualEntry((s) => ({ ...s, endTime: e.target.value }))}
                className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          {manualError && (
            <p className="text-xs text-red-500">{manualError}</p>
          )}
          <div className="flex justify-end">
            <button
              onClick={handleManualCreate}
              disabled={loading}
              className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-60"
            >
              Save Entry
            </button>
          </div>
        </div>
      )}

      {/* Entries list */}
      <div className="space-y-2">
        {entries.length === 0 && !runningEntry && (
          <p className="text-center py-12 text-gray-400">
            {isFilterActive
              ? "No entries match the current filter."
              : "No time entries yet. Start tracking!"}
          </p>
        )}
        {runningEntry && (
          <div className="flex items-center justify-between rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse shrink-0" />
              <span className="text-sm font-medium truncate">
                {runningEntry.description ?? "No description"}
              </span>
              {runningEntry.project && (
                <span
                  className="shrink-0 text-xs px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: runningEntry.project.color }}
                >
                  {runningEntry.project.name}
                </span>
              )}
            </div>
            <span className="font-mono text-sm tabular-nums text-indigo-600 dark:text-indigo-400">
              {formatDuration(elapsed)}
            </span>
          </div>
        )}
        {entries.map((entry) =>
          editingId === entry.id ? (
            <div
              key={entry.id}
              className="rounded-lg border border-indigo-300 dark:border-indigo-700 px-4 py-3 space-y-3"
            >
              <input
                type="text"
                placeholder="Description"
                value={editState.description}
                onChange={(e) =>
                  setEditState((s) => ({ ...s, description: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <div className="flex flex-col sm:flex-row gap-3">
                <select
                  value={editState.projectId}
                  onChange={(e) =>
                    setEditState((s) => ({ ...s, projectId: e.target.value }))
                  }
                  className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">No project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      Start
                    </label>
                    <input
                      type="datetime-local"
                      value={editState.startTime}
                      onChange={(e) =>
                        setEditState((s) => ({
                          ...s,
                          startTime: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex flex-col gap-1 flex-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      End
                    </label>
                    <input
                      type="datetime-local"
                      value={editState.endTime}
                      onChange={(e) =>
                        setEditState((s) => ({
                          ...s,
                          endTime: e.target.value,
                        }))
                      }
                      className="rounded-lg border border-gray-200 dark:border-gray-700 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={handleEditCancel}
                  disabled={loading}
                  className="rounded-lg px-4 py-1.5 text-sm font-medium border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleEditSave(entry.id)}
                  disabled={loading}
                  className="rounded-lg px-4 py-1.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors disabled:opacity-60"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-800 px-4 py-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-sm font-medium truncate">
                  {entry.description ?? "No description"}
                </span>
                {entry.project && (
                  <span
                    className="shrink-0 text-xs px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: entry.project.color }}
                  >
                    {entry.project.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-gray-400 dark:text-gray-500">
                  {new Date(entry.startTime).toLocaleDateString()}
                </span>
                <span className="font-mono text-sm tabular-nums text-gray-500 dark:text-gray-400">
                  {formatDuration(entry.duration ?? 0)}
                </span>
                <button
                  onClick={() => handleEditStart(entry)}
                  className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                  aria-label="Edit entry"
                >
                  Edit
                </button>
              </div>
            </div>
          )
        )}
      </div>

      {/* Hidden userId for reference */}
      <input type="hidden" value={userId} />
    </div>
  );
}
