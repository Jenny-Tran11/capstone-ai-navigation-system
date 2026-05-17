const techBadges = [
  // AI/ML — warm-primary
  { label: 'YOLOv12n', dotColor: '#cc5933', category: 'AI / ML' },
  { label: 'Roboflow', dotColor: '#cc5933', category: 'AI / ML' },
  { label: 'Google Gemini 2.0', dotColor: '#cc5933', category: 'AI / ML' },
  { label: 'Google Routes API', dotColor: '#cc5933', category: 'AI / ML' },
  // Mobile — blue
  { label: 'React Native', dotColor: '#3b82f6', category: 'Mobile' },
  { label: 'Expo', dotColor: '#3b82f6', category: 'Mobile' },
  { label: 'TypeScript', dotColor: '#3b82f6', category: 'Mobile' },
  // Cloud — amber
  { label: 'AWS Lambda', dotColor: '#f59e0b', category: 'Cloud' },
  { label: 'DynamoDB', dotColor: '#f59e0b', category: 'Cloud' },
  { label: 'AWS Cognito', dotColor: '#f59e0b', category: 'Cloud' },
  { label: 'S3 / CloudFront', dotColor: '#f59e0b', category: 'Cloud' },
];

const TechStackSection = (): JSX.Element => (
  <section className="py-20 px-6" style={{ backgroundColor: 'var(--warm-bg)' }}>
    <div className="max-w-4xl mx-auto">
      {/* Badge + headline */}
      <div className="text-center mb-12">
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-6"
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
          Technology Stack
        </div>
        <h2
          className="text-2xl sm:text-3xl font-light"
          style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
        >
          Built on production-grade infrastructure.
        </h2>
      </div>

      {/* Badge cloud */}
      <div className="flex flex-wrap justify-center gap-3">
        {techBadges.map((tech) => (
          <span
            key={tech.label}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium"
            style={{
              borderColor: 'var(--warm-border)',
              color: 'var(--warm-fg)',
              backgroundColor: 'var(--warm-surface)',
            }}
          >
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: tech.dotColor }}
            />
            {tech.label}
          </span>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-8">
        {[
          { label: 'AI / ML', color: '#cc5933' },
          { label: 'Mobile', color: '#3b82f6' },
          { label: 'Cloud', color: '#f59e0b' },
        ].map(({ label, color }) => (
          <div
            key={label}
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--warm-muted)' }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TechStackSection;
