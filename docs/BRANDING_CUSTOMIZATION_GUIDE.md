# Branding Customization Guide

This guide explains how to customize the application branding for distribution.

## Configuration File

All branding configurations are centralized in `/src/lib/appConfig.ts`. This file contains all customizable branding elements:

```typescript
export const appConfig = {
  versionLabel: 'Beta Version',
  branding: {
    appName: 'Group Availability',
    appInitials: 'GA',
    logoIconPath: '/webapp_icon.png',
    logoBackgroundColor: 'bg-blue-600',
    logoTextColor: 'text-white',
  },
};
```

## Branding Elements

### 1. Application Name (`appName`)
- **Default:** `'Group Availability'`
- **Used in:** Header logo, authentication page, page titles, and manifest
- **How to change:** Update the `appName` value in `appConfig.ts`

### 2. Application Initials (`appInitials`)
- **Default:** `'GA'`
- **Used in:** Header logo badge
- **How to change:** Update the `appInitials` value in `appConfig.ts`
- **Recommendation:** Keep it 2-3 characters for best visual appearance

### 3. Logo Icon Path (`logoIconPath`)
- **Default:** `'/webapp_icon.png'`
- **Used in:** Authentication page logo
- **How to change:**
  1. Place your logo image in the `/public` directory
  2. Update the `logoIconPath` value in `appConfig.ts`
- **Recommendation:** Use a square image (512x512px or larger) for best results

### 4. Logo Colors
- **Background Color (`logoBackgroundColor`):** Default `'bg-blue-600'`
- **Text Color (`logoTextColor`):** Default `'text-white'`
- **Used in:** Header logo badge background and text
- **How to change:** Update the values using Tailwind CSS color classes
- **Examples:**
  - Green theme: `logoBackgroundColor: 'bg-green-600'`
  - Red theme: `logoBackgroundColor: 'bg-red-600'`
  - Dark theme: `logoBackgroundColor: 'bg-gray-900'`

## Additional Files to Customize

### PWA Manifest (`/public/manifest.json`)
Update the following fields:
- `name`: Full application name (e.g., "Group Availability Planner")
- `short_name`: Short name for home screen (e.g., "Availability")
- `description`: App description
- `theme_color`: Browser theme color (hex format)
- `background_color`: Background color (hex format)

### HTML Title (`/index.html`)
Update the `<title>` tag to match your application name.

### PWA Icons
Replace the following icon files in `/public`:
- `icon-192.png` - 192x192px icon
- `icon-192-maskable.png` - 192x192px maskable icon (with padding)
- `icon-512.png` - 512x512px icon
- `icon-512-maskable.png` - 512x512px maskable icon (with padding)
- `webapp_icon.png` - Large logo for auth pages

**Icon Requirements:**
- Format: PNG with transparency
- Maskable icons: Include 20% padding (safe zone) around the main icon
- Use solid backgrounds for maskable icons to ensure visibility on any background color

### Favicon (`/public/icon-192.png`)
The `icon-192.png` is also used as the favicon. Update this to match your branding.

## Quick Start Checklist

1. ✓ Update `appName` in `appConfig.ts`
2. ✓ Update `appInitials` in `appConfig.ts`
3. ✓ Update color scheme (`logoBackgroundColor`, `logoTextColor`) in `appConfig.ts`
4. ✓ Replace logo image file and update `logoIconPath` in `appConfig.ts`
5. ✓ Update PWA manifest fields in `/public/manifest.json`
6. ✓ Update HTML title in `/index.html`
7. ✓ Replace all icon files in `/public`
8. ✓ Test the application to ensure all branding appears correctly

## Theme Color Reference

Common Tailwind CSS color classes for `logoBackgroundColor`:
- Blue: `bg-blue-600`
- Green: `bg-green-600`
- Red: `bg-red-600`
- Purple: `bg-purple-600`
- Orange: `bg-orange-600`
- Gray: `bg-gray-600`
- Slate: `bg-slate-600`
- Teal: `bg-teal-600`

Text color should contrast well with the background. For dark backgrounds, use `text-white`. For light backgrounds, use `text-gray-900`.

## Testing

After making changes:
1. Run `npm run build` to ensure the application builds successfully
2. Test the application in a browser to verify all branding changes
3. Test PWA installation to verify icons and names appear correctly
4. Verify the header logo displays properly
5. Verify the authentication page logo appears correctly

## Support

If you encounter any issues or need additional customization options, please refer to the main documentation or contact support.
