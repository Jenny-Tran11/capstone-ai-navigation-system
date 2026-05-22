import PageWrapper from '../components/page-wrapper/PageWrapper';

const pipelineSteps = [
  {
    number: '01',
    title: 'Frame Capture',
    description:
      'expo-camera captures frames at the configured interval (5–60 seconds for obstacle detection, 2–3 seconds for signal/transit modes). Frames are compressed client-side before transmission.',
  },
  {
    number: '02',
    title: 'Preprocessing',
    description:
      'Images are base64-encoded and resized on-device to reduce payload size. Quality is set to 0.3 to balance speed and detection accuracy.',
  },
  {
    number: '03',
    title: 'AI Inference',
    description:
      "For obstacle and signal detection, the frame is sent to Roboflow's YOLOv12n hosted inference endpoint. For transit, it goes to the /transit/user/detect Lambda, which forwards it to Google Gemini 2.0 Flash.",
  },
  {
    number: '04',
    title: 'Result Processing',
    description:
      'Bounding box coordinates are normalised and filtered by confidence threshold. The top detections are used to generate a human-readable scene description. Results are stored to DynamoDB via Lambda.',
  },
  {
    number: '05',
    title: 'User Feedback',
    description:
      'TTS narration is triggered via expo-speech, haptic patterns via expo-haptics, and the bounding box overlay is updated in the camera preview. Duplicate announcements are suppressed using word-overlap detection.',
  },
];

const backendServices = [
  {
    title: 'AWS Cognito',
    description:
      'User pool authentication with JWT token verification on every protected API route. Supports sign-up, email verification, and password reset flows.',
  },
  {
    title: 'AWS Lambda',
    description:
      'Express.js handlers deployed as serverless functions. Each domain (detection, user profile, transit, admin) runs as a separate Lambda behind API Gateway.',
  },
  {
    title: 'DynamoDB',
    description:
      'NoSQL storage for detection history, user profiles, and preferences. Six tables with Global Secondary Indexes for efficient querying by user and permission type.',
  },
  {
    title: 'S3 + CloudFront',
    description:
      'Static assets and app distribution served via CloudFront CDN. Profile images and detection images are stored in S3 with pre-signed URL access.',
  },
  {
    title: 'AWS CDK',
    description:
      'All infrastructure defined as code in TypeScript using AWS CDK 2.x. Enables reproducible deployments and environment parity between local (MiniStack) and production.',
  },
  {
    title: 'API Gateway',
    description:
      'REST API fronting all Lambda functions with Cognito JWT authorizer. Each function is mounted on a path prefix matching its domain.',
  },
];

