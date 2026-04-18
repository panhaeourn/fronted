import { Link } from "react-router-dom";
import { formatCurrency, formatDate, formatRangeLabel } from "./helpers";
import {
  activityBadgeStyle,
  activityDetailStyle,
  activityRowStyle,
  activityTimeStyle,
  actionLinkStyle,
  chartBarWrapStyle,
  chartGridStyle,
  dashboardShellStyle,
  donutInnerStyle,
  donutOuterStyle,
  donutWrapStyle,
  emptyStateStyle,
  ghostLinkStyle,
  guestActionsStyle,
  guestBadgeStyle,
  guestHeadingStyle,
  guestTextStyle,
  headerRowStyle,
  heroChartPanelStyle,
  homeDetailLinkStyle,
  homeFilterChipLinkStyle,
  homeSummaryMiniCardStyle,
  homeSummaryMiniLabelStyle,
  homeSummaryMiniValueStyle,
  lineChartSvgStyle,
  lineChartWrapStyle,
  loadingStyle,
  metricCardGlowStyle,
  metricCardStyle,
  metricGridStyle,
  pageStyle,
  panelStyle,
  panelSubtitleStyle,
  primaryButtonLinkStyle,
  primaryButtonStyle,
  statusRowStyle,
  summaryFiltersStyle,
  summaryGridStyle,
  summaryHeaderStyle,
  summaryMetaStyle,
  summaryTitleWrapStyle,
  summaryTotalStyle,
  tableCellStyle,
  tableHeadStyle,
  threeColumnGridStyle,
  titleStyle,
  twoColumnGridStyle,
  twoColumnWideGridStyle,
  welcomePanelStyle,
} from "./styles";
import type { DashboardData, Metric, Status } from "./types";

export function GuestHome() {
  return (
    <div style={dashboardShellStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={titleStyle}>Welcome</h1>
        </div>
      </div>

      <section style={{ ...panelStyle, ...welcomePanelStyle }}>
        <div style={guestBadgeStyle}>Guest Access</div>
        <h2 style={guestHeadingStyle}>Register to See Courses</h2>
        <p style={guestTextStyle}>
          Create a student account to browse available courses, unlock learning content, and access your personal
          dashboard. If you already have an account, sign in to continue.
        </p>

        <div style={guestActionsStyle}>
          <Link to="/register" style={primaryButtonLinkStyle}>
            Register
          </Link>
          <Link to="/login" style={ghostLinkStyle}>
            Login
          </Link>
          <Link to="/courses" style={actionLinkStyle}>
            View Course Page
          </Link>
        </div>
      </section>
    </div>
  );
}

export function HomeLoading({ children }: { children: string }) {
  return <div style={loadingStyle}>{children}</div>;
}

export function HomeError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div style={pageStyle}>
      <div
        style={{
          marginBottom: 18,
          padding: "14px 16px",
          borderRadius: 16,
          color: "#ffd3d3",
          background: "rgba(146, 37, 37, 0.34)",
          border: "1px solid rgba(248, 113, 113, 0.3)",
        }}
      >
        {error}
      </div>
      <button onClick={onRetry} style={primaryButtonStyle}>
        Retry
      </button>
    </div>
  );
}

