// SahodSuri FAQ library: basic, well-established answers to common questions Filipino workers ask about their sahod (pay) and rights.

const SOURCES = {
  handbook: {
    title: 'NWPC: Workers’ Statutory Monetary Benefits Handbook (2024)',
    url: 'https://nwpc.dole.gov.ph/wp-content/uploads/2024/11/Workers-Statutory-Monetary-Benefits-Handbook-2024-Edition.pdf',
  },
  laborCode: {
    title: 'DOLE: Labor Code, Book III – Conditions of Employment',
    url: 'https://dole.gov.ph/book-3-conditions-of-employment/',
  },
  bir: { title: 'BIR: Income tax on compensation (TRAIN Law, RA 10963)', url: 'https://www.bir.gov.ph/' },
  nwpc: { title: 'NWPC: Current regional wage rates', url: 'https://nwpc.dole.gov.ph/' },
  dole: { title: 'DOLE: Labor Advisory No. 06, Series of 2020 (final pay and COE)', url: 'https://dole.gov.ph/' },
  arms: { title: 'DOLE ARMS: Online Request for Assistance (SEnA)', url: 'https://arms.dole.gov.ph/' },
  sss: { title: 'SSS: Official website', url: 'https://www.sss.gov.ph/' },
  philhealth: { title: 'PhilHealth: Official website', url: 'https://www.philhealth.gov.ph/' },
  pagibig: { title: 'Pag-IBIG Fund: Official website', url: 'https://www.pagibigfund.gov.ph/' },
};