const HowItWorks = (): JSX.Element => (
  <PageWrapper title="How It Works">
    {/* Page banner */}
    <section
      className="relative flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden text-center"
      style={{ backgroundColor: 'var(--warm-bg)' }}
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-3xl pointer-events-none -z-10 opacity-20"
        style={{ backgroundColor: '#e8976a' }}
      />
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
        Architecture
      </div>
      <h1
        className="text-3xl sm:text-5xl md:text-6xl font-light leading-tight max-w-3xl"
        style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
      >
        How AI-Detect works{' '}
        <strong style={{ fontWeight: 600 }}>under the hood.</strong>
      </h1>
      <p
        className="mt-6 text-lg font-light max-w-2xl leading-relaxed"
        style={{ color: 'var(--warm-muted)' }}
      >
        A serverless mobile architecture combining on-device camera capture,
        cloud AI inference, and an AWS backend.
      </p>
    </section>

    {/* System architecture diagram */}
    <section
      className="py-20 px-6"
      style={{
        backgroundColor: 'var(--warm-surface)',
        borderTop: '1px solid var(--warm-border)',
      }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-xl sm:text-2xl font-light mb-10"
          style={{ color: 'var(--warm-fg)', letterSpacing: '-0.01em' }}
        >
          System Architecture
        </h2>

        {/* Layer boxes */}
        <div className="space-y-4">
          {/* Mobile layer */}
          <div
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: 'var(--warm-bg)',
              borderColor: 'var(--warm-border)',
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--warm-muted)' }}
            >
              Mobile App Layer
            </p>
            <div className="flex flex-wrap gap-2">
              {['React Native', 'Expo', 'Camera', 'TTS', 'Haptics', 'GPS'].map(
                (t) => (
                  <span
                    key={t}
                    className="px-3 py-1 rounded-full text-xs border"
                    style={{
                      borderColor: 'var(--warm-border)',
                      color: 'var(--warm-fg)',
                      backgroundColor: 'var(--warm-surface)',
                    }}
                  >
                    {t}
                  </span>
                ),
              )}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 5v14M6 14l6 6 6-6"
                stroke="var(--warm-border)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* AI layer */}
          <div
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: 'var(--warm-bg)',
              borderColor: 'var(--warm-border)',
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--warm-muted)' }}
            >
              Inference & AI Layer
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'Roboflow API',
                'YOLOv12n',
                'Gemini 2.0 Flash',
                'Google Routes API',
              ].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs border"
                  style={{
                    borderColor: 'rgba(204,89,51,0.25)',
                    color: 'var(--warm-primary)',
                    backgroundColor: 'rgba(204,89,51,0.06)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M12 5v14M6 14l6 6 6-6"
                stroke="var(--warm-border)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          {/* Backend layer */}
          <div
            className="rounded-2xl border p-6"
            style={{
              backgroundColor: 'var(--warm-bg)',
              borderColor: 'var(--warm-border)',
            }}
          >
            <p
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--warm-muted)' }}
            >
              Backend Layer (AWS)
            </p>
            <div className="flex flex-wrap gap-2">
              {[
                'API Gateway',
                'Lambda',
                'DynamoDB',
                'Cognito',
                'S3',
                'CloudFront',
                'CDK',
              ].map((t) => (
                <span
                  key={t}
                  className="px-3 py-1 rounded-full text-xs border"
                  style={{
                    borderColor: 'rgba(245,158,11,0.3)',
                    color: '#b45309',
                    backgroundColor: 'rgba(245,158,11,0.06)',
                  }}
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ML Pipeline */}
    <section
      className="py-20 px-6"
      style={{
        backgroundColor: 'var(--warm-bg)',
        borderTop: '1px solid var(--warm-border)',
      }}
    >
      <div className="max-w-3xl mx-auto">
        <h2
          className="text-xl sm:text-2xl font-light mb-10"
          style={{ color: 'var(--warm-fg)', letterSpacing: '-0.01em' }}
        >
          Detection Pipeline
        </h2>

        <div className="space-y-6">
          {pipelineSteps.map((step, i) => (
            <div key={step.number} className="flex gap-6 items-start">
              {/* Step number + connector */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm"
                  style={{ backgroundColor: 'var(--warm-primary)' }}
                >
                  {i + 1}
                </div>
                {i < pipelineSteps.length - 1 && (
                  <div
                    className="w-px flex-1 mt-2 mb-0"
                    style={{
                      height: '32px',
                      backgroundColor: 'var(--warm-border)',
                    }}
                  />
                )}
              </div>
              <div className="pb-6">
                <h3
                  className="text-base font-semibold mb-1"
                  style={{ color: 'var(--warm-fg)' }}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: 'var(--warm-muted)' }}
                >
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Backend services grid */}
    <section
      className="py-20 px-6"
      style={{
        backgroundColor: 'var(--warm-surface)',
        borderTop: '1px solid var(--warm-border)',
      }}
    >
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-xl sm:text-2xl font-light mb-10"
          style={{ color: 'var(--warm-fg)', letterSpacing: '-0.01em' }}
        >
          Backend Services
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {backendServices.map((service) => (
            <div
              key={service.title}
              className="p-6 rounded-2xl border"
              style={{
                backgroundColor: 'var(--warm-bg)',
                borderColor: 'var(--warm-border)',
              }}
            >
              <h3
                className="text-base font-semibold mb-2"
                style={{ color: 'var(--warm-fg)' }}
              >
                {service.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--warm-muted)' }}
              >
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Detection history note */}
    <section
      className="py-16 px-6"
      style={{
        backgroundColor: 'var(--warm-bg)',
        borderTop: '1px solid var(--warm-border)',
      }}
    >
      <div className="max-w-3xl mx-auto">
        <div
          className="rounded-2xl border p-8"
          style={{
            backgroundColor: 'var(--warm-surface)',
            borderColor: 'var(--warm-border)',
          }}
        >
          <h3
            className="text-base font-semibold mb-3"
            style={{ color: 'var(--warm-fg)' }}
          >
            Detection History
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--warm-muted)' }}
          >
            Every detection is logged — class, confidence score, timestamp, and
            scene description — to DynamoDB via the{' '}
            <code
              className="text-xs px-1 py-0.5 rounded"
              style={{ backgroundColor: 'rgba(45,37,32,0.06)' }}
            >
              POST /detection/user
            </code>{' '}
            Lambda endpoint. Users can review their full detection history in
            the app's History tab, with per-record expansion showing the top
            detected objects and confidence levels.
          </p>
        </div>
      </div>
    </section>
  </PageWrapper>
);

export default HowItWorks;
