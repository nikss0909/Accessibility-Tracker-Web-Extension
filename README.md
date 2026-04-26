# Inclusive Web Assistant

Inclusive Web Assistant is a focused Chrome extension that helps disabled users browse websites more comfortably and independently.

It is no longer a developer audit dashboard. The popup and floating toolbar provide direct assistive controls for the active webpage.

## Features

- Read page aloud with start, pause, resume, and stop controls
- Increase, decrease, and reset page text size
- Dark and light high contrast modes
- Dyslexia-friendly font and spacing mode
- Keyboard navigation mode with strong focus outlines
- Focus mode that reduces page distractions
- Translate pages into a preferred language
- Movable, collapsible floating toolbar on webpages
- Options page for saved preferences, voice, language, theme, default text size, and help

## Tech Stack

- React
- Vite
- Chrome Manifest V3
- Vitest and Testing Library

## Quick Start

```bash
npm install
npm run dev
```

Open the popup during development at:

```text
http://127.0.0.1:5173/popup.html
```

Open settings during development at:

```text
http://127.0.0.1:5173/options.html
```

## Build The Extension

```bash
npm run build
```

Then load the extension in Chrome:

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select the `dist` folder.
5. Open any website and use the extension popup or floating toolbar.

## Project Structure

```text
public/
  manifest.json          Chrome extension manifest
  content.js             Page assistive tools and floating toolbar
src/
  popup/                 Compact extension popup
  options/               Extension options/settings page
popup.html               Popup Vite entry
options.html             Options page Vite entry
```

## Scripts

```bash
npm run dev       # Vite development server
npm run build     # Production extension build
npm run test      # Unit tests
npm run lint      # ESLint
```

The old backend, enterprise dashboard, score system, fake team/project analytics, and report-sending surface have been removed from the active project.
