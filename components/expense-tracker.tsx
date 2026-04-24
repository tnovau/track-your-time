"use client";

import { useState, useEffect, useCallback } from "react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  tax: number | null;
  billable: boolean;
  date: string;
  userId: string;
  fileUrl: string | null;
  fileKey: string | null;
  fileName: string | null;
  project: { id: string; name: string; color: string; currency: string | null } | null;
  category: { id: string; name: string; color: string } | null;
  user: { id: string; name: string; email: string };
}

interface Project {
  id: string;
  name: string;
  color: string;
  currency: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ExpenseFormState {
  description: string;
  amount: string;
  tax: string;
  billable: boolean;
  date: string;
  projectId: string;
  categoryId: string;
  file: File | null;
  fileUrl: string | null;
  fileKey: string | null;
  fileName: string | null;
}

function emptyForm(): ExpenseFormState {
  return {
    description: "",
    amount: "",
    tax: "",
    billable: false,
    date: new Date().toISOString().slice(0, 10),
    projectId: "",
    categoryId: "",
    file: null,
    fileUrl: null,
    fileKey: null,
    fileName: null,
  };
}

async function uploadFile(file: File): Promise<{
  fileUrl: string;
  fileKey: string;
  fileName: string;
}> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/expenses/upload", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Upload failed");
  }
  return res.json();
}

