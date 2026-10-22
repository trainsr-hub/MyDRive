// path: src/services/api.ts
// =============================================================================
// [SERVICES API GATEWAY - UNIFIED DELEGATE TO CORE API]
// =============================================================================

import { execute as coreExecute, API_BASE, DEFAULT_PROJECT_ID } from '../core/api';

export interface BackendOrder {
  action: string;
  key?: string;
  data?: unknown;
  [key: string]: unknown;
}

export interface BackendRequestPayload {
  project_id: string;
  tier: string;
  order: BackendOrder;
}

export interface BackendResponse<T = unknown> {
  status?: string;
  data: T;
  detail?: string;
}

export { API_BASE, DEFAULT_PROJECT_ID };

/**
 * Delegated executeOrder function ensuring single source of truth for network operations.
 */
export async function executeOrder<T = unknown>(
  payload: BackendRequestPayload
): Promise<BackendResponse<T>> {
  const { project_id, tier, order } = payload;
  const res = await coreExecute<T>(
    tier,
    order.action,
    order.key,
    order.data,
    project_id
  );
  const data = (res && typeof res === 'object' && 'data' in res ? (res as { data: T }).data : (res as T)) ?? ({} as T);
  return {
    status: (res as { status?: string })?.status ?? 'success',
    data,
    detail: (res as { detail?: string })?.detail,
  };
}
