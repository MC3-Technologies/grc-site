/**
 * Formats ISO date strings into user-friendly date and time format
 * Example: "2025-03-13T22:06:24.551Z" -> "Mar 13, 2025 at 10:06 PM"
 */
export const formatDateTime = (isoDateString: string): string => {
  try {
    const date = new Date(isoDateString);

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    // Format date using built-in Intl formatter
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  } catch (error) {
    console.error("Error formatting date:", error);
    return isoDateString; // Return original string as fallback
  }
};

/**
 * Formats relative time (e.g., "2 hours ago", "yesterday")
 */
export const getRelativeTimeString = (isoDateString: string): string => {
  try {
    const date = new Date(isoDateString);

    // Check if date is valid first
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }

    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    // Less than a minute
    if (diffInSeconds < 60) {
      return "Just now";
    }

    // Less than an hour
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    }

    // Less than a day
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    }

    // Less than a week
    if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      if (days === 1) return "Yesterday";
      return `${days} days ago`;
    }

    // Fall back to regular date format for older dates
    return formatDateTime(isoDateString);
  } catch (error) {
    console.error("Error calculating relative time:", error);
    // Return original string as fallback if calculations/formatting fail
    return isoDateString;
  }
};
