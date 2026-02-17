# Overa

Overa is a desktop cricket companion app built with **Tauri + Next.js**.  
It gives you quick access to live scores, full match details, and an optional floating widget for live matches.

## What This App Is About

Overa is designed for people who want cricket updates while working, studying, or gaming without keeping multiple browser tabs open.

You can:
- Track live, upcoming, and recent matches.
- Open detailed match pages with scorecards, squads, and live breakdown.
- Launch a floating subscribe view for live matches only.

## Screenshots (Placeholders)

### 1. Home Screen (Live / Upcoming / Recent)
![Home Screen Placeholder](https://placehold.co/1200x675/0f172a/93c5fd?text=Add+Home+Screen+Screenshot)

Add a screenshot showing:
- Top header
- Live / Upcoming / Recent tabs
- Match list cards

### 2. Match Details Screen
![Match Details Placeholder](https://placehold.co/1200x675/0f172a/93c5fd?text=Add+Match+Details+Screenshot)

Add a screenshot showing:
- Live tab layout
- Team score section
- Batters / bowlers / recent balls

### 3. Subscribe Widget (Compact)
![Subscribe Compact Placeholder](https://placehold.co/900x600/0f172a/93c5fd?text=Add+Subscribe+Compact+Screenshot)

Add a screenshot showing:
- Compact mode when not hovered
- Compact mode on hover with details

### 4. Subscribe Widget (Expanded)
![Subscribe Expanded Placeholder](https://placehold.co/900x600/0f172a/93c5fd?text=Add+Subscribe+Expanded+Screenshot)

Add a screenshot showing:
- Expanded view
- Live stats and prediction section

## Features

- Live, upcoming, and recent match listing.
- Match details with:
  - Team scores
  - Match status/toss/venue/start details
  - RR / RRR
  - Current batters and bowlers
  - Recent balls / current over breakdown
  - Team-wise scorecard tab
  - Squads tab
- Win prediction support (when available from source).
- Route-based widget behavior:
  - Subscribe page behaves like a floating widget.
  - Home and match pages behave as normal app windows.
- Desktop-first UI with compact and expanded subscribe modes.

## How It Works

1. The app fetches and parses cricket data from public Cricbuzz pages/endpoints.
2. It normalizes that raw data into internal models.
3. React Query handles polling and caching.
4. UI routes render specialized views:
- `/` home match list
- `/match?matchId=...` detailed match page
- `/subscribe?matchId=...` floating live widget
5. Tauri window APIs control size/drag behavior and widget mode for subscribe page.

## Where Data Comes From

Primary source: **Cricbuzz public web data** parsed by app services.

Key code locations:
- `src/lib/cricket/service.ts`
- `src/lib/cricket/scorecard.ts`
- `src/lib/cricket/players.ts`
- `src/lib/cricket/match-links.ts`

Notes:
- Data availability depends on source coverage.
- Some fields (win prediction, complete squads, recent balls) may be unavailable for specific matches.
- This project is not affiliated with Cricbuzz.

## Download

Use GitHub Releases for installers.

- Latest release page: [Download Overa](https://github.com/mustbemo/overa/releases/latest)
- macOS download: [Overa for macOS](https://github.com/mustbemo/overa/releases/latest)
- Windows download: [Overa for Windows](https://github.com/mustbemo/overa/releases/latest)
- Linux download: [Overa for Linux](https://github.com/mustbemo/overa/releases/latest)
- All releases: [View all releases](https://github.com/mustbemo/overa/releases)

If no release is published yet, publish your first release and the links above will work automatically.

## Install and Run (Easy Steps)

These steps are for builds downloaded from GitHub Releases.

### macOS

1. Download the macOS build from the latest release.
2. If you downloaded a `.tar.gz`, extract it first.
3. Move app to Applications and remove quarantine:

```bash
mv ~/Downloads/Overa.app /Applications/ 2>/dev/null || true
xattr -dr com.apple.quarantine "/Applications/Overa.app"
open "/Applications/Overa.app"
```

If your file is still archived, run:

```bash
tar -xzf ~/Downloads/Overa_*.app.tar.gz -C ~/Downloads
mv ~/Downloads/Overa.app /Applications/
xattr -dr com.apple.quarantine "/Applications/Overa.app"
open "/Applications/Overa.app"
```

### Windows

1. Download the Windows build from the latest release.
2. Double-click the installer or executable.
3. If Microsoft Defender SmartScreen appears, click:
   - `More info`
   - `Run anyway`

You may see this warning because the app is not code-signed yet.

### Linux

1. Download the Linux build from the latest release.
2. Make it executable.
3. Run it.

Example for an AppImage:

```bash
chmod +x ~/Downloads/Overa*.AppImage
~/Downloads/Overa*.AppImage
```

## Local Development

### Prerequisites

- Node.js 20+
- npm 10+
- Rust toolchain (stable)
- Tauri system dependencies (WebView runtime and platform tooling)

### Install

```bash
npm install
```

### Run web app only

```bash
npm run dev
```

### Run desktop app (Tauri)

```bash
npm run tauri:dev
```

## Build Desktop App

```bash
npm run tauri:build
```

Build outputs are generated under `src-tauri/target/release/bundle/`.

## Automated Releases (GitHub Actions)

This repo includes a release workflow at `.github/workflows/release.yml`.

When you push to `main`, GitHub Actions will:
- Build desktop artifacts for macOS (Apple Silicon and Intel), Windows, and Linux.
- Create a new pre-release snapshot and upload artifacts automatically.

No extra secrets are required for this workflow.

Note:
- macOS and Windows binaries are unsigned in this setup.
- macOS users should run the quarantine-removal command shown above.
- Windows users might see SmartScreen and should use `More info -> Run anyway`.

## Project Structure

```text
src/
  app/                     # Next.js routes (home, match, subscribe)
  components/cricket/      # UI components for cards, tabs, score views
  hooks/                   # Window + drag hooks
  lib/cricket/             # Fetching/parsing/normalization services
src-tauri/
  src/                     # Tauri Rust entrypoint
  tauri.conf.json          # Desktop app/window config
```

## Suggestions and Contributions

Suggestions, issues, and pull requests are welcome.

You can contribute by:
- Reporting parsing/data mismatches with match examples.
- Improving UI/UX and responsiveness.
- Adding tests for data parsers.
- Improving squad and scorecard reliability.
- Proposing new features.

Recommended contribution flow:
1. Open an issue with context and expected behavior.
2. Fork the repo and create a branch.
3. Submit a PR with a clear change summary.

## Disclaimer

Overa is an unofficial project.  
Cricket data is sourced from publicly accessible pages and may change or break if source formats change.
