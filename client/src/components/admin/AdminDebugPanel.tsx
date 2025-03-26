// File: client/src/components/admin/AdminDebugPanel.tsx
import React, { useState, useEffect, useRef } from "react";
import { fetchAdminStats, clearAdminStatsCache, clearUserCache, type AdminStats, type AuditLog } from "../../utils/adminUser";

const AdminDebugPanel: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>("Never");
  const [refreshCount, setRefreshCount] = useState(0);
  const [rawData, setRawData] = useState<AdminStats | null>(null);
  const [apiStatus, setApiStatus] = useState<string>("Idle");
  const [error, setError] = useState<string | null>(null);
  const [cacheStatus, setCacheStatus] = useState<string>("Unknown");
  const [recentActivities, setRecentActivities] = useState<AuditLog[]>([]);
  const [lastNetworkRequest, setLastNetworkRequest] = useState<string>("None");
  const eventLogRef = useRef<string[]>([]);
  const [eventLog, setEventLog] = useState<string[]>([]);

  // Setup event listener for admin actions
  useEffect(() => {
    const handleAdminAction = (event: Event) => {
      const customEvent = event as CustomEvent;
      const eventType = customEvent.detail.type;
      const timestamp = new Date().toISOString();
      
      const logMessage = `[${timestamp}] Admin event detected: ${eventType}`;
      console.log(logMessage);
      
      // Add to event log
      eventLogRef.current = [logMessage, ...eventLogRef.current.slice(0, 9)];
      setEventLog([...eventLogRef.current]);
    };

    // Listen on both document and window to catch all events
    document.addEventListener('adminAction', handleAdminAction);
    window.addEventListener('adminAction', handleAdminAction);

    return () => {
      document.removeEventListener('adminAction', handleAdminAction);
      window.removeEventListener('adminAction', handleAdminAction);
    };
  }, []);

  // Function to force refresh stats and track the operation
  const forceRefreshStats = async () => {
    try {
      setApiStatus("Fetching...");
      setError(null);
      const timestamp = new Date().toISOString();
      setLastNetworkRequest(timestamp);
      
      // Log the operation
      const logMessage = `[${timestamp}] Manual refresh requested`;
      eventLogRef.current = [logMessage, ...eventLogRef.current.slice(0, 9)];
      setEventLog([...eventLogRef.current]);
      
      // Clear caches first
      clearAdminStatsCache();
      clearUserCache();
      setCacheStatus("Cleared");
      
      // Fetch fresh data
      const stats = await fetchAdminStats(true);
      
      // Update state with results
      setRawData(stats);
      setLastRefreshTime(new Date().toISOString());
      setRefreshCount(prev => prev + 1);
      setApiStatus("Success");
      
      // Extract recent activities for display
      if (stats && stats.recentActivity) {
        setRecentActivities(stats.recentActivity.slice(0, 5));
      }
      
      // Log the completion
      const completionMessage = `[${new Date().toISOString()}] Manual refresh completed`;
      eventLogRef.current = [completionMessage, ...eventLogRef.current.slice(0, 9)];
      setEventLog([...eventLogRef.current]);
      
      return stats;
    } catch (err) {
      console.error("Debug panel refresh error:", err);
      setApiStatus("Error");
      setError(err instanceof Error ? err.message : String(err));
      
      // Log the error
      const errorMessage = `[${new Date().toISOString()}] Refresh error: ${err instanceof Error ? err.message : String(err)}`;
      eventLogRef.current = [errorMessage, ...eventLogRef.current.slice(0, 9)];
      setEventLog([...eventLogRef.current]);
      
      return null;
    }
  };
  
  // Check local storage cache status
  const checkCacheStatus = () => {
    try {
      const adminStatsCache = localStorage.getItem("admin_stats_cache");
      const adminStatsCacheTimestamp = localStorage.getItem("admin_stats_cache_timestamp");
      
      if (adminStatsCache && adminStatsCacheTimestamp) {
        const timestamp = new Date(parseInt(adminStatsCacheTimestamp, 10)).toISOString();
        setCacheStatus(`Present (Last updated: ${timestamp})`);
      } else {
        setCacheStatus("Empty");
      }
    } catch (err) {
      setCacheStatus("Error checking cache");
      console.error("Error checking cache:", err);
    }
  };

  // Function to clear all caches
  const clearAllCaches = () => {
    try {
      clearAdminStatsCache();
      clearUserCache();
      
      // Log the operation
      const timestamp = new Date().toISOString();
      const logMessage = `[${timestamp}] All caches cleared`;
      eventLogRef.current = [logMessage, ...eventLogRef.current.slice(0, 9)];
      setEventLog([...eventLogRef.current]);
      
      setCacheStatus("Cleared");
      checkCacheStatus();
    } catch (err) {
      console.error("Error clearing caches:", err);
      setCacheStatus("Error clearing");
    }
  };

  // Periodically check cache status
  useEffect(() => {
    checkCacheStatus();
    
    const intervalId = setInterval(() => {
      checkCacheStatus();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Format timestamp for better readability
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString() + "." + date.getMilliseconds().toString().padStart(3, '0');
    } catch {
      return timestamp;
    }
  };

  if (!isExpanded) {
    return (
      <div 
        className="fixed bottom-4 right-4 p-2 bg-blue-600 text-white rounded-full shadow-lg cursor-pointer z-50"
        onClick={() => setIsExpanded(true)}
        title="Show Debug Panel"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 w-full md:w-1/2 lg:w-1/3 bg-gray-800 text-white z-50 shadow-lg rounded-t-lg overflow-hidden max-h-screen">
      <div className="p-3 bg-gray-900 flex justify-between items-center border-b border-gray-700">
        <h3 className="text-lg font-semibold">Admin Dashboard Debug Panel</h3>
        <button 
          onClick={() => setIsExpanded(false)}
          className="text-gray-400 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      <div className="p-3 overflow-y-auto max-h-[80vh]">
        <div className="flex space-x-2 mb-4">
          <button 
            onClick={forceRefreshStats}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={apiStatus === "Fetching..."}
          >
            {apiStatus === "Fetching..." ? "Refreshing..." : "Force Refresh"}
          </button>
          
          <button 
            onClick={clearAllCaches}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Clear All Caches
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-700 p-2 rounded">
            <p className="text-xs text-gray-400">Status:</p>
            <p className="text-sm font-mono">{apiStatus}</p>
          </div>
          
          <div className="bg-gray-700 p-2 rounded">
            <p className="text-xs text-gray-400">Cache Status:</p>
            <p className="text-sm font-mono">{cacheStatus}</p>
          </div>
          
          <div className="bg-gray-700 p-2 rounded">
            <p className="text-xs text-gray-400">Last Refresh:</p>
            <p className="text-sm font-mono">{formatTimestamp(lastRefreshTime)}</p>
          </div>
          
          <div className="bg-gray-700 p-2 rounded">
            <p className="text-xs text-gray-400">Refresh Count:</p>
            <p className="text-sm font-mono">{refreshCount}</p>
          </div>
          
          <div className="bg-gray-700 p-2 rounded">
            <p className="text-xs text-gray-400">Recent API Call:</p>
            <p className="text-sm font-mono">{formatTimestamp(lastNetworkRequest)}</p>
          </div>
        </div>
        
        {error && (
          <div className="bg-red-900 border border-red-800 text-white p-2 rounded mb-4">
            <p className="text-xs font-bold">Error:</p>
            <p className="text-sm font-mono">{error}</p>
          </div>
        )}
        
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 border-b border-gray-700 pb-1">Event Log:</h4>
          <div className="bg-gray-900 p-2 rounded text-xs font-mono max-h-24 overflow-y-auto">
            {eventLog.length > 0 ? (
              <ul>
                {eventLog.map((log, index) => (
                  <li key={index} className="pb-1 border-b border-gray-800 mb-1">{log}</li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No events logged yet</p>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <h4 className="text-sm font-semibold mb-2 border-b border-gray-700 pb-1">Latest Activities from API:</h4>
          <div className="bg-gray-900 p-2 rounded text-xs font-mono max-h-48 overflow-y-auto">
            {recentActivities.length > 0 ? (
              <ul>
                {recentActivities.map((activity: AuditLog, index: number) => (
                  <li key={index} className="pb-1 border-b border-gray-800 mb-1">
                    <div><span className="text-blue-400">ID:</span> {activity.id}</div>
                    <div><span className="text-blue-400">Action:</span> {activity.action}</div>
                    <div><span className="text-blue-400">Time:</span> {formatTimestamp(activity.timestamp)}</div>
                    <div><span className="text-blue-400">Resource:</span> {activity.affectedResource} {activity.resourceId && `(${activity.resourceId})`}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No activities found</p>
            )}
          </div>
        </div>
        
        <div>
          <h4 className="text-sm font-semibold mb-2 border-b border-gray-700 pb-1">Raw Response Data:</h4>
          <div className="bg-gray-900 p-2 rounded text-xs font-mono max-h-64 overflow-y-auto">
            <pre>{rawData ? JSON.stringify(rawData, null, 2) : "No data"}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDebugPanel;