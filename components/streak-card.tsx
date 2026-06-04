import type { HeatmapDay } from '@/lib/streak';

interface StreakCardProps {
  heatmap: HeatmapDay[];
  currentStreak: number;
  longestStreak: number;
  weeks?: number;
}

const LEVELS = [
  '#EBEDF0',
  '#9BE9A8',
  '#40C463',
  '#30A14E',
  '#216E39',
];

function level(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface ColumnInfo {
  cells: (HeatmapDay | null)[];
  startDate: string | null;
}

export function StreakCard({ heatmap, currentStreak, longestStreak, weeks = 24 }: StreakCardProps) {
  const columns: ColumnInfo[] = Array.from({ length: weeks }, () => ({
    cells: Array(7).fill(null),
    startDate: null,
  }));

  if (heatmap.length > 0) {
    const first = heatmap[0];
    const [y, m, d] = first.date.split('-').map(Number);
    let dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    let col = 0;
    for (const cell of heatmap) {
      if (col >= weeks) break;
      columns[col].cells[dow] = cell;
      if (!columns[col].startDate) columns[col].startDate = cell.date;
      dow++;
      if (dow > 6) {
        dow = 0;
        col++;
      }
    }
  }

  const monthLabels: { col: number; label: string }[] = [];
  let lastMonth = -1;
  columns.forEach((c, idx) => {
    if (!c.startDate) return;
    const month = Number(c.startDate.split('-')[1]) - 1;
    if (month !== lastMonth) {
      monthLabels.push({ col: idx, label: MONTH_NAMES[month] });
      lastMonth = month;
    }
  });

  const cellSize = 11;
  const gap = 3;
  const gridWidth = weeks * cellSize + (weeks - 1) * gap;
  const labelColWidth = 28;

  return (
    <div
      className="rounded-2xl"
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(17,17,16,0.08)',
        boxShadow: '0 1px 2px rgba(17,17,16,0.04)',
      }}
    >
      <div className="flex items-center gap-2 px-4 pt-4 pb-3">
        <span aria-hidden="true" style={{ fontSize: '15px' }}>🔥</span>
        <span className="text-[15px] font-semibold" style={{ color: '#111110' }}>
          Streak
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-[12px] tabular-nums whitespace-nowrap">
          <span>
            <span style={{ color: '#6B6A65' }}>Current </span>
            <span className="font-semibold" style={{ color: '#111110' }}>
              {currentStreak}<span style={{ color: '#9C9B95' }}>d</span>
            </span>
          </span>
          <span>
            <span style={{ color: '#6B6A65' }}>Longest </span>
            <span className="font-semibold" style={{ color: '#111110' }}>
              {longestStreak}<span style={{ color: '#9C9B95' }}>d</span>
            </span>
          </span>
        </div>
      </div>

      <div className="px-4 pb-3">
        <div className="overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          <div style={{ width: `${gridWidth + labelColWidth}px`, paddingLeft: `${labelColWidth}px`, position: 'relative' }}>
            <div style={{ position: 'relative', height: '14px', marginBottom: '4px' }}>
              {monthLabels.map((ml) => (
                <span
                  key={`${ml.col}-${ml.label}`}
                  style={{
                    position: 'absolute',
                    left: `${ml.col * (cellSize + gap)}px`,
                    top: 0,
                    fontSize: '10px',
                    fontWeight: 600,
                    color: '#6B6A65',
                    lineHeight: '14px',
                  }}
                >
                  {ml.label}
                </span>
              ))}
            </div>

            <div style={{ position: 'absolute', left: 0, top: '18px', display: 'flex', flexDirection: 'column' }}>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => {
                const label = d === 1 ? 'Mon' : d === 3 ? 'Wed' : d === 5 ? 'Fri' : '';
                return (
                  <span
                    key={d}
                    style={{
                      height: `${cellSize}px`,
                      marginBottom: d < 6 ? `${gap}px` : 0,
                      fontSize: '9px',
                      fontWeight: 600,
                      color: '#6B6A65',
                      lineHeight: `${cellSize}px`,
                      width: `${labelColWidth - 4}px`,
                    }}
                  >
                    {label}
                  </span>
                );
              })}
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${weeks}, ${cellSize}px)`,
                gridTemplateRows: `repeat(7, ${cellSize}px)`,
                gridAutoFlow: 'column',
                gap: `${gap}px`,
              }}
            >
              {columns.flatMap((c, wIdx) =>
                c.cells.map((cell, dIdx) => {
                  const lvl = cell ? level(cell.count) : 0;
                  return (
                    <div
                      key={`${wIdx}-${dIdx}`}
                      title={cell ? `${cell.date}: ${cell.count} completed` : ''}
                      style={{
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        backgroundColor: cell ? LEVELS[lvl] : 'transparent',
                        borderRadius: '2px',
                        outline: cell ? '1px solid rgba(17,17,16,0.04)' : 'none',
                        outlineOffset: '-1px',
                      }}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1 mt-3">
          <span className="text-[9px] font-semibold" style={{ color: '#6B6A65' }}>Less</span>
          {LEVELS.map((c, i) => (
            <span
              key={i}
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: c,
                borderRadius: '2px',
                display: 'inline-block',
                outline: '1px solid rgba(17,17,16,0.04)',
                outlineOffset: '-1px',
              }}
            />
          ))}
          <span className="text-[9px] font-semibold" style={{ color: '#6B6A65' }}>More</span>
        </div>
      </div>
    </div>
  );
}
