/**
 * Offline Status Indicator Component
 * Shows when app is offline and sync status
 */

import React from "react";
import { useOffline } from "../hooks/useMobile";
import { WifiOff, RefreshCw, CheckCircle } from "lucide-react";

export default function OfflineIndicator() {
  const { isOffline, pendingSync, sync } = useOffline();
  const [syncing, setSyncing] = React.useState(false);

  if (!isOffline && pendingSync === 0) {
    return null; // Don't show anything when online and synced
  }

  const handleSync = async () => {
    setSyncing(true);
    await sync();
    setSyncing(false);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="container mx-auto px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOffline ? (
              <>
                <WifiOff className="w-5 h-5 animate-pulse" />
                <div>
                  <p className="font-semibold">You're offline</p>
                  {pendingSync > 0 && (
                    <p className="text-sm opacity-90">
                      {pendingSync} {pendingSync === 1 ? "change" : "changes"}{" "}
                      will sync when online
                    </p>
                  )}
                </div>
              </>
            ) : pendingSync > 0 ? (
              <>
                <RefreshCw
                  className={`w-5 h-5 ${syncing ? "animate-spin" : ""}`}
                />
                <div>
                  <p className="font-semibold">
                    {syncing ? "Syncing..." : `${pendingSync} changes pending`}
                  </p>
                  <p className="text-sm opacity-90">
                    {syncing ? "Please wait" : "Tap to sync now"}
                  </p>
                </div>
              </>
            ) : null}
          </div>

          {!isOffline && pendingSync > 0 && !syncing && (
            <button
              onClick={handleSync}
              className="px-4 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg font-medium transition-colors"
            >
              Sync Now
            </button>
          )}

          {syncing && (
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span className="text-sm">Syncing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
