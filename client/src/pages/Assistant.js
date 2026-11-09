import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api';

const TYPE_META = {
  video: { icon: '▶', label: 'Video', color: 'var(--accent-green)' },
  website: { icon: '🔗', label: 'Link', color: 'var(--accent-blue)' },
  note: { icon: '📝', label: 'Note', color: 'var(--accent-yellow)' },
};

// Tiny markdown-ish renderer: "- " bullets + **bold**, everything else as text.
const renderReply = (text) => {
  const lines = String(text || '').split('\n');
  const blocks = [];
  let bullets = [];
  const flushBullets = () => {
    if (bullets.length) {
      blocks.push(
        <ul key={`ul-${blocks.length}`} className="space-y-1 my-2 pl-1">
          {bullets.map((b, i) => (
            <li key={i} className="flex gap-2">
              <span style={{ color: 'var(--accent-coral)' }}>•</span>
              <span>{inlineFormat(b)}</span>
            </li>
          ))}
        </ul>
      );
      bullets = [];
    }
  };
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      bullets.push(trimmed.replace(/^[-•]\s*/, ''));
    } else {
      flushBullets();
      if (trimmed) blocks.push(<p key={`p-${blocks.length}`} className="my-1.5">{inlineFormat(trimmed)}</p>);
    }
  });
  flushBullets();
  return <div className="leading-relaxed">{blocks}</div>;
};

const inlineFormat = (text) => {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={i} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
};

const QUIZ_PROMPTS = [
  { label: '🤖 Explain this article', message: 'Explain this article in simple terms with the key takeaways.' },
  { label: '🎓 Quiz me', message: 'Quiz me on what I have saved' },
  { label: '🔍 Find saved items', message: 'Find everything I saved about ', needsTyping: true },
  { label: '🗓 What should I review today?', message: 'What should I review today?' },
  { label: '📊 Summarize my week', message: 'Summarize my week based on what I saved and learned.' },
];

