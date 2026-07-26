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
        aiResponse = `Based on your current skill vector, your predicted starting salary ranges between **$85,000/yr** and **$135,000/yr** with a 5-year growth trajectory of **+28%**!`;
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
          position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 999,
          width: '60px', height: '60px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-blue))',
          border: 'none', color: '#fff', cursor: 'pointer',
          boxShadow: '0 10px 25px rgba(139, 92, 246, 0.4), 0 0 15px rgba(59, 130, 246, 0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {isOpen ? <X size={26} /> : <Bot size={28} />}
      </button>

      {/* Floating Chat Box */}
      {isOpen && (
        <div className="animate-fade-in" style={{
          position: 'fixed', bottom: '6.5rem', right: '2rem', zIndex: 998,
          width: '360px', height: '480px',
          backgroundColor: 'rgba(23, 31, 48, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', gap: '0.5rem'
          }}>
            <Sparkles size={20} color="var(--accent-purple)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>AI Career Mentor</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Online • 216D Vector Assistant</div>
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
                  <div style={{ background: 'rgba(139, 92, 246, 0.2)', padding: '0.4rem', borderRadius: '50%', height: 'fit-content', color: 'var(--accent-purple)' }}>
                    <Bot size={16} />
                  </div>
                )}
                <div style={{
                  padding: '0.65rem 0.85rem', borderRadius: '12px', fontSize: '0.85rem', lineHeight: '1.4',
                  backgroundColor: m.sender === 'user' ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                  color: m.sender === 'user' ? '#fff' : 'var(--text-primary)',
                  border: m.sender === 'ai' ? '1px solid rgba(255,255,255,0.08)' : 'none'
                }}>
                  {m.text}
                </div>
              </div>
            ))}
            {isThinking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <Loader2 size={14} className="animate-spin" /> TwinPath AI is thinking...
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} style={{ padding: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask your AI Career Mentor..."
              style={{
                flex: 1, padding: '0.6rem 0.8rem', borderRadius: '8px',
                backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff', fontSize: '0.85rem', outline: 'none'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: '0.6rem 0.8rem' }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
