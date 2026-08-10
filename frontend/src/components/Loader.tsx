
export default function Loader({ message = 'Initializing Decision Twin...' }: { message?: string }) {
  return (
    <div className="full-screen-loader-overlay">
      <div className="loader-container">
        <div className="loader-svg-wrapper">
          <svg viewBox="0 0 800 500" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="chipGradient" x1={0} y1={0} x2={0} y2={1}>
                <stop offset="0%" stopColor="var(--bg-elevated)" />
                <stop offset="100%" stopColor="var(--bg-surface)" />
              </linearGradient>
              <linearGradient id="textGradient" x1={0} y1={0} x2={0} y2={1}>
                <stop offset="0%" stopColor="var(--text-primary)" />
                <stop offset="100%" stopColor="var(--text-muted)" />
              </linearGradient>
              <linearGradient id="pinGradient" x1={1} y1={0} x2={0} y2={0}>
                <stop offset="0%" stopColor="var(--accent-blue)" />
                <stop offset="50%" stopColor="var(--accent-purple)" />
                <stop offset="100%" stopColor="var(--bg-elevated)" />
              </linearGradient>
            </defs>
            <g id="traces">
              <path d="M100 100 H200 V210 H326" className="trace-bg" />
              <path d="M100 100 H200 V210 H326" className="trace-flow purple" />
              <path d="M80 180 H180 V230 H326" className="trace-bg" />
              <path d="M80 180 H180 V230 H326" className="trace-flow blue" />
              <path d="M60 260 H150 V250 H326" className="trace-bg" />
              <path d="M60 260 H150 V250 H326" className="trace-flow teal" />
              <path d="M100 350 H200 V270 H326" className="trace-bg" />
              <path d="M100 350 H200 V270 H326" className="trace-flow rose" />
              
              <path d="M700 90 H560 V210 H474" className="trace-bg" />
              <path d="M700 90 H560 V210 H474" className="trace-flow blue" />
              <path d="M740 160 H580 V230 H474" className="trace-bg" />
              <path d="M740 160 H580 V230 H474" className="trace-flow teal" />
              <path d="M720 250 H590 V250 H474" className="trace-bg" />
              <path d="M720 250 H590 V250 H474" className="trace-flow rose" />
              <path d="M680 340 H570 V270 H474" className="trace-bg" />
              <path d="M680 340 H570 V270 H474" className="trace-flow purple" />
            </g>
            <rect 
              x={330} 
              y={190} 
              width={140} 
              height={100} 
              rx={20} 
              ry={20} 
              fill="url(#chipGradient)" 
              stroke="var(--accent-blue)" 
              strokeWidth={2} 
              filter="drop-shadow(0 0 10px rgba(6, 182, 212, 0.25))" 
            />
            <g>
              <rect x={322} y={205} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={322} y={225} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={322} y={245} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={322} y={265} width={8} height={10} fill="url(#pinGradient)" rx={2} />
            </g>
            <g>
              <rect x={470} y={205} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={470} y={225} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={470} y={245} width={8} height={10} fill="url(#pinGradient)" rx={2} />
              <rect x={470} y={265} width={8} height={10} fill="url(#pinGradient)" rx={2} />
            </g>
            <text 
              x={400} 
              y={245} 
              fontFamily="Space Grotesk, sans-serif" 
              fontSize={18} 
              fontWeight="bold"
              fill="url(#textGradient)" 
              textAnchor="middle" 
              alignmentBaseline="middle"
              className="chip-text"
            >
              TwinPath
            </text>
            <circle cx={100} cy={100} r={5} fill="var(--accent-purple)" />
            <circle cx={80} cy={180} r={5} fill="var(--accent-blue)" />
            <circle cx={60} cy={260} r={5} fill="var(--accent-teal)" />
            <circle cx={100} cy={350} r={5} fill="var(--accent-rose)" />
            <circle cx={700} cy={90} r={5} fill="var(--accent-blue)" />
            <circle cx={740} cy={160} r={5} fill="var(--accent-teal)" />
            <circle cx={720} cy={250} r={5} fill="var(--accent-rose)" />
            <circle cx={680} cy={340} r={5} fill="var(--accent-purple)" />
          </svg>
        </div>
        <div className="loader-status-text">
          {message}
        </div>
      </div>
    </div>
  );
}
