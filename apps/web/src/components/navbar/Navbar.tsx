import { useState } from 'react';
import { Link } from 'react-router-dom';

const Logo = () => (
  <div
    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
    style={{ backgroundColor: 'var(--warm-primary)' }}
  >
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M1 9C1 9 4 3 9 3s8 6 8 6-3 6-8 6S1 9 1 9z"
        stroke="white"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="9" cy="9" r="2.5" stroke="white" strokeWidth="1.5" />
      <rect x="6.5" y="6.5" width="5" height="5" stroke="white" strokeWidth="1" strokeDasharray="1.5 1" />
    </svg>
  </div>
);

const navLinks = [
  { label: 'Features', to: '/features' },
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

const Navbar = (): JSX.Element => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{
        backgroundColor: 'rgba(248,246,241,0.85)',
        borderColor: 'var(--warm-border)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <Logo />
          <span
            className="text-xl font-medium tracking-tight"
            style={{ color: 'var(--warm-fg)' }}
          >
            AI-Detect
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          {navLinks.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="no-underline transition-opacity hover:opacity-70"
              style={{ color: 'var(--warm-fg)' }}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/get-started"
            className="no-underline text-sm font-semibold text-white rounded-full px-6 py-2.5 transition-all duration-200"
            style={{ backgroundColor: 'var(--warm-primary)' }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = 'var(--warm-primary-hover)')
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.backgroundColor = 'var(--warm-primary)')
            }
          >
            Get Started
          </Link>
        </div>

        {/* Hamburger */}
        <button
          type="button"
          className="md:hidden flex flex-col justify-evenly w-6 h-6 cursor-pointer bg-transparent border-none p-0"
          onClick={() => setIsMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <div className="h-[2px] w-full" style={{ backgroundColor: 'var(--warm-fg)' }} />
          <div className="h-[2px] w-full" style={{ backgroundColor: 'var(--warm-fg)' }} />
          <div className="h-[2px] w-full" style={{ backgroundColor: 'var(--warm-fg)' }} />
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className="overflow-hidden transition-all duration-200 ease-in-out md:hidden"
        style={{ maxHeight: isMobileOpen ? '320px' : '0' }}
      >
        <div
          className="flex flex-col items-center gap-4 py-6 border-t"
          style={{ borderColor: 'var(--warm-border)' }}
        >
          {navLinks.map(({ label, to }) => (
            <Link
              key={label}
              to={to}
              className="no-underline text-sm font-medium"
              style={{ color: 'var(--warm-fg)' }}
              onClick={() => setIsMobileOpen(false)}
            >
              {label}
            </Link>
          ))}
          <Link
            to="/get-started"
            className="no-underline text-sm font-semibold text-white rounded-full px-6 py-2.5 mt-2"
            style={{ backgroundColor: 'var(--warm-primary)' }}
            onClick={() => setIsMobileOpen(false)}
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
