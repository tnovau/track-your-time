import * as vscode from "vscode";
import { getConfig } from "./config";
import { ApiClient } from "./services/api-client";
import { AnalyticsService } from "./services/analytics-service";
import { AuthService } from "./services/auth-service";
import { formatDurationSeconds } from "./services/format";
import { StorageService } from "./services/storage-service";
import { TimerService } from "./services/timer-service";
import { TimerStatusBar } from "./ui/status-bar";

export async function activate(context: vscode.ExtensionContext) {
  let config;
  try {
    config = getConfig();
  } catch (error) {
    void vscode.window.showErrorMessage(
      `Track Your Time configuration error: ${(error as Error).message}`
    );
    return;
  }

  const storage = new StorageService(context);
  const apiClient = new ApiClient(config, storage);
  const authService = new AuthService(config, apiClient, storage);
  const timerService = new TimerService(apiClient, storage);
  const analyticsService = new AnalyticsService(apiClient);
  const statusBar = new TimerStatusBar();
  const output = vscode.window.createOutputChannel("Track Your Time");

  context.subscriptions.push(statusBar, output);

  const withAuth = async <T>(action: () => Promise<T>) => {
    const authenticated = await authService.ensureAuthenticated();
    if (!authenticated) {
      void vscode.window.showWarningMessage("Please sign in first: Track Your Time: Sign In");
      return null;
    }

    try {
      return await action();
    } catch (error) {
      const message = (error as Error).message;
      output.appendLine(`[error] ${message}`);
      void vscode.window.showErrorMessage(`Track Your Time error: ${message}`);
      return null;
    }
  };

  const refreshRunningTimer = async () => {
    const running = await withAuth(() => timerService.getRunningEntry());
    if (!running) {
      statusBar.showIdle();
      return;
    }
    statusBar.showRunning(running);
  };

  context.subscriptions.push(
    vscode.commands.registerCommand("trackYourTime.signIn", async () => {
      try {
        await authService.signIn();
        output.appendLine("[auth] sign-in completed");
        void vscode.window.showInformationMessage("Track Your Time connected.");
        await refreshRunningTimer();
      } catch (error) {
        const message = (error as Error).message;
        output.appendLine(`[auth] sign-in failed: ${message}`);
        void vscode.window.showErrorMessage(`Sign-in failed: ${message}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("trackYourTime.signOut", async () => {
      await authService.signOut();
      statusBar.showIdle();
      void vscode.window.showInformationMessage("Track Your Time signed out.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("trackYourTime.startTimer", async () => {
      const started = await withAuth(() => timerService.startTimer());
      if (!started) return;

      void vscode.window.showInformationMessage(
        `Timer started for ${started.project?.name ?? "No project"}`
      );
      await refreshRunningTimer();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("trackYourTime.stopTimer", async () => {
      const stopped = await withAuth(() => timerService.stopTimer());
      if (!stopped) {
        void vscode.window.showInformationMessage("No running timer found.");
        await refreshRunningTimer();
        return;
      }

      void vscode.window.showInformationMessage(
        `Stopped timer at ${formatDurationSeconds(stopped.duration ?? 0)}`
      );
      await refreshRunningTimer();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("trackYourTime.updateRunningDescription", async () => {
      const updated = await withAuth(() => timerService.updateRunningDescription());
      if (!updated) return;
      void vscode.window.showInformationMessage("Running timer description updated.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("trackYourTime.createManualEntry", async () => {
      const entry = await withAuth(() => timerService.createManualEntry());
      if (!entry) return;
      void vscode.window.showInformationMessage("Manual time entry created.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("trackYourTime.editEntry", async () => {
      const selected = await withAuth(() => timerService.chooseEntryToEdit());
      if (!selected) return;

      const updated = await withAuth(() => timerService.editEntry(selected));
      if (!updated) return;

      void vscode.window.showInformationMessage("Time entry updated.");
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("trackYourTime.listRecentEntries", async () => {
      const entries = await withAuth(() => timerService.listRecentEntries());
      if (!entries) return;

      const picks = entries.slice(0, 30).map((entry) => {
        const running = !entry.endTime;
        return {
          label: running ? "$(clock) Running" : (entry.description || "Untitled entry"),
          description: `${entry.project?.name ?? "No project"} - ${new Date(entry.startTime).toLocaleString()}`,
          detail: running
            ? "In progress"
            : `Duration: ${formatDurationSeconds(entry.duration ?? 0)}`,
        };
      });

      void vscode.window.showQuickPick(picks, {
        placeHolder: "Recent time entries",
      });
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("trackYourTime.showAnalyticsSummary", async () => {
      await withAuth(() => analyticsService.showSummary(config.defaultAnalyticsPeriod));
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("trackYourTime.showAnalyticsCharts", async () => {
      await withAuth(() => analyticsService.showCharts(config.defaultAnalyticsPeriod));
    })
  );

  const poll = setInterval(() => {
    void refreshRunningTimer();
  }, config.pollIntervalSeconds * 1000);
  context.subscriptions.push({
    dispose: () => clearInterval(poll),
  });

  await refreshRunningTimer();
}

export function deactivate() {
  // No-op
}
