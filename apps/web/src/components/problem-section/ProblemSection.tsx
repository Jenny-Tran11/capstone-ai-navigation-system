const ProblemSection = (): JSX.Element => (
  <section className="py-24 px-6" style={{ backgroundColor: 'var(--warm-bg)' }}>
    <div className="max-w-4xl mx-auto">
      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-10"
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
        The Problem
      </div>

      {/* Headline */}
      <h2
        className="text-3xl sm:text-4xl md:text-5xl font-light leading-tight mb-14"
        style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
      >
        <strong style={{ fontWeight: 600, color: 'var(--warm-primary)' }}>
          253 million
        </strong>{' '}
        people live with vision impairment worldwide.
      </h2>

      {/* Two-column content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
        {/* Stat card */}
        <div
          className="rounded-2xl border p-8 flex flex-col gap-4"
          style={{
            backgroundColor: 'var(--warm-surface)',
            borderColor: 'var(--warm-border)',
          }}
        >
          <span
            className="text-6xl font-light"
            style={{ color: 'var(--warm-primary)' }}
          >
            85%
          </span>
          <p
            className="text-base leading-relaxed"
            style={{ color: 'var(--warm-fg)' }}
          >
            of navigation barriers faced by visually impaired people occur in
            outdoor environments.
          </p>
          <p className="text-xs mt-2" style={{ color: 'var(--warm-muted)' }}>
            — WHO / accessibility research
          </p>
        </div>

        {/* Body text */}
        <div className="space-y-5">
          <p
            className="text-base leading-relaxed"
            style={{ color: 'var(--warm-fg)' }}
          >
            Daily navigation — crossing streets, catching buses, avoiding
            obstacles — requires constant visual processing that assistive canes
            and basic GPS tools cannot fully provide.
          </p>
          <p
            className="text-base leading-relaxed"
            style={{ color: 'var(--warm-fg)' }}
          >
            Existing solutions rely on expensive dedicated hardware or limited
            smartphone features. AI-Detect was built to leverage the sensors
            already in users' pockets.
          </p>
          <p
            className="text-base leading-relaxed"
            style={{ color: 'var(--warm-fg)' }}
          >
            By combining real-time computer vision with voice and haptic
            feedback, AI-Detect provides a continuous, screen-free navigation
            layer for the visually impaired.
          </p>
        </div>
      </div>
    </div>
  </section>
);

export default ProblemSection;
