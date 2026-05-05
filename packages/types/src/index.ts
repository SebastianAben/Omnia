export type AppEnvironment = "local" | "preview" | "staging" | "production";

export type UserRoleCode =
  | "cashier"
  | "store_supervisor"
  | "hq_admin"
  | "executive_analyst";

export type SyncEventStatus =
  | "pending"
  | "queued"
  | "processing"
  | "synced"
  | "failed"
  | "conflict";

export type SyncEventType =
  | "transaction.created"
  | "transaction.voided"
  | "payment.recorded"
  | "stock_movement.created"
  | "shift.opened"
  | "shift.closed"
  | "product.updated"
  | "branch_price.updated"
  | "conflict.resolved";

export interface ApiResponse<TData = unknown, TMeta = unknown> {
  success: boolean;
  message?: string;
  data?: TData;
  meta?: TMeta;
  error?: {
    code: string;
    details?: unknown;
  };
}

export interface AuthenticatedUser {
  id: string;
  fullName: string;
  roleCode: UserRoleCode;
  branchId?: string;
}

export interface BranchContext {
  branchId: string;
  branchName: string;
  registerId?: string;
  registerName?: string;
}

export interface SyncEventEnvelope<TPayload = unknown> {
  eventId: string;
  eventType: SyncEventType;
  eventVersion: number;
  branchId: string;
  sourceSystem: "branch_app" | "central_service" | "shopee_integration";
  sourceMode: "online" | "offline_replay";
  entityType: string;
  entityId: string;
  occurredAt: string;
  producedByUserId?: string;
  payload: TPayload;
}
