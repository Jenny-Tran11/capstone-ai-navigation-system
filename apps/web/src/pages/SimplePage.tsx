import PageWrapper from '../components/page-wrapper/PageWrapper';

interface SimplePageProps {
  title: string;
  heading: string;
  description: string;
  badge?: string;
}

const SimplePage = ({
  title,
  heading,
  description,
  badge,
}: SimplePageProps): JSX.Element => (
  <PageWrapper title={title}>
    <div className="max-w-4xl mx-auto px-6 py-24 space-y-8">
      {badge && (
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium"
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
          {badge}
        </div>
      )}
      <h1
        className="text-5xl md:text-6xl font-light tracking-tight"
        style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
      >
        {heading}
      </h1>
      <p
        className="text-lg md:text-xl font-light max-w-2xl leading-relaxed"
        style={{ color: 'var(--warm-muted)' }}
      >
        {description}
      </p>
    </div>
  </PageWrapper>
);

export default SimplePage;
