import * as vscode from "vscode";
import { AnalyticsPeriod, Provider, TrackYourTimeConfig } from "./types";

function normalizeBaseUrl(baseUrl: string) {
  const trimmed = baseUrl.trim().replace(/\/$/, "");
  const parsed = new URL(trimmed);
  return parsed.toString().replace(/\/$/, "");
}

export function getConfig(): TrackYourTimeConfig {
  const cfg = vscode.workspace.getConfiguration("trackYourTime");
  const baseUrl = normalizeBaseUrl(cfg.get<string>("baseUrl", "http://localhost:3000"));
  const callbackHost = cfg.get<string>("callbackHost", "127.0.0.1").trim();
  const callbackPort = cfg.get<number>("callbackPort", 43899);
  const defaultProvider = cfg.get<Provider>("defaultProvider", "github");
  const pollIntervalSeconds = cfg.get<number>("pollIntervalSeconds", 15);
  const defaultAnalyticsPeriod = cfg.get<AnalyticsPeriod>("defaultAnalyticsPeriod", "month");

  if (!Number.isInteger(callbackPort) || callbackPort < 1 || callbackPort > 65535) {
    throw new Error("trackYourTime.callbackPort must be an integer between 1 and 65535");
  }
  if (!callbackHost) {
    throw new Error("trackYourTime.callbackHost cannot be empty");
  }
  if (pollIntervalSeconds < 5 || pollIntervalSeconds > 120) {
    throw new Error("trackYourTime.pollIntervalSeconds must be between 5 and 120");
  }

  return {
    baseUrl,
    callbackHost,
    callbackPort,
    defaultProvider,
    pollIntervalSeconds,
    defaultAnalyticsPeriod,
  };
}
