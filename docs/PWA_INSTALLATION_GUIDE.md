# PWA Installation Guide

This document provides information about the Progressive Web App (PWA) installation features and how to test them.

## Overview

The Group Availability Planner is now installable as a Progressive Web App, allowing users to add it to their home screen or desktop for a native app-like experience.

## Features

### 1. Chromium Browsers (Chrome, Edge, Opera)
- **Desktop & Android**: Automatic "Install App" button appears on the sign-in/sign-up page
- Detects the `beforeinstallprompt` event
- Shows native browser install dialog when clicked
- Hides install button once app is installed

### 2. iOS Safari (iPhone & iPad)
- Shows instructional card with step-by-step guide:
  1. Tap the Share button
  2. Scroll and tap "Add to Home Screen"
  3. Tap "Add" to confirm
- Card can be dismissed (preference stored in localStorage)
- Does not show if app is already installed

### 3. Fallback Instructions
- For browsers that don't support programmatic install
- Shows instructions for:
  - Android Chrome: Menu → Add to Home screen
  - Desktop Chrome: Install icon in address bar

## Testing Checklist

### Android Chrome
- [ ] Open the app in Chrome on Android
- [ ] Navigate to the sign-in/sign-up page
- [ ] Verify "Install App" button appears
- [ ] Click button and verify install dialog appears
- [ ] Complete installation
- [ ] Open installed app from home screen
- [ ] Verify app runs in standalone mode (no browser UI)
- [ ] Return to browser and verify install button no longer appears

### Desktop Chrome/Edge
- [ ] Open the app in Chrome or Edge on desktop
- [ ] Navigate to the sign-in/sign-up page
- [ ] Verify "Install App" button appears (may take a few seconds)
- [ ] Click button and verify install dialog appears
- [ ] Complete installation
- [ ] Open installed app from desktop/taskbar
- [ ] Verify app runs in standalone window
- [ ] Return to browser and verify install button no longer appears

### iOS Safari
- [ ] Open the app in Safari on iPhone or iPad
- [ ] Navigate to the sign-in/sign-up page
- [ ] Verify instructional card appears with iOS-specific instructions
- [ ] Follow instructions to add to home screen
- [ ] Open installed app from home screen
- [ ] Verify app runs in standalone mode
- [ ] Click "X" to dismiss instructions and verify card disappears
- [ ] Reload page and verify card stays dismissed

### Fallback (Other Browsers)
- [ ] Open the app in Firefox, Samsung Internet, or other browser
- [ ] Navigate to the sign-in/sign-up page
- [ ] Verify fallback instructions card appears
- [ ] Verify instructions are appropriate for the platform

## Technical Requirements

### Manifest File (`/public/manifest.json`)
```json
{
  "name": "Group Availability Planner",
  "short_name": "Availability",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#2563eb",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker
- Basic caching strategy implemented
- Provides offline fallback
- Required for Chromium browsers to show install prompt

### HTML Meta Tags
```html
<meta name="theme-color" content="#2563eb" />
<link rel="manifest" href="/manifest.json" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

## Troubleshooting

### Install Button Doesn't Appear (Chrome/Edge)
1. Verify app is served over HTTPS
2. Check browser console for service worker registration errors
3. Ensure manifest.json is accessible
4. Clear browser cache and reload
5. Try in incognito/private mode
6. Check Chrome DevTools → Application → Manifest

### iOS Instructions Don't Show
1. Verify you're using Safari (not Chrome on iOS)
2. Check if already installed (opens in standalone mode)
3. Check localStorage for 'ios-install-dismissed' key
4. Clear Safari data and try again

### Service Worker Issues
1. Open DevTools → Application → Service Workers
2. Check for registration errors
3. Try "Unregister" and reload
4. Verify `/service-worker.js` is accessible

## Browser Support

| Browser | Platform | Support Level |
|---------|----------|---------------|
| Chrome | Android | Full (native install prompt) |
| Chrome | Desktop | Full (native install prompt) |
| Edge | Desktop | Full (native install prompt) |
| Safari | iOS | Manual (instructions shown) |
| Firefox | All | Fallback (instructions shown) |
| Other | All | Fallback (instructions shown) |

## Future Enhancements

Potential improvements for future releases:
- Enhanced offline functionality
- Background sync for poll updates
- Push notifications for poll responses
- App shortcuts for quick actions
- Advanced caching strategies
- Update notifications when new version available
