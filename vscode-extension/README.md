# Track Your Time VS Code Extension

Internal extension for Track Your Time OAuth sign-in, timer commands, and analytics inside VS Code.

## Development

1. npm install
2. npm run build
3. Press F5 in VS Code from this folder to launch Extension Development Host

Alternatively, run the launch config named `Run Track Your Time Extension` from `.vscode/launch.json`.

## VSIX packaging

1. npm install
2. npm run package:vsix
3. Install the generated `track-your-time-vscode.vsix` via VS Code command: `Extensions: Install from VSIX...`

## Configuration

- trackYourTime.baseUrl
- trackYourTime.callbackHost
- trackYourTime.callbackPort
- trackYourTime.defaultProvider
- trackYourTime.pollIntervalSeconds
- trackYourTime.defaultAnalyticsPeriod
