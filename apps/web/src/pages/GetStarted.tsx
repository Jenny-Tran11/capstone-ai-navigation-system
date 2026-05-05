import PageWrapper from '../components/page-wrapper/PageWrapper';

const steps = [
  {
    number: '1',
    title: 'Download the App',
    description:
      'Install AI-Detect on your iOS or Android device. The app is built with React Native and Expo, targeting both platforms from a single codebase.',
    detail: (
      <div className="flex gap-3 mt-4 flex-wrap">
        {['Available on iOS', 'Available on Android'].map((label) => (
          <span
            key={label}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium"
            style={{
              borderColor: 'var(--warm-border)',
              color: 'var(--warm-muted)',
              backgroundColor: 'var(--warm-bg)',
            }}
          >
            {label}
          </span>
        ))}
      </div>
    ),
  },
  {
    number: '2',
    title: 'Create Your Profile',
    description:
      'Sign up using your email. AWS Cognito secures your authentication. Once registered, configure your feedback preferences — voice speed, haptic intensity, and detection sensitivity.',
    detail: null,
  },
  {
    number: '3',
    title: 'Start Navigating',
    description:
      "Point your phone's camera toward your path and tap Start. AI-Detect continuously analyses your surroundings and guides you with audio cues and vibration feedback.",
    detail: null,
  },
];

const GetStarted = (): JSX.Element => (
  <PageWrapper title="Get Started">
    <div className="max-w-3xl mx-auto px-6 py-24 space-y-16">
      {/* Header */}
      <div className="space-y-4">
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
          Get the App
        </div>
        <h1
          className="text-4xl sm:text-5xl font-light tracking-tight"
          style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
        >
          Start navigating with AI-Detect.
        </h1>
        <p
          className="text-lg font-light"
          style={{ color: 'var(--warm-muted)' }}
        >
          AI-Detect is a mobile application for iOS and Android, built with
          React Native and Expo.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step) => (
          <div
            key={step.number}
            className="rounded-2xl border p-8 flex gap-6"
            style={{
              backgroundColor: 'var(--warm-surface)',
              borderColor: 'var(--warm-border)',
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0"
              style={{ backgroundColor: 'var(--warm-primary)' }}
            >
              {step.number}
            </div>
            <div>
              <h2
                className="text-lg font-semibold mb-2"
                style={{ color: 'var(--warm-fg)' }}
              >
                {step.title}
              </h2>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--warm-muted)' }}
              >
                {step.description}
              </p>
              {step.detail}
            </div>
          </div>
        ))}
      </div>

      {/* Evaluators info box */}
      <div
        className="rounded-2xl border p-8 space-y-3"
        style={{
          backgroundColor: 'rgba(204,89,51,0.04)',
          borderColor: 'rgba(204,89,51,0.2)',
        }}
      >
        <h3
          className="text-base font-semibold"
          style={{ color: 'var(--warm-fg)' }}
        >
          For Evaluators
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: 'var(--warm-muted)' }}
        >
          This project is a University of Wollongong capstone submission. The
          source code and architecture documentation are available on request.
          Please use the{' '}
          <a
            href="/contact"
            className="no-underline font-medium"
            style={{ color: 'var(--warm-primary)' }}
          >
            contact page
          </a>{' '}
          to request a demo or access credentials for the test environment.
        </p>
      </div>
    </div>
  </PageWrapper>
);

export default GetStarted;
