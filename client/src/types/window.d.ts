import { AdminEvents, emitAdminEvent } from "../utils/adminUser";

type AdminUserType = {
  emitAdminEvent?: typeof emitAdminEvent;
  AdminEvents?: typeof AdminEvents;
};

declare global {
  interface Window {
    adminUser?: AdminUserType;
  }
}

export {}; 