import { Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Select } from '@/components/ui/input.jsx';
import { formatMoney } from '../lib/payslipForm.js';

const COPY = {
  English: {
    title: 'Your pay summary',
    empty: 'Calculate or open a saved breakdown to see a short summary here.',
    gross: (value) => `You earned ${value} before deductions.`,
    deductions: (value) => `Your listed deductions total ${value}.`,
    takeHome: (value) => `Your calculated take-home pay is ${value}.`,
    matches: 'This matches the net pay shown on your payslip.',
    differs: 'This differs from the net pay shown on your payslip. Consider checking the entered figures with payroll.',
    missing: 'The net pay printed on the payslip was not entered, so it could not be compared.',
    review: 'There are items to review in this breakdown. Check the notes below the figures.',
    language: 'Summary language',
  },
  Filipino: {
    title: 'Buod ng sahod mo',
    empty: 'Magkalkula o magbukas ng naka-save na breakdown para makita rito ang maikling buod.',
    gross: (value) => `Kumita ka ng ${value} bago ang mga kaltas.`,
    deductions: (value) => `Ang kabuuan ng mga nakalistang kaltas ay ${value}.`,
    takeHome: (value) => `Ang nakalkulang maiuuwi mong sahod ay ${value}.`,
    matches: 'Tugma ito sa net pay na nasa payslip mo.',
    differs: 'Iba ito sa net pay na nasa payslip mo. Mainam na ipasuri sa payroll ang mga inilagay na halaga.',
    missing: 'Hindi nailagay ang net pay na nasa payslip kaya hindi ito naikumpara.',
    review: 'May mga item sa breakdown na dapat suriin. Tingnan ang mga tala sa ibaba ng mga halaga.',
    language: 'Wika ng buod',
  },
  Taglish: {
    title: 'Pay summary mo',
    empty: 'Mag-calculate o mag-open ng saved breakdown para makita rito ang short summary.',
    gross: (value) => `Ang earnings mo bago kaltas ay ${value}.`,
    deductions: (value) => `Total ng listed deductions mo ay ${value}.`,
    takeHome: (value) => `Ang calculated take-home pay mo ay ${value}.`,
    matches: 'Match ito sa net pay na nasa payslip mo.',
    differs: 'Iba ito sa net pay na nasa payslip mo. Puwedeng ipa-check sa payroll ang mga amount na nilagay.',
    missing: 'Hindi nailagay ang net pay sa payslip kaya hindi ito na-compare.',
    review: 'May items sa breakdown na dapat i-review. Tingnan ang notes sa ibaba ng figures.',
    language: 'Summary language',
  },
};

function makeSummary(breakdown, copy) {
  if (!breakdown) return [copy.empty];
  const { totals } = breakdown;
  const lines = [
    copy.gross(formatMoney(totals.grossPay)),
    copy.deductions(formatMoney(totals.totalDeductions)),
    copy.takeHome(formatMoney(totals.computedNetPay)),
  ];
  if (breakdown.netPayCheck.statedNetPay === null) lines.push(copy.missing);
  else lines.push(breakdown.netPayCheck.matches ? copy.matches : copy.differs);
  if (breakdown.needsReview && !breakdown.flags.some((flag) => flag.code === 'NET_PAY_MISMATCH')) lines.push(copy.review);
  return lines;
}

export default function BreakdownSummary({ breakdown, language, onLanguageChange }) {
  const copy = COPY[language] || COPY.English;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />{copy.title}</CardTitle>
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="sr-only">{copy.language}</span>
          <Select className="h-8 w-auto py-0 text-xs text-foreground" value={language} onChange={(event) => onLanguageChange(event.target.value)} aria-label={copy.language}>
            <option value="English">English</option><option value="Filipino">Filipino</option><option value="Taglish">Taglish</option>
          </Select>
        </label>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm" aria-live="polite">
          {makeSummary(breakdown, copy).map((line) => <li key={line}>{line}</li>)}
        </ul>
        {breakdown && <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">
          {language === 'Filipino' ? 'Awtomatikong buod ito mula sa mga halagang inilagay mo; hindi ito payo sa buwis o batas.'
            : language === 'Taglish' ? 'Automatic summary ito based sa amounts na nilagay mo; hindi ito tax o legal advice.'
              : 'This summary uses the figures entered and is not tax or legal advice.'}
        </p>}
      </CardContent>
    </Card>
  );
}