function formatCurrency(amount: number, currency: string | null): string {
  if (!currency) return amount.toFixed(2);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ExpenseTracker() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExpenseFormState>(emptyForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExpenseFormState>(emptyForm());

  // Filters
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterCategoryId, setFilterCategoryId] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const isFilterActive = !!(filterProjectId || filterCategoryId || filterDateFrom || filterDateTo);

  const fetchData = useCallback(async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (filterProjectId) params.set("projectId", filterProjectId);
      if (filterCategoryId) params.set("categoryId", filterCategoryId);
      if (filterDateFrom) params.set("dateFrom", filterDateFrom);
      if (filterDateTo) params.set("dateTo", filterDateTo);
      const qs = params.toString();

      const [expRes, projRes, catRes] = await Promise.all([
        fetch(`/api/expenses${qs ? `?${qs}` : ""}`),
        fetch("/api/projects"),
        fetch("/api/expense-categories"),
      ]);

      if (expRes.ok) setExpenses(await expRes.json());
      if (projRes.ok) setProjects(await projRes.json());
      if (catRes.ok) setCategories(await catRes.json());
    } finally {
      setFetching(false);
    }
  }, [filterProjectId, filterCategoryId, filterDateFrom, filterDateTo]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function handleCreate() {
    setFormError(null);
    if (!form.description.trim()) {
      setFormError("Description is required.");
      return;
    }
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      setFormError("Amount must be a positive number.");
      return;
    }
    if (!form.date) {
      setFormError("Date is required.");
      return;
    }

    setLoading(true);
    try {
      let fileData: { fileUrl?: string; fileKey?: string; fileName?: string } = {};
      if (form.file) {
        try {
          fileData = await uploadFile(form.file);
        } catch (err) {
          setFormError(err instanceof Error ? err.message : "File upload failed.");
          return;
        }
      }

      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: form.description.trim(),
          amount: Number(form.amount),
          date: new Date(form.date).toISOString(),
          projectId: form.projectId || null,
          categoryId: form.categoryId || null,
          tax: form.tax ? Number(form.tax) : null,
          billable: form.billable,
          ...fileData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setFormError(data.error || "Failed to create expense.");
        return;
      }

      setForm(emptyForm());
      setShowForm(false);
      fetchData();
    } finally {
      setLoading(false);
    }
  }

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setEditForm({
      description: expense.description,
      amount: String(expense.amount),
      tax: expense.tax != null ? String(expense.tax) : "",
      billable: expense.billable,
      date: new Date(expense.date).toISOString().slice(0, 10),
      projectId: expense.project?.id ?? "",
      categoryId: expense.category?.id ?? "",
      file: null,
      fileUrl: expense.fileUrl,
      fileKey: expense.fileKey,
      fileName: expense.fileName,
    });
  }

  async function handleUpdate() {
    if (!editingId) return;
    setLoading(true);
    try {
      let fileData: { fileUrl?: string | null; fileKey?: string | null; fileName?: string | null } = {};
      if (editForm.file) {
        try {
          fileData = await uploadFile(editForm.file);
        } catch {
          return;
        }
      } else if (editForm.fileUrl === null && editForm.fileKey === null) {
        // File was removed
        fileData = { fileUrl: null, fileKey: null, fileName: null };
      }

      const res = await fetch(`/api/expenses/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: editForm.description.trim(),
          amount: Number(editForm.amount),
          date: new Date(editForm.date).toISOString(),
          projectId: editForm.projectId || null,
          categoryId: editForm.categoryId || null,
          tax: editForm.tax ? Number(editForm.tax) : null,
          billable: editForm.billable,
          ...fileData,
        }),
      });

      if (res.ok) {
        setEditingId(null);
        fetchData();
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } finally {
      setLoading(false);
    }
  }

  function clearFilters() {
    setFilterProjectId("");
    setFilterCategoryId("");
    setFilterDateFrom("");
    setFilterDateTo("");
  }

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalTax = expenses.reduce((sum, e) => sum + (e.tax ?? 0), 0);
  const selectedProject = filterProjectId && filterProjectId !== "none"
    ? projects.find((p) => p.id === filterProjectId)
    : null;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Project
            </label>
            <select
              value={filterProjectId}
              onChange={(e) => setFilterProjectId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="">All projects</option>
              <option value="none">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              Category
            </label>
            <select
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
            >
              <option value="">All categories</option>
              <option value="none">No category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              From
            </label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>
          <div className="min-w-[140px]">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              To
            </label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
            />
          </div>
          {isFilterActive && (
            <button
              onClick={clearFilters}
              className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline pb-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Summary + Add button */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            {" · "}
            <span className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(totalAmount, selectedProject?.currency ?? null)}
            </span>
            {totalTax > 0 && (
              <>
                {" · Tax "}
                <span className="font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(totalTax, selectedProject?.currency ?? null)}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm);
            setFormError(null);
            if (!showForm) setForm(emptyForm());
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
        >
          {showForm ? "Cancel" : "+ Add Expense"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
          <h3 className="text-sm font-semibold">New Expense</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Software subscription"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Amount
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Tax (optional)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.tax}
                onChange={(e) => setForm({ ...form, tax: e.target.value })}
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Date
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Project (optional)
              </label>
              <select
                value={form.projectId}
                onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Category (optional)
              </label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
              >
                <option value="">No category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Receipt / Invoice (optional)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) =>
                    setForm({ ...form, file: e.target.files?.[0] ?? null })
                  }
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 dark:file:bg-indigo-950/50 dark:file:text-indigo-400"
                />
                {form.file && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, file: null })}
                    className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                  >
                    Remove
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG or PDF. Images are stored as PDF.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="billable"
              checked={form.billable}
              onChange={(e) => setForm({ ...form, billable: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="billable" className="text-sm text-gray-700 dark:text-gray-300">
              Billable
            </label>
          </div>
          {formError && (
            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowForm(false);
                setFormError(null);
              }}
              className="px-4 py-2 text-sm rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {loading ? "Saving…" : "Save Expense"}
            </button>
          </div>
        </div>
      )}

      {/* Expense list */}
      {fetching ? (
        <div className="text-center py-12 text-gray-400">Loading…</div>
      ) : expenses.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            {isFilterActive
              ? "No expenses match your filters."
              : "No expenses yet. Add your first expense above!"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {expenses.map((expense) =>
            editingId === expense.id ? (
              /* Inline edit form */
              <div
                key={expense.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-indigo-300 dark:border-indigo-700 p-4 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Description
                    </label>
                    <input
                      type="text"
                      value={editForm.description}
                      onChange={(e) =>
                        setEditForm({ ...editForm, description: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Amount
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={editForm.amount}
                      onChange={(e) =>
                        setEditForm({ ...editForm, amount: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
                      placeholder="Amount"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Tax (optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={editForm.tax}
                      onChange={(e) =>
                        setEditForm({ ...editForm, tax: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
                      placeholder="Tax"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={editForm.date}
                      onChange={(e) =>
                        setEditForm({ ...editForm, date: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Project (optional)
                    </label>
                    <select
                      value={editForm.projectId}
                      onChange={(e) =>
                        setEditForm({ ...editForm, projectId: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
                    >
                      <option value="">No project</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Category (optional)
                    </label>
                    <select
                      value={editForm.categoryId}
                      onChange={(e) =>
                        setEditForm({ ...editForm, categoryId: e.target.value })
                      }
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm"
                    >
                      <option value="">No category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Receipt / Invoice
                    </label>
                    {editForm.fileUrl && !editForm.file ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={editForm.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline truncate"
                        >
                          {editForm.fileName || "View file"}
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            setEditForm({
                              ...editForm,
                              fileUrl: null,
                              fileKey: null,
                              fileName: null,
                            })
                          }
                          className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,application/pdf"
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              file: e.target.files?.[0] ?? null,
                            })
                          }
                          className="w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 dark:file:bg-indigo-950/50 dark:file:text-indigo-400"
                        />
                        {editForm.file && (
                          <button
                            type="button"
                            onClick={() =>
                              setEditForm({ ...editForm, file: null })
                            }
                            className="text-xs text-gray-400 hover:text-red-500 shrink-0"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`edit-billable-${editingId}`}
                    checked={editForm.billable}
                    onChange={(e) =>
                      setEditForm({ ...editForm, billable: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor={`edit-billable-${editingId}`} className="text-xs text-gray-700 dark:text-gray-300">
                    Billable
                  </label>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 text-xs rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdate}
                    disabled={loading}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              /* Display row */
              <div
                key={expense.id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-4 flex items-center gap-4 group hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
              >
                {/* Project color dot */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor: expense.project?.color ?? "#9ca3af",
                  }}
                />

                {/* Description + metadata */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {expense.description}
                    {expense.billable && (
                      <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                        Billable
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatDate(expense.date)}
                    {expense.project && (
                      <>
                        {" · "}
                        <span
                          className="font-medium"
                          style={{ color: expense.project.color }}
                        >
                          {expense.project.name}
                        </span>
                      </>
                    )}
                    {expense.category && (
                      <>
                        {" · "}
                        <span
                          className="inline-flex items-center gap-0.5 font-medium"
                          style={{ color: expense.category.color }}
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full"
                            style={{ backgroundColor: expense.category.color }}
                          />
                          {expense.category.name}
                        </span>
                      </>
                    )}
                    {expense.fileUrl && (
                      <>
                        {" · "}
                        <a
                          href={expense.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <svg
                            className="w-3 h-3"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          {expense.fileName || "Receipt"}
                        </a>
                      </>
                    )}
                  </p>
                </div>

                {/* Amount */}
                <div className="text-right shrink-0">
                  <p className="text-sm font-semibold tabular-nums">
                    {formatCurrency(
                      expense.amount,
                      expense.project?.currency ?? null
                    )}
                  </p>
                  {expense.tax != null && expense.tax > 0 && (
                    <p className="text-xs text-gray-400 tabular-nums">
                      tax {formatCurrency(expense.tax, expense.project?.currency ?? null)}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={() => startEdit(expense)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 transition-colors"
                    title="Edit"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                    title="Delete"
                  >
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
