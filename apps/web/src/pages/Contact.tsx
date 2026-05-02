import React, { useState } from 'react';
import PageWrapper from '../components/page-wrapper/PageWrapper';

const Contact = (): JSX.Element => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const inputStyle = {
    backgroundColor: 'var(--warm-bg)',
    borderColor: 'var(--warm-border)',
    color: 'var(--warm-fg)',
  };

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--warm-primary)';
  };
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.currentTarget.style.borderColor = 'var(--warm-border)';
  };

  return (
    <PageWrapper title="Contact">
      <div className="max-w-2xl mx-auto px-6 py-24 space-y-12">
        <div className="space-y-4">
          <h1 className="text-5xl font-light tracking-tight" style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}>
            Get in touch
          </h1>
          <p className="text-lg font-light" style={{ color: 'var(--warm-muted)' }}>
            Have a question or want to work together? We'd love to hear from you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--warm-fg)' }}>Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Your name"
              required
              className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors"
              style={inputStyle}
              onFocus={focusHandler}
              onBlur={blurHandler}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--warm-fg)' }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="you@company.com"
              required
              className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors"
              style={inputStyle}
              onFocus={focusHandler}
              onBlur={blurHandler}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium" style={{ color: 'var(--warm-fg)' }}>Message</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Tell us how we can help..."
              required
              rows={6}
              className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors resize-none"
              style={inputStyle}
              onFocus={focusHandler}
              onBlur={blurHandler}
            />
          </div>

          <button
            type="submit"
            className="rounded-full px-8 py-3 text-sm font-semibold text-white transition-all duration-200"
            style={{ backgroundColor: 'var(--warm-primary)' }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--warm-primary-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.backgroundColor = 'var(--warm-primary)')}
          >
            Send message
          </button>
        </form>

        <div className="pt-4 border-t" style={{ borderColor: 'var(--warm-border)' }}>
          <p className="text-sm" style={{ color: 'var(--warm-muted)' }}>
            Or reach us directly at{' '}
            <a href="mailto:hello@baselinecore.com" className="no-underline font-medium" style={{ color: 'var(--warm-primary)' }}>
              hello@baselinecore.com
            </a>
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Contact;
