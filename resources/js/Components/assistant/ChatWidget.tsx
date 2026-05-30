import { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

interface Message { role: 'user' | 'assistant'; content: string }

export default function ChatWidget() {
    const [open, setOpen]       = useState(false);
    const [input, setInput]     = useState('');
    const [history, setHistory] = useState<Message[]>([]);
    const [streaming, setStreaming] = useState(false);
    const [error, setError]     = useState<string | null>(null);
    const bottomRef             = useRef<HTMLDivElement>(null);
    const abortRef              = useRef<AbortController | null>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, streaming]);

    async function sendMessage() {
        const text = input.trim();
        if (!text || streaming) return;

        setInput('');
        setError(null);
        const userMsg: Message = { role: 'user', content: text };
        const newHistory = [...history, userMsg];
        setHistory(newHistory);
        setStreaming(true);

        // Append an empty assistant placeholder
        const assistantPlaceholder: Message = { role: 'assistant', content: '' };
        setHistory([...newHistory, assistantPlaceholder]);

        abortRef.current = new AbortController();

        try {
            const res = await fetch('/api/assistant', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'text/event-stream',
                    'X-XSRF-TOKEN': getCsrf(),
                },
                body: JSON.stringify({
                    message: text,
                    history: history.slice(-10), // send last 10 turns
                }),
                signal: abortRef.current.signal,
            });

            if (!res.ok || !res.body) {
                throw new Error('Request failed');
            }

            const reader  = res.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, { stream: true });
                const lines = chunk.split('\n');

                for (const line of lines) {
                    if (!line.startsWith('data: ')) continue;
                    const payload = line.slice(6).trim();
                    if (payload === '[DONE]') break;
                    if (!payload) continue;

                    try {
                        const parsed = JSON.parse(payload);
                        if (parsed.error) {
                            setError(parsed.error);
                            break;
                        }
                        if (parsed.text) {
                            accumulated += parsed.text;
                            setHistory((prev) => {
                                const updated = [...prev];
                                updated[updated.length - 1] = { role: 'assistant', content: accumulated };
                                return updated;
                            });
                        }
                    } catch {
                        // malformed SSE line — skip
                    }
                }
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError('Could not reach the assistant. Please try again.');
            }
            // Remove placeholder if nothing was accumulated
            setHistory((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant' && last.content === '') {
                    return prev.slice(0, -1);
                }
                return prev;
            });
        } finally {
            setStreaming(false);
        }
    }

    function stop() {
        abortRef.current?.abort();
        setStreaming(false);
    }

    return (
        <>
            {/* Floating toggle button */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="fixed bottom-20 right-5 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-brand shadow-lg transition hover:bg-brand/90 lg:bottom-6"
                aria-label="Open shopping assistant"
            >
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
            </button>

            {/* Chat panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.97 }}
                        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
                        className="fixed bottom-36 right-5 z-50 flex w-[340px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 lg:bottom-22"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between bg-ink-900 px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-brand" />
                                <span className="text-sm font-semibold text-white">Alarcon Avenue Assistant</span>
                            </div>
                            <button type="button" onClick={() => setOpen(false)} className="text-ink-400 hover:text-white">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-80">
                            {history.length === 0 && (
                                <p className="text-center text-xs text-ink-400 py-6">
                                    Ask me anything about our products, shipping, or orders.
                                </p>
                            )}
                            {history.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={[
                                            'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
                                            msg.role === 'user'
                                                ? 'bg-brand text-white'
                                                : 'bg-ink-100 text-ink-800',
                                        ].join(' ')}
                                    >
                                        {msg.content || (streaming && i === history.length - 1
                                            ? <span className="italic text-ink-400">Thinking…</span>
                                            : null
                                        )}
                                    </div>
                                </div>
                            ))}
                            {error && (
                                <p className="text-center text-xs text-red-500">{error}</p>
                            )}
                            <div ref={bottomRef} />
                        </div>

                        {/* Input */}
                        <div className="border-t border-ink-100 px-3 py-2 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                                placeholder="Ask about products…"
                                disabled={streaming}
                                className="flex-1 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-50"
                            />
                            {streaming ? (
                                <button type="button" onClick={stop} className="rounded-xl bg-red-100 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-200">
                                    Stop
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={sendMessage}
                                    disabled={!input.trim()}
                                    className="rounded-xl bg-brand px-3 py-2 text-white transition hover:bg-brand/90 disabled:opacity-40"
                                >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function getCsrf(): string {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}
