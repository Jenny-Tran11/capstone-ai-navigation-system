import React from 'react';
import { Link } from 'react-router-dom';

const platformLinks: { label: string; to: string }[] = [
  { label: 'Features', to: '/features' },
  { label: 'Integrations', to: '/integrations' },
  { label: 'Pricing', to: '/pricing' },
  { label: 'Changelog', to: '/changelog' },
];

const companyLinks: { label: string; to: string }[] = [
  { label: 'About Us', to: '/about' },
  { label: 'Careers', to: '/careers' },
  { label: 'Blog', to: '/blog' },
  { label: 'Contact', to: '/contact' },
];

const connectLinks: { label: string; href: string }[] = [
  { label: 'hello@baselinecore.com', href: 'mailto:hello@baselinecore.com' },
  { label: 'Twitter', href: 'https://twitter.com/baselinecore' },
  { label: 'LinkedIn', href: 'https://linkedin.com/company/baselinecore' },
];

const linkHover = {
  onMouseEnter: (e: React.MouseEvent<HTMLElement>) => ((e.currentTarget as HTMLElement).style.color = 'var(--warm-primary)'),
  onMouseLeave: (e: React.MouseEvent<HTMLElement>) => ((e.currentTarget as HTMLElement).style.color = 'var(--warm-muted)'),
};

const Footer = (): JSX.Element => (
  <footer
    className="border-t py-16 px-6"
    style={{ backgroundColor: 'var(--warm-surface)', borderColor: 'var(--warm-border)' }}
  >
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
      {/* Brand column */}
      <div className="space-y-4 md:col-span-1">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--warm-primary)' }}
          >
            <span className="text-white font-bold text-xs">B</span>
          </div>
          <span className="text-lg font-medium tracking-tight" style={{ color: 'var(--warm-fg)' }}>
            Baseline Core
          </span>
        </div>
        <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'var(--warm-muted)' }}>
          Crafting human-centred software foundations for modern creative teams.
        </p>
      </div>

      {/* Platform */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm" style={{ color: 'var(--warm-fg)' }}>Platform</h4>
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
        <h4 className="font-semibold text-sm" style={{ color: 'var(--warm-fg)' }}>Company</h4>
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

      {/* Connect */}
      <div className="space-y-4">
        <h4 className="font-semibold text-sm" style={{ color: 'var(--warm-fg)' }}>Connect</h4>
        <div className="flex flex-col gap-3">
          {connectLinks.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="no-underline text-sm transition-colors"
              style={{ color: 'var(--warm-muted)' }}
              {...linkHover}
            >
              {label}
            </a>
          ))}
        </div>
      </div>
    </div>

    {/* Bottom bar */}
    <div
      className="max-w-7xl mx-auto mt-16 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
      style={{ borderColor: 'var(--warm-border)', color: 'var(--warm-muted)' }}
    >
      <p>© {new Date().getFullYear()} Baseline Core. All rights reserved.</p>
      <div className="flex items-center gap-6">
        <Link to="/privacy" className="no-underline hover:opacity-70 transition-opacity" style={{ color: 'var(--warm-muted)' }}>Privacy Policy</Link>
        <Link to="/terms" className="no-underline hover:opacity-70 transition-opacity" style={{ color: 'var(--warm-muted)' }}>Terms of Service</Link>
      </div>
    </div>
  </footer>
);

export default Footer;
