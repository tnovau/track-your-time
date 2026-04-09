import { createServer, Server } from "node:http";
import { randomBytes } from "node:crypto";
import * as vscode from "vscode";
import { TrackYourTimeConfig } from "../types";
import { ApiClient } from "./api-client";
import { StorageService } from "./storage-service";

export class AuthService {
  constructor(
    private readonly config: TrackYourTimeConfig,
    private readonly apiClient: ApiClient,
    private readonly storage: StorageService,
  ) {}

  async signIn() {
    const state = randomBytes(16).toString("hex");
    const callbackUrl = `http://${this.config.callbackHost}:${this.config.callbackPort}/callback`;
    const bridgeUrl = `${this.config.baseUrl}/api/auth/extension/complete?redirect_uri=${encodeURIComponent(
      callbackUrl
    )}&state=${encodeURIComponent(state)}`;

    const authCode = await this.waitForBridgeCallback({
      state,
      bridgeUrl,
      callbackPath: "/callback",
    });

    const cookie = await this.apiClient.exchangeBridgeCode({
      code: authCode,
      state,
    });

    await this.storage.saveCookie(cookie);
    await this.apiClient.hasSession();
  }

  async signOut() {
    await this.storage.clearCookie();
  }

  async ensureAuthenticated() {
    const cookie = await this.storage.readCookie();
    if (!cookie) {
      return false;
    }

    try {
      await this.apiClient.hasSession();
      return true;
    } catch {
      return false;
    }
  }

  private async waitForBridgeCallback(input: {
    state: string;
    bridgeUrl: string;
    callbackPath: string;
  }) {
    const callbackUrl = new URL(
      `http://${this.config.callbackHost}:${this.config.callbackPort}${input.callbackPath}`
    );

    return new Promise<string>((resolve, reject) => {
      let server: Server | undefined;
      let settled = false;

      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        if (server) {
          server.close(() => fn());
          return;
        }
        fn();
      };

      server = createServer((req, res) => {
        const reqUrl = new URL(req.url ?? "/", callbackUrl);

        if (reqUrl.pathname !== input.callbackPath) {
          res.statusCode = 404;
          res.end("Not found");
          return;
        }

        const code = reqUrl.searchParams.get("code");
        const state = reqUrl.searchParams.get("state");

        if (!code || state !== input.state) {
          res.statusCode = 400;
          res.setHeader("Content-Type", "text/plain");
          res.end("Invalid callback. You can close this window.");
          finish(() => reject(new Error("Invalid callback state")));
          return;
        }

        res.statusCode = 200;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.end("<html><body><h2>Track Your Time connected.</h2><p>You can close this tab and return to VS Code.</p></body></html>");

        finish(() => resolve(code));
      });

      server.once("error", (err) => {
        finish(() => reject(err));
      });

      server.listen(this.config.callbackPort, this.config.callbackHost, async () => {
        const opened = await vscode.env.openExternal(vscode.Uri.parse(input.bridgeUrl));
        if (!opened) {
          finish(() => reject(new Error("Could not open browser for sign-in.")));
        }
      });

      setTimeout(() => {
        finish(() => reject(new Error("Authentication timed out after 3 minutes.")));
      }, 3 * 60 * 1000).unref();
    });
  }
}
