/** Field lists shared by the review form and the read-only view. */
export const PAYSLIP_FIELDS = [
  { key: 'employer_name', label: 'Employer Name', type: 'text' },
  { key: 'pay_period_start', label: 'Pay Period Start', type: 'text' },
  { key: 'pay_period_end', label: 'Pay Period End', type: 'text' },
  { key: 'payment_date', label: 'Payment Date', type: 'text' },
  { key: 'basic_salary', label: 'Basic Salary (PHP)', type: 'number' },
  { key: 'total_allowances', label: 'Total Allowances (PHP)', type: 'number' },
  { key: 'sss', label: 'SSS Contribution (PHP)', type: 'number' },
  { key: 'philhealth', label: 'PhilHealth (PHP)', type: 'number' },
  { key: 'pagibig', label: 'Pag-IBIG / HDMF (PHP)', type: 'number' },
  { key: 'withholding_tax', label: 'Withholding Tax (PHP)', type: 'number' },
  { key: 'total_deductions', label: 'Total Deductions (PHP)', type: 'number' },
  { key: 'gross_pay', label: 'Gross Pay (PHP)', type: 'number' },
  { key: 'net_pay', label: 'Net Pay (PHP)', type: 'number' },
];

export const CONTRACT_FIELDS = [
  { key: 'employer_name', label: 'Employer Name', type: 'text' },
  { key: 'employee_name', label: 'Employee Name', type: 'text' },
  { key: 'position_title', label: 'Position / Job Title', type: 'text' },
  { key: 'employment_type', label: 'Employment Type', type: 'text' },
  { key: 'start_date', label: 'Start Date', type: 'text' },
  { key: 'basic_salary', label: 'Basic Salary (PHP)', type: 'number' },
  { key: 'working_hours', label: 'Working Hours / Schedule', type: 'text' },
];
