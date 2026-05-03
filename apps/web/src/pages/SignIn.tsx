import type React from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageWrapper from '../components/page-wrapper/PageWrapper';

const SignIn = (): JSX.Element => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <PageWrapper title="Sign In">
      <div className="flex items-center justify-center min-h-[80vh] px-6 py-16">
        <div
          className="w-full max-w-md rounded-3xl border p-10 space-y-8"
          style={{
            backgroundColor: 'var(--warm-surface)',
            borderColor: 'var(--warm-border)',
          }}
        >
          <div className="text-center space-y-2">
            <h1
              className="text-3xl font-light tracking-tight"
              style={{ color: 'var(--warm-fg)' }}
            >
              Welcome back
            </h1>
            <p className="text-sm" style={{ color: 'var(--warm-muted)' }}>
              Sign in to your Baseline Bolt account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label
                htmlFor="signin-email"
                className="text-sm font-medium"
                style={{ color: 'var(--warm-fg)' }}
              >
                Email
              </label>
              <input
                id="signin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--warm-bg)',
                  borderColor: 'var(--warm-border)',
                  color: 'var(--warm-fg)',
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--warm-primary)')
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--warm-border)')
                }
              />
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="signin-password"
                className="text-sm font-medium"
                style={{ color: 'var(--warm-fg)' }}
              >
                Password
              </label>
              <input
                id="signin-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl px-4 py-3 text-sm border outline-none transition-colors"
                style={{
                  backgroundColor: 'var(--warm-bg)',
                  borderColor: 'var(--warm-border)',
                  color: 'var(--warm-fg)',
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--warm-primary)')
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = 'var(--warm-border)')
                }
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-full py-3 text-sm font-semibold text-white transition-all duration-200"
              style={{ backgroundColor: 'var(--warm-primary)' }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  'var(--warm-primary-hover)')
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.backgroundColor =
                  'var(--warm-primary)')
              }
            >
              Sign in
            </button>
          </form>

          <p
            className="text-center text-sm"
            style={{ color: 'var(--warm-muted)' }}
          >
            Don't have an account?{' '}
            <Link
              to="/get-started"
              className="font-medium no-underline"
              style={{ color: 'var(--warm-primary)' }}
            >
              Get started free
            </Link>
          </p>
        </div>
      </div>
    </PageWrapper>
  );
};

export default SignIn;
