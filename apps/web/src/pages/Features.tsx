import PageWrapper from '../components/page-wrapper/PageWrapper';

const features = [
  {
    id: 'obstacle',
    badge: 'YOLOv12n · Roboflow',
    title: 'Real-Time Obstacle Detection',
    description:
      "The core detection mode runs continuously while the camera is active. YOLOv12n — a compact yet capable object detection model — processes frames via Roboflow's hosted inference API and returns bounding boxes, class labels, and confidence scores in real time.",
    details: [
      'Colour-coded bounding boxes overlaid on the camera preview: red for high-danger objects (people, stairs, kerbs), orange for medium-danger (vehicles, bikes), green for low-danger.',
      'Each detection triggers a text-to-speech announcement describing the scene — e.g. "Person ahead, vehicle to the right."',
      'Haptic feedback patterns are calibrated to danger level: a strong pulse for high-danger, a lighter tap for medium-danger.',
      'Rate limiting (configurable max scans per hour) prevents battery drain on extended sessions.',
    ],
    callout:
      'Model: YOLOv12n  ·  Inference: Roboflow Hosted API  ·  Feedback: expo-speech + expo-haptics',
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <rect
          x="7"
          y="7"
          width="10"
          height="10"
          rx="1"
          strokeDasharray="2.5 1.5"
        />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'crossing',
    badge: 'Custom Dataset · Roboflow',
    title: 'Pedestrian Signal Detection',
    description:
      "A dedicated detection mode for pedestrian crossings. The model is trained to classify the state of pedestrian signals — walk or don't-walk — and immediately announces the result so users know when it is safe to cross.",
    details: [
      'Handles both LED countdown-style and classic walk-man pedestrian signals.',
      'A full-width colour banner appears at the top of the screen: green for "Walk", red for "Don\'t Walk".',
      'Audio announcement on every state change, suppressing duplicate reads.',
      'Confidence threshold of 0.65 filters out uncertain detections.',
    ],
    callout:
      'Classes: walk, dont_walk  ·  Confidence threshold: 0.65  ·  Update rate: 2 fps',
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="8" y="2" width="8" height="20" rx="3" />
        <circle cx="12" cy="7" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="12" cy="17" r="1.5" />
      </svg>
    ),
  },
  {
    id: 'transit',
    badge: 'Google Gemini 2.0 Flash',
    title: 'Transit & Bus Detection',
    description:
      'Instead of traditional object detection, transit identification uses Google Gemini 2.0 Flash — a multimodal language model — to read bus numbers, route identifiers, and destination text from camera frames. This approach handles partial occlusion, varying fonts, and low-light conditions more robustly.',
    details: [
      'User taps to query: the current frame is sent to Gemini with a structured prompt asking for bus number and destination.',
      'The result is spoken immediately — e.g. "Bus 370 to Bondi Junction."',
      'The yellow TransitBanner displays the bus number and destination on screen.',
      'Processed server-side via the /transit/user/detect Lambda endpoint.',
    ],
    callout:
      'Model: gemini-2.0-flash  ·  API: Google AI Studio  ·  Mode: on-demand query',
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
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
    id: 'navigation',
    badge: 'Google Routes API v2',
    title: 'Turn-by-Turn Walking Navigation',
    description:
      'Full walking route planning integrated into the detection workflow. The user searches for a destination on the home screen and is guided through turn-by-turn instructions with voice prompts, while the detection layer continues running in the background.',
    details: [
      'Google Routes API v2 provides detailed walking routes with per-step distance and duration.',
      'Polyline decoding renders the route as a blue path on the in-app map.',
      'Each navigation step is read aloud on demand via a "Read Step" button.',
      'GPS location tracking updates the active step as the user walks.',
    ],
    callout:
      'API: Routes API v2  ·  Mode: WALK  ·  Provider: Google Maps Platform',
    icon: (
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M12 2L19 21L12 16L5 21L12 2Z" />
      </svg>
    ),
  },
];

const Features = (): JSX.Element => (
  <PageWrapper title="Features">
    <>
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
          Platform Features
        </div>
        <h1
          className="text-3xl sm:text-5xl md:text-6xl font-light leading-tight max-w-3xl"
          style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
        >
          Every feature built for{' '}
          <strong style={{ fontWeight: 600 }}>screen-free</strong> use.
        </h1>
        <p
          className="mt-6 text-lg font-light max-w-2xl leading-relaxed"
          style={{ color: 'var(--warm-muted)' }}
        >
          AI-Detect's four core detection systems work together to give visually
          impaired users a complete picture of their environment in real time.
        </p>
      </section>

      {/* Feature detail sections */}
      {features.map((feature, idx) => (
        <section
          key={feature.id}
          className="py-20 px-6"
          style={{
            backgroundColor:
              idx % 2 === 0 ? 'var(--warm-surface)' : 'var(--warm-bg)',
            borderTop: '1px solid var(--warm-border)',
          }}
        >
          <div className="max-w-5xl mx-auto">
            <div
              className={`flex flex-col md:flex-row gap-12 items-start ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
            >
              {/* Text side */}
              <div className="flex-1 space-y-6">
                <span
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: 'rgba(204,89,51,0.08)',
                    color: 'var(--warm-primary)',
                    border: '1px solid rgba(204,89,51,0.2)',
                  }}
                >
                  {feature.badge}
                </span>
                <h2
                  className="text-2xl sm:text-3xl font-light"
                  style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
                >
                  {feature.title}
                </h2>
                <p
                  className="text-base leading-relaxed"
                  style={{ color: 'var(--warm-muted)' }}
                >
                  {feature.description}
                </p>
                <ul className="space-y-3">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex gap-3 items-start">
                      <span
                        className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: 'var(--warm-primary)' }}
                      />
                      <span
                        className="text-sm leading-relaxed"
                        style={{ color: 'var(--warm-muted)' }}
                      >
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
                {/* Technical callout */}
                <div
                  className="rounded-xl px-4 py-3 text-xs font-mono leading-relaxed"
                  style={{
                    backgroundColor: 'rgba(45,37,32,0.04)',
                    color: 'var(--warm-fg)',
                    border: '1px solid var(--warm-border)',
                  }}
                >
                  {feature.callout}
                </div>
              </div>

              {/* Illustration side */}
              <div
                className="w-full md:w-80 flex-shrink-0 rounded-2xl border flex items-center justify-center"
                style={{
                  backgroundColor: 'var(--warm-bg)',
                  borderColor: 'var(--warm-border)',
                  minHeight: '260px',
                  background:
                    'linear-gradient(135deg, #f0ebe2 0%, #e8ddd0 100%)',
                }}
              >
                <div
                  className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{
                    backgroundColor: 'rgba(204,89,51,0.1)',
                    color: 'var(--warm-primary)',
                  }}
                >
                  {feature.icon}
                </div>
              </div>
            </div>
          </div>
        </section>
      ))}
    </>
  </PageWrapper>
);

export default Features;
