import { getSupabaseAdminClient } from '../../config/supabase.js';
import { AppError } from '../../middleware/apiResponse.js';

/**
 * Read-only data access for the dashboard. The service-role client bypasses
 * RLS, so EVERY query here filters by user_id (directly, or through the parent
 * payroll record). The dashboard never writes to other modules' tables.
 *
 * Tables used (see database/schema.sql): payroll_records, payroll_items,
 * documents, contract_reviews.
 */

const MAX_ROWS = 500;

const fail = () => {
  // Never forward Supabase error text: it may contain internals.
  throw new AppError('Unable to load dashboard data', 502, 'DASHBOARD_DATA_ERROR');
};

const rowsOf = ({ data, error }) => {
  if (error) fail();
  return data || [];
};

export const createRepository = (getClient = getSupabaseAdminClient) => ({
  async listPayrollRecords(userId) {
    const result = await getClient()
      .from('payroll_records')
      .select(
        'id, document_id, employer_name, pay_period_start, pay_period_end, payment_date, basic_salary, total_allowances, total_deductions, gross_pay, net_pay, currency, analysis_status, created_at',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(MAX_ROWS);
    return rowsOf(result);
  },

  /** Deduction lines (payroll_items.item_type = 'deduction') for the given records. */
  async listDeductions(userId, recordIds) {
    if (!recordIds.length) return [];
    // Ownership: only items whose parent record belongs to this user.
    const owned = rowsOf(
      await getClient()
        .from('payroll_records')
        .select('id')
        .eq('user_id', userId)
        .in('id', recordIds),
    ).map((r) => r.id);
    if (!owned.length) return [];

    const result = await getClient()
      .from('payroll_items')
      .select('payroll_record_id, category, description, amount')
      .eq('item_type', 'deduction')
      .in('payroll_record_id', owned)
      .limit(MAX_ROWS * 20);
    return rowsOf(result);
  },

  async listDocuments(userId) {
    const result = await getClient()
      .from('documents')
      .select('id, document_type, file_name, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);
    return rowsOf(result);
  },

  async listContractReviews(userId) {
    const result = await getClient()
      .from('contract_reviews')
      .select('id, document_id, review_status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(MAX_ROWS);
    return rowsOf(result);
  },
});

export const dashboardRepository = createRepository();
