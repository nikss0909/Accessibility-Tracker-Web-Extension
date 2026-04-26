# Production Notes

## Build

```bash
npm ci
npm run lint
npm run test
npm run build
```

Load the generated `dist/` folder as an unpacked Chrome extension for final verification.

## Extension Checks

- Confirm the popup opens quickly and remains compact.
- Confirm the options page saves language, voice, theme, text size, and toolbar startup preference.
- Confirm the floating toolbar appears on normal webpages, can be moved, collapsed, and closed.
- Confirm read aloud, text size, contrast, dyslexia, keyboard, focus, and translate controls work on several websites.
- Confirm all popup and settings controls are keyboard reachable and have visible focus outlines.

## Privacy

Inclusive Web Assistant stores preferences locally through `chrome.storage.local`.

Translation opens the current page through Google Translate in a new tab. No custom backend is used by the current extension.
