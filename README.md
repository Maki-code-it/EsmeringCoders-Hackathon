# Earnest

**Understand Your Pay. Know Your Rights.**

Earnest is a web app that helps Filipino employees understand their payslips, employment contracts, deductions, and workplace rights in plain English or Filipino.

## Problem

Many Filipino workers struggle to understand their payslips, deductions, overtime pay, and employment contracts. This is especially true for minimum-wage, contractual, and first-time employees. Many cannot tell if their pay is correct or what a deduction means, so they risk misunderstanding what they are owed.

## Solution

Workers upload a payslip or contract. Earnest reads it, breaks down the pay line by line, explains what each part means, and points out entries worth asking HR about. Every value is labeled as extracted, calculated, or AI-generated, so users know what to verify.

## Features

- **Document upload:** payslips and contracts, as PDF or image.
- **Data extraction:** reads the document's data, which the user can review and correct.
- **Payroll breakdown:** gross to net pay, allowances, and deductions, plus estimates for overtime, holiday pay, and night differential.
- **AI assistant:** answers Philippine labor-rights questions in English or Filipino.
- **Flags:** marks entries to clarify with HR.
- **Dashboard:** pay history, salary trends, and downloadable PDF and CSV reports.

## Use of Lumen

- **Lumen OCR:** reads uploaded payslips and contracts and turns them into structured data. Users can review and correct the result.
- **Lumen AI Chat:** answers labor-rights and pay questions. A reviewed FAQ backs it up for basic questions and for when the service is unavailable.
- **Security:** Lumen is called only from the backend, so the API credentials never reach the browser. Only the minimum personal data is sent.
