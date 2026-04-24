"use client";

import { useState, useEffect, useCallback } from "react";

interface Category {
  id: string;
  name: string;
  color: string;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/expense-categories");
      if (!res.ok) throw new Error("Failed to load categories");
      setCategories(await res.json());
    } catch {
      setError("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/expense-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to create category");
        return;
      }
      const cat: Category = await res.json();
      setCategories((prev) => [...prev, cat].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName("");
    } catch {
      setError("Failed to create category.");
    } finally {
      setCreating(false);
    }
  }

  function startEdit(cat: Category) {
    setEditingId(cat.id);
    setEditingName(cat.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function handleSave(id: string) {
    if (!editingName.trim()) return;
    setSavingId(id);
    try {
      const res = await fetch(`/api/expense-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editingName.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to rename category");
        return;
      }
      const updated: Category = await res.json();
      setCategories((prev) =>
        prev.map((c) => (c.id === id ? updated : c)).sort((a, b) => a.name.localeCompare(b.name))
      );
      setEditingId(null);
    } catch {
      setError("Failed to rename category.");
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/expense-categories/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Failed to delete category");
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch {
      setError("Failed to delete category.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        Loading categories…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-3 text-sm text-red-600 dark:text-red-400">
          {error}
          <button onClick={() => setError(null)} className="ml-2 underline text-xs">Dismiss</button>
        </div>
      )}

      {/* Create form */}
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category name…"
          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          maxLength={64}
          disabled={creating}
        />
        <button
          type="submit"
          disabled={creating || !newName.trim()}
          className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {creating ? "Adding…" : "Add"}
        </button>
      </form>

      {/* List */}
      {categories.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 p-8 text-center text-gray-400 text-sm">
          No categories yet. Add one above.
        </div>
      ) : (
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li
              key={cat.id}
              className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-800 px-4 py-3 hover:border-gray-300 dark:hover:border-gray-700 transition-all"
            >
              <span
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              {editingId === cat.id ? (
                <>
                  <input
                    autoFocus
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSave(cat.id);
                      if (e.key === "Escape") cancelEdit();
                    }}
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    maxLength={64}
                    disabled={savingId === cat.id}
                  />
                  <button
                    onClick={() => handleSave(cat.id)}
                    disabled={savingId === cat.id || !editingName.trim()}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                  >
                    {savingId === cat.id ? "Saving…" : "Save"}
                  </button>
                  <button onClick={cancelEdit} className="text-xs text-gray-400 hover:text-gray-600">
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-sm font-medium">{cat.name}</span>
                  <button
                    onClick={() => startEdit(cat)}
                    className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  >
                    Rename
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    disabled={deletingId === cat.id}
                    className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors"
                  >
                    {deletingId === cat.id ? "Deleting…" : "Delete"}
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
