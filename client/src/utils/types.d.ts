// Type declarations for global window object extensions
interface AdminUser {
  emitAdminEvent: (type: string, data?: unknown) => boolean;
  AdminEvents: Record<string, string>;
  clearAdminStatsCache: () => void;
  clearUserCache: () => void;
}

// Define the UserData interface for user information in the admin dashboard
interface UserData {
  email: string;
  status: string;
  role: string;
  created?: string;
  lastLogin?: string;
  enabled?: boolean;
  customStatus?: string | null;
  firstName?: string;
  lastName?: string;
  companyName?: string;
}

interface Window {
  adminUser?: AdminUser;
  createDebouncedHandler: () => (event: CustomEvent) => void;
  debouncedHandler: (event: CustomEvent) => void;
  emitSingleEvent: (eventType?: string) => string;
  manualRefresh: () => string;
}
