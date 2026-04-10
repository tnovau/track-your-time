import * as vscode from "vscode";
import { TimeEntry } from "../types";
import { formatDurationSeconds } from "../services/format";

export class TimerStatusBar {
  private readonly item: vscode.StatusBarItem;

  constructor() {
    this.item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
    this.item.command = "trackYourTime.stopTimer";
    this.item.tooltip = "Track Your Time";
    this.item.hide();
  }

  showRunning(entry: TimeEntry, now = new Date()) {
    const start = new Date(entry.startTime).getTime();
    const seconds = Math.max(0, Math.floor((now.getTime() - start) / 1000));
    const project = entry.project?.name ?? "No project";
    this.item.text = `$(clock) ${formatDurationSeconds(seconds)} - ${project}`;
    this.item.show();
  }

  showIdle() {
    this.item.text = "$(clock) Track Your Time";
    this.item.show();
  }

  hide() {
    this.item.hide();
  }

  dispose() {
    this.item.dispose();
  }
}
