const stats = [
  {
    value: '3',
    label: 'Detection Modes',
    sub: 'Obstacles, signals, and transit',
  },
  {
    value: '<100ms',
    label: 'Analysis Latency',
    sub: 'Real-time on-device + cloud',
  },
  {
    value: '3-in-1',
    label: 'Feedback System',
    sub: 'Voice + haptic + visual',
  },
];

const StatsSection = (): JSX.Element => (
  <section
    className="py-12 px-6 border-b"
    style={{ borderColor: 'var(--warm-border)' }}
  >
    <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x"
      style={{ ['--tw-divide-color' as string]: 'var(--warm-border)' }}
    >
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="flex flex-col items-center text-center py-8 sm:py-6 px-8"
          style={
            i < stats.length - 1
              ? { borderColor: 'var(--warm-border)' }
              : {}
          }
        >
          <span
            className="text-5xl font-light mb-2"
            style={{ color: 'var(--warm-primary)' }}
          >
            {stat.value}
          </span>
          <span className="text-base font-semibold mb-1" style={{ color: 'var(--warm-fg)' }}>
            {stat.label}
          </span>
          <span className="text-sm" style={{ color: 'var(--warm-muted)' }}>
            {stat.sub}
          </span>
        </div>
      ))}
    </div>
  </section>
);

export default StatsSection;
