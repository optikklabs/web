import { CHART_THEME_DEFAULTS } from "@shared/utils/chartTheme";

export interface ServiceMapNode {
  name: string;
  sub: string;
  x: number;
  y: number;
  status: "ok" | "warn" | "err";
  isCenter?: boolean;
}

export interface ServiceMapEdge {
  path: string;
  width: number;
  color: string;
  label: string;
  lx: number;
  ly: number;
  dur: string;
  delay: string;
}

interface TopologySVGProps {
  nodes: readonly ServiceMapNode[];
  edges: readonly ServiceMapEdge[];
  selectedFocus: string;
  onNodeClick: (name: string) => void;
  onNavigate: (name: string) => void;
}

export function TopologySVG({
  nodes,
  edges,
  selectedFocus,
  onNodeClick,
  onNavigate,
}: TopologySVGProps) {
  return (
    <svg
      viewBox="0 0 880 420"
      className="block h-[380px] w-full"
      role="img"
      aria-label="Service dependencies topology flow map"
    >
      <defs>
        <marker
          id="arrow-flow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto-start-reverse"
        >
          <path d="M0 0 L10 5 L0 10 z" fill="var(--fg-mute)" opacity="0.4" />
        </marker>
        <pattern id="dot-grid-overview" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="0.6" fill="var(--fg-mute)" opacity="0.12" />
        </pattern>
      </defs>

      <rect width="880" height="420" fill="url(#dot-grid-overview)" rx="6" />

      <text
        x="120"
        y="25"
        fontSize="9.5"
        fill="var(--fg-mute)"
        fontWeight="700"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        UPSTREAM
      </text>
      <text
        x="440"
        y="25"
        fontSize="9.5"
        fill="var(--brand)"
        fontWeight="700"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        THIS SERVICE
      </text>
      <text
        x="760"
        y="25"
        fontSize="9.5"
        fill="var(--fg-mute)"
        fontWeight="700"
        letterSpacing="1.5"
        textAnchor="middle"
      >
        DOWNSTREAM
      </text>

      {edges.map((e) => (
        <g key={e.path}>
          <path
            d={e.path}
            stroke={e.color}
            strokeOpacity="0.12"
            strokeWidth={e.width + 4}
            fill="none"
            strokeLinecap="round"
          />
          <path
            d={e.path}
            stroke={e.color}
            strokeOpacity="0.75"
            strokeWidth="1.2"
            fill="none"
            markerEnd="url(#arrow-flow)"
          />
          <text
            x={e.lx}
            y={e.ly}
            fontSize="8.5"
            fill="var(--fg-2)"
            fontFamily="var(--font-mono)"
            textAnchor="middle"
            style={{ paintOrder: "stroke", stroke: "var(--bg-card)", strokeWidth: 3 }}
          >
            {e.label}
          </text>
          <circle r="2.5" fill={e.color}>
            <animateMotion dur={e.dur} repeatCount="indefinite" begin={e.delay} path={e.path} />
          </circle>
          <circle r="1.5" fill={e.color} opacity="0.6">
            <animateMotion
              dur={e.dur}
              repeatCount="indefinite"
              begin={`${(Number.parseFloat(e.delay) + Number.parseFloat(e.dur) / 2).toFixed(1)}s`}
              path={e.path}
            />
          </circle>
        </g>
      ))}

      {nodes.map((n) => {
        const fillTheme =
          n.status === "err"
            ? CHART_THEME_DEFAULTS.err()
            : n.status === "warn"
              ? CHART_THEME_DEFAULTS.warn()
              : CHART_THEME_DEFAULTS.ok();

        return (
          <g
            key={n.name}
            transform={`translate(${n.x}, ${n.y})`}
            onClick={() => n.name !== selectedFocus && onNodeClick(n.name)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                if (n.name !== selectedFocus) onNodeClick(n.name);
              }
            }}
            tabIndex={0}
            aria-label={`Focus ${n.name}`}
            className="cursor-pointer"
          >
            <rect
              width="180"
              height={n.isCenter ? "110" : "60"}
              rx={n.isCenter ? "12" : "10"}
              fill="var(--bg-card)"
              stroke="var(--line)"
              strokeWidth={n.isCenter ? "2" : "1"}
            />
            <rect
              x="0"
              y="0"
              width="4"
              height={n.isCenter ? "110" : "60"}
              rx="2"
              fill={fillTheme}
            />
            <text
              x="16"
              y="25"
              fontSize={n.isCenter ? "13.5" : "12.5"}
              fontWeight="700"
              fill="var(--fg-0)"
            >
              {n.name}
            </text>
            <text x="16" y="42" fontSize="9.5" fill="var(--fg-3)" fontFamily="var(--font-mono)">
              {n.sub}
            </text>
            <circle cx="166" cy="15" r="3.5" fill={fillTheme} />

            {n.isCenter && (
              <>
                <line x1="16" y1="54" x2="164" y2="54" stroke="var(--line)" strokeOpacity="0.3" />
                <text x="16" y="72" fontSize="10" fill="var(--fg-2)" fontWeight="600">
                  Active Focus node
                </text>
                <text
                  x="16"
                  y="88"
                  fontSize="10"
                  fill="var(--brand)"
                  fontWeight="600"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(n.name);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      event.stopPropagation();
                      onNavigate(n.name);
                    }
                  }}
                  tabIndex={0}
                  aria-label={`View ${n.name} detail page`}
                  className="hover:underline"
                >
                  view detail page →
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}
