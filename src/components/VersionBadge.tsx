// Created: 2025-12-22
// Last updated: 2025-12-22

import { appConfig } from '../lib/appConfig';

export default function VersionBadge() {
  if (!appConfig.versionLabel) return null;

  return (
    <div className="fixed bottom-4 left-4 z-30 px-2 py-1 bg-slate-100 text-slate-500 text-xs font-medium rounded border border-slate-200">
      {appConfig.versionLabel}
    </div>
  );
}
