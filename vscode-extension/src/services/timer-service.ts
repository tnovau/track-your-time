import * as vscode from "vscode";
import { ApiClient } from "./api-client";
import { StorageService } from "./storage-service";
import { TimeEntry } from "../types";

export class TimerService {
  constructor(
    private readonly apiClient: ApiClient,
    private readonly storage: StorageService,
  ) {}

  async getRunningEntry() {
    const entries = await this.apiClient.listEntries();
    return entries.find((entry) => !entry.endTime) ?? null;
  }

  async startTimer() {
    const projects = await this.apiClient.listProjects();

    const selected = await vscode.window.showQuickPick(
      [
        { label: "No project", projectId: "none" },
        ...projects.map((project) => ({
          label: project.name,
          description: project.role,
          projectId: project.id,
        })),
      ],
      {
        placeHolder: "Select project",
      }
    );

    if (!selected) return null;

    const description = await vscode.window.showInputBox({
      prompt: "Timer description (optional)",
    });

    const entry = await this.apiClient.startTimer({
      description: description?.trim() || undefined,
      projectId: selected.projectId === "none" ? undefined : selected.projectId,
    });

    await this.storage.setLastProjectId(
      selected.projectId === "none" ? null : selected.projectId
    );

    return entry;
  }

  async stopTimer() {
    const running = await this.getRunningEntry();
    if (!running) return null;
    return this.apiClient.stopEntry(running.id);
  }

  async updateRunningDescription() {
    const running = await this.getRunningEntry();
    if (!running) return null;

    const description = await vscode.window.showInputBox({
      prompt: "New running description",
      value: running.description ?? "",
    });

    if (description === undefined) return null;

    return this.apiClient.updateEntry(running.id, {
      description: description.trim() || null,
    });
  }

  async createManualEntry() {
    const projects = await this.apiClient.listProjects();
    const selected = await vscode.window.showQuickPick(
      [
        { label: "No project", projectId: "none" },
        ...projects.map((project) => ({ label: project.name, projectId: project.id })),
      ],
      { placeHolder: "Select project for manual entry" }
    );
    if (!selected) return null;

    const description = await vscode.window.showInputBox({
      prompt: "Entry description (optional)",
    });
    if (description === undefined) return null;

    const startInput = await vscode.window.showInputBox({
      prompt: "Start time ISO (e.g. 2026-04-09T09:00:00.000Z)",
    });
    if (!startInput) return null;

    const endInput = await vscode.window.showInputBox({
      prompt: "End time ISO (e.g. 2026-04-09T10:15:00.000Z)",
    });
    if (!endInput) return null;

    return this.apiClient.createManualEntry({
      projectId: selected.projectId === "none" ? undefined : selected.projectId,
      description: description.trim() || undefined,
      startTime: startInput,
      endTime: endInput,
    });
  }

  async listRecentEntries() {
    return this.apiClient.listEntries();
  }

  async chooseEntryToEdit() {
    const entries = await this.apiClient.listEntries();
    const completed = entries.filter((entry) => !!entry.endTime).slice(0, 25);

    const selected = await vscode.window.showQuickPick(
      completed.map((entry) => ({
        label: entry.description || "Untitled entry",
        description: `${entry.project?.name ?? "No project"} - ${new Date(entry.startTime).toLocaleString()}`,
        entry,
      })),
      { placeHolder: "Select entry to edit" }
    );

    return selected?.entry ?? null;
  }

  async editEntry(entry: TimeEntry) {
    const projects = await this.apiClient.listProjects();
    const selectedProject = await vscode.window.showQuickPick(
      [
        { label: "No project", projectId: "none" },
        ...projects.map((project) => ({
          label: project.name,
          projectId: project.id,
        })),
      ],
      {
        placeHolder: "Select project",
      }
    );
    if (!selectedProject) return null;

    const description = await vscode.window.showInputBox({
      prompt: "Description",
      value: entry.description ?? "",
    });
    if (description === undefined) return null;

    const startTime = await vscode.window.showInputBox({
      prompt: "Start time ISO",
      value: entry.startTime,
      validateInput: (value) =>
        Number.isNaN(new Date(value).getTime()) ? "Invalid ISO date" : null,
    });
    if (!startTime) return null;

    const endTime = await vscode.window.showInputBox({
      prompt: "End time ISO (leave empty for running entry)",
      value: entry.endTime ?? "",
      validateInput: (value) => {
        if (!value.trim()) return null;
        return Number.isNaN(new Date(value).getTime()) ? "Invalid ISO date" : null;
      },
    });
    if (endTime === undefined) return null;

    return this.apiClient.updateEntry(entry.id, {
      description: description.trim() || null,
      projectId: selectedProject.projectId === "none" ? null : selectedProject.projectId,
      startTime,
      endTime: endTime.trim() ? endTime : null,
    });
  }
}
