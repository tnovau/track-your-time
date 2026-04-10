import * as vscode from "vscode";
import { ApiClient } from "./api-client";
import { AnalyticsPeriod } from "../types";
import { formatHours } from "./format";

export class AnalyticsService {
  constructor(private readonly apiClient: ApiClient) {}

  async showSummary(period: AnalyticsPeriod) {
    const overall = await this.apiClient.getOverallAnalytics(period);
    const totalHours = overall.projects.reduce((sum, project) => sum + project.hours, 0);
    const totalEarnings = overall.projects.reduce((sum, project) => sum + project.earnings, 0);

    const lines = [
      `# Track Your Time analytics (${period})`,
      "",
      `- Total hours: ${formatHours(totalHours)}`,
      `- Total earnings: ${totalEarnings.toFixed(2)}`,
      `- Projects with time: ${overall.projects.length}`,
      "",
      "## Per project",
      ...overall.projects.map((project) => {
        const hours = formatHours(project.hours);
        const earnings = project.earnings.toFixed(2);
        return `- ${project.name}: ${hours} | earnings ${earnings}`;
      }),
    ];

    const doc = await vscode.workspace.openTextDocument({
      language: "markdown",
      content: lines.join("\n"),
    });
    await vscode.window.showTextDocument(doc, { preview: false });
  }

  async showCharts(period: AnalyticsPeriod) {
    const overall = await this.apiClient.getOverallAnalytics(period);
    const panel = vscode.window.createWebviewPanel(
      "trackYourTime.analytics",
      `Track Your Time Charts (${period})`,
      vscode.ViewColumn.Active,
      { enableScripts: false }
    );

    const maxHours = Math.max(1, ...overall.projects.map((project) => project.hours));

    const bars = overall.projects
      .map((project) => {
        const width = Math.max(2, Math.round((project.hours / maxHours) * 100));
        return `<div class="row"><div class="label">${escapeHtml(project.name)}</div><div class="bar-wrap"><div class="bar" style="width:${width}%"></div></div><div class="value">${project.hours.toFixed(2)}h</div></div>`;
      })
      .join("\n");

    panel.webview.html = `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 16px; color: var(--vscode-foreground); }
  h1 { font-size: 16px; margin-bottom: 12px; }
  .row { display: grid; grid-template-columns: 180px 1fr 70px; gap: 12px; align-items: center; margin: 8px 0; }
  .label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bar-wrap { background: var(--vscode-input-background); border-radius: 6px; height: 12px; }
  .bar { background: var(--vscode-button-background); border-radius: 6px; height: 12px; }
  .value { text-align: right; font-variant-numeric: tabular-nums; }
</style>
</head>
<body>
  <h1>Hours per project (${period})</h1>
  ${bars || "<p>No data for this period.</p>"}
</body>
</html>`;
  }
}

function escapeHtml(input: string) {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
