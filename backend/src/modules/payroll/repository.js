import { getSupabaseAdminClient } from '../../config/supabase.js';
import { AppError } from '../../middleware/apiResponse.js';

// Data access for payroll_records and payroll_items (see database/schema.sql).

const MAX_RECORDS = 100;

const RECORD_COLUMNS =
  'id, document_id, employer_name, pay_period_start, pay_period_end, payment_date, basic_salary, total_allowances, total_deductions, gross_pay, net_pay, currency, analysis_status, discrepancy_flags, created_at';

// Never forward Supabase error text: it may contain internals.
const fail = () => {
  throw new AppError('Unable to access payroll data', 502, 'PAYROLL_DATA_ERROR');
};

const check = ({ data, error }) => {
  if (error) fail();
  return data;
};

export const createRepository = (getClient = getSupabaseAdminClient) => ({
  async listRecords(userId) {
    return (
      check(
        await getClient()
          .from('payroll_records')
          .select('id, employer_name, pay_period_start, pay_period_end, gross_pay, total_deductions, net_pay, analysis_status, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(MAX_RECORDS),
      ) || []
    );
  },

  // Finds an existing record that is the same payslip: linked to the same document, or same employer and same pay period.
  async findDuplicate(userId, { documentId, employerName, payPeriodStart, payPeriodEnd }) {
    if (documentId) {
      const byDocument = check(
        await getClient()
          .from('payroll_records')
          .select('id')
          .eq('user_id', userId)
          .eq('document_id', documentId)
          .limit(1),
      );
      if (byDocument?.length) return byDocument[0];
    }
    if (!payPeriodStart || !payPeriodEnd) return null;

    let query = getClient()
      .from('payroll_records')
      .select('id')
      .eq('user_id', userId)
      .eq('pay_period_start', payPeriodStart)
      .eq('pay_period_end', payPeriodEnd);
    query = employerName ? query.ilike('employer_name', employerName.replace(/[%_\\]/g, '\\$&')) : query.is('employer_name', null);
    const byPeriod = check(await query.limit(1));
    return byPeriod?.[0] || null;
  },

  async documentBelongsToUser(userId, documentId) {
    const row = check(
      await getClient()
        .from('documents')
        .select('id')
        .eq('id', documentId)
        .eq('user_id', userId)
        .maybeSingle(),
    );
    return Boolean(row);
  },

  /** Returns { record, items } or null when the record is not this user's. */
  async getRecord(userId, recordId) {
    const record = check(
      await getClient()
        .from('payroll_records')
        .select(RECORD_COLUMNS)
        .eq('id', recordId)
        .eq('user_id', userId)
        .maybeSingle(),
    );
    if (!record) return null;

    const items = check(
      await getClient()
        .from('payroll_items')
        .select('item_type, category, description, amount, created_at')
        .eq('payroll_record_id', record.id)
        .order('created_at', { ascending: true }),
    );
    return { record, items: items || [] };
  },

  /** Inserts the record and its line items. Removes the record if items fail. */
  async createRecord(userId, recordRow, itemRows) {
    const record = check(
      await getClient()
        .from('payroll_records')
        .insert({ ...recordRow, user_id: userId })
        .select('id')
        .single(),
    );

    if (itemRows.length) {
      const { error } = await getClient()
        .from('payroll_items')
        .insert(itemRows.map((item) => ({ ...item, payroll_record_id: record.id })));
      if (error) {
        // No multi-table transactions through the REST client: undo manually.
        await getClient().from('payroll_records').delete().eq('id', record.id).eq('user_id', userId);
        fail();
      }
    }
    return record.id;
  },

  /** Deletes a user's record and its items. Returns false if not found. */
  async deleteRecord(userId, recordId) {
    const owned = check(
      await getClient()
        .from('payroll_records')
        .select('id')
        .eq('id', recordId)
        .eq('user_id', userId)
        .maybeSingle(),
    );
    if (!owned) return false;

    check(await getClient().from('payroll_items').delete().eq('payroll_record_id', recordId));
    check(await getClient().from('payroll_records').delete().eq('id', recordId).eq('user_id', userId));
    return true;
  },
});

export const payrollRepository = createRepository();
