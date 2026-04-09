import { URLSearchParams } from "node:url";
import { AnalyticsPeriod, OverallAnalytics, ProjectAnalytics, ProjectSummary, TimeEntry, TrackYourTimeConfig } from "../types";
import { StorageService } from "./storage-service";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH";
  query?: Record<string, string | undefined>;
  body?: unknown;
  auth?: boolean;
};

export class ApiClient {
  constructor(
    private readonly config: TrackYourTimeConfig,
    private readonly storage: StorageService,
  ) {}

  async hasSession() {
    const projects = await this.listProjects();
    return Array.isArray(projects);
  }

  async listProjects() {
    return this.request<ProjectSummary[]>("/api/projects");
  }

  async listEntries(query?: { projectId?: string; dateFrom?: string; dateTo?: string }) {
    return this.request<TimeEntry[]>("/api/time-entries", {
      query,
    });
  }

  async startTimer(input: { projectId?: string; description?: string }) {
    return this.request<TimeEntry>("/api/time-entries", {
      method: "POST",
      body: {
        projectId: input.projectId,
        description: input.description,
      },
    });
  }

  async createManualEntry(input: {
    projectId?: string;
    description?: string;
    startTime: string;
    endTime: string;
  }) {
    return this.request<TimeEntry>("/api/time-entries", {
      method: "POST",
      body: input,
    });
  }

  async stopEntry(entryId: string) {
    return this.request<TimeEntry>(`/api/time-entries/${entryId}/stop`, {
      method: "PATCH",
    });
  }

  async updateEntry(
    entryId: string,
    input: {
      description?: string | null;
      projectId?: string | null;
      startTime?: string;
      endTime?: string | null;
    }
  ) {
    return this.request<TimeEntry>(`/api/time-entries/${entryId}`, {
      method: "PATCH",
      body: input,
    });
  }

  async getOverallAnalytics(period: AnalyticsPeriod) {
    return this.request<OverallAnalytics>("/api/analytics", {
      query: { period },
    });
  }

  async getProjectAnalytics(projectId: string, period: AnalyticsPeriod) {
    return this.request<ProjectAnalytics>(`/api/projects/${projectId}/analytics`, {
      query: { period },
    });
  }

  async exchangeBridgeCode(input: { code: string; state: string }) {
    const response = await this.request<{ cookie: string }>("/api/auth/extension/exchange", {
      method: "POST",
      body: input,
      auth: false,
    });
    return response.cookie;
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const method = options.method ?? "GET";
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(options.query ?? {})) {
      if (value !== undefined) {
        searchParams.set(key, value);
      }
    }

    const query = searchParams.toString();
    const url = `${this.config.baseUrl}${path}${query ? `?${query}` : ""}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    if (options.auth !== false) {
      const cookie = await this.storage.readCookie();
      if (!cookie) {
        throw new Error("Not authenticated. Run Track Your Time: Sign In first.");
      }
      headers.Cookie = cookie;
    }

    const response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      let message = `${response.status} ${response.statusText}`;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        if (body?.error) {
          message = body.error;
        }
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return (await response.json()) as T;
  }
}
