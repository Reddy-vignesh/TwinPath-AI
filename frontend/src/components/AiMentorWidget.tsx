import { useState } from 'react';
import { Bot, X, Send, Sparkles, Loader2 } from 'lucide-react';
import { useTwinStore } from '../stores/twinStore';
import { useProfileStore } from '../stores/profileStore';

interface Message {
  sender: 'ai' | 'user';
  text: string;
}

export default function AiMentorWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const { recommendations } = useTwinStore();
  const { profile } = useProfileStore();

  const topMatch = recommendations[0]?.career?.title || 'Software Engineer';

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: `Hello! I am your **TwinPath AI Counselor**. I've analyzed your profile and your top career match is **${topMatch}**. How can I help guide your career path today?`
    }
  ]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) return;

    const userText = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      let aiResponse = '';
      const lower = userText.toLowerCase();

      if (lower.includes('skill') || lower.includes('learn') || lower.includes('improve')) {
        aiResponse = `To boost your Digital Twin match for **${topMatch}**, focus on adding **Docker**, **Kubernetes**, and **Cloud System Design** to your skills catalog!`;
      } else if (lower.includes('salary') || lower.includes('pay') || lower.includes('money')) {
        aiResponse = `Based on your current skill vector, your predicted starting salary ranges between **₹8.5 LPA** and **₹18.5 LPA** with a 5-year growth trajectory of **+28%**!`;
      } else if (lower.includes('project') || lower.includes('resume')) {
        aiResponse = `I recommend building a **Distributed Microservices Pipeline** or an **AI Vector Search App**. These projects will increase your match score by **+14%**!`;
      } else {
        aiResponse = `Great question! Based on your profile completeness (${Math.round((profile?.twin_completeness_score ?? 0) * 100)}%), continuing to log projects and certifications will refine your vector representation!`;
      }

      setMessages(prev => [...prev, { sender: 'ai', text: aiResponse }]);
      setIsThinking(false);
    }, 1000);
  };

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        style={{
          position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 1000,
          width: '52px', height: '52px', borderRadius: '50%',
          background: 'var(--accent-primary)',
          border: '1px solid var(--accent-primary)', color: '#fff', cursor: 'pointer',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        aria-label="Toggle AI Mentor Chat"
      >
        {isOpen ? <X size={22} /> : <Bot size={24} />}
      </button>

      {/* Floating Chat Box */}
      {isOpen && (
        <div className="card animate-fade-in" style={{
          position: 'fixed', bottom: '5.5rem', right: '1.5rem', zIndex: 999,
          width: '360px', height: '480px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem', background: '#F8FAFC',
            borderBottom: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', gap: '0.65rem'
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
              background: 'var(--brand-surface)', border: '1px solid rgba(125, 64, 71, 0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--brand-primary)'
            }}>
              <Sparkles size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>Decision Twin AI Counselor</div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-secondary)' }}>Online • 216-D Career Guidance</div>
            </div>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {messages.map((m, idx) => (
              <div key={idx} style={{
                display: 'flex', gap: '0.5rem',
                alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '85%'
              }}>
                {m.sender === 'ai' && (
                  <div style={{ background: 'var(--brand-surface)', padding: '0.35rem', borderRadius: '50%', height: 'fit-content', color: 'var(--brand-primary)', border: '1px solid rgba(125, 64, 71, 0.2)' }}>
                    <Bot size={15} />
                  </div>
                )}
                <div style={{
                  padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-md)', fontSize: '0.8125rem', lineHeight: '1.45',
                  backgroundColor: m.sender === 'user' ? 'var(--accent-primary)' : '#F8FAFC',
                  color: m.sender === 'user' ? '#FFFFFF' : 'var(--text-primary)',
                  border: m.sender === 'ai' ? '1px solid var(--border)' : 'none',
                  boxShadow: 'var(--shadow-subtle)'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                <Loader2 size={13} className="animate-spin" color="var(--accent-primary)" /> Decision Twin AI is thinking...
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', background: '#FFFFFF' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI Career Mentor..."
              style={{
                flex: 1, padding: '0.55rem 0.75rem', borderRadius: 'var(--radius-sm)',
                backgroundColor: '#FFFFFF', border: '1px solid var(--border)',
                color: 'var(--text-primary)', fontSize: '0.8125rem', outline: 'none'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.55rem 0.75rem' }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
