import { useState } from 'react';
import { MessageSquarePlus, Star, Send, X, AlertCircle, CheckCircle2, Sparkles, Bug, Lightbulb } from 'lucide-react';
import { apiClient } from '../api/client';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [reportType, setReportType] = useState<'feedback' | 'bug_report' | 'feature_request'>('feedback');
  const [category, setCategory] = useState('general');
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMsg('Please enter a description for your feedback.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await apiClient.post('/feedback', {
        report_type: reportType,
        category: category,
        rating: rating,
        message: message,
        email: email || undefined,
        page_url: window.location.href,
      });

      setSuccessMsg('Thank you! Your feedback has been sent directly to the development team.');
      setTimeout(() => {
        setMessage('');
        setSuccessMsg('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || 'Failed to send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div className="animate-fade-in" style={{
        width: '100%', maxWidth: '520px',
        backgroundColor: 'rgba(23, 31, 48, 0.95)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(139, 92, 246, 0.15)',
        position: 'relative'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem',
            background: 'none', border: 'none', color: 'var(--text-muted)',
            cursor: 'pointer', padding: '0.25rem'
          }}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '0 0 0.5rem 0' }}>
            <Sparkles color="var(--accent-purple)" size={22} />
            Feedback & Support
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
            Help us improve <b>TwinPath AI</b>! Report an issue or share your experience.
          </p>
        </div>

        {successMsg ? (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)', border: '1px solid var(--success)',
            borderRadius: '10px', padding: '1.5rem', textAlign: 'center', color: 'var(--success)'
          }}>
            <CheckCircle2 size={36} style={{ marginBottom: '0.5rem' }} />
            <div style={{ fontWeight: 600 }}>{successMsg}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Type Selector Tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setReportType('feedback')}
                style={{
                  padding: '0.6rem', borderRadius: '8px', border: '1px solid',
                  borderColor: reportType === 'feedback' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)',
                  backgroundColor: reportType === 'feedback' ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-elevated)',
                  color: reportType === 'feedback' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer'
                }}
              >
                <MessageSquarePlus size={14} /> Rating
              </button>
              <button
                type="button"
                onClick={() => setReportType('bug_report')}
                style={{
                  padding: '0.6rem', borderRadius: '8px', border: '1px solid',
                  borderColor: reportType === 'bug_report' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)',
                  backgroundColor: reportType === 'bug_report' ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-elevated)',
                  color: reportType === 'bug_report' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer'
                }}
              >
                <Bug size={14} /> Bug Report
              </button>
              <button
                type="button"
                onClick={() => setReportType('feature_request')}
                style={{
                  padding: '0.6rem', borderRadius: '8px', border: '1px solid',
                  borderColor: reportType === 'feature_request' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.1)',
                  backgroundColor: reportType === 'feature_request' ? 'rgba(139, 92, 246, 0.2)' : 'var(--bg-elevated)',
                  color: reportType === 'feature_request' ? '#fff' : 'var(--text-secondary)',
                  fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem', cursor: 'pointer'
                }}
              >
                <Lightbulb size={14} /> Request
              </button>
            </div>

            {/* 5-Star Rating (shown for general feedback) */}
            {reportType === 'feedback' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Rate your experience:
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem'
                      }}
                    >
                      <Star
                        size={24}
                        fill={star <= rating ? '#F59E0B' : 'transparent'}
                        color={star <= rating ? '#F59E0B' : 'var(--text-muted)'}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Category:
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                style={{
                  width: '100%', padding: '0.65rem', borderRadius: '8px',
                  backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)', outline: 'none'
                }}
              >
                <option value="general">General Feedback</option>
                <option value="recommendations">AI Recommendations</option>
                <option value="simulator">What-If Simulator</option>
                <option value="ui">User Interface & Design</option>
                <option value="login">Login / Auth</option>
                <option value="other">Other / Request</option>
              </select>
            </div>

            {/* Message Area */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                {reportType === 'bug_report' ? 'Describe the bug or error:' : reportType === 'feature_request' ? 'Describe the skill/career path you want added:' : 'Your Feedback:'}
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  reportType === 'bug_report'
                    ? 'Tell us what happened or what error message you received...'
                    : reportType === 'feature_request'
                    ? 'Suggest a new skill or career path...'
                    : 'What do you like or what can we improve?'
                }
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)', outline: 'none', resize: 'vertical'
                }}
              />
            </div>

            {/* Contact Email (Optional for guests) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                Your Email (Optional):
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                style={{
                  width: '100%', padding: '0.65rem', borderRadius: '8px',
                  backgroundColor: 'var(--bg-elevated)', border: '1px solid rgba(255,255,255,0.1)',
                  color: 'var(--text-primary)', outline: 'none'
                }}
              />
            </div>

            {errorMsg && (
              <div style={{ color: 'var(--error)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <AlertCircle size={15} /> {errorMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: '0.75rem', fontSize: '0.95rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.5rem' }}
            >
              {isSubmitting ? 'Sending...' : <><Send size={16} /> Submit Feedback</>}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
