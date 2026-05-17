import type React from 'react';
import { Link } from 'react-router-dom';

const platformLinks: { label: string; to: string }[] = [
  { label: 'Features', to: '/features' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Get Started', to: '/get-started' },
];

const companyLinks: { label: string; to: string }[] = [
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms of Service', to: '/terms' },
];

const linkHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) =>
    ((e.currentTarget as HTMLElement).style.color = 'var(--warm-primary)'),
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) =>
    ((e.currentTarget as HTMLElement).style.color = 'var(--warm-muted)'),
};

const Footer = (): JSX.Element => (
  <footer
    className="border-t py-16 px-6"
    style={{
      backgroundColor: 'var(--warm-surface)',
      borderColor: 'var(--warm-border)',
    }}
  >
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
      {/* Brand column */}
      <div className="space-y-4 md:col-span-2">
        <div className="flex items-center gap-2.5">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: 'var(--warm-primary)' }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 18 18"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 9C1 9 4 3 9 3s8 6 8 6-3 6-8 6S1 9 1 9z"
                stroke="white"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              <circle cx="9" cy="9" r="2.5" stroke="white" strokeWidth="1.5" />
              <rect
                x="6.5"
                y="6.5"
                width="5"
                height="5"
                stroke="white"
                strokeWidth="1"
                strokeDasharray="1.5 1"
              />
            </svg>
          </div>
          <span
            className="text-lg font-medium tracking-tight"
            style={{ color: 'var(--warm-fg)' }}
          >
            AI-Detect
          </span>
        </div>
        <p
          className="text-sm leading-relaxed max-w-xs"
          style={{ color: 'var(--warm-muted)' }}
        >
          AI-powered navigation for the visually impaired. University of
          Wollongong Capstone 2026.
        </p>
        <a
          href="mailto:contact@ai-detect.app"
          className="no-underline text-sm transition-colors"
          style={{ color: 'var(--warm-muted)' }}
          {...linkHover}
        >
          contact@ai-detect.app
        </a>
      </div>

      {/* Platform */}
      <div className="space-y-4">
        <h4
          className="font-semibold text-sm"
          style={{ color: 'var(--warm-fg)' }}
        >
          Project
        </h4>
        <div className="flex flex-col gap-3">
          {platformLinks.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="no-underline text-sm transition-colors"
              style={{ color: 'var(--warm-muted)' }}
              {...linkHover}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      {/* Company */}
      <div className="space-y-4">
        <h4
          className="font-semibold text-sm"
          style={{ color: 'var(--warm-fg)' }}
        >
          Info
        </h4>
        <div className="flex flex-col gap-3">
          {companyLinks.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="no-underline text-sm transition-colors"
              style={{ color: 'var(--warm-muted)' }}
              {...linkHover}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div
      className="max-w-7xl mx-auto mt-16 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
      style={{ borderColor: 'var(--warm-border)', color: 'var(--warm-muted)' }}
    >
      <p>© 2026 AI-Detect. University of Wollongong Capstone Project.</p>
      <p>Built with React Native · Expo · AWS · YOLOv12n · Google Gemini</p>
    </div>
  </footer>
);

export default Footer;
