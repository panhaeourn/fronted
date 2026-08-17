import type { CSSProperties, ReactNode } from "react";

type ElectricCardProps = {
  children: ReactNode;
  enabled?: boolean;
  color?: string;
  className?: string;
};

export default function ElectricCard({
  children,
  enabled = true,
  color = "#6b1aec",
  className = "",
}: ElectricCardProps) {
  if (!enabled) return <>{children}</>;

  const variables = {
    "--electric-border-color": color,
  } as CSSProperties;

  return (
    <div className={`electric-catalog-frame ${className}`} style={variables}>
      <svg className="electric-catalog-svg" width="0" height="0" aria-hidden="true">
        <defs>
          <filter
            id="catalog-turbulent-displace"
            colorInterpolationFilters="sRGB"
            x="-20%"
            y="-20%"
            width="140%"
            height="140%"
          >
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves={10} result="noise1" seed={1} />
            <feOffset in="noise1" result="offsetNoise1">
              <animate attributeName="dy" values="700;0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves={10} result="noise2" seed={1} />
            <feOffset in="noise2" result="offsetNoise2">
              <animate attributeName="dy" values="0;-700" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves={10} result="noise3" seed={2} />
            <feOffset in="noise3" result="offsetNoise3">
              <animate attributeName="dx" values="490;0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves={10} result="noise4" seed={2} />
            <feOffset in="noise4" result="offsetNoise4">
              <animate attributeName="dx" values="0;-490" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
            <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
            <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="combinedNoise"
              scale={30}
              xChannelSelector="R"
              yChannelSelector="B"
            />
          </filter>
        </defs>
      </svg>

      <section className="electric-catalog-card">
        <div className="electric-catalog-inner" aria-hidden="true">
          <div className="electric-catalog-border-outer">
            <div className="electric-catalog-main-card" />
          </div>
          <div className="electric-catalog-glow-1" />
          <div className="electric-catalog-glow-2" />
        </div>

        <div className="electric-catalog-overlay-1" aria-hidden="true" />
        <div className="electric-catalog-overlay-2" aria-hidden="true" />
        <div className="electric-catalog-background-glow" aria-hidden="true" />

        <div className="electric-catalog-content">{children}</div>
      </section>
    </div>
  );
}
