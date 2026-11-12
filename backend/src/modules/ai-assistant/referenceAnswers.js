const FALLBACK_NOTICE = {
  English: 'Lumen declined this topic, so this is a short answer from SahodSuri’s reviewed reference library.',
  Filipino: 'Hindi sinagot ng Lumen ang paksang ito, kaya ang maikling sagot na ito ay mula sa sinuring reference library ng SahodSuri.',
  Taglish: 'Hindi sinagot ng Lumen ang topic na ito, kaya itong maikling sagot ay mula sa reviewed reference library ng SahodSuri.',
};

const ANSWERS = [
  {
    matches: /overtime|over time|lampas.*oras|dagdag na oras|oras na sobra/i,
    sourceId: 'hours-and-premiums',
    answer: {
      English: 'For workers covered by the rule, overtime generally means work beyond 8 hours in a day. On an ordinary workday, the baseline is the regular hourly rate plus at least 25% for each overtime hour. Overtime on a rest day or holiday uses a different calculation based on the applicable rate for the first 8 hours. Coverage and exceptions matter, so check your workday, hours, and current DOLE/NWPC guidance before comparing amounts.',
      Filipino: 'Para sa mga manggagawang sakop ng patakaran, karaniwang overtime ang trabahong lampas 8 oras sa isang araw. Sa ordinaryong araw ng trabaho, batayang tuntunin ang regular na hourly rate dagdag ang hindi bababa sa 25% para sa bawat oras ng overtime. Iba ang pagkukuwenta kapag rest day o holiday, batay sa naaangkop na bayad sa unang 8 oras. Mahalaga ang saklaw at mga eksepsyon, kaya tiyakin ang araw at oras ng trabaho at tingnan ang kasalukuyang gabay ng DOLE/NWPC.',
      Taglish: 'Para sa workers na covered ng rule, overtime usually means work beyond 8 hours in a day. Sa ordinary workday, baseline ang regular hourly rate plus at least 25% bawat overtime hour. Iba ang computation kapag rest day or holiday, based sa applicable rate sa first 8 hours. May coverage rules and exceptions, kaya i-check ang workday, hours, at current DOLE/NWPC guidance bago mag-compare ng amounts.',
    },
  },
  {
    matches: /night shift|night differential|night pay|10\s*p\.?m\.?|6\s*a\.?m\.?|gabi|pang-gabi/i,
    sourceId: 'hours-and-premiums',
    answer: {
      English: 'For covered employees, night-shift differential is generally at least 10% of the regular wage for each hour worked between 10 p.m. and 6 a.m. Coverage exceptions can apply. Check the actual hours and current DOLE guidance before comparing a payslip amount.',
      Filipino: 'Para sa mga empleyadong sakop ng patakaran, karaniwang hindi bababa sa 10% ng regular na sahod ang night-shift differential sa bawat oras na nagtrabaho mula 10 p.m. hanggang 6 a.m. May mga eksepsyon sa saklaw. Tiyakin ang aktuwal na oras at kasalukuyang gabay ng DOLE bago ihambing ang halaga sa payslip.',
      Taglish: 'Para sa covered employees, generally at least 10% ng regular wage ang night-shift differential bawat oras na nagtrabaho between 10 p.m. and 6 a.m. May coverage exceptions. I-check ang actual hours at current DOLE guidance bago i-compare ang payslip amount.',
    },
  },
  {
    matches: /holiday pay|regular holiday|special holiday|rest day|rest-day|day off|araw ng pahinga|bayad sa holiday/i,
    sourceId: 'hours-and-premiums',
    answer: {
      English: 'Holiday and rest-day pay depend on whether the date is a regular holiday, special day, or your scheduled rest day, whether you worked, and your coverage. These categories have different rules and premiums. Share the date, whether you worked, and your normal schedule (without personal identifiers) for a more specific explanation; verify the date’s classification with current DOLE guidance.',
      Filipino: 'Nakadepende ang bayad sa holiday o rest day kung regular holiday, special day, o nakatakda mong araw ng pahinga ang petsa, kung pumasok ka, at kung sakop ka ng patakaran. Magkakaiba ang tuntunin at premium ng mga ito. Ibahagi ang petsa, kung nagtrabaho ka, at karaniwang iskedyul mo (walang personal na identifier) para mas maipaliwanag; tiyakin sa kasalukuyang gabay ng DOLE kung anong klaseng araw iyon.',
      Taglish: 'Depende ang holiday/rest-day pay kung regular holiday, special day, or scheduled rest day mo ang date, kung pumasok ka, at kung covered ka. Magkakaiba ang rules at premiums. I-share ang date, kung nag-work ka, at usual schedule (walang personal identifiers) para mas ma-explain; i-verify sa current DOLE guidance ang classification ng date.',
    },
  },
  {
    matches: /13th.?month|thirteenth month|year.end pay/i,
    sourceId: 'thirteenth-month-pay',
    answer: {
      English: 'DOLE’s 2026 guidance says covered private-sector rank-and-file employees who worked at least one month in the calendar year are entitled to 13th-month pay. The baseline formula is total basic salary earned during the year ÷ 12. Which pay components count as basic salary can matter, so compare the computation with the current DOLE advisory and your payroll records.',
      Filipino: 'Ayon sa gabay ng DOLE para sa 2026, may 13th-month pay ang mga sakop na rank-and-file employee sa pribadong sektor na nagtrabaho nang hindi bababa sa isang buwan sa calendar year. Batayang formula ang kabuuang basic salary na kinita sa taon ÷ 12. Mahalaga kung aling bahagi ng bayad ang itinuturing na basic salary, kaya ihambing ang computation sa kasalukuyang advisory ng DOLE at payroll records.',
      Taglish: 'Ayon sa 2026 DOLE guidance, entitled sa 13th-month pay ang covered private-sector rank-and-file employees na nag-work ng at least one month sa calendar year. Baseline formula: total basic salary earned during the year ÷ 12. Important kung aling pay components ang counted as basic salary, kaya i-check ang current DOLE advisory at payroll records.',
    },
  },
  {
    matches: /service incentive leave|\bsil\b|maternity|paternity|solo parent|parental leave|sick leave|vacation leave|leave benefit|leave days|leave credits|leave pay/i,
    sourceId: 'leave-benefits',
    answer: {
      English: 'Leave benefits have different eligibility rules. As a general example, covered employees may qualify for five days of paid service incentive leave after one year, subject to exceptions and other equivalent benefits. Maternity, paternity, solo-parent, and other statutory leaves have separate requirements. Which leave type are you asking about, and how long have you worked there? Check the current NWPC handbook for the applicable rule.',
      Filipino: 'Magkakaiba ang eligibility rules ng mga leave benefit. Halimbawa, maaaring maging kwalipikado ang mga sakop na empleyado sa limang araw na paid service incentive leave matapos ang isang taon, depende sa mga eksepsyon at katumbas na benepisyo. Hiwalay ang requirements para sa maternity, paternity, solo-parent, at iba pang statutory leave. Anong uri ng leave ang tinutukoy mo at gaano ka na katagal nagtatrabaho roon? Tingnan ang kasalukuyang NWPC handbook para sa naaangkop na tuntunin.',
      Taglish: 'Iba-iba ang eligibility rules ng leave benefits. Halimbawa, puwedeng qualified ang covered employees sa 5 days paid service incentive leave after one year, subject sa exceptions at equivalent benefits. Separate ang requirements ng maternity, paternity, solo-parent, at ibang statutory leaves. Anong leave ang tinutukoy mo at gaano ka na katagal doon? I-check ang current NWPC handbook para sa applicable rule.',
    },
  },
  {
    matches: /final pay|last pay|back pay|separation pay|resign|resignation|terminated|termination pay/i,
    sourceId: 'final-and-separation-pay',
    answer: {
      English: 'Final pay and separation pay are different. Final pay covers wages and benefits due when employment ends. Separation pay depends on why employment ended and the applicable law, policy, or agreement; resigning does not automatically mean separation pay is due. Ask for an itemized final-pay computation and check the reason for separation against current DOLE/NWPC guidance.',
      Filipino: 'Magkaiba ang final pay at separation pay. Saklaw ng final pay ang mga sahod at benepisyong dapat bayaran sa pagtatapos ng trabaho. Nakadepende ang separation pay sa dahilan ng pagtatapos at sa naaangkop na batas, policy, o kasunduan; hindi awtomatikong may separation pay kapag nag-resign. Humingi ng itemized computation ng final pay at ihambing ang dahilan ng separation sa kasalukuyang gabay ng DOLE/NWPC.',
      Taglish: 'Magkaiba ang final pay at separation pay. Kasama sa final pay ang wages at benefits na due kapag natapos ang employment. Depende ang separation pay sa dahilan ng pagtatapos at applicable law, policy, or agreement; hindi automatic na may separation pay kapag nag-resign. Humingi ng itemized final-pay computation at i-check ang circumstances sa current DOLE/NWPC guidance.',
    },
  },
  {
    matches: /\bsss\b|philhealth|phil health|pag.?ibig|contribution|premium deduction/i,
    sourceId: 'statutory-contributions',
    answer: {
      English: 'SSS, PhilHealth, and Pag-IBIG contribution amounts depend on the current schedule and your membership or compensation category. I shouldn’t guess a rate from a payslip label alone. Share the agency, period, and shown amount (remove personal identifiers), and compare it with that agency’s current official contribution table.',
      Filipino: 'Nakadepende ang halaga ng SSS, PhilHealth, at Pag-IBIG contribution sa kasalukuyang schedule at sa membership o compensation category mo. Hindi ako dapat manghula ng rate mula lang sa label ng payslip. Ibahagi ang ahensya, period, at halagang nakalagay (alisin ang personal identifiers), at ihambing ito sa kasalukuyang official contribution table ng ahensya.',
      Taglish: 'Depende ang SSS, PhilHealth, at Pag-IBIG contribution sa current schedule at membership/compensation category mo. Hindi ako dapat manghula ng rate base lang sa payslip label. I-share ang agency, period, at amount (alisin ang personal identifiers), tapos i-compare sa current official contribution table ng agency.',
    },
  },
  {
    matches: /normal hours|work hours|working hours|meal break|meal period|how many hours|oras ng trabaho|oras ba dapat/i,
    sourceId: 'hours-and-premiums',
    answer: {
      English: 'For employees covered by the Labor Code’s hours-of-work rules, normal work is generally limited to 8 hours a day, with specific coverage exceptions. Meal periods and time counted as work also have rules. Tell me your schedule and break details (no employer or personal identifiers) and I can help explain what to check in DOLE Book III.',
      Filipino: 'Para sa mga empleyadong sakop ng tuntunin sa oras ng trabaho sa Labor Code, karaniwang hindi lalampas sa 8 oras kada araw ang normal na trabaho, ngunit may mga eksepsyon sa saklaw. May tuntunin din tungkol sa meal break at oras na binibilang na trabaho. Ibahagi ang iskedyul at detalye ng break (walang pangalan ng employer o personal na identifier) at tutulungan kitang tukuyin ang dapat tingnan sa DOLE Book III.',
      Taglish: 'Para sa employees na covered ng hours-of-work rules ng Labor Code, generally hanggang 8 hours a day ang normal work, pero may coverage exceptions. May rules din sa meal periods at oras na counted as work. I-share ang schedule at break details (walang employer/personal identifiers) at tutulungan kitang i-check ang DOLE Book III.',
    },
  },
  {
    matches: /deduct|withhold|kaltas|salary deduction|payroll deduction/i,
    sourceId: 'wage-deductions',
    answer: {
      English: 'A deduction label by itself is not enough to determine whether a deduction is allowed. Philippine wage rules describe limited situations for deductions, and other rules may apply to particular items. Ask payroll what legal or regulatory basis applies, how the amount was calculated, and whether your written consent is relevant. The details matter; this answer does not determine that a deduction is illegal.',
      Filipino: 'Hindi sapat ang pangalan ng kaltas para malaman kung pinapayagan ito. May mga limitadong sitwasyon para sa kaltas sa sahod sa ilalim ng mga tuntunin sa Pilipinas, at maaaring may ibang patakaran para sa partikular na kaltas. Itanong sa payroll kung anong batayan sa batas o regulasyon ang ginagamit, paano kinalkula ang halaga, at kung mahalaga ang iyong nakasulat na pahintulot. Mahalaga ang mga detalye; hindi nito ipinapasiya na ilegal ang kaltas.',
      Taglish: 'Hindi sapat ang label ng deduction para malaman kung allowed ito. May limited situations para sa wage deductions sa Philippine rules, at may ibang rules para sa specific items. Tanungin ang payroll kung anong legal/regulatory basis, paano kinuwenta ang amount, at kung kailangan ang written consent mo. Important ang details; hindi nito dini-declare na illegal ang deduction.',
    },
  },
  {
    matches: /contract|clause|probationary|termination|employment term|kontrata|probasyon/i,
    sourceId: 'contract-reading',
    answer: {
      English: 'I can explain a contract clause in plain language if you paste the clause here after removing names and other personal details. I can point out conditions, dates, pay, schedule, or wording to clarify, but I can’t determine whether a term is enforceable from a short excerpt.',
      Filipino: 'Maipapaliwanag ko sa simpleng Filipino ang isang bahagi ng kontrata kung ilalagay mo rito ang teksto matapos alisin ang mga pangalan at iba pang personal na detalye. Matutukoy ko ang mga kondisyon, petsa, sahod, iskedyul, o malabong pananalita na dapat linawin, pero hindi ko matitiyak kung maipatutupad ang isang kondisyon batay lang sa maikling sipi.',
      Taglish: 'I can explain a contract clause in plain language kung i-paste mo rito ang clause after removing names and personal details. Matutukoy ko ang conditions, dates, pay, schedule, or wording na dapat linawin, pero hindi ko masasabi kung enforceable ang term base lang sa short excerpt.',
    },
  },
  {
    matches: /minimum wage|wage order|regional wage|daily rate|minimum salary|pinakamababang sahod/i,
    sourceId: 'regional-wages',
    answer: {
      English: 'Minimum wage depends on the applicable regional wage order and can change. To identify the right rate, check your work location, industry, worker category, and the wage order’s effective date in NWPC’s current rates. I shouldn’t guess a rate without those details.',
      Filipino: 'Nakadepende ang minimum wage sa naaangkop na regional wage order at maaari itong magbago. Para malaman ang tamang rate, tingnan ang lugar ng trabaho, industriya, kategorya ng manggagawa, at petsa ng bisa ng wage order sa kasalukuyang rates ng NWPC. Hindi ako dapat manghula ng rate kung wala ang mga detalyeng ito.',
      Taglish: 'Depende ang minimum wage sa applicable regional wage order at puwedeng magbago. Para mahanap ang tamang rate, i-check ang work location, industry, worker category, at effectivity date sa current NWPC rates. Hindi ako dapat manghula ng rate without those details.',
    },
  },
  {
    matches: /complain|complaint|claim|unpaid|not paid|underpaid|incorrect pay|money claim|ireklamo|reklamo|hindi.*(bayad|sumahod|nagpasahod)|kulang.*(sahod|pasahod)|pasahod|sweldo/i,
    sourceId: 'dole-sena-assistance',
    answer: {
      English: 'If you believe wages or benefits may be unpaid, first ask payroll/HR for a written breakdown and keep relevant records such as payslips, time records, your contract, and written messages. You can request help through DOLE’s Single Entry Approach (SEnA), which handles employment-related money claims. A Request for Assistance can be filed at a DOLE office or online through DOLE ARMS. This does not by itself establish that your employer violated the law; the details and records matter.',
      Filipino: 'Kung sa tingin mo ay may sahod o benepisyong hindi naibayad, humingi muna sa payroll/HR ng nakasulat na breakdown at itago ang mahahalagang rekord gaya ng payslip, tala ng oras ng trabaho, kontrata, at mga mensahe. Maaari kang humingi ng tulong sa Single Entry Approach (SEnA) ng DOLE para sa mga money claim na may kaugnayan sa trabaho. Maaaring maghain ng Request for Assistance sa opisina ng DOLE o online sa DOLE ARMS. Hindi nito awtomatikong pinatutunayang lumabag sa batas ang employer; mahalaga ang mga detalye at rekord.',
      Taglish: 'Kung tingin mo may wages or benefits na hindi nabayaran, humingi muna sa payroll/HR ng written breakdown at itago ang records gaya ng payslips, time records, contract, at messages. Puwede kang mag-request ng help through DOLE’s Single Entry Approach (SEnA), na tumutulong sa employment-related money claims. Puwedeng mag-file ng Request for Assistance sa DOLE office o online sa DOLE ARMS. Hindi nito automatic na pinapatunayang lumabag sa batas ang employer; importante ang details at records.',
    },
  },
  {
    matches: /payslip|pay slip|net pay|gross pay|allowance|payroll|sahod|sweldo/i,
    sourceId: 'payslip-basics',
    answer: {
      English: 'I can explain the entries on a payslip, but I need the labels and amounts to explain your specific breakdown. Remove your name, employer identifiers, account numbers, and other personal details before sharing. I’ll separate listed earnings and allowances, deductions, and net pay, and flag labels that need payroll clarification.',
      Filipino: 'Maipapaliwanag ko ang mga entry sa payslip, pero kailangan ko ang mga label at halaga para maipaliwanag ang partikular mong breakdown. Alisin muna ang pangalan, detalye ng employer, account number, at iba pang personal na impormasyon. Pagkakahiwalayin ko ang nakalistang kita at allowance, kaltas, at net pay, at ituturo ang mga label na dapat linawin sa payroll.',
      Taglish: 'I can explain the payslip entries, pero kailangan ko ang labels at amounts para sa specific breakdown mo. Alisin muna ang name, employer identifiers, account numbers, at personal details. Ise-separate ko ang earnings/allowances, deductions, at net pay, at i-flag ang labels na dapat linawin sa payroll.',
    },
  },
];

export function makeReferenceFallback({ question, language, references }) {
  const query = String(question || '').toLowerCase();
  const selected = ANSWERS.find(({ matches }) => matches.test(query));
  if (!selected || !references.some(({ id }) => id === selected.sourceId)) return null;
  return {
    answer: selected.answer[language] || selected.answer.English,
    notice: FALLBACK_NOTICE[language] || FALLBACK_NOTICE.English,
    sourceId: selected.sourceId,
  };
}
