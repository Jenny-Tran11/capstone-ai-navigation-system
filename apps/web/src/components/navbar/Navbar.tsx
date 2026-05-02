import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = (): JSX.Element => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <nav
      className="sticky top-0 z-50 border-b"
      style={{ backgroundColor: 'rgba(248,246,241,0.85)', borderColor: 'var(--warm-border)', backdropFilter: 'blur(12px)' }}
    >
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: 'var(--warm-primary)' }}
          >
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-xl font-medium tracking-tight" style={{ color: 'var(--warm-fg)' }}>
            Baseline Core
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium" style={{ color: 'var(--warm-fg)' }}>
          <Link to="/about" className="no-underline transition-colors hover:opacity-70" style={{ color: 'var(--warm-fg)' }}>
            About
          </Link>
        </div>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-4">
          <Link
            to="/#"
            className="text-sm font-medium no-underline transition-opacity hover:opacity-70"
            style={{ color: 'var(--warm-fg)' }}
          >
            Sign in
          </Link>
          <Link
            to="/#"
            className="no-underline text-sm font-semibold text-white rounded-full px-6 py-2.5 transition-all duration-200"
            style={{ backgroundColor: 'var(--warm-primary)' }}
            onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = 'var(--warm-primary-hover)')}
            onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = 'var(--warm-primary)')}
          >
            Get Started
          </Link>
        </div>

        {/* Hamburger */}
        <button
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
        style={{ maxHeight: isMobileOpen ? '200px' : '0' }}
      >
        <div
          className="flex flex-col items-center gap-4 py-6 border-t"
          style={{ borderColor: 'var(--warm-border)' }}
        >
          <Link
            to="/about"
            className="no-underline text-sm font-medium"
            style={{ color: 'var(--warm-fg)' }}
            onClick={() => setIsMobileOpen(false)}
          >
            About
          </Link>
          <Link
            to="/#"
            className="no-underline text-sm font-semibold text-white rounded-full px-6 py-2.5"
            style={{ backgroundColor: 'var(--warm-primary)' }}
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
