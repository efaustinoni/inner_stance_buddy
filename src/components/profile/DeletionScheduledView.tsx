// Created: 2025-12-28
// Last updated: 2025-12-28

import { AlertTriangle } from 'lucide-react';

interface DeletionScheduledViewProps {
  scheduledDate: string;
  onAcknowledge: () => void;
}

export default function DeletionScheduledView({
  scheduledDate,
  onAcknowledge,
}: DeletionScheduledViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-md p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          Account Deletion Scheduled
        </h2>
        <p className="text-gray-600 mb-4">
          Your account has been deactivated and is scheduled for permanent deletion.
        </p>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-medium text-orange-900 mb-1">Hard Delete Date:</p>
          <p className="text-lg font-semibold text-orange-700">
            {scheduledDate}
          </p>
        </div>
        <div className="text-sm text-gray-600 space-y-2 text-left mb-6">
          <p className="flex items-start gap-2">
            <span className="text-orange-600 mt-0.5">•</span>
            <span>Your account is now deactivated and you cannot log in</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-orange-600 mt-0.5">•</span>
            <span>All your polls and data will be permanently deleted on the date shown above</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-orange-600 mt-0.5">•</span>
            <span>This action cannot be undone after the hard delete</span>
          </p>
        </div>
        <button
          onClick={onAcknowledge}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Acknowledge & Sign Out
        </button>
      </div>
    </div>
  );
}
