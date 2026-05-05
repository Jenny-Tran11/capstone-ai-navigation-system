import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Obstacle Detection',
    description:
      'YOLOv12n via Roboflow identifies obstacles in real time — people, vehicles, furniture — with colour-coded bounding boxes, TTS narration, and haptic pulses calibrated to danger level.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect x="7" y="7" width="10" height="10" rx="1" strokeDasharray="2.5 1.5" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    title: 'Crossing Signal Detection',
    description:
      'Detects pedestrian walk/don\'t-walk signals so users know exactly when it is safe to cross, without relying on audible signals that may not be present at every intersection.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="8" y="2" width="8" height="20" rx="3" />
        <circle cx="12" cy="7" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="17" r="1.5" />
      </svg>
    ),
  },
  {
    title: 'Transit Detection',
    description:
      'Google Gemini 2.0 Flash reads bus numbers, route information, and arrival indicators from camera frames, then speaks the result aloud instantly.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="2" />
        <line x1="3" y1="11" x2="21" y2="11" />
        <circle cx="7.5" cy="22" r="1.5" />
        <circle cx="16.5" cy="22" r="1.5" />
        <line x1="7.5" y1="19" x2="7.5" y2="22" />
        <line x1="16.5" y1="19" x2="16.5" y2="22" />
        <line x1="3" y1="6" x2="3" y2="4" strokeLinecap="round" />
        <line x1="21" y1="6" x2="21" y2="4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: 'Walking Navigation',
    description:
      'Google Routes API v2 provides turn-by-turn walking directions with voice prompts, integrated with live detection so obstacle warnings layer seamlessly over navigation guidance.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 2L19 21L12 16L5 21L12 2Z" />
      </svg>
    ),
  },
];

const FeaturesSection = (): JSX.Element => (
  <section className="py-24 px-6" style={{ backgroundColor: 'var(--warm-bg)' }}>
    <div className="max-w-5xl mx-auto">
      {/* Badge + headline */}
      <div className="text-center mb-16">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-6"
          style={{
            borderColor: 'rgba(204,89,51,0.25)',
            color: 'var(--warm-primary)',
            backgroundColor: 'rgba(204,89,51,0.06)',
          }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--warm-primary)' }} />
          Core Features
        </div>
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-light"
          style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
        >
          Four layers of intelligent navigation.
        </h2>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="p-8 rounded-2xl border space-y-4"
            style={{
              backgroundColor: 'var(--warm-surface)',
              borderColor: 'var(--warm-border)',
            }}
          >
            {/* Icon */}
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: 'rgba(204,89,51,0.1)',
                color: 'var(--warm-primary)',
              }}
            >
              {feature.icon}
            </div>
            <h3 className="text-lg font-semibold" style={{ color: 'var(--warm-fg)' }}>
              {feature.title}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--warm-muted)' }}>
              {feature.description}
            </p>
            <Link
              to="/features"
              className="no-underline text-sm font-medium transition-opacity hover:opacity-70"
              style={{ color: 'var(--warm-primary)' }}
            >
              Learn more →
            </Link>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default FeaturesSection;