const Assistant = () => {
  const [searchParams] = useSearchParams();
  const [aiEnabled, setAiEnabled] = useState(null); // null = checking
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [quiz, setQuiz] = useState(null); // { questions, answers: {}, score: null }
  const [attached, setAttached] = useState(null);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  // Attach context passed via URL (?contextType=&contextId=&title=&prompt=)
  useEffect(() => {
    const type = searchParams.get('contextType');
    const id = searchParams.get('contextId');
    const title = searchParams.get('title');
    if (type && id) setAttached({ type, id, title: title || 'Saved item' });
    const prompt = searchParams.get('prompt');
    if (prompt) setInput(prompt);
  }, [searchParams]);

  useEffect(() => {
    api.get('/ai/status').then((res) => setAiEnabled(!!res.data?.data?.enabled)).catch(() => setAiEnabled(false));
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const isQuizIntent = (text) => /(quiz|quizz|test me|pop quiz)/i.test(text);

  const sendMessage = async (rawMessage, opts = {}) => {
    const message = String(rawMessage || '').trim();
    if (!message || sending) return;
    const mode = opts.mode || (isQuizIntent(message) ? 'quiz' : 'chat');

    const userMsg = { role: 'user', content: message };
    const history = [...messages, userMsg].slice(-12);
    setMessages(history);
    setInput('');
    setSending(true);

    try {
      const response = await api.post('/ai/chat', {
        message,
        history: history.slice(0, -1),
        context: attached ? { type: attached.type, id: attached.id } : undefined,
        mode,
      });
      const data = response.data?.data || {};
      const reply = data.reply || 'Hmm, I got nothing back — try rephrasing.';
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      if (data.quiz && data.quiz.length) {
        setQuiz({ questions: data.quiz, answers: {}, score: null });
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Something went wrong. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${msg}` }]);
    } finally {
      setSending(false);
    }
  };

  const handleQuickPrompt = (p) => {
    if (p.needsTyping) {
      setInput(p.message);
      inputRef.current?.focus();
      return;
    }
    sendMessage(p.message);
  };

  const answerQuiz = (qIndex, optionIndex) => {
    setQuiz((prev) => ({ ...prev, answers: { ...prev.answers, [qIndex]: optionIndex } }));
  };

  const finishQuiz = () => {
    const correct = quiz.questions.filter((q, i) => quiz.answers[i] === q.answer).length;
    setQuiz((prev) => ({ ...prev, score: correct }));
  };

  const retakeQuiz = () => {
    setQuiz(null);
    sendMessage('Quiz me again with different questions', { mode: 'quiz' });
  };

  const canScore = quiz && quiz.questions.length > 0 && quiz.questions.every((_, i) => quiz.answers[i] !== undefined);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <Navbar />
      <main className="neo-container py-16">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-10 neo-animate-in">
          <div>
            <h1 className="neo-title text-5xl mb-2">AI Assistant</h1>
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              Ask anything about your library — it reads your saved items
            </p>
          </div>
          <div className="flex gap-3">
            <Link to="/knowledge" className="neo-btn neo-btn-secondary">🕸 Knowledge graph</Link>
            <Link to="/capture" className="neo-btn neo-btn-primary">＋ Capture</Link>
          </div>
        </div>

        {aiEnabled === false && (
          <div className="neo-card mb-10 neo-animate-in" style={{ borderColor: 'var(--accent-yellow)' }}>
            <div className="text-center py-10">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="neo-title text-3xl mb-3">AI is sleeping</h2>
              <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
                Set <strong>AI_API_KEY</strong> in your server environment to wake it up — free tier works great (Groq).
              </p>
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="neo-btn neo-btn-primary"
              >
                Get a free API key →
              </a>
            </div>
          </div>
        )}

        {(aiEnabled || aiEnabled === null) && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            {/* Chat column */}
            <div className="neo-card flex flex-col" style={{ minHeight: '560px' }}>
              {/* Attached item */}
              {attached && (
                <div className="mb-4 flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '2.5px solid var(--accent-blue)', boxShadow: 'var(--shadow-sm)' }}>
                  <span className="text-xl" style={{ color: TYPE_META[attached.type]?.color }}>
                    {TYPE_META[attached.type]?.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>CONTEXT ATTACHED</p>
                    <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{attached.title}</p>
                  </div>
                  <button
                    onClick={() => setAttached(null)}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-sm font-bold"
                    style={{ color: 'var(--text-muted)' }}
                    title="Remove context"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Messages */}
              <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4" style={{ maxHeight: '440px' }}>
                {messages.length === 0 && (
                  <div className="text-center py-16">
                    <div className="text-6xl mb-4">💬</div>
                    <h3 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {attached ? `Ask me anything about "${attached.title}"` : 'Your memory, on tap'}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Try a quick prompt below — I can explain saved items, quiz you, or find anything you've saved.
                    </p>
                  </div>
                )}
                {messages.map((msg, index) => (
                  <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] px-4 py-3 rounded-lg text-sm`}
                      style={
                        msg.role === 'user'
                          ? { background: 'var(--accent-yellow)', color: 'var(--text-primary)', border: '2.5px solid var(--border-primary)', boxShadow: 'var(--shadow-sm)' }
                          : { background: 'var(--bg-secondary)', border: '2.5px solid var(--border-light)', color: 'var(--text-secondary)' }
                      }
                    >
                      {msg.role === 'assistant' ? renderReply(msg.content) : <span className="font-bold">{msg.content}</span>}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start">
                    <div className="px-4 py-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '2.5px solid var(--border-light)' }}>
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full neo-spinner" style={{ borderTopColor: 'var(--accent-coral)' }}></span>
                        <span className="w-2 h-2 rounded-full neo-spinner" style={{ borderTopColor: 'var(--accent-pink)', animationDelay: '0.15s' }}></span>
                        <span className="w-2 h-2 rounded-full neo-spinner" style={{ borderTopColor: 'var(--accent-yellow)', animationDelay: '0.3s' }}></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form
                onSubmit={(e) => { e.preventDefault(); sendMessage(input); }}
                className="flex items-end gap-3 pt-4"
                style={{ borderTop: '3px solid var(--border-primary)' }}
              >
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
                  }}
                  className="neo-textarea flex-1"
                  rows="2"
                  placeholder="Ask about your saved items… (Enter to send, Shift+Enter for newline)"
                  style={{ resize: 'none' }}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || sending}
                  className="neo-btn neo-btn-primary flex-shrink-0"
                  style={{ minWidth: '96px' }}
                >
                  {sending ? '…' : 'Send →'}
                </button>
              </form>
            </div>

            {/* Side column */}
            <div className="space-y-6">
              <div className="neo-card-sm">
                <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--text-primary)' }}>✨ Quick prompts</h3>
                <div className="space-y-2">
                  {QUIZ_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      onClick={() => handleQuickPrompt(p)}
                      className="w-full text-left px-4 py-3 rounded-lg text-sm font-bold transition-all hover:translate-x-0.5"
                      style={{ color: 'var(--text-primary)', border: '2.5px solid var(--border-light)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="neo-card-sm">
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>How it works</h3>
                <ul className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  <li className="flex gap-2"><span style={{ color: 'var(--accent-coral)' }}>•</span> It reads an index of your saved videos, links, and notes.</li>
                  <li className="flex gap-2"><span style={{ color: 'var(--accent-coral)' }}>•</span> Attach an item ("Explain this article") for deep-dive answers.</li>
                  <li className="flex gap-2"><span style={{ color: 'var(--accent-coral)' }}>•</span> Ask for a quiz and it tests you on what you've saved.</li>
                  <li className="flex gap-2"><span style={{ color: 'var(--accent-coral)' }}>•</span> It never invents items — only answers from your library.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Quiz overlay */}
        {quiz && (
          <div className="fixed inset-0 flex items-center justify-center z-50 p-6 neo-animate-in" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
            <div className="neo-card max-w-xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="neo-title text-3xl">🎓 Quiz</h2>
                {quiz.score !== null ? (
                  <span className="neo-badge neo-badge-white text-sm">Score</span>
                ) : (
                  <button onClick={() => setQuiz(null)} className="text-xl font-bold px-2" style={{ color: 'var(--text-muted)' }}>✕</button>
                )}
              </div>

              {quiz.score === null ? (
                <>
                  <div className="space-y-6">
                    {quiz.questions.map((q, qIndex) => (
                      <div key={qIndex}>
                        <p className="font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                          {qIndex + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((option, oIndex) => {
                            const selected = quiz.answers[qIndex] === oIndex;
                            const revealed = quiz.answers[qIndex] !== undefined;
                            const isCorrect = oIndex === q.answer;
                            let style = { borderColor: 'var(--border-light)', color: 'var(--text-secondary)', background: 'var(--bg-card)' };
                            if (revealed && isCorrect) style = { borderColor: 'var(--accent-green)', color: 'var(--text-primary)', background: '#e9fbf0' };
                            else if (revealed && selected && !isCorrect) style = { borderColor: '#c92a2a', color: 'var(--text-primary)', background: '#ffe9e9' };
                            else if (selected) style = { borderColor: 'var(--accent-blue)', color: 'var(--text-primary)', background: 'var(--bg-secondary)' };
                            return (
                              <button
                                key={oIndex}
                                onClick={() => answerQuiz(qIndex, oIndex)}
                                disabled={revealed}
                                className="text-left text-sm font-bold px-3 py-2.5 rounded-lg border-2 transition-all"
                                style={style}
                              >
                                {revealed && isCorrect ? '✅ ' : revealed && selected ? '❌ ' : ''}{option}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 pt-6">
                    <button onClick={finishQuiz} disabled={!canScore} className="neo-btn neo-btn-primary flex-1">
                      Check answers
                    </button>
                    <button onClick={() => setQuiz(null)} className="neo-btn neo-btn-secondary flex-1">Close</button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-7xl mb-4">
                    {quiz.score === quiz.questions.length ? '🏆' : quiz.score >= quiz.questions.length / 2 ? '🎉' : '💪'}
                  </div>
                  <h3 className="neo-title text-4xl mb-3">
                    {quiz.score} / {quiz.questions.length}
                  </h3>
                  <p className="text-lg mb-8" style={{ color: 'var(--text-secondary)' }}>
                    {quiz.score === quiz.questions.length
                      ? 'Perfect score — you really know your library!'
                      : quiz.score >= quiz.questions.length / 2
                        ? 'Solid! A quick re-read of a few items and you are there.'
                        : 'Good start — ask me to explain the items you missed.'}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={retakeQuiz} className="neo-btn neo-btn-primary flex-1">🔁 Another quiz</button>
                    <button onClick={() => setQuiz(null)} className="neo-btn neo-btn-secondary flex-1">Done</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Assistant;
