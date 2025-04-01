// Type declarations for global window object extensions
interface AdminUser {
  emitAdminEvent: (type: string, data?: unknown) => boolean;
  AdminEvents: Record<string, string>;
  clearAdminStatsCache: () => void;
  clearUserCache: () => void;
}

interface Window {
  adminUser?: AdminUser;
  createDebouncedHandler: () => (event: CustomEvent) => void;
  debouncedHandler: (event: CustomEvent) => void;
  emitSingleEvent: (eventType?: string) => string;
  manualRefresh: () => string;
} 