import { useMemo } from "react";
import { Link } from "react-router-dom";
import type { ReceptionistUser } from "../../lib/domain-types";
import type { ReceptionistDayEntry } from "../../lib/receptionistDailyReceipts";
import {
  filterDaysByRange,
  formatCurrency,
  formatRangeLabel,
  type RangeView,
} from "./manageReceptionistSupport";
import {
  activeFilterChipButtonStyle,
  chipRowStyle,
  dangerButtonStyle,
  detailLinkStyle,
  emptySummaryStyle,
  receptionistCardStyle,
  receptionistHeaderStyle,
  receptionistRoleStyle,
  summaryActionsStyle,
  summaryHeaderStyle,
  summaryTitleStackStyle,
  summaryTitleStyle,
  summaryWrapStyle,
  totalLabelStyle,
  filterChipButtonStyle,
} from "./manageReceptionistStyles";

export function ReceptionistSummaryCard({
  user,
  allDays,
  range,
  onRangeChange,
  onRemove,
}: {
  user: ReceptionistUser;
  allDays: ReceptionistDayEntry[];
  range: RangeView;
  onRangeChange: (range: RangeView) => void;
  onRemove: () => void;
}) {
  const filteredDays = useMemo(() => filterDaysByRange(allDays, range), [allDays, range]);
  const total = filteredDays.reduce((sum, day) => sum + day.total, 0);

  return (
    <div style={receptionistCardStyle}>
      <div style={receptionistHeaderStyle}>
        <div>
          <div><b>{user.username || "No username"}</b></div>
          <div>{user.email}</div>
          <div style={receptionistRoleStyle}>{user.role}</div>
        </div>

        <button onClick={onRemove} style={dangerButtonStyle}>
          Remove
        </button>
      </div>

      <div style={summaryWrapStyle}>
        <div style={summaryHeaderStyle}>
          <div style={summaryTitleStackStyle}>
            <div style={summaryTitleStyle}>Student Money Summary</div>
            <div style={chipRowStyle}>
              {(["DAY", "WEEK", "MONTH", "YEAR"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => onRangeChange(item)}
                  style={item === range ? activeFilterChipButtonStyle : filterChipButtonStyle}
                >
                  {formatRangeLabel(item)}
                </button>
              ))}
            </div>
          </div>
          <div style={summaryActionsStyle}>
            <div style={totalLabelStyle}>{formatCurrency(total)} total</div>
            <Link
              to={`/admin/receptionists/${user.id}/money?range=${range}`}
              style={detailLinkStyle}
            >
              Detail
            </Link>
          </div>
        </div>

        {filteredDays.length === 0 && (
          <div style={emptySummaryStyle}>
            No payment history in this {formatRangeLabel(range).toLowerCase()} yet.
          </div>
        )}
      </div>
    </div>
  );
}
