import { Link } from 'react-router-dom';

const AboutBanner = (): JSX.Element => (
  <main
    className="relative flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden"
    style={{ backgroundColor: 'var(--warm-bg)' }}
  >
    {/* Soft background glow */}
    <div
      className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none -z-10 opacity-20"
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
        Our Story
      </div>

      {/* Headline */}
      <h1
        className="text-3xl sm:text-5xl md:text-7xl leading-tight"
        style={{
          color: 'var(--warm-fg)',
          fontWeight: 300,
          letterSpacing: '-0.02em',
        }}
      >
        Crafting software with{' '}
        <strong style={{ fontWeight: 600 }}>purpose</strong>.
      </h1>

      {/* Sub-copy */}
      <p
        className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light"
        style={{ color: 'var(--warm-muted)' }}
      >
        We started Baseline Bolt because we believed great software should feel
        effortless. Every decision we make — from architecture to interface — is
        driven by care for the people using it.
      </p>

      {/* CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to="/contact"
          className="no-underline inline-flex items-center gap-2 text-white text-base font-semibold rounded-full px-8 py-4 w-full sm:w-auto transition-all duration-200 shadow-lg"
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
          Work with us
        </Link>
        <Link
          to="/"
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
          Back to home
        </Link>
      </div>
    </div>

    {/* Values section */}
    <div className="mt-24 w-full max-w-5xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-3 gap-8">
      {[
        {
          title: 'Craft first',
          body: "We sweat the details that most people overlook — because that's where the magic lives.",
        },
        {
          title: 'Human-centred',
          body: 'Every feature is designed around how people actually work, not how we think they should.',
        },
        {
          title: 'Open by default',
          body: 'We build in public, share our learnings, and believe the best ideas come from the community.',
        },
      ].map((value) => (
        <div
          key={value.title}
          className="p-6 sm:p-8 rounded-2xl border"
          style={{
            backgroundColor: 'var(--warm-surface)',
            borderColor: 'var(--warm-border)',
          }}
        >
          <h3
            className="text-lg font-semibold mb-3"
            style={{ color: 'var(--warm-fg)' }}
          >
            {value.title}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--warm-muted)' }}
          >
            {value.body}
          </p>
        </div>
      ))}
    </div>
  </main>
);

export default AboutBanner;
