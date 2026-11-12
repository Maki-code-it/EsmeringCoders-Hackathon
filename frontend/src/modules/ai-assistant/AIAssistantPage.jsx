import { useEffect, useRef, useState } from 'react';
import { Bot, Send, Sparkles, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent } from '@/components/ui/card.jsx';
import { sendAssistantMessage } from './assistantService.js';

// Common sahod questions; each one has a reviewed answer in the backend FAQ library.
const SUGGESTIONS = [
  'What is the difference between gross pay and net pay?',
  'Paano kinukuwenta ang 13th month pay?',
  'How much is holiday pay if I work on a regular holiday?',
  'How is overtime pay calculated?',
  'Bakit may withholding tax ako?',
  'Kailan dapat ibigay ang final pay ko?',
];

const INTRO = {
  role: 'assistant',
  content: 'Hi! I’m Lumen, your SahodSuri assistant. Ask me anything about your sahod: what gross and net pay mean, how overtime, holiday pay, or 13th month pay is computed, your deductions, leaves, final pay, or general Philippine labor rights. You can include reviewed payslip details, but remove personal information first.',
  cautions: ['AI-generated: please verify important details. This is general information, not legal advice.'],
};

export default function AIAssistantPage() {
  const [messages, setMessages] = useState([INTRO]);
  const [input, setInput] = useState('');
  const [language, setLanguage] = useState('English');
  const [sessionId, setSessionId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  async function submit(event) {
    event?.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    const history = [...messages, { role: 'user', content: question }];
    setMessages(history);
    setInput('');
    setError('');
    setBusy(true);
    try {
      const result = await sendAssistantMessage({
        question,
        language,
        sessionId: sessionId || undefined,
        topic: /contract|clause|employment term|probationary|termination/i.test(question) ? 'contract'
          : /payslip|pay slip|deduction|salary|allowance|net pay|gross pay|withholding/i.test(question) ? 'payslip' : 'labor',
        history: history.slice(-11, -1).map(({ role, content }) => ({ role, content })),
      });
      if (result.sessionId) setSessionId(result.sessionId);
      setMessages((current) => [...current, {
        role: 'assistant',
        content: result.answer,
        cautions: result.cautions || [],
        references: result.references || [],
      }]);
    } catch (cause) {
      setError(cause.message || 'Could not get a response. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-10rem)] min-h-[34rem] max-w-4xl flex-col gap-4">
      <div>
        <div className="mb-1 flex items-center gap-2 text-primary"><Sparkles className="h-5 w-5" /><span className="text-sm font-medium">Lumen AI Assistant</span></div>
        <h1 className="text-2xl font-semibold tracking-tight">Understand your pay and rights</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ask in English, Filipino, or Taglish. For document questions, share only information you have reviewed.</p>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b px-5 py-3">
          <div className="flex items-center gap-2 text-sm font-medium"><Bot className="h-4 w-4 text-primary" /> SahodSuri assistant</div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">Reply in
            <select className="rounded-md border bg-background px-2 py-1 text-foreground" value={language} onChange={(event) => setLanguage(event.target.value)} aria-label="Reply language">
              <option>English</option><option>Filipino</option><option>Taglish</option>
            </select>
          </label>
        </div>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {messages.map((message, index) => (
            <div key={`${index}-${message.role}`} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${message.role === 'user' ? 'bg-secondary' : 'bg-primary/10 text-primary'}`}>
                {message.role === 'user' ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.cautions?.map((caution) => <p key={caution} className="mt-3 border-t border-current/15 pt-2 text-xs opacity-80">{caution}</p>)}
                {!!message.references?.length && <div className="mt-3 border-t border-current/15 pt-2 text-xs">
                  <p className="mb-1 font-medium">Sources</p>
                  <ul className="list-inside list-disc space-y-1">
                    {message.references.map((reference, referenceIndex) => {
                      const title = typeof reference === 'string' ? reference : reference.title;
                      const url = typeof reference === 'string' ? null : reference.url;
                      return <li key={`${title}-${referenceIndex}`}>{url
                        ? <a className="underline underline-offset-2" href={url} target="_blank" rel="noreferrer">{title}</a>
                        : title}</li>;
                    })}
                  </ul>
                </div>}
              </div>
            </div>
          ))}
          {busy && <p className="pl-11 text-sm text-muted-foreground">Lumen is preparing an answer…</p>}
          <div ref={endRef} />
        </CardContent>
        {messages.length === 1 && <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-6">{SUGGESTIONS.map((suggestion) => <button key={suggestion} className="rounded-full border px-3 py-1.5 text-left text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground" onClick={() => setInput(suggestion)}>{suggestion}</button>)}</div>}
        <form onSubmit={submit} className="border-t p-3 sm:p-4">
          {error && <p role="alert" className="mb-2 text-sm text-destructive">{error}</p>}
          <div className="flex items-end gap-2">
            <label className="sr-only" htmlFor="assistant-question">Your question</label>
            <textarea id="assistant-question" className="max-h-32 min-h-11 flex-1 resize-y rounded-lg border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Ask about a payslip, contract, or labor rights…" rows={1} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); submit(); } }} maxLength={3000} />
            <Button type="submit" disabled={!input.trim() || busy} aria-label="Send question"><Send className="h-4 w-4" /><span className="hidden sm:inline">Send</span></Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Don’t share names, addresses, account numbers, or other sensitive personal details. AI responses can be incomplete.</p>
        </form>
      </Card>
    </div>
  );
}
