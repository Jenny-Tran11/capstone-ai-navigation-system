import AboutBanner from '../components/about-banner/AboutBanner';
import PageWrapper from '../components/page-wrapper/PageWrapper';

const techDetails = [
  {
    name: 'YOLOv12n + Roboflow',
    description:
      'YOLOv12n is a compact, high-performance object detection model. Hosted on Roboflow\'s inference API, it processes camera frames and returns bounding boxes with class labels and confidence scores in real time.',
  },
  {
    name: 'Google Gemini 2.0 Flash',
    description:
      'Gemini\'s multimodal vision capability reads bus numbers, route destinations, and transit signage from camera images. Its language understanding handles partial or low-contrast text better than pure computer vision approaches.',
  },
  {
    name: 'Google Routes API v2',
    description:
      'Provides detailed walking routes with step-by-step instructions, distance, and estimated duration. Directions are read aloud via TTS as the user walks, with the active step updating automatically.',
  },
  {
    name: 'React Native + Expo',
    description:
      'The mobile app is built with Expo and React Native, targeting both iOS and Android from a single codebase. Camera access, TTS, haptics, and GPS are handled through Expo\'s managed workflow.',
  },
  {
    name: 'AWS Serverless Backend',
    description:
      'Express.js handlers run as AWS Lambda functions behind API Gateway. User profiles, preferences, and detection history are stored in DynamoDB. Authentication is managed by AWS Cognito with JWT tokens.',
  },
];

const teamMembers = [
  { name: 'Team Member 1', role: 'Mobile Development' },
  { name: 'Team Member 2', role: 'AI / ML Integration' },
  { name: 'Team Member 3', role: 'Backend & Infrastructure' },
  { name: 'Team Member 4', role: 'UX & Accessibility' },
];

const About = (): JSX.Element => (
  <PageWrapper title="About">
    <>
      <AboutBanner />

      {/* Project overview cards */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--warm-surface)', borderTop: '1px solid var(--warm-border)' }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-light mb-10"
            style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
          >
            About the Project
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'What It Does',
                body: 'AI-Detect provides real-time obstacle detection, pedestrian signal recognition, transit identification, and turn-by-turn walking navigation — all communicated through voice and haptic feedback.',
              },
              {
                title: 'Why We Built It',
                body: 'Visually impaired users face daily navigation challenges that existing tools cannot fully address. This project explores how commodity smartphone hardware and modern AI APIs can fill that gap.',
              },
              {
                title: 'How It\'s Built',
                body: 'A React Native/Expo mobile app connects to a serverless AWS backend. On-device camera feeds are processed by Roboflow and Google Gemini, with results stored in DynamoDB via Lambda.',
              },
            ].map((card) => (
              <div
                key={card.title}
                className="p-8 rounded-2xl border"
                style={{ backgroundColor: 'var(--warm-bg)', borderColor: 'var(--warm-border)' }}
              >
                <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--warm-fg)' }}>
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--warm-muted)' }}>
                  {card.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology deep-dive */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--warm-bg)', borderTop: '1px solid var(--warm-border)' }}>
        <div className="max-w-3xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-light mb-10"
            style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
          >
            Technology Deep-Dive
          </h2>
          <div className="space-y-8">
            {techDetails.map((tech) => (
              <div key={tech.name}>
                <h3 className="text-base font-semibold mb-2" style={{ color: 'var(--warm-fg)' }}>
                  {tech.name}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--warm-muted)' }}>
                  {tech.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team section */}
      <section className="py-20 px-6" style={{ backgroundColor: 'var(--warm-surface)', borderTop: '1px solid var(--warm-border)' }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-2xl sm:text-3xl font-light mb-10"
            style={{ color: 'var(--warm-fg)', letterSpacing: '-0.02em' }}
          >
            The Team
          </h2>
          <p className="text-sm mb-10" style={{ color: 'var(--warm-muted)' }}>
            University of Wollongong · School of Computing and Information Technology · Capstone 2026
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div
                key={member.name}
                className="p-6 rounded-2xl border text-center"
                style={{ backgroundColor: 'var(--warm-bg)', borderColor: 'var(--warm-border)' }}
              >
                <div
                  className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center text-white font-semibold text-lg"
                  style={{ backgroundColor: 'var(--warm-primary)' }}
                >
                  {member.name.charAt(0)}
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--warm-fg)' }}>
                  {member.name}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--warm-muted)' }}>
                  {member.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Accessibility commitment */}
      <section className="py-16 px-6" style={{ backgroundColor: 'var(--warm-bg)', borderTop: '1px solid var(--warm-border)' }}>
        <div className="max-w-3xl mx-auto">
          <blockquote
            className="pl-6 py-4 border-l-4"
            style={{ borderColor: 'var(--warm-primary)' }}
          >
            <p className="text-base leading-relaxed italic" style={{ color: 'var(--warm-fg)' }}>
              "Every design decision in AI-Detect prioritises users who cannot rely on visual
              feedback. The interface defaults to audio-first, touch-first, and
              network-resilient operation."
            </p>
          </blockquote>
        </div>
      </section>
    </>
  </PageWrapper>
);

export default About;
