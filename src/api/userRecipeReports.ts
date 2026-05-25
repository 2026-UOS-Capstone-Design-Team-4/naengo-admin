import client from './client';

export type UserRecipeReportReason =
  | 'INAPPROPRIATE'
  | 'COPYRIGHT'
  | 'SPAM'
  | 'DANGEROUS'
  | 'FALSE_INFO'
  | 'OTHER';

export type UserRecipeReportStatus =
  | 'PENDING'
  | 'REVIEWING'
  | 'RESOLVED'
  | 'REJECTED';

export interface UserRecipeReport {
  report_id: number;
  user_recipe_id: number;
  reporter_user_id: number;
  recipe_owner_user_id: number;
  reason: UserRecipeReportReason;
  description?: string | null;
  status: UserRecipeReportStatus;
  review_note?: string | null;
  reviewed_by?: number | null;
  reviewed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRecipeReportFilters {
  status?: UserRecipeReportStatus | '';
  user_recipe_id?: number | '';
  reporter_user_id?: number | '';
  recipe_owner_user_id?: number | '';
  cursor?: string | null;
  limit?: number;
}

export interface UserRecipeReportListResponse {
  items: UserRecipeReport[];
  next_cursor: string | null;
  has_next: boolean;
}

export interface UserRecipeReportUpdatePayload {
  status?: UserRecipeReportStatus | null;
  review_note?: string | null;
}

function cleanParams(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== '' && value != null),
  );
}

export async function getUserRecipeReports(
  filters: UserRecipeReportFilters = {},
): Promise<UserRecipeReportListResponse> {
  const { data } = await client.get<UserRecipeReportListResponse>(
    '/admin/user-recipe-reports',
    {
      params: cleanParams({ limit: 100, ...filters }),
    },
  );
  if (!Array.isArray(data.items)) {
    throw new Error('Invalid user recipe report list response');
  }
  return data;
}

export async function getUserRecipeReport(
  reportId: number,
): Promise<UserRecipeReport> {
  const { data } = await client.get<UserRecipeReport>(
    `/admin/user-recipe-reports/${reportId}`,
  );
  return data;
}

export async function updateUserRecipeReport(
  reportId: number,
  payload: UserRecipeReportUpdatePayload,
): Promise<UserRecipeReport> {
  const { data } = await client.patch<UserRecipeReport>(
    `/admin/user-recipe-reports/${reportId}`,
    payload,
  );
  return data;
}