const FAQS = [
  {
    id: 'gross-vs-net',
    // Must mention both gross and net; a "difference" word only raises the score.
    patterns: [/gross.{0,40}net|net.{0,40}gross/i, /pagkakaiba|difference|\bvs\.?|versus/i],
    requiredPattern: 0,
    sources: ['handbook'],
    facts: 'Gross pay = total earnings for the pay period before deductions (basic pay plus overtime, holiday pay, night differential, allowances). Net pay (take-home pay) = gross pay minus deductions (SSS, PhilHealth, Pag-IBIG, withholding tax, loans, other authorized deductions).',
    answer: {
      English: 'Gross pay is everything you earned in the pay period before anything is taken out: basic pay plus overtime, holiday pay, night differential, and allowances. Net pay (take-home pay) is what is left after deductions such as SSS, PhilHealth, Pag-IBIG, withholding tax, and loans.\n\nFormula: Net pay = Gross pay − Total deductions.\n\nTip: the Payroll Breakdown page in SahodSuri can check this math for your payslip.',
      Filipino: 'Ang gross pay ay ang kabuuang kinita mo sa isang pay period bago ang anumang kaltas: basic pay kasama ang overtime, holiday pay, night differential, at allowance. Ang net pay (take-home pay) ay ang natitira matapos ang mga kaltas gaya ng SSS, PhilHealth, Pag-IBIG, withholding tax, at loan.\n\nFormula: Net pay = Gross pay − Kabuuang kaltas.\n\nTip: Masusuri ng Payroll Breakdown page ng SahodSuri ang computation ng payslip mo.',
      Taglish: 'Ang gross pay ay lahat ng kinita mo sa pay period bago kaltasan: basic pay plus overtime, holiday pay, night differential, at allowances. Ang net pay (take-home pay) ay ang natitira after deductions gaya ng SSS, PhilHealth, Pag-IBIG, withholding tax, at loans.\n\nFormula: Net pay = Gross pay − Total deductions.\n\nTip: Puwede mong i-check ang math ng payslip mo sa Payroll Breakdown page ng SahodSuri.',
    },
  },
  {
    id: 'gross-pay',
    patterns: [/gross\s*(pay|income|salary|earnings)?/i, /kabuuang (kita|sahod|sweldo)/i],
    sources: ['handbook'],
    facts: 'Gross pay = total earnings for the pay period before any deductions: basic pay plus overtime pay, holiday and rest-day premiums, night-shift differential, and allowances.',
    answer: {
      English: 'Gross pay is your total earnings for the pay period before any deductions. It usually includes your basic pay plus overtime pay, holiday or rest-day premiums, night-shift differential, and allowances.\n\nExample: Basic pay ₱9,000 + Overtime ₱560 + Allowance ₱1,000 = Gross pay ₱10,560.\n\nYour net pay (take-home) is gross pay minus deductions.',
      Filipino: 'Ang gross pay ay ang kabuuang kinita mo sa isang pay period bago ang anumang kaltas. Karaniwang kasama rito ang basic pay, overtime pay, dagdag-bayad sa holiday o rest day, night-shift differential, at allowance.\n\nHalimbawa: Basic pay ₱9,000 + Overtime ₱560 + Allowance ₱1,000 = Gross pay ₱10,560.\n\nAng net pay (take-home) mo ay gross pay bawas ang mga kaltas.',
      Taglish: 'Ang gross pay ay total earnings mo sa pay period bago ang kahit anong deduction. Usually kasama rito ang basic pay, overtime pay, holiday o rest-day premiums, night-shift differential, at allowances.\n\nExample: Basic pay ₱9,000 + Overtime ₱560 + Allowance ₱1,000 = Gross pay ₱10,560.\n\nAng net pay (take-home) mo ay gross pay minus deductions.',
    },
  },
  {
    id: 'net-pay',
    patterns: [/net\s*pay|take.?home|net salary|net income/i, /bakit (maliit|mababa|kulang).{0,30}(sahod|sweldo|natanggap)|why.{0,30}(lower|less|smaller).{0,30}(pay|salary)/i],
    sources: ['handbook'],
    facts: 'Net pay (take-home pay) = gross pay minus deductions. Common deductions: SSS, PhilHealth, and Pag-IBIG employee shares, withholding tax, loan repayments, and other deductions authorized by law or by the worker in writing. Net pay is lower than gross pay mainly because of these deductions.',
    answer: {
      English: 'Net pay, or take-home pay, is the amount you actually receive. It is your gross pay minus deductions.\n\nNet pay = Gross pay − (SSS + PhilHealth + Pag-IBIG + withholding tax + loans + other deductions)\n\nThat is why your take-home is lower than your salary rate. Every deduction should be listed on your payslip. If one is unclear, it is fair to ask payroll what it is for.',
      Filipino: 'Ang net pay o take-home pay ay ang halagang talagang natatanggap mo. Ito ang gross pay bawas ang mga kaltas.\n\nNet pay = Gross pay − (SSS + PhilHealth + Pag-IBIG + withholding tax + loan + iba pang kaltas)\n\nKaya mas mababa ang natatanggap mo kaysa sa rate ng sahod mo. Dapat nakalista sa payslip ang bawat kaltas. Kung may hindi malinaw, puwede mong itanong sa payroll kung para saan ito.',
      Taglish: 'Ang net pay o take-home pay ay ang amount na talagang natatanggap mo. Ito ang gross pay minus deductions.\n\nNet pay = Gross pay − (SSS + PhilHealth + Pag-IBIG + withholding tax + loans + other deductions)\n\nKaya mas mababa ang take-home mo kaysa sa salary rate mo. Dapat naka-list sa payslip ang bawat deduction. Kung may hindi malinaw, okay lang itanong sa payroll kung para saan ito.',
    },
  },
  {
    id: 'basic-pay',
    patterns: [/basic (pay|salary|wage)|basic na sahod|batayang sahod/i],
    sources: ['handbook'],
    facts: 'Basic pay (basic salary) is the fixed pay for normal working hours. It generally excludes overtime, premiums, night differential, allowances, and most bonuses. It matters because 13th-month pay and many rate computations are based on basic salary.',
    answer: {
      English: 'Basic pay is your fixed pay for your normal working hours, based on your daily or monthly rate. It generally does not include overtime, holiday premiums, night differential, allowances, or bonuses.\n\nWhy it matters: your 13th-month pay is computed from basic salary only, and your daily and hourly rates come from it.',
      Filipino: 'Ang basic pay ay ang nakapirming bayad para sa normal mong oras ng trabaho, batay sa daily o monthly rate mo. Karaniwang hindi kasama rito ang overtime, dagdag-bayad sa holiday, night differential, allowance, o bonus.\n\nBakit mahalaga: ang 13th-month pay ay kinukuwenta mula sa basic salary lamang, at dito rin nanggagaling ang daily at hourly rate mo.',
      Taglish: 'Ang basic pay ay fixed pay mo para sa normal working hours, based sa daily o monthly rate mo. Generally hindi kasama rito ang overtime, holiday premiums, night differential, allowances, o bonuses.\n\nBakit important: ang 13th-month pay mo ay computed from basic salary lang, at dito rin galing ang daily at hourly rate mo.',
    },
  },
  {
    id: 'allowances',
    patterns: [/allowance|de minimis|rice subsidy|transpo(rtation)?|meal allowance|cola\b|ecola/i],
    sources: ['bir', 'handbook'],
    facts: 'Allowances are extra pay on top of basic pay (e.g. rice, meal, transportation, COLA). Some small benefits are "de minimis" and are tax-exempt up to BIR limits. COLA is a cost-of-living allowance; some wage orders later integrate it into the basic wage. Allowances are usually not part of basic salary for 13th-month pay unless integrated.',
    answer: {
      English: 'An allowance is extra pay given on top of your basic pay, such as rice, meal, transportation, or COLA (cost-of-living allowance). Allowances are part of your gross pay.\n\nSome small benefits are called "de minimis" and are not taxed up to limits set by the BIR. Allowances are usually not included in basic salary when computing 13th-month pay, unless they have been integrated into it. Check your contract or company policy for which allowances you are entitled to.',
      Filipino: 'Ang allowance ay dagdag na bayad bukod sa basic pay mo, gaya ng rice, meal, transportation, o COLA (cost-of-living allowance). Bahagi ito ng gross pay mo.\n\nAng ilang maliit na benepisyo ay tinatawag na "de minimis" at hindi binubuwisan hanggang sa limitasyong itinakda ng BIR. Karaniwang hindi kasama ang allowance sa basic salary kapag kinukuwenta ang 13th-month pay, maliban kung isinama na ito. Tingnan ang kontrata o patakaran ng kumpanya kung aling allowance ang para sa iyo.',
      Taglish: 'Ang allowance ay extra pay on top ng basic pay mo, gaya ng rice, meal, transportation, o COLA (cost-of-living allowance). Part ito ng gross pay mo.\n\nAng ibang maliliit na benefits ay tinatawag na "de minimis" at hindi tina-tax hanggang sa limits ng BIR. Usually hindi kasama ang allowances sa basic salary kapag kinukuwenta ang 13th-month pay, unless integrated na. I-check ang contract o company policy kung aling allowances ang para sa iyo.',
    },
  },
  {
    id: 'daily-hourly-rate',
    patterns: [/daily rate|hourly rate|rate per (day|hour)|per day|kada araw|kada oras|arawang sahod/i, /monthly rate|monthly (salary|pay)|buwanang sahod/i, /(compute|kuwenta|kwenta|calculate).{0,40}rate/i],
    sources: ['handbook'],
    facts: 'For monthly-paid workers: daily rate = monthly rate x 12 / number of paid days in a year (the employer\'s factor, commonly 261 for Monday-Friday work, 313 for Monday-Saturday, 365 if rest days and holidays are paid). Hourly rate = daily rate / 8. Daily-paid workers are paid for days actually worked, plus pay for regular holidays under the rules.',
    answer: {
      English: 'If you are monthly-paid:\n• Daily rate = Monthly rate × 12 ÷ number of paid days in a year\n• Hourly rate = Daily rate ÷ 8\n\nThe number of paid days depends on your schedule. Common factors are 261 (Monday–Friday), 313 (Monday–Saturday), and 365 (when rest days and holidays are paid). Ask HR which factor they use.\n\nExample: ₱18,000 × 12 ÷ 261 = ₱827.59 per day, or ₱103.45 per hour.\n\nIf you are daily-paid, you are paid for the days you actually work, plus regular holiday pay under the rules.',
      Filipino: 'Kung monthly-paid ka:\n• Daily rate = Monthly rate × 12 ÷ bilang ng bayad na araw sa isang taon\n• Hourly rate = Daily rate ÷ 8\n\nNakadepende ang bilang ng bayad na araw sa iskedyul mo. Karaniwang factor ang 261 (Lunes–Biyernes), 313 (Lunes–Sabado), at 365 (kung bayad ang rest day at holiday). Itanong sa HR kung anong factor ang gamit nila.\n\nHalimbawa: ₱18,000 × 12 ÷ 261 = ₱827.59 kada araw, o ₱103.45 kada oras.\n\nKung daily-paid ka, binabayaran ka sa mga araw na talagang pumasok ka, kasama ang bayad sa regular holiday ayon sa patakaran.',
      Taglish: 'Kung monthly-paid ka:\n• Daily rate = Monthly rate × 12 ÷ number of paid days in a year\n• Hourly rate = Daily rate ÷ 8\n\nDepende sa schedule mo ang number of paid days. Common factors ang 261 (Monday–Friday), 313 (Monday–Saturday), at 365 (kung paid ang rest days at holidays). Itanong sa HR kung anong factor ang gamit nila.\n\nExample: ₱18,000 × 12 ÷ 261 = ₱827.59 per day, o ₱103.45 per hour.\n\nKung daily-paid ka, bayad ka sa days na actually pumasok ka, plus regular holiday pay ayon sa rules.',
    },
  },
  {
    id: 'withholding-tax',
    patterns: [/withholding|income tax|\btax\b|buwis|\bbir\b|train law/i],
    sources: ['bir'],
    facts: 'Withholding tax is income tax the employer deducts from pay and remits to the BIR. Under the TRAIN Law (RA 10963), annual taxable compensation of PHP 250,000 or less is exempt from income tax. Minimum wage earners are exempt from income tax on their statutory minimum wage and on holiday pay, overtime pay, night differential, and hazard pay. Employee shares of SSS, PhilHealth, and Pag-IBIG are not taxable. 13th-month pay and other benefits are tax-exempt up to PHP 90,000 per year.',
    answer: {
      English: 'Withholding tax is income tax that your employer deducts from your pay and sends to the BIR on your behalf.\n\nKey rules under the TRAIN Law:\n• If your annual taxable income is ₱250,000 or less, you pay no income tax.\n• Minimum wage earners pay no income tax on their minimum wage, holiday pay, overtime, night differential, and hazard pay.\n• Your SSS, PhilHealth, and Pag-IBIG contributions are not taxed.\n• 13th-month pay and other bonuses are tax-free up to ₱90,000 a year.\n\nIf you are below these thresholds but still have tax withheld, ask payroll to explain it.',
      Filipino: 'Ang withholding tax ay income tax na kinakaltas ng employer mo sa sahod mo at ipinapasa sa BIR para sa iyo.\n\nMahahalagang patakaran sa ilalim ng TRAIN Law:\n• Kung ₱250,000 o mas mababa ang taxable income mo sa isang taon, wala kang babayarang income tax.\n• Walang income tax ang minimum wage earner sa minimum wage, holiday pay, overtime, night differential, at hazard pay nila.\n• Hindi binubuwisan ang SSS, PhilHealth, at Pag-IBIG contribution mo.\n• Walang buwis ang 13th-month pay at iba pang bonus hanggang ₱90,000 kada taon.\n\nKung pasok ka sa mga ito pero may kaltas pa ring buwis, itanong sa payroll kung bakit.',
      Taglish: 'Ang withholding tax ay income tax na dine-deduct ng employer sa sahod mo at nire-remit sa BIR for you.\n\nKey rules under TRAIN Law:\n• Kung ₱250,000 or less ang annual taxable income mo, walang income tax.\n• Walang income tax ang minimum wage earners sa minimum wage, holiday pay, overtime, night differential, at hazard pay nila.\n• Hindi taxable ang SSS, PhilHealth, at Pag-IBIG contributions mo.\n• Tax-free ang 13th-month pay at ibang bonuses up to ₱90,000 a year.\n\nKung pasok ka rito pero may tax deduction pa rin, itanong sa payroll kung bakit.',
    },
  },
  {
    id: 'government-contributions',
    patterns: [/\bsss\b|philhealth|phil health|pag.?ibig|hdmf/i, /contribution|kontribusyon|hulog/i, /government (deduction|contribution)|mandatory (deduction|contribution)/i],
    sources: ['sss', 'philhealth', 'pagibig'],
    facts: 'SSS: social security (sickness, maternity, disability, retirement, death benefits, salary loans). PhilHealth: national health insurance for hospital and medical costs. Pag-IBIG (HDMF): savings fund plus housing and multi-purpose loans. Both employer and employee pay shares; the employer deducts the employee share from pay and must remit it. Rates change; check each agency\'s current official table. Workers can check posted contributions through each agency\'s online member portal.',
    answer: {
      English: 'These are the three government contributions on most payslips:\n• SSS: social security. It covers sickness, maternity, disability, retirement, and death benefits, plus salary loans.\n• PhilHealth: health insurance that helps pay hospital and medical bills.\n• Pag-IBIG (HDMF): a savings fund that also offers housing and multi-purpose loans.\n\nYou and your employer both pay a share. Your employer deducts your share from your pay and must send it to the agency. Rates change, so check each agency\'s current table. You can confirm your contributions were actually posted through each agency\'s online member account.',
      Filipino: 'Ito ang tatlong government contribution na makikita sa karamihan ng payslip:\n• SSS: social security. Sakop nito ang sickness, maternity, disability, retirement, at death benefits, pati salary loan.\n• PhilHealth: health insurance na tumutulong sa gastos sa ospital at pagpapagamot.\n• Pag-IBIG (HDMF): savings fund na may housing at multi-purpose loan.\n\nPareho kayong may bahagi ng employer mo. Kinakaltas ng employer ang bahagi mo sa sahod at dapat nila itong ihulog sa ahensya. Nagbabago ang rates, kaya tingnan ang kasalukuyang table ng bawat ahensya. Masusuri mo kung naihulog talaga ang contribution mo sa online member account ng bawat ahensya.',
      Taglish: 'Ito ang tatlong government contributions sa karamihan ng payslips:\n• SSS: social security. Covered ang sickness, maternity, disability, retirement, at death benefits, plus salary loans.\n• PhilHealth: health insurance na tumutulong sa hospital at medical bills.\n• Pag-IBIG (HDMF): savings fund na may housing at multi-purpose loans.\n\nMay share kayo pareho ng employer mo. Dine-deduct ng employer ang share mo sa sahod at dapat nila itong i-remit sa agency. Nagbabago ang rates, kaya i-check ang current table ng bawat agency. Puwede mong i-verify kung na-post talaga ang contributions mo sa online member account ng bawat agency.',
    },
  },
  {
    id: 'payday',
    patterns: [/how often|gaano kadalas|kailan (ang )?(sahod|sweldo|payday)|payday|pay day|every (two|2) weeks|kinsenas|katapusan|cut.?off/i, /(\blate\b|delayed|naantala|\bhuli\b|atrasado).{0,30}(sahod|sweldo|salary|wages?|paycheck)|(sahod|sweldo|salary|wages?|paycheck).{0,30}(\blate\b|delayed|naantala|\bhuli\b|atrasado)/i],
    sources: ['laborCode'],
    facts: 'Labor Code Art. 103: wages must be paid at least once every two weeks or twice a month, at intervals not exceeding 16 days (exceptions for force majeure). Art. 102: wages are paid in legal tender; payment through bank or ATM is allowed under DOLE conditions. Common practice is semi-monthly payroll (kinsenas at katapusan).',
    answer: {
      English: 'Under the Labor Code, you must be paid at least once every two weeks or twice a month, with no more than 16 days between paydays. That is why many companies pay on the 15th and 30th ("kinsenas at katapusan"). Wages must be paid in money, though bank or ATM payroll is allowed.\n\nIf your salary is repeatedly late, ask HR in writing for the reason and keep a record of the dates. If it is not resolved, you can ask DOLE for help through a Request for Assistance (SEnA).',
      Filipino: 'Ayon sa Labor Code, dapat kang mabayaran nang hindi bababa sa isang beses kada dalawang linggo o dalawang beses kada buwan, at hindi lalampas sa 16 na araw ang pagitan ng bawat sahod. Kaya maraming kumpanya ang nagpapasahod tuwing ika-15 at ika-30 ("kinsenas at katapusan"). Dapat bayaran ang sahod sa pera, pero puwede rin sa bangko o ATM.\n\nKung paulit-ulit na late ang sahod mo, itanong nang nakasulat sa HR ang dahilan at itala ang mga petsa. Kung hindi maayos, puwede kang humingi ng tulong sa DOLE sa pamamagitan ng Request for Assistance (SEnA).',
      Taglish: 'Under the Labor Code, dapat kang mabayaran at least once every two weeks or twice a month, at hindi lalampas sa 16 days ang pagitan ng paydays. Kaya maraming companies ang nagpapasahod tuwing 15th at 30th ("kinsenas at katapusan"). Dapat in money ang sahod, pero allowed ang bank o ATM payroll.\n\nKung paulit-ulit na late ang sahod mo, itanong in writing sa HR ang reason at i-record ang dates. Kung hindi ma-resolve, puwede kang humingi ng tulong sa DOLE through a Request for Assistance (SEnA).',
    },
  },
  {
    id: 'holiday-pay',
    patterns: [/holiday|pista opisyal|araw ng pahinga|rest day|day off|special (non.?working|day)/i, /double pay|doble|200%|130%/i],
    sources: ['handbook'],
    facts: 'General DOLE rules for covered employees (based on daily rate): Regular holiday, not worked: 100%. Regular holiday, worked: 200% for the first 8 hours. Regular holiday on rest day, worked: 260%. Special non-working day, not worked: no work, no pay unless company policy or CBA says otherwise. Special non-working day, worked: 130%. Special day on rest day, worked: 150%. Rest day, worked: 130%. Overtime on these days: plus 30% of the hourly rate on that day. Holiday pay exemptions apply to some employers (e.g. certain small retail/service establishments).',
    answer: {
      English: 'General DOLE rules, based on your daily rate:\n\nRegular holiday (e.g. Christmas, Independence Day)\n• Not worked: 100% (paid even without working, if eligible)\n• Worked: 200% for the first 8 hours\n• Worked and it is also your rest day: 260%\n\nSpecial non-working day\n• Not worked: no work, no pay (unless company policy says otherwise)\n• Worked: 130%\n• Worked and it is also your rest day: 150%\n\nRest day worked: 130%\nOvertime on these days: plus 30% of the hourly rate for that day.\n\nExample: daily rate ₱600, worked on a regular holiday = ₱1,200.\n\nSome small establishments are exempt. Check the official holiday list each year, since dates are set by proclamation.',
      Filipino: 'Pangkalahatang patakaran ng DOLE, batay sa daily rate mo:\n\nRegular holiday (hal. Pasko, Araw ng Kalayaan)\n• Hindi pumasok: 100% (bayad kahit walang pasok, kung kwalipikado)\n• Pumasok: 200% sa unang 8 oras\n• Pumasok at rest day mo rin: 260%\n\nSpecial non-working day\n• Hindi pumasok: no work, no pay (maliban kung iba ang patakaran ng kumpanya)\n• Pumasok: 130%\n• Pumasok at rest day mo rin: 150%\n\nPumasok sa rest day: 130%\nOvertime sa mga araw na ito: dagdag na 30% ng hourly rate sa araw na iyon.\n\nHalimbawa: daily rate ₱600, pumasok sa regular holiday = ₱1,200.\n\nMay ilang maliliit na establisyimento na exempted. Tingnan ang opisyal na listahan ng holiday bawat taon dahil itinatakda ito ng proklamasyon.',
      Taglish: 'General DOLE rules, based sa daily rate mo:\n\nRegular holiday (hal. Christmas, Independence Day)\n• Hindi pumasok: 100% (paid kahit walang pasok, kung eligible)\n• Pumasok: 200% sa first 8 hours\n• Pumasok at rest day mo rin: 260%\n\nSpecial non-working day\n• Hindi pumasok: no work, no pay (unless iba ang company policy)\n• Pumasok: 130%\n• Pumasok at rest day mo rin: 150%\n\nRest day na pumasok: 130%\nOvertime sa mga araw na ito: plus 30% ng hourly rate sa araw na iyon.\n\nExample: daily rate ₱600, pumasok sa regular holiday = ₱1,200.\n\nMay ilang small establishments na exempted. I-check ang official holiday list every year dahil naka-proclamation ang dates.',
    },
  },
  {
    id: 'overtime-pay',
    patterns: [/overtime|over time|\bot\b|lampas.{0,10}oras|sobrang oras|extra hours/i],
    sources: ['laborCode', 'handbook'],
    facts: 'Labor Code Art. 87: work beyond 8 hours a day on an ordinary working day is paid at least the hourly rate plus 25% (125%). Overtime on a rest day, special day, or holiday is paid at the hourly rate for that day plus 30%. Managerial employees and some other groups are not covered by hours-of-work rules. Undertime on one day cannot be offset by overtime on another day (Art. 88).',
    answer: {
      English: 'Overtime is work beyond 8 hours in a day. On an ordinary working day, each overtime hour is paid at least your hourly rate plus 25%.\n\nOvertime pay = Hourly rate × 125% × overtime hours\nExample: hourly rate ₱75 × 1.25 × 2 hours = ₱187.50\n\nOn a rest day, special day, or holiday, overtime is your hourly rate for that day plus 30%. Managers and some other worker groups are not covered. Your employer also cannot use your overtime to cancel out undertime on a different day.',
      Filipino: 'Ang overtime ay trabahong lampas sa 8 oras sa isang araw. Sa ordinaryong araw ng trabaho, ang bawat oras ng overtime ay binabayaran ng hindi bababa sa hourly rate mo dagdag ang 25%.\n\nOvertime pay = Hourly rate × 125% × bilang ng oras ng overtime\nHalimbawa: hourly rate ₱75 × 1.25 × 2 oras = ₱187.50\n\nSa rest day, special day, o holiday, ang overtime ay ang hourly rate mo sa araw na iyon dagdag ang 30%. Hindi sakop ang mga manager at ilang grupo ng manggagawa. Hindi rin puwedeng gamitin ng employer ang overtime mo para tapalan ang undertime sa ibang araw.',
      Taglish: 'Ang overtime ay work beyond 8 hours in a day. Sa ordinary working day, bawat overtime hour ay bayad at least ng hourly rate mo plus 25%.\n\nOvertime pay = Hourly rate × 125% × overtime hours\nExample: hourly rate ₱75 × 1.25 × 2 hours = ₱187.50\n\nSa rest day, special day, o holiday, ang overtime ay hourly rate mo sa araw na iyon plus 30%. Hindi covered ang managers at ibang worker groups. Hindi rin puwedeng gamitin ng employer ang overtime mo para i-offset ang undertime sa ibang araw.',
    },
  },
  {
    id: 'night-differential',
    patterns: [/night (shift )?diff|night differential|\bnd\b|graveyard|night shift|pang.?gabi|panggabi|10\s*p\.?m/i],
    sources: ['laborCode'],
    facts: 'Labor Code Art. 86: night-shift differential is at least 10% of the regular hourly rate for each hour worked between 10:00 p.m. and 6:00 a.m. It is added on top of overtime or holiday rates when those also apply. Some groups (e.g. managerial employees) are not covered.',
    answer: {
      English: 'Night-shift differential is at least an extra 10% of your hourly rate for every hour you work between 10:00 p.m. and 6:00 a.m.\n\nNight differential = Hourly rate × 10% × hours worked from 10 p.m. to 6 a.m.\nExample: hourly rate ₱75 × 0.10 × 6 hours = ₱45\n\nIt is added on top of overtime or holiday pay if those also apply. Managers and some other groups are not covered.',
      Filipino: 'Ang night-shift differential ay dagdag na hindi bababa sa 10% ng hourly rate mo sa bawat oras na nagtrabaho ka mula 10:00 p.m. hanggang 6:00 a.m.\n\nNight differential = Hourly rate × 10% × oras na nagtrabaho mula 10 p.m. hanggang 6 a.m.\nHalimbawa: hourly rate ₱75 × 0.10 × 6 oras = ₱45\n\nIdinadagdag ito sa overtime o holiday pay kung sakop din ang mga iyon. Hindi sakop ang mga manager at ilang grupo.',
      Taglish: 'Ang night-shift differential ay extra na at least 10% ng hourly rate mo bawat oras na nag-work ka from 10:00 p.m. to 6:00 a.m.\n\nNight differential = Hourly rate × 10% × hours worked from 10 p.m. to 6 a.m.\nExample: hourly rate ₱75 × 0.10 × 6 hours = ₱45\n\nIdinadagdag ito on top ng overtime o holiday pay kung applicable din. Hindi covered ang managers at ibang groups.',
    },
  },
  {
    id: 'thirteenth-month',
    patterns: [/13th|thirteenth|13.?month|ika.?13|year.?end (pay|bonus)/i],
    sources: ['handbook', 'bir'],
    facts: 'PD 851: rank-and-file private-sector employees who worked at least one month in the calendar year are entitled to 13th-month pay. Formula: total basic salary earned in the calendar year / 12. Must be paid not later than December 24. Resigned or separated employees get a pro-rated amount. It is tax-exempt up to PHP 90,000 together with other benefits (TRAIN Law). Allowances, overtime, and holiday premiums are generally not included in basic salary for this purpose.',
    answer: {
      English: 'If you are a rank-and-file employee in the private sector and worked at least one month this year, you are entitled to 13th-month pay.\n\n13th-month pay = Total basic salary earned this year ÷ 12\nExample: worked all year at ₱15,000 a month → ₱180,000 ÷ 12 = ₱15,000\n\n• It must be paid on or before December 24.\n• If you resigned or left, you still get a pro-rated amount.\n• Overtime, holiday premiums, and most allowances are usually not counted.\n• It is tax-free up to ₱90,000, together with other bonuses.',
      Filipino: 'Kung rank-and-file employee ka sa pribadong sektor at nagtrabaho nang hindi bababa sa isang buwan ngayong taon, may karapatan ka sa 13th-month pay.\n\n13th-month pay = Kabuuang basic salary na kinita ngayong taon ÷ 12\nHalimbawa: buong taon sa ₱15,000 kada buwan → ₱180,000 ÷ 12 = ₱15,000\n\n• Dapat itong ibigay sa o bago ang Disyembre 24.\n• Kung nag-resign o umalis ka, may pro-rated na halaga ka pa rin.\n• Karaniwang hindi kasama ang overtime, holiday premium, at karamihan ng allowance.\n• Walang buwis ito hanggang ₱90,000, kasama ang iba pang bonus.',
      Taglish: 'Kung rank-and-file employee ka sa private sector at nag-work ng at least one month this year, entitled ka sa 13th-month pay.\n\n13th-month pay = Total basic salary earned this year ÷ 12\nExample: buong taon sa ₱15,000 a month → ₱180,000 ÷ 12 = ₱15,000\n\n• Dapat itong ibigay on or before December 24.\n• Kung nag-resign o umalis ka, may pro-rated amount ka pa rin.\n• Usually hindi counted ang overtime, holiday premiums, at karamihan ng allowances.\n• Tax-free ito up to ₱90,000, kasama ang ibang bonuses.',
    },
  },
  {
    id: 'service-incentive-leave',
    patterns: [/service incentive|\bsil\b|vacation leave|sick leave|\bvl\b|\bsl\b|leave credits?|paid leave|unused leave|convert.{0,15}leave|leave.{0,15}(cash|convert)/i],
    sources: ['laborCode', 'handbook'],
    facts: 'Labor Code Art. 95: covered employees who have rendered at least one year of service are entitled to 5 days of service incentive leave (SIL) with pay per year. Unused SIL is converted to cash at the end of the year or on separation. Employees already enjoying at least 5 days of paid vacation leave, and some establishments (e.g. those with fewer than 10 workers), are exempt. Vacation and sick leave beyond this depend on company policy or contract.',
    answer: {
      English: 'The Labor Code gives covered employees 5 days of paid Service Incentive Leave (SIL) every year after at least one year of service. You can use it for vacation or sickness. Unused SIL is converted to cash at the end of the year or when you leave.\n\nIf your company already gives at least 5 days of paid vacation leave, that counts instead. Small establishments with fewer than 10 workers are exempt. Any vacation or sick leave beyond this depends on your contract or company policy.',
      Filipino: 'Sa ilalim ng Labor Code, ang mga sakop na empleyado ay may 5 araw na bayad na Service Incentive Leave (SIL) kada taon matapos ang hindi bababa sa isang taon ng serbisyo. Puwede itong gamitin sa bakasyon o pagkakasakit. Ang hindi nagamit na SIL ay ginagawang pera sa katapusan ng taon o kapag umalis ka.\n\nKung nagbibigay na ang kumpanya ng hindi bababa sa 5 araw na bayad na vacation leave, iyon na ang bilang. Exempted ang maliliit na establisyimento na may mas mababa sa 10 manggagawa. Nakadepende sa kontrata o patakaran ng kumpanya ang dagdag na vacation o sick leave.',
      Taglish: 'Sa Labor Code, may 5 days paid Service Incentive Leave (SIL) every year ang covered employees after at least one year of service. Puwede itong gamitin for vacation o sickness. Ang unused SIL ay kino-convert to cash sa end of the year o kapag umalis ka.\n\nKung nagbibigay na ang company ng at least 5 days paid vacation leave, iyon na ang counted. Exempted ang small establishments na may less than 10 workers. Depende sa contract o company policy ang extra vacation o sick leave.',
    },
  },
  {
    id: 'family-leaves',
    patterns: [/maternity|paternity|solo parent|buntis|nanganak|panganganak|manganganak|new (mom|dad|baby)|parental leave/i],
    sources: ['handbook'],
    facts: 'RA 11210: 105 days paid maternity leave for live birth regardless of delivery type, plus 15 days if the mother is a solo parent; 60 days for miscarriage or emergency termination of pregnancy; the mother may allocate up to 7 days to the father. RA 8187: 7 days paid paternity leave for married male employees for the first four deliveries of the legitimate spouse. RA 11861: 7 working days solo parent leave per year after at least 6 months of service. Eligibility and documents apply; SSS pays maternity benefits for qualified members.',
    answer: {
      English: 'Main family-related leaves in the Philippines:\n• Maternity leave (RA 11210): 105 days paid for live birth, plus 15 more days if you are a solo parent. 60 days for miscarriage or emergency termination of pregnancy. Up to 7 days can be shared with the father.\n• Paternity leave (RA 8187): 7 days paid for married male employees, for the first four deliveries of their legal wife.\n• Solo parent leave (RA 11861): 7 working days a year after at least 6 months of service.\n\nEach has eligibility and document requirements. For maternity, SSS pays the benefit to qualified members, so notify both your employer and SSS early.',
      Filipino: 'Pangunahing leave na may kinalaman sa pamilya sa Pilipinas:\n• Maternity leave (RA 11210): 105 araw na bayad para sa live birth, dagdag na 15 araw kung solo parent ka. 60 araw para sa miscarriage o emergency termination ng pagbubuntis. Hanggang 7 araw ay puwedeng ibahagi sa ama.\n• Paternity leave (RA 8187): 7 araw na bayad para sa kasal na lalaking empleyado, para sa unang apat na panganganak ng legal na asawa.\n• Solo parent leave (RA 11861): 7 araw ng trabaho kada taon matapos ang hindi bababa sa 6 na buwang serbisyo.\n\nMay eligibility at requirements ang bawat isa. Sa maternity, ang SSS ang nagbabayad ng benepisyo sa mga kwalipikadong miyembro, kaya ipaalam nang maaga sa employer at sa SSS.',
      Taglish: 'Main family-related leaves sa Pilipinas:\n• Maternity leave (RA 11210): 105 days paid para sa live birth, plus 15 days kung solo parent ka. 60 days para sa miscarriage o emergency termination of pregnancy. Up to 7 days puwedeng i-share sa father.\n• Paternity leave (RA 8187): 7 days paid para sa married male employees, para sa first four deliveries ng legal wife.\n• Solo parent leave (RA 11861): 7 working days a year after at least 6 months of service.\n\nMay eligibility at document requirements ang bawat isa. Sa maternity, SSS ang nagbabayad ng benefit sa qualified members, kaya i-inform agad ang employer at SSS.',
    },
  },
  {
    id: 'final-pay',
    patterns: [/final pay|last pay|back pay|backpay|huling sahod|certificate of employment|\bcoe\b|clearance/i, /(resign|nag.?resign|umalis|quit|terminated|tinanggal).{0,40}(pay|sahod|sweldo|makukuha|matatanggap)/i],
    sources: ['dole'],
    facts: 'DOLE Labor Advisory No. 06, Series of 2020: final pay must be released within 30 days from the date of separation, unless a more favorable company policy or agreement applies. Final pay can include unpaid salary, pro-rated 13th-month pay, cash conversion of unused service incentive leave, separation pay if applicable, and tax refund, less authorized deductions. A Certificate of Employment must be issued within 3 days from the employee\'s request. Separation pay is different and depends on the reason for separation; resignation does not automatically entitle a worker to separation pay.',
    answer: {
      English: 'Final pay ("back pay") is what your employer owes you when you leave. Under DOLE Labor Advisory No. 06-2020, it should be released within 30 days from your separation date, unless your company policy gives a shorter time.\n\nIt usually includes:\n• Unpaid salary for days worked\n• Pro-rated 13th-month pay\n• Cash for unused service incentive leave\n• Tax refund, if any\n• Separation pay, only if applicable\n\nAuthorized deductions may be subtracted. You can also request a Certificate of Employment (COE), which must be given within 3 days of your request. Resigning does not automatically mean you get separation pay.',
      Filipino: 'Ang final pay ("back pay") ay ang dapat ibayad sa iyo ng employer kapag umalis ka. Ayon sa DOLE Labor Advisory No. 06-2020, dapat itong ibigay sa loob ng 30 araw mula sa petsa ng separation, maliban kung mas maikli ang itinakda ng patakaran ng kumpanya.\n\nKaraniwang kasama rito ang:\n• Hindi pa nababayarang sahod sa mga araw na pumasok ka\n• Pro-rated na 13th-month pay\n• Katumbas na pera ng hindi nagamit na service incentive leave\n• Tax refund, kung mayroon\n• Separation pay, kung naaangkop lamang\n\nPuwedeng ibawas ang mga awtorisadong kaltas. Puwede ka ring humingi ng Certificate of Employment (COE), na dapat ibigay sa loob ng 3 araw mula sa paghingi mo. Hindi awtomatikong may separation pay kapag nag-resign.',
      Taglish: 'Ang final pay ("back pay") ay ang dapat ibayad sa iyo ng employer kapag umalis ka. Under DOLE Labor Advisory No. 06-2020, dapat itong i-release within 30 days from separation date mo, unless mas maikli ang nasa company policy.\n\nUsually kasama rito ang:\n• Unpaid salary sa days na pumasok ka\n• Pro-rated 13th-month pay\n• Cash conversion ng unused service incentive leave\n• Tax refund, kung meron\n• Separation pay, kung applicable lang\n\nPuwedeng ibawas ang authorized deductions. Puwede ka ring mag-request ng Certificate of Employment (COE), na dapat ibigay within 3 days ng request mo. Hindi automatic na may separation pay kapag nag-resign.',
    },
  },
  {
    id: 'late-undertime',
    patterns: [/\blate\b|tardy|tardiness|undertime|nahuli|na-?late\b|\babsent|absence|lumiban|no work.{0,5}no pay/i],
    sources: ['laborCode'],
    facts: 'Under the "no work, no pay" principle, an employer may deduct pay for time not worked, such as tardiness, undertime, or unpaid absences, computed from the hourly or daily rate. Labor Code Art. 88: undertime on one day cannot be offset by overtime on another day. Company rules on tardiness should be known to employees; deductions should match actual time not worked. Fines or penalties beyond the actual time not worked need a legal basis.',
    answer: {
      English: 'Under the "no work, no pay" rule, your employer can deduct pay for time you did not work, such as lateness, undertime, or unpaid absences. The deduction should match the actual time missed.\n\nLate deduction = (Hourly rate ÷ 60) × minutes late\nExample: hourly rate ₱75, 30 minutes late → ₱1.25 × 30 = ₱37.50\n\nTwo things to know:\n• Overtime on another day cannot be used to cancel out undertime (Labor Code Art. 88).\n• Extra fines beyond the actual time missed need a legal basis. If a late deduction looks too big, ask HR how it was computed.',
      Filipino: 'Sa ilalim ng patakarang "no work, no pay," puwedeng kaltasan ng employer ang sahod para sa oras na hindi ka nagtrabaho, gaya ng pagka-late, undertime, o absent na walang bayad. Dapat tugma ang kaltas sa aktuwal na oras na nawala.\n\nKaltas sa late = (Hourly rate ÷ 60) × minutong late\nHalimbawa: hourly rate ₱75, 30 minutong late → ₱1.25 × 30 = ₱37.50\n\nDalawang dapat malaman:\n• Hindi puwedeng gamitin ang overtime sa ibang araw para tapalan ang undertime (Labor Code Art. 88).\n• Kailangan ng legal na batayan ang dagdag na multa na lampas sa aktuwal na oras na nawala. Kung mukhang sobra ang kaltas sa late, itanong sa HR kung paano ito kinuwenta.',
      Taglish: 'Under the "no work, no pay" rule, puwedeng i-deduct ng employer ang pay para sa oras na hindi ka nag-work, gaya ng late, undertime, o unpaid absences. Dapat match ang deduction sa actual time na na-miss.\n\nLate deduction = (Hourly rate ÷ 60) × minutes late\nExample: hourly rate ₱75, 30 minutes late → ₱1.25 × 30 = ₱37.50\n\nDalawang dapat malaman:\n• Hindi puwedeng gamitin ang overtime sa ibang araw para i-offset ang undertime (Labor Code Art. 88).\n• Kailangan ng legal basis ang extra fines na lampas sa actual time na na-miss. Kung mukhang sobra ang late deduction, itanong sa HR kung paano kinuwenta.',
    },
  },
  {
    id: 'probationary',
    patterns: [/probation|probi\b|regularization|regular employee|ma-?regular|contractual|\bendo\b/i],
    sources: ['laborCode'],
    facts: 'Labor Code Art. 296 (formerly 281): probationary employment generally cannot exceed 6 months from the start of work, unless covered by an apprenticeship agreement or a longer period is justified. The employer must make the standards for regularization known at the time of engagement; if not, the employee is deemed regular. An employee allowed to work after the probationary period becomes regular. Probationary employees are entitled to minimum wage and statutory benefits.',
    answer: {
      English: 'Probationary employment generally cannot last more than 6 months from your first day of work. The standards you must meet to become regular should be explained to you when you are hired. If they were not, you are considered a regular employee.\n\nIf you are allowed to keep working after the probation period ends, you become regular. While on probation, you still have the right to at least minimum wage and statutory benefits like SSS, PhilHealth, Pag-IBIG, and 13th-month pay.',
      Filipino: 'Karaniwang hindi puwedeng lumampas sa 6 na buwan mula sa unang araw ng trabaho ang probationary employment. Dapat ipaliwanag sa iyo sa simula pa lang ang mga pamantayan para ma-regular. Kung hindi ito ginawa, itinuturing kang regular na empleyado.\n\nKung pinayagan kang magpatuloy sa trabaho matapos ang probationary period, nagiging regular ka na. Habang naka-probation, may karapatan ka pa rin sa hindi bababa sa minimum wage at mga benepisyong itinakda ng batas gaya ng SSS, PhilHealth, Pag-IBIG, at 13th-month pay.',
      Taglish: 'Generally hindi puwedeng lumampas sa 6 months from your first day of work ang probationary employment. Dapat i-explain sa iyo sa simula pa lang ang standards para ma-regular. Kung hindi ginawa, considered ka nang regular employee.\n\nKung pinayagan kang mag-continue sa work after ng probation period, regular ka na. Habang naka-probation, may right ka pa rin sa at least minimum wage at statutory benefits gaya ng SSS, PhilHealth, Pag-IBIG, at 13th-month pay.',
    },
  },
  {
    id: 'minimum-wage',
    patterns: [/minimum wage|minimum salary|wage order|regional wage|pinakamababang sahod|minimum na sahod|sapat ba.{0,20}sahod|underpaid|kulang.{0,15}(sahod|sweldo)/i],
    sources: ['nwpc'],
    facts: 'Minimum wages are set per region by the Regional Tripartite Wages and Productivity Boards through wage orders, and they change over time. The rate depends on region, sector or industry, and sometimes establishment size. Check the current rate on the NWPC website. Minimum wage earners are exempt from income tax on their statutory minimum wage.',
    answer: {
      English: 'There is no single nationwide minimum wage in the Philippines. Each region sets its own through wage orders from its Regional Wage Board, and the rates change over time. Your rate depends on your region, your industry, and sometimes the size of the business.\n\nTo check:\n1. Go to the NWPC website (nwpc.dole.gov.ph) and open your region\'s latest wage order.\n2. Compare it with your daily rate. If you are monthly-paid, convert first using Monthly rate × 12 ÷ paid days.\n\nMinimum wage earners also pay no income tax on their minimum wage.',
      Filipino: 'Walang iisang minimum wage sa buong Pilipinas. Bawat rehiyon ay may sariling minimum wage na itinatakda ng Regional Wage Board sa pamamagitan ng wage order, at nagbabago ito paminsan-minsan. Nakadepende ang rate mo sa rehiyon, industriya, at kung minsan sa laki ng negosyo.\n\nPara masuri:\n1. Pumunta sa website ng NWPC (nwpc.dole.gov.ph) at buksan ang pinakabagong wage order ng rehiyon mo.\n2. Ihambing ito sa daily rate mo. Kung monthly-paid ka, i-convert muna gamit ang Monthly rate × 12 ÷ bayad na araw.\n\nWala ring income tax ang minimum wage earner sa kanilang minimum wage.',
      Taglish: 'Walang iisang nationwide minimum wage sa Pilipinas. Bawat region ay may sariling minimum wage na sine-set ng Regional Wage Board through wage orders, at nagbabago ito over time. Depende ang rate mo sa region, industry, at minsan sa size ng business.\n\nPara i-check:\n1. Pumunta sa NWPC website (nwpc.dole.gov.ph) at buksan ang latest wage order ng region mo.\n2. I-compare ito sa daily rate mo. Kung monthly-paid ka, i-convert muna using Monthly rate × 12 ÷ paid days.\n\nWala ring income tax ang minimum wage earners sa minimum wage nila.',
    },
  },
  {
    id: 'unpaid-wages-help',
    patterns: [/hindi (binayaran|nabayaran|pinasahod|nagpasahod)|unpaid|not paid|di (binayaran|nabayaran)|walang sahod|ayaw (magbayad|ibigay)/i, /reklamo|complain|file a case|\bkaso\b|\bdole\b|\bsena\b|hotline|1349|where (can|do) i (go|report)|saan.{0,15}(magreklamo|lumapit|pumunta)/i],
    sources: ['arms'],
    facts: 'Steps for unpaid or incorrect wages: ask HR/payroll in writing for an itemized explanation; keep payslips, time records, contract, and messages. If unresolved, file a Request for Assistance under DOLE\'s Single Entry Approach (SEnA), a free conciliation-mediation process, at any DOLE office or online through DOLE ARMS (arms.dole.gov.ph). The DOLE hotline is 1349. Filing is a request for assistance, not a finding that the employer violated the law.',
    answer: {
      English: 'If your pay is unpaid or seems wrong, here is what you can do:\n\n1. Ask HR or payroll in writing (email or message) for an itemized explanation.\n2. Keep your records: payslips, time records or DTR, your contract, and messages.\n3. If it is not resolved, file a Request for Assistance under DOLE\'s Single Entry Approach (SEnA). It is free and aims to settle the issue through mediation within 30 days.\n   • Online: DOLE ARMS (arms.dole.gov.ph)\n   • In person: any DOLE field office\n   • DOLE hotline: 1349\n\nFiling is a request for help, not an accusation. The outcome depends on the facts and your records.',
      Filipino: 'Kung hindi naibayad o mukhang mali ang sahod mo, ito ang puwede mong gawin:\n\n1. Humingi nang nakasulat (email o mensahe) sa HR o payroll ng itemized na paliwanag.\n2. Itago ang mga rekord: payslip, time records o DTR, kontrata, at mga mensahe.\n3. Kung hindi maayos, maghain ng Request for Assistance sa Single Entry Approach (SEnA) ng DOLE. Libre ito at layunin nitong maayos ang problema sa pamamagitan ng mediation sa loob ng 30 araw.\n   • Online: DOLE ARMS (arms.dole.gov.ph)\n   • Personal: kahit anong DOLE field office\n   • DOLE hotline: 1349\n\nAng paghahain ay paghingi ng tulong, hindi paratang. Nakadepende ang resulta sa mga detalye at rekord mo.',
      Taglish: 'Kung unpaid o mukhang mali ang sahod mo, ito ang puwede mong gawin:\n\n1. Humingi in writing (email o message) sa HR o payroll ng itemized explanation.\n2. Itago ang records: payslips, time records o DTR, contract, at messages.\n3. Kung hindi ma-resolve, mag-file ng Request for Assistance under DOLE\'s Single Entry Approach (SEnA). Libre ito at layunin nitong ma-settle ang issue through mediation within 30 days.\n   • Online: DOLE ARMS (arms.dole.gov.ph)\n   • In person: kahit anong DOLE field office\n   • DOLE hotline: 1349\n\nAng pag-file ay request for help, hindi accusation. Depende ang outcome sa facts at records mo.',
    },
  },
  {
    id: 'read-payslip',
    patterns: [/(read|understand|basahin|intindihin|maintindihan).{0,30}(payslip|pay slip)|(payslip|pay slip).{0,30}(parts|sections|mean|ibig sabihin|explain)|what is a payslip|ano ang payslip/i],
    sources: ['handbook'],
    facts: 'A payslip usually has: (1) employee and pay period details, (2) earnings: basic pay, overtime, holiday pay, night differential, allowances, adding up to gross pay, (3) deductions: SSS, PhilHealth, Pag-IBIG, withholding tax, loans, others, adding up to total deductions, (4) net pay = gross pay - total deductions. Check that the pay period, days worked, and rates are correct.',
    answer: {
      English: 'Most payslips have four parts:\n\n1. Details: your pay period (e.g. Nov 1–15) and sometimes days or hours worked.\n2. Earnings: basic pay, overtime, holiday pay, night differential, and allowances. These add up to your gross pay.\n3. Deductions: SSS, PhilHealth, Pag-IBIG, withholding tax, loans, and others. These add up to total deductions.\n4. Net pay: Gross pay − Total deductions. This is your take-home pay.\n\nWhat to check: the pay period and days worked are right, overtime and holidays you worked are listed, and every deduction is something you recognize. You can enter your payslip on SahodSuri\'s Payroll Breakdown page to check the math.',
      Filipino: 'Karamihan ng payslip ay may apat na bahagi:\n\n1. Detalye: ang pay period mo (hal. Nob 1–15) at kung minsan ang bilang ng araw o oras na pumasok ka.\n2. Kita (Earnings): basic pay, overtime, holiday pay, night differential, at allowance. Ang kabuuan nito ay ang gross pay mo.\n3. Kaltas (Deductions): SSS, PhilHealth, Pag-IBIG, withholding tax, loan, at iba pa. Ang kabuuan nito ay ang total deductions.\n4. Net pay: Gross pay − Kabuuang kaltas. Ito ang take-home pay mo.\n\nDapat suriin: tama ang pay period at bilang ng araw, nakalista ang overtime at holiday na pinasukan mo, at kilala mo ang bawat kaltas. Puwede mong ilagay ang payslip mo sa Payroll Breakdown page ng SahodSuri para masuri ang computation.',
      Taglish: 'Karamihan ng payslips ay may apat na parts:\n\n1. Details: pay period mo (hal. Nov 1–15) at minsan ang days o hours worked.\n2. Earnings: basic pay, overtime, holiday pay, night differential, at allowances. Ang total nito ay gross pay mo.\n3. Deductions: SSS, PhilHealth, Pag-IBIG, withholding tax, loans, at iba pa. Ang total nito ay total deductions.\n4. Net pay: Gross pay − Total deductions. Ito ang take-home pay mo.\n\nDapat i-check: tama ang pay period at days worked, naka-list ang overtime at holidays na pinasukan mo, at kilala mo ang bawat deduction. Puwede mong i-enter ang payslip mo sa Payroll Breakdown page ng SahodSuri para ma-check ang math.',
    },
  },
];

// Find the FAQ that best matches a question, or null. Score = number of an FAQ's patterns that match. Ties keep library order, which lists more specific FAQs (e.g. gross vs net) before broader ones.
export function findFaq(question) {
  const text = String(question || '');
  let best = null;
  for (const faq of FAQS) {
    if (faq.requiredPattern !== undefined && !faq.patterns[faq.requiredPattern].test(text)) continue;
    const score = faq.patterns.reduce((count, pattern) => count + (pattern.test(text) ? 1 : 0), 0);
    if (score >= 1 && (!best || score > best.score)) best = { faq, score };
  }
  return best?.faq || null;
}

export function faqReferenceLinks(faq) {
  return faq.sources.map((key) => SOURCES[key]);
}

export function formatFaqForPrompt(faq) {
  return `Reviewed key facts (accurate; use these figures and formulas directly):\n${faq.facts}`;
}

