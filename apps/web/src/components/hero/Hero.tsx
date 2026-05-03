import { Link } from 'react-router-dom';

const Hero = (): JSX.Element => (
  <main
    className="relative flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden"
    style={{ backgroundColor: 'var(--warm-bg)' }}
  >
    {/* Soft background glow */}
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none -z-10 opacity-30"
      style={{ backgroundColor: '#e8976a' }}
    />

    <div className="max-w-4xl mx-auto text-center space-y-8">
      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-2"
        style={{
          borderColor: 'rgba(204,89,51,0.25)',
          color: 'var(--warm-primary)',
          backgroundColor: 'rgba(204,89,51,0.06)',
        }}
      >
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: 'var(--warm-primary)' }}
        />
        Introducing Baseline Core 2.0
      </div>

      {/* Headline */}
      <h1
        className="text-3xl sm:text-5xl md:text-7xl leading-tight tracking-tight"
        style={{
          color: 'var(--warm-fg)',
          fontWeight: 300,
          letterSpacing: '-0.02em',
        }}
      >
        Software that feels <strong style={{ fontWeight: 600 }}>human</strong>.
        <br />
        Built for modern teams.
      </h1>

      {/* Sub-copy */}
      <p
        className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light"
        style={{ color: 'var(--warm-muted)' }}
      >
        We believe technology should adapt to your rhythm, not the other way
        around. Baseline Core is the flexible foundation for teams that value
        craft as much as velocity.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to="/get-started"
          className="no-underline inline-flex items-center gap-2 text-white text-base font-semibold rounded-full px-8 py-4 w-full sm:w-auto transition-all duration-200 shadow-lg group"
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
          Start your journey
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
        <Link
          to="/about"
          className="no-underline inline-flex items-center text-base font-medium rounded-full px-8 py-4 w-full sm:w-auto transition-all duration-200 border"
          style={{
            color: 'var(--warm-fg)',
            borderColor: 'var(--warm-border)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'var(--warm-primary)';
            el.style.color = 'var(--warm-primary)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'var(--warm-border)';
            el.style.color = 'var(--warm-fg)';
          }}
        >
          Read our story
        </Link>
      </div>
    </div>

    {/* Hero image */}
    <div className="mt-20 w-full max-w-6xl mx-auto px-4 sm:px-6">
      <div
        className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[16/9]"
        style={{ boxShadow: '0 25px 60px rgba(45,37,32,0.12)' }}
      >
        <img
          src="/warm-hero.png"
          alt="Team collaborating in a modern warm studio"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 rounded-[2rem] border border-black/5 pointer-events-none" />
      </div>
    </div>
  </main>
);

export default Hero;
