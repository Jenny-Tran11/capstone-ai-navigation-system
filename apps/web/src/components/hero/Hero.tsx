import { Link } from 'react-router-dom';

const Hero = (): JSX.Element => (
  <main
    className="relative flex flex-col items-center justify-center pt-24 pb-16 px-6 overflow-hidden"
    style={{ backgroundColor: 'var(--warm-bg)' }}
  >
    {/* Soft background glow */}
    <div
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-3xl pointer-events-none -z-10 opacity-30"
      style={{ backgroundColor: '#e8976a' }}
    />

    <div className="max-w-4xl mx-auto text-center space-y-8">
      {/* Badge */}
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium mb-2"
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
        University of Wollongong · Capstone 2026
      </div>

      {/* Headline */}
      <h1
        className="text-3xl sm:text-5xl md:text-7xl leading-tight tracking-tight"
        style={{
          color: 'var(--warm-fg)',
          fontWeight: 300,
          letterSpacing: '-0.02em',
        }}
      >
        Navigate the World
        <br />
        with <strong style={{ fontWeight: 600 }}>Confidence</strong>.
      </h1>

      {/* Sub-copy */}
      <p
        className="text-lg md:text-xl max-w-2xl mx-auto leading-relaxed font-light"
        style={{ color: 'var(--warm-muted)' }}
      >
        AI-Detect uses real-time computer vision, voice guidance, and haptic
        feedback to help visually impaired users navigate safely — detecting
        obstacles, crossing signals, and transit in real time.
      </p>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to="/features"
          className="no-underline inline-flex items-center gap-2 text-white text-base font-semibold rounded-full px-8 py-4 w-full sm:w-auto transition-all duration-200 shadow-lg group"
          style={{ backgroundColor: 'var(--warm-primary)' }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--warm-primary-hover)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.backgroundColor =
              'var(--warm-primary)')
          }
        >
          Explore Features
          <svg
            className="w-4 h-4 transition-transform group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Link>
        <Link
          to="/how-it-works"
          className="no-underline inline-flex items-center text-base font-medium rounded-full px-8 py-4 w-full sm:w-auto transition-all duration-200 border"
          style={{
            color: 'var(--warm-fg)',
            borderColor: 'var(--warm-border)',
            backgroundColor: 'transparent',
          }}
          onMouseEnter={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'var(--warm-primary)';
            el.style.color = 'var(--warm-primary)';
          }}
          onMouseLeave={(e) => {
            const el = e.currentTarget as HTMLElement;
            el.style.borderColor = 'var(--warm-border)';
            el.style.color = 'var(--warm-fg)';
          }}
        >
          Learn How It Works
        </Link>
      </div>
    </div>

    {/* Hero illustration — inline SVG phone mockup */}
    <div className="mt-20 w-full max-w-6xl mx-auto px-4 sm:px-6">
      <div
        className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[16/9] flex items-center justify-center"
        style={{
          background:
            'linear-gradient(135deg, #f0ebe2 0%, #e8ddd0 50%, #ddd0c0 100%)',
          boxShadow: '0 25px 60px rgba(45,37,32,0.12)',
        }}
      >
        <svg
          viewBox="0 0 800 450"
          className="w-full h-full"
          aria-label="AI-Detect app illustration showing obstacle detection bounding boxes"
        >
          {/* Grid background */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="rgba(180,160,140,0.2)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="800" height="450" fill="url(#grid)" />

          {/* Phone frame */}
          <rect
            x="290"
            y="30"
            width="220"
            height="390"
            rx="28"
            ry="28"
            fill="rgba(45,37,32,0.08)"
          />
          <rect
            x="294"
            y="34"
            width="212"
            height="382"
            rx="24"
            ry="24"
            fill="rgba(255,255,255,0.5)"
          />

          {/* Camera viewfinder area inside phone */}
          <rect
            x="302"
            y="60"
            width="196"
            height="270"
            rx="4"
            ry="4"
            fill="rgba(45,37,32,0.06)"
          />

          {/* Bounding box — obstacle (red) */}
          <rect
            x="320"
            y="90"
            width="60"
            height="90"
            rx="3"
            ry="3"
            fill="none"
            stroke="#cc5933"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <rect
            x="320"
            y="90"
            width="60"
            height="16"
            rx="2"
            ry="2"
            fill="#cc5933"
          />
          <text
            x="325"
            y="102"
            fontSize="9"
            fill="white"
            fontFamily="monospace"
          >
            Person 94%
          </text>

          {/* Bounding box — signal (green) */}
          <rect
            x="395"
            y="110"
            width="45"
            height="70"
            rx="3"
            ry="3"
            fill="none"
            stroke="#22c55e"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <rect
            x="395"
            y="110"
            width="45"
            height="16"
            rx="2"
            ry="2"
            fill="#22c55e"
          />
          <text
            x="399"
            y="122"
            fontSize="9"
            fill="white"
            fontFamily="monospace"
          >
            Signal 89%
          </text>

          {/* Bounding box — vehicle (orange) */}
          <rect
            x="315"
            y="205"
            width="80"
            height="50"
            rx="3"
            ry="3"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeDasharray="4 2"
          />
          <rect
            x="315"
            y="205"
            width="80"
            height="16"
            rx="2"
            ry="2"
            fill="#f59e0b"
          />
          <text
            x="319"
            y="217"
            fontSize="9"
            fill="white"
            fontFamily="monospace"
          >
            Vehicle 78%
          </text>

          {/* TTS waveform bar at bottom of phone */}
          <rect
            x="310"
            y="355"
            width="180"
            height="28"
            rx="14"
            ry="14"
            fill="rgba(204,89,51,0.12)"
          />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
            const heights = [6, 10, 14, 8, 16, 12, 18, 10, 14, 8, 12, 6];
            const h = heights[i] ?? 8;
            return (
              <rect
                key={i}
                x={326 + i * 13}
                y={369 - h / 2}
                width="5"
                height={h}
                rx="2.5"
                ry="2.5"
                fill="rgba(204,89,51,0.6)"
              />
            );
          })}

          {/* Side labels */}
          <text
            x="80"
            y="200"
            fontSize="13"
            fontWeight="600"
            fill="rgba(45,37,32,0.5)"
            fontFamily="Montserrat, sans-serif"
          >
            Real-Time
          </text>
          <text
            x="80"
            y="218"
            fontSize="13"
            fontWeight="600"
            fill="rgba(45,37,32,0.5)"
            fontFamily="Montserrat, sans-serif"
          >
            Detection
          </text>
          <line
            x1="175"
            y1="209"
            x2="295"
            y2="185"
            stroke="rgba(204,89,51,0.3)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          <text
            x="570"
            y="145"
            fontSize="13"
            fontWeight="600"
            fill="rgba(45,37,32,0.5)"
            fontFamily="Montserrat, sans-serif"
          >
            Voice
          </text>
          <text
            x="570"
            y="163"
            fontSize="13"
            fontWeight="600"
            fill="rgba(45,37,32,0.5)"
            fontFamily="Montserrat, sans-serif"
          >
            Guidance
          </text>
          <line
            x1="568"
            y1="154"
            x2="510"
            y2="200"
            stroke="rgba(204,89,51,0.3)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />

          <text
            x="565"
            y="280"
            fontSize="13"
            fontWeight="600"
            fill="rgba(45,37,32,0.5)"
            fontFamily="Montserrat, sans-serif"
          >
            Haptic
          </text>
          <text
            x="565"
            y="298"
            fontSize="13"
            fontWeight="600"
            fill="rgba(45,37,32,0.5)"
            fontFamily="Montserrat, sans-serif"
          >
            Feedback
          </text>
          <line
            x1="563"
            y1="289"
            x2="510"
            y2="310"
            stroke="rgba(204,89,51,0.3)"
            strokeWidth="1"
            strokeDasharray="3 3"
          />
        </svg>
        <div className="absolute inset-0 rounded-[2rem] border border-black/5 pointer-events-none" />
      </div>
    </div>
  </main>
);

export default Hero;
