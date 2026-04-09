import * as vscode from "vscode";

const COOKIE_KEY = "trackYourTime.sessionCookie";
const PROJECT_KEY = "trackYourTime.lastProjectId";

export class StorageService {
  constructor(
    private readonly context: vscode.ExtensionContext,
  ) {}

  async saveCookie(cookie: string) {
    await this.context.secrets.store(COOKIE_KEY, cookie);
  }

  async readCookie() {
    return this.context.secrets.get(COOKIE_KEY);
  }

  async clearCookie() {
    await this.context.secrets.delete(COOKIE_KEY);
  }

  async setLastProjectId(projectId: string | null) {
    await this.context.globalState.update(PROJECT_KEY, projectId);
  }

  getLastProjectId() {
    return this.context.globalState.get<string | null>(PROJECT_KEY, null);
  }
}
