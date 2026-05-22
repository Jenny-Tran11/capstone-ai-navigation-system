import { Link } from 'react-router-dom';

const CtaSection = (): JSX.Element => (
  <section
    className="py-24 px-6"
    style={{
      backgroundColor: 'var(--warm-surface)',
      borderTop: '1px solid var(--warm-border)',
    }}
  >
    <div className="max-w-3xl mx-auto">
      <div
        className="relative rounded-3xl border p-12 sm:p-16 text-center overflow-hidden"
        style={{
          backgroundColor: 'var(--warm-bg)',
          borderColor: 'var(--warm-border)',
        }}
      >
        {/* Radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none -z-10 opacity-20"
          style={{ backgroundColor: '#e8976a' }}
        />

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-8"
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
          University of Wollongong · Capstone 2026
        </div>

        <h2
          className="text-3xl sm:text-4xl font-light mb-6"
          style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
        >
          Built to make navigation
          <br />
          <strong style={{ fontWeight: 600 }}>accessible for everyone.</strong>
        </h2>

        <p
          className="text-base font-light leading-relaxed max-w-lg mx-auto mb-10"
          style={{ color: 'var(--warm-muted)' }}
        >
          AI-Detect is a capstone project exploring how mobile AI can close the
          accessibility gap in outdoor navigation. Explore the features, read
          how it works, or get in touch.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/about"
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
            Learn More About the Project
          </Link>
          <Link
            to="/contact"
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
            Get in Touch
          </Link>
        </div>
      </div>
    </div>
  </section>
);

export default CtaSection;
