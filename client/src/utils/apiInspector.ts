// File: client/src/utils/apiInspector.ts

/**
 * This utility helps inspect API responses and directly check what the backend
 * is returning. Run this in your browser console to debug API responses.
 */

import { getClientSchema } from "../amplify/schema";

/**
 * Directly fetches and logs admin stats from the API
 * @returns The raw response received from the backend
 */
export async function inspectAdminStats() {
  try {
    //console.log("- Fetching admin stats directly from API...");
    //const startTime = Date.now();

    // Get client and make the request
    const client = getClientSchema();
    const response = await client.queries.getAdminStats({});

    //const endTime = Date.now();
    //console.log(`- API response received in ${endTime - startTime}ms`);

    // Log the raw response
    //console.log("Raw API response:", response);

    if (response && response.data) {
      try {
        // Try to parse if it's a string
        let parsedData;
        if (typeof response.data === "string") {
          // Handle double-encoded JSON (common with AppSync)
          if (response.data.startsWith('"') && response.data.endsWith('"')) {
            parsedData = JSON.parse(JSON.parse(response.data));
          } else {
            parsedData = JSON.parse(response.data);
          }
        } else {
          parsedData = response.data;
        }

        //console.log("Parsed data:", parsedData);

        // Check for recent activities
        if (parsedData && parsedData.recentActivity) {
          //console.log(
          //  `Recent activities count: ${parsedData.recentActivity.length}`,
          //);

          if (parsedData.recentActivity.length > 0) {
            //console.log("Recent activities (newest first):");
            // Sort by timestamp (newest first) and display
            // const sortedActivities = [...parsedData.recentActivity].sort(
            //   (a, b) =>
            //     new Date(b.timestamp).getTime() -
            //     new Date(a.timestamp).getTime(),
            // );
          } else {
            //console.log("- No recent activities found in the response");
          }
        } else {
          //console.log("- No recentActivity property found in the response");
        }

        return parsedData;
      } catch (parseError) {
        console.error("- Error parsing response data:", parseError);
        return response.data;
      }
    } else {
      //console.log("- No data in the response");
      return response;
    }
  } catch (error) {
    console.error("- Error fetching admin stats:", error);
    return null;
  }
}

/**
 * Helper function to log recent activities from DynamoDB
 * @returns The recent activities
 */
export async function inspectRecentActivities() {
  try {
    const client = getClientSchema();

    // Calculate date range for last 30 days
    const endDate = new Date().toISOString();
    const startDate = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    //console.log(`Fetching audit logs from ${startDate} to ${endDate}...`);

    // Fetch recent audit logs
    const response = await client.queries.getAuditLogs({
      dateRange: { startDate, endDate },
      // No filters to get all logs
    });

    //console.log("Raw audit logs response:", response);

    if (response && response.data) {
      let logs;
      if (typeof response.data === "string") {
        logs = JSON.parse(response.data);
      } else {
        logs = response.data;
      }

      if (Array.isArray(logs)) {
        //console.log(`Found ${logs.length} audit logs`);

        // Sort by timestamp (newest first)
        const sortedLogs = [...logs].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );

        // Get just the user-related logs
        const userLogs = sortedLogs.filter(
          (log) => log.affectedResource === "user" && true, // Include all action types
        );

        //console.log(`Found ${userLogs.length} user-related logs`);

        // Display most recent 10
        // if (userLogs.length > 0) {
        //   console.log("Most recent user logs:");
        //   userLogs.slice(0, 10).forEach((log, index) => {
        //     console.log(
        //       `  ${index + 1}. [${log.action}] ${log.timestamp} - ${log.resourceId}`,
        //     );
        //   });
        // }

        return userLogs;
      } else {
        //console.log("- Response data is not an array");
        return logs;
      }
    } else {
      //console.log("- No data in the response");
      return [];
    }
  } catch (error) {
    console.error("- Error fetching audit logs:", error);
    return [];
  }
}

/**
 * Run this in the browser console to check if the stats endpoints are working:
 *
 * 1. First import the function:
 *    import('/src/utils/apiInspector.js').then(m => window.apiInspector = m);
 *
 * 2. Then run:
 *    window.apiInspector.inspectAdminStats();
 *
 * 3. Or to check audit logs directly:
 *    window.apiInspector.inspectRecentActivities();
 */

// Declare types for window extension
declare global {
  interface Window {
    inspectAdminStats: typeof inspectAdminStats;
    inspectRecentActivities: typeof inspectRecentActivities;
  }
}

// Add to window for console access if in browser environment
if (typeof window !== "undefined") {
  window.inspectAdminStats = inspectAdminStats;
  window.inspectRecentActivities = inspectRecentActivities;
}
