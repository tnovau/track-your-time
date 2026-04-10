export type AnalyticsPeriod = "week" | "month" | "year";

export type Provider = "github" | "google";

export type ProjectSummary = {
  id: string;
  name: string;
  color: string | null;
  currency: string | null;
  hourlyRate: number | null;
  role?: "ADMIN" | "TRACKER" | "READER";
};

export type TimeEntry = {
  id: string;
  description: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  project: { id: string; name: string; color: string | null } | null;
  user?: { id: string; name: string | null; email: string | null };
};

export type OverallAnalytics = {
  period: AnalyticsPeriod;
  start: string;
  end: string;
  labels: string[];
  projects: Array<{
    id: string;
    name: string;
    color: string | null;
    hours: number;
    earnings: number;
  }>;
  series: Array<{
    id: string;
    name: string;
    color: string | null;
    currency: string | null;
    hourlyRate: number | null;
    hours: number[];
    earnings: number[];
  }>;
};

export type ProjectAnalytics = {
  project: {
    id: string;
    name: string;
    color: string | null;
    hourlyRate: number | null;
    currency: string | null;
  };
  period: AnalyticsPeriod;
  current: {
    start: string;
    end: string;
    data: Array<{ label: string; hours: number; earnings: number }>;
    totalHours: number;
    totalEarnings: number;
  };
  previous: {
    start: string;
    end: string;
    data: Array<{ label: string; hours: number; earnings: number }>;
    totalHours: number;
    totalEarnings: number;
  };
};

export type TrackYourTimeConfig = {
  baseUrl: string;
  callbackHost: string;
  callbackPort: number;
  defaultProvider: Provider;
  pollIntervalSeconds: number;
  defaultAnalyticsPeriod: AnalyticsPeriod;
};
