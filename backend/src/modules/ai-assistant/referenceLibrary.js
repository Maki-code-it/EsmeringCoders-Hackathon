/**
 * Small, reviewed starter library for retrieval-augmented answers.
 * Summaries are paraphrased from the listed official sources; check those
 * sources for current coverage, exceptions, and regional rules.
 */
const REFERENCES = [
  {
    id: 'payslip-basics',
    title: 'Reading a payslip',
    url: 'https://nwpc.dole.gov.ph/wp-content/uploads/2024/11/Workers-Statutory-Monetary-Benefits-Handbook-2024-Edition.pdf',
    topics: ['payslip', 'pay', 'salary', 'deduction', 'benefit'],
    keywords: ['payslip', 'pay slip', 'net pay', 'gross pay', 'salary', 'allowance', 'deduction', 'sss', 'philhealth', 'pag-ibig', 'withholding'],
    summary: 'Explain the labels and amounts exactly as supplied. Separate earnings and allowances from deductions, then distinguish the shown net pay. Do not infer what an unclear payroll abbreviation means or certify that a calculation is correct. Ask the user to check the employer’s payroll explanation and the applicable statutory-benefit rules.',
  },
  {
    id: 'wage-deductions',
    title: 'DOLE: Wage deductions (Labor Code, Book III, Article 113)',
    url: 'https://dole.gov.ph/book-3-conditions-of-employment/',
    topics: ['payslip', 'deduction', 'labor'],
    keywords: ['deduction', 'deducted', 'salary', 'wage', 'cash bond', 'uniform', 'damage', 'loss', 'payroll'],
    summary: 'Article 113 describes limited circumstances for wage deductions, including worker-consented insurance premiums, properly authorized union dues, and deductions authorized by law or DOLE rules. Other rules may apply to specific deductions. A label or amount alone is not enough to decide whether a particular deduction is allowed; ask what authority and written consent or supporting details apply.',
  },
  {
    id: 'deduction-conditions',
    title: 'DOLE-CAR: Authorized deductions in workers’ pay',
    url: 'https://car.dole.gov.ph/news/authorized-deductions-in-workersae-pay/',
    topics: ['payslip', 'deduction', 'labor'],
    keywords: ['deduction', 'deducted', 'cash bond', 'deposit', 'loss', 'damage', 'tools', 'materials', 'equipment'],
    summary: 'DOLE-CAR explains that deductions for loss or damage have specific conditions, including establishing responsibility, giving the worker a chance to explain, and limiting the amount to a fair and reasonable actual loss. Rules can depend on the deduction type and circumstances; do not conclude a deduction is illegal from a payslip entry alone.',
  },
  {
    id: 'hours-and-premiums',
    title: 'DOLE: Conditions of Employment (Book III)',
    url: 'https://dole.gov.ph/book-3-conditions-of-employment/',
    topics: ['labor', 'overtime', 'holiday', 'night differential', 'hours'],
    keywords: ['overtime', 'over time', 'holiday', 'rest day', 'rest-day', 'night shift', 'night differential', 'hours worked', 'premium', 'meal break', 'meal period', 'work hours'],
    summary: 'Book III covers working time and additional compensation. For covered employees, overtime on an ordinary day is generally regular wage plus at least 25%; work beyond eight hours on a rest day or holiday uses the applicable first-eight-hours rate plus at least 30%. Night-shift differential is at least 10% of regular wage per hour worked from 10 p.m. to 6 a.m. Rest-day/holiday premiums and exemptions depend on the facts and coverage; verify current rules before applying a rate.',
  },
  {
    id: 'thirteenth-month-pay',
    title: 'DOLE: 13th-month pay guidance (2026)',
    url: 'https://dole.gov.ph/news/dole-clarifies-13th-month-pay-rules-ensures-workers-receive-rightful-benefits/',
    topics: ['pay', 'salary', 'benefit', 'labor'],
    keywords: ['13th month', '13th-month', 'thirteenth month', '13th pay', 'year-end pay', 'december pay'],
    summary: 'DOLE’s 2026 advisory says covered private-sector rank-and-file employees who worked at least one month in the calendar year receive 13th-month pay. The baseline computation is total basic salary earned in the calendar year divided by 12. Which pay components count as basic salary and other coverage details can matter; check the current advisory.',
  },
  {
    id: 'leave-benefits',
    title: 'NWPC: Workers’ Statutory Monetary Benefits Handbook (2024)',
    url: 'https://nwpc.dole.gov.ph/wp-content/uploads/2024/11/Workers-Statutory-Monetary-Benefits-Handbook-2024-Edition.pdf',
    topics: ['leave', 'benefit', 'labor'],
    keywords: ['leave', 'sick leave', 'vacation leave', 'service incentive leave', 'sil', 'maternity', 'paternity', 'solo parent', 'vawc', 'miscarriage', 'gynecological'],
    summary: 'Leave benefits come from different laws and have different eligibility, duration, documents, and pay rules. The handbook covers service incentive leave and statutory leave categories. Do not assume that one leave rule applies to every employee; identify the leave type and verify eligibility in the current official guidance.',
  },
  {
    id: 'final-and-separation-pay',
    title: 'NWPC: Workers’ Statutory Monetary Benefits Handbook (2024)',
    url: 'https://nwpc.dole.gov.ph/wp-content/uploads/2024/11/Workers-Statutory-Monetary-Benefits-Handbook-2024-Edition.pdf',
    topics: ['pay', 'employment', 'labor'],
    keywords: ['final pay', 'last pay', 'back pay', 'separation pay', 'resign', 'resignation', 'terminated', 'termination pay', 'clearance'],
    summary: 'Final pay and separation pay are different. Final pay refers to wages and benefits due on separation. Separation pay depends on the reason employment ended and applicable law, policy, or agreement; resignation does not automatically establish entitlement to separation pay. Ask for an itemized computation and verify the applicable circumstances.',
  },
  {
    id: 'statutory-contributions',
    title: 'Official SSS, PhilHealth, and Pag-IBIG contribution information',
    url: 'https://www.sss.gov.ph/pay-contribution',
    topics: ['payslip', 'deduction', 'contribution'],
    keywords: ['sss', 'philhealth', 'phil health', 'pag-ibig', 'pag ibig', 'contribution', 'premium', 'government deduction'],
    summary: 'Statutory contribution amounts depend on the agency’s current schedule and the worker’s membership or compensation category. Explain only the label and amount supplied; do not infer a current rate from memory. Check the latest official SSS, PhilHealth, or Pag-IBIG schedule for the specific agency.',
  },
  {
    id: 'regional-wages',
    title: 'NWPC: Current regional wage rates and FAQs',
    url: 'https://nwpc.dole.gov.ph/',
    topics: ['labor', 'minimum wage', 'wages', 'salary'],
    keywords: ['minimum wage', 'wage order', 'regional wage', 'daily rate', 'minimum salary', 'region'],
    summary: 'Minimum wage rates are set by regional wage orders and can change. The applicable rate depends on location and worker/industry coverage. Use the current NWPC regional wage information rather than assuming a single nationwide amount; ask which region and category apply.',
  },
  {
    id: 'dole-sena-assistance',
    title: 'DOLE: Single Entry Approach (SEnA) and Request for Assistance',
    url: 'https://dole.gov.ph/sena-contents/',
    topics: ['labor', 'wages', 'claims', 'assistance'],
    keywords: ['complaint', 'complain', 'claim', 'unpaid', 'not paid', 'underpaid', 'incorrect pay', 'money claim', 'employer', 'pasahod', 'sahod', 'sweldo', 'ireklamo', 'reklamo', 'bayad'],
    summary: 'DOLE describes SEnA as an assistance and conciliation-mediation process for labor issues, including claims for money arising from employment. An aggrieved worker may file a Request for Assistance at a DOLE office or online through DOLE ARMS. This is a route to request assistance, not a finding that an employer violated the law.',
  },
  {
    id: 'dole-arms-rfa',
    title: 'DOLE ARMS: Online Request for Assistance',
    url: 'https://arms.dole.gov.ph/',
    topics: ['labor', 'claims', 'assistance'],
    keywords: ['complaint', 'complain', 'claim', 'unpaid', 'not paid', 'underpaid', 'incorrect pay', 'money claim', 'employer', 'pasahod', 'sahod', 'sweldo', 'ireklamo', 'reklamo', 'bayad'],
    summary: 'DOLE ARMS is the online system for submitting and tracking SEnA Requests for Assistance. Review the current form and filing instructions on the official portal before submitting personal information.',
  },
  {
    id: 'contract-reading',
    title: 'DOLE: Labor Code, Book III – Conditions of Employment',
    url: 'https://dole.gov.ph/book-3-conditions-of-employment/',
    topics: ['contract', 'labor', 'employment'],
    keywords: ['contract', 'clause', 'probationary', 'regular', 'work schedule', 'job title', 'salary', 'termination', 'notice', 'confidentiality', 'non-compete'],
    summary: 'For a contract question, paraphrase only the clause the user provided. Identify defined terms, conditions, dates, pay, work schedule, leave, and termination wording that may need clarification. A plain-language summary is not a determination of enforceability; legal effect may depend on facts and rules beyond the excerpt.',
  },
];

const normalize = (value) => String(value || '').toLowerCase();

export function findRelevantReferences({ question, topic, limit = 4 }) {
  const query = normalize(question);
  return REFERENCES
    .map((reference) => {
      const topicMatch = reference.topics.includes(topic) ? 3 : 0;
      const keywordMatches = reference.keywords.reduce((count, keyword) => count + (query.includes(keyword) ? 1 : 0), 0);
      return { reference, score: topicMatch + keywordMatches, keywordMatches };
    })
    .filter(({ reference, keywordMatches }) => keywordMatches > 0
      || (topic === 'payslip' && reference.id === 'payslip-basics')
      || (topic === 'contract' && reference.id === 'contract-reading'))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ reference }) => reference);
}

export function formatReferencesForPrompt(references) {
  if (!references.length) return 'No matching library excerpt was found. Do not invent a source; say when the answer needs verification.';
  return references.map(({ title, url, summary }) => `Source: ${title}\nURL: ${url}\nReviewed summary: ${summary}`).join('\n\n');
}

export function toReferenceLinks(references) {
  return references.map(({ title, url }) => ({ title, url }));
}
