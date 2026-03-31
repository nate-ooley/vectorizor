'use client';

import type { PendingAction } from '@/lib/magic-wanda/types';

interface ActionConfirmationCardProps {
  action: PendingAction;
  onConfirm: () => void;
  onReject: () => void;
  isLoading: boolean;
}

export default function ActionConfirmationCard({
  action,
  onConfirm,
  onReject,
  isLoading,
}: ActionConfirmationCardProps) {
  // Format params for display
  const displayParams = Object.entries(action.params).filter(
    ([key, value]) => value != null && key !== 'locationId'
  );

  return (
    <div className="mx-4 my-3 bg-neutral-800 border border-purple-500/30 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <span className="text-yellow-400 text-xs">!</span>
        </div>
        <h3 className="text-white font-medium text-sm">Confirm Action</h3>
      </div>

      <p className="text-neutral-300 text-sm mb-3">{action.description}</p>

      {displayParams.length > 0 && (
        <div className="bg-neutral-900 rounded-lg p-3 mb-3 space-y-1">
          {displayParams.map(([key, value]) => (
            <div key={key} className="flex text-xs">
              <span className="text-neutral-500 w-24 flex-shrink-0 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className="text-neutral-300">
                {typeof value === 'object' ? JSON.stringify(value) : String(value)}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className="flex-1 py-2 px-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-600/50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isLoading ? 'Executing...' : 'Confirm'}
        </button>
        <button
          onClick={onReject}
          disabled={isLoading}
          className="flex-1 py-2 px-3 bg-neutral-700 hover:bg-neutral-600 disabled:bg-neutral-700/50 text-neutral-300 text-sm font-medium rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