export function DashboardLayout({
  data,
  onRefresh,
  refreshing,
}: {
  data: DashboardData;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div style={dashboardShellStyle}>
      <div style={headerRowStyle}>
        <div>
          <h1 style={titleStyle}>{data.title}</h1>
        </div>

        <button onClick={onRefresh} disabled={refreshing} style={primaryButtonStyle}>
          {refreshing ? "Refreshing..." : "Refresh Dashboard"}
        </button>
      </div>

      <div style={metricGridStyle}>
        {data.metrics.map((item) => (
          <MetricCard key={item.label} {...item} />
        ))}
      </div>

      <div style={threeColumnGridStyle}>
        <section style={{ ...panelStyle, ...welcomePanelStyle }}>
          <h3 style={{ margin: 0, fontSize: 24 }}>{data.welcomeTitle}</h3>
          <p style={{ color: "var(--app-subtle-text)", maxWidth: 380 }}>{data.welcomeText}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {data.quickLinks.slice(0, 2).map((item) => (
              <Link key={item.label} to={item.to} style={ghostLinkStyle}>
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section style={{ ...panelStyle, ...heroChartPanelStyle }}>
          <h3 style={{ marginTop: 0 }}>{data.chartTitle}</h3>
          <p style={panelSubtitleStyle}>{data.chartSubtitle}</p>
          <LineChart items={data.chartItems} formatter={data.chartFormatter} />
        </section>
      </div>

      {data.moneySummary && (
        <section style={panelStyle}>
          <div style={summaryHeaderStyle}>
            <div style={summaryTitleWrapStyle}>
              <h3 style={{ margin: 0 }}>Student Money Summary</h3>
              <div style={summaryFiltersStyle}>
                {(["DAY", "WEEK", "MONTH", "YEAR"] as const).map((range) => (
                  <Link key={range} to={`${data.moneySummary?.detailBasePath}?range=${range}`} style={homeFilterChipLinkStyle}>
                    {formatRangeLabel(range)}
                  </Link>
                ))}
              </div>
            </div>
            <div style={summaryMetaStyle}>
              <div style={summaryTotalStyle}>{formatCurrency(data.moneySummary.total)} total</div>
              <Link to={`${data.moneySummary.detailBasePath}?range=YEAR`} style={homeDetailLinkStyle}>
                Detail
              </Link>
            </div>
          </div>

          <div style={summaryGridStyle}>
            <div style={homeSummaryMiniCardStyle}>
              <div style={homeSummaryMiniLabelStyle}>Active Days</div>
              <div style={homeSummaryMiniValueStyle}>{data.moneySummary.activeDays}</div>
            </div>
            <div style={homeSummaryMiniCardStyle}>
              <div style={homeSummaryMiniLabelStyle}>Students Paid</div>
              <div style={homeSummaryMiniValueStyle}>{data.moneySummary.studentsPaid}</div>
            </div>
            <div style={homeSummaryMiniCardStyle}>
              <div style={homeSummaryMiniLabelStyle}>Latest Day</div>
              <div style={{ ...homeSummaryMiniValueStyle, fontSize: 16 }}>{data.moneySummary.latestDay}</div>
            </div>
          </div>
        </section>
      )}

      <div style={twoColumnWideGridStyle}>
        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>{data.statusTitle}</h3>
          <StatusChart items={data.statuses} />
        </section>

        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>{data.tableOneTitle}</h3>
          <DataTable columns={data.tableOneColumns} rows={data.tableOneRows} />
        </section>
      </div>

      <div style={twoColumnGridStyle}>
        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>{data.secondTitle}</h3>
          <p style={panelSubtitleStyle}>{data.secondSubtitle}</p>
          <BarChart
            items={data.secondItems}
            color="linear-gradient(180deg, rgba(52,211,153,0.95), rgba(30,110,102,0.3))"
            formatter={data.secondFormatter}
          />
        </section>

        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>{data.activityTitle}</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {data.activity.length === 0 ? (
              <div style={emptyStateStyle}>No recent activity found.</div>
            ) : (
              data.activity.map((item) => (
                <div key={item.id} style={activityRowStyle}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.title}</div>
                    <div style={activityDetailStyle}>{item.detail}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={activityBadgeStyle}>{item.badge}</div>
                    <div style={activityTimeStyle}>{formatDate(item.time)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <div style={twoColumnGridStyle}>
        <section style={panelStyle}>
          <h3 style={{ marginTop: 0 }}>{data.tableTwoTitle}</h3>
          <DataTable columns={data.tableTwoColumns} rows={data.tableTwoRows} />
        </section>
      </div>
    </div>
  );
}

function MetricCard({ label, value, accent }: Metric) {
  return (
    <div style={metricCardStyle(accent)}>
      <div style={metricCardGlowStyle(accent)} />
      <div style={{ color: "var(--app-muted)", fontSize: 13 }}>{label}</div>
      <div style={{ fontSize: 30, fontWeight: 800, marginTop: 8 }}>{value}</div>
    </div>
  );
}

function BarChart({
  items,
  color,
  formatter,
}: {
  items: Array<{ label: string; value: number }>;
  color: string;
  formatter: (value: number) => string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div style={chartGridStyle}>
      {items.map((item) => {
        const height = Math.max((item.value / max) * 100, item.value > 0 ? 12 : 6);

        return (
          <div key={item.label} style={{ textAlign: "center" }}>
            <div style={{ color: "var(--app-muted-strong)", fontSize: 12, marginBottom: 10 }}>{formatter(item.value)}</div>
            <div style={chartBarWrapStyle}>
              <div
                style={{
                  width: "100%",
                  maxWidth: 56,
                  height: `${height}%`,
                  minHeight: 6,
                  borderRadius: 18,
                  background: color,
                }}
              />
            </div>
            <div style={{ marginTop: 10, color: "var(--app-heading)", fontWeight: 600 }}>{item.label}</div>
          </div>
        );
      })}
    </div>
  );
}

function LineChart({
  items,
  formatter,
}: {
  items: Array<{ label: string; value: number }>;
  formatter: (value: number) => string;
}) {
  const width = 620;
  const height = 210;
  const paddingX = 26;
  const paddingTop = 18;
  const paddingBottom = 38;
  const max = Math.max(...items.map((item) => item.value), 1);
  const usableWidth = width - paddingX * 2;
  const usableHeight = height - paddingTop - paddingBottom;
  const stepX = items.length > 1 ? usableWidth / (items.length - 1) : 0;

  const points = items.map((item, index) => {
    const x = paddingX + stepX * index;
    const y = paddingTop + usableHeight - (item.value / max) * usableHeight;
    return { x, y, value: item.value, label: item.label };
  });

  const linePath = points
    .map((point, index, array) => {
      if (index === 0) return `M ${point.x} ${point.y}`;
      const prev = array[index - 1];
      const controlX = (prev.x + point.x) / 2;
      return `C ${controlX} ${prev.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
    })
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1]?.x ?? paddingX} ${height - paddingBottom} L ${
    points[0]?.x ?? paddingX
  } ${height - paddingBottom} Z`;

  return (
    <div style={lineChartWrapStyle}>
      <svg viewBox={`0 0 ${width} ${height}`} style={lineChartSvgStyle} preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="revenueLineStroke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6fb6ff" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
          <linearGradient id="revenueLineFill" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(111,182,255,0.18)" />
            <stop offset="100%" stopColor="rgba(103,232,249,0.01)" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + usableHeight - usableHeight * ratio;
          return (
            <line
              key={ratio}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke="var(--app-table-border-soft)"
              strokeDasharray="4 6"
              strokeWidth="1"
            />
          );
        })}

        <path d={areaPath} fill="url(#revenueLineFill)" />
        <path
          d={linePath}
          fill="none"
          stroke="url(#revenueLineStroke)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 8px rgba(111, 182, 255, 0.18))" }}
        />

        {points.map((point) => (
          <g key={point.label}>
            <circle cx={point.x} cy={point.y} r="4.5" fill="#12203c" stroke="#9fddff" strokeWidth="2" />
            <circle cx={point.x} cy={point.y} r="1.8" fill="#eff9ff" />
            <text x={point.x} y={point.y - 11} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--app-muted-strong)">
              {formatter(point.value)}
            </text>
            <text x={point.x} y={height - 10} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--app-heading)">
              {point.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function StatusChart({ items }: { items: Status[] }) {
  if (items.length === 0) {
    return <div style={emptyStateStyle}>No status data available.</div>;
  }

  const total = items.reduce((sum, item) => sum + item.value, 0) || 1;
  let start = 0;
  const gradient = items
    .map((item) => {
      const end = start + (item.value / total) * 100;
      const segment = `${item.color} ${start}% ${end}%`;
      start = end;
      return segment;
    })
    .join(", ");

  return (
    <div style={donutWrapStyle}>
      <div style={{ ...donutOuterStyle, background: `conic-gradient(${gradient})` }}>
        <div style={donutInnerStyle}>
          <div style={{ color: "var(--app-muted)", fontSize: 12 }}>Total</div>
          <div style={{ fontSize: 30, fontWeight: 800 }}>{total}</div>
        </div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        {items.map((item) => (
          <div key={item.label} style={statusRowStyle}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: item.color }} />
              <span>{item.label}</span>
            </div>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  if (rows.length === 0) {
    return <div style={emptyStateStyle}>No records available.</div>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column} style={tableHeadStyle}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`} style={tableCellStyle}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
