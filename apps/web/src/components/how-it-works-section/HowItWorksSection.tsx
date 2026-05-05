const steps = [
  {
    number: '01',
    title: 'Capture',
    description:
      'The mobile camera continuously streams frames. On-device processing and cloud API calls run in parallel for minimal latency.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <rect x="2" y="6" width="20" height="15" rx="3" />
        <circle cx="12" cy="13.5" r="3.5" />
        <path d="M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2" />
        <circle cx="17" cy="9.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    number: '02',
    title: 'Analyse',
    description:
      'YOLOv12n via Roboflow detects obstacles and signals. Google Gemini 2.0 Flash identifies transit information. Results return in under 100ms.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3.05 11a9 9 0 010 2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: '03',
    title: 'Guide',
    description:
      'Detected objects trigger text-to-speech narration and haptic feedback. Navigation directions layer in via Google Routes API without interruption.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M12 2L19 21L12 16L5 21L12 2Z" />
      </svg>
    ),
  },
];

const HowItWorksSection = (): JSX.Element => (
  <section
    className="py-24 px-6"
    style={{ backgroundColor: 'var(--warm-surface)', borderTop: '1px solid var(--warm-border)', borderBottom: '1px solid var(--warm-border)' }}
  >
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
          How It Works
        </div>
        <h2
          className="text-3xl sm:text-4xl md:text-5xl font-light"
          style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
        >
          Capture. Analyse. <strong style={{ fontWeight: 600 }}>Guide.</strong>
        </h2>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
        {/* Connector lines (desktop only) */}
        <div className="hidden md:block absolute top-12 left-[33%] right-[33%] h-px" style={{ backgroundColor: 'var(--warm-border)' }} />

        {steps.map((step) => (
          <div key={step.number} className="flex flex-col items-center text-center space-y-4 relative">
            {/* Step number (decorative) */}
            <span
              className="text-6xl font-light select-none"
              style={{ color: 'var(--warm-primary)', opacity: 0.25 }}
            >
              {step.number}
            </span>

            {/* Icon circle */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center -mt-6 relative z-10"
              style={{
                backgroundColor: 'var(--warm-bg)',
                border: '1px solid var(--warm-border)',
                color: 'var(--warm-primary)',
              }}
            >
              {step.icon}
            </div>

            <h3 className="text-xl font-semibold" style={{ color: 'var(--warm-fg)' }}>
              {step.title}
            </h3>
            <p className="text-sm font-light leading-relaxed max-w-xs" style={{ color: 'var(--warm-muted)' }}>
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorksSection;
