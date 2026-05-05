import type React from 'react';
import { useState } from 'react';
import PageWrapper from '../components/page-wrapper/PageWrapper';

interface FormState {
  name: string;
  email: string;
  message: string;
}

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

const Contact = (): JSX.Element => {
  const [form, setForm] = useState<FormState>({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      const apiUrl = process.env.REACT_APP_API_URL || '';
      const response = await fetch(`${apiUrl}contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data as { error?: string }).error || 'Something went wrong',
        );
      }

      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      setStatus('error');
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to send message, please try again.',
      );
    }
  };

  const inputStyle = {
    backgroundColor: 'var(--warm-bg)',
    borderColor: 'var(--warm-border)',
    color: 'var(--warm-fg)',
  };

  const focusHandler = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    e.currentTarget.style.borderColor = 'var(--warm-primary)';
  };
  const blurHandler = (
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    e.currentTarget.style.borderColor = 'var(--warm-border)';
  };

  return (
    <PageWrapper title="Contact">
      <div className="max-w-2xl mx-auto px-6 py-24 space-y-12">
        <div className="space-y-4">
          <h1
            className="text-5xl font-light tracking-tight"
            style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
          >
            Get in touch
          </h1>
          <p
            className="text-lg font-light"
            style={{ color: 'var(--warm-muted)' }}
          >
            Have questions about AI-Detect? Interested in the project or want to
            request a demo? We'd love to hear from you.
          </p>
        </div>

        {status === 'success' ? (
          <div
            className="rounded-2xl p-8 space-y-3 border"
            style={{
              backgroundColor: 'var(--warm-surface)',
              borderColor: 'var(--warm-border)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4"
              style={{ backgroundColor: 'var(--warm-primary)' }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M4 10L8 14L16 6"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2
              className="text-2xl font-light"
              style={{ color: 'var(--warm-fg)' }}
            >
              Message sent
            </h2>
            <p className="text-sm" style={{ color: 'var(--warm-muted)' }}>
              Thanks for reaching out. We'll get back to you at your email
              address as soon as possible.
            </p>
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="mt-4 text-sm font-medium transition-colors"
              style={{ color: 'var(--warm-primary)' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  'var(--warm-primary-hover)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.color =
                  'var(--warm-primary)')
              }
            >
              Send another message
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label
                htmlFor="contact-name"
                className="text-sm font-medium"
                style={{ color: 'var(--warm-fg)' }}
              >
                Name
              </label>
              <input
                id="contact-name"
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                required
                disabled={status === 'loading'}
                className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors disabled:opacity-50"
                style={inputStyle}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="contact-email"
                className="text-sm font-medium"
                style={{ color: 'var(--warm-fg)' }}
              >
                Email
              </label>
              <input
                id="contact-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="you@company.com"
                required
                disabled={status === 'loading'}
                className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors disabled:opacity-50"
                style={inputStyle}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="contact-message"
                className="text-sm font-medium"
                style={{ color: 'var(--warm-fg)' }}
              >
                Message
              </label>
              <textarea
                id="contact-message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Tell us how we can help..."
                required
                rows={6}
                disabled={status === 'loading'}
                className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors resize-none disabled:opacity-50"
                style={inputStyle}
                onFocus={focusHandler}
                onBlur={blurHandler}
              />
            </div>

            {status === 'error' && (
              <p className="text-sm" style={{ color: '#c0392b' }}>
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading'}
              className="rounded-full px-8 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: 'var(--warm-primary)' }}
              onMouseEnter={(e) => {
                if (status !== 'loading')
                  (e.currentTarget as HTMLElement).style.backgroundColor =
                    'var(--warm-primary-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor =
                  'var(--warm-primary)';
              }}
            >
              {status === 'loading' ? 'Sending...' : 'Send message'}
            </button>
          </form>
        )}

        <div
          className="pt-4 border-t"
          style={{ borderColor: 'var(--warm-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--warm-muted)' }}>
            Or reach us directly at{' '}
            <a
              href="mailto:contact@ai-detect.app"
              className="no-underline font-medium"
              style={{ color: 'var(--warm-primary)' }}
            >
              contact@ai-detect.app
            </a>
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Contact;
