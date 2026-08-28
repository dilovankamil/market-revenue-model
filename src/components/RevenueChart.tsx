import * as d3 from 'd3';
import type { YearResult } from '../model/types';

interface RevenueChartProps {
  data: YearResult[];
}

const formatUsd = (value: number) => {
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  return `$${(value / 1_000).toFixed(0)}K`;
};

export function RevenueChart({ data }: RevenueChartProps) {
  const width = 960;
  const height = 360;
  const margin = { top: 24, right: 22, bottom: 42, left: 76 };

  const x = d3
    .scaleBand<number>()
    .domain(data.map((d) => d.year))
    .range([margin.left, width - margin.right])
    .padding(0.26);

  const maxRevenue = d3.max(data, (d) => d.grossRevenueUsd) ?? 0;
  const y = d3
    .scaleLinear()
    .domain([0, maxRevenue * 1.12 || 1])
    .nice()
    .range([height - margin.bottom, margin.top]);

  const yTicks = y.ticks(5);
  const xTicks = data.filter((_, index) => index % 2 === 0);

  return (
    <svg className="revenue-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Revenue forecast">
      {yTicks.map((tick) => (
        <g key={tick}>
          <line
            x1={margin.left}
            x2={width - margin.right}
            y1={y(tick)}
            y2={y(tick)}
            className="chart-grid"
          />
          <text x={margin.left - 12} y={y(tick) + 4} textAnchor="end" className="chart-axis-label">
            {formatUsd(tick)}
          </text>
        </g>
      ))}

      {data.map((row) => {
        const barX = x(row.year) ?? 0;
        const barY = y(row.grossRevenueUsd);
        const barHeight = height - margin.bottom - barY;

        return (
          <g key={row.year}>
            <rect
              x={barX}
              y={barY}
              width={x.bandwidth()}
              height={Math.max(0, barHeight)}
              rx={5}
              className="revenue-bar"
            >
              <title>{`${row.year}: ${formatUsd(row.grossRevenueUsd)} revenue · ${Math.round(row.treatedPatients).toLocaleString()} treated patients`}</title>
            </rect>
            {row.developmentCostsUsd > 0 && (
              <circle
                cx={barX + x.bandwidth() / 2}
                cy={height - margin.bottom + 18}
                r={4}
                className="development-marker"
              >
                <title>{`${row.year}: ${formatUsd(row.developmentCostsUsd)} development cost`}</title>
              </circle>
            )}
          </g>
        );
      })}

      {xTicks.map((row) => (
        <text
          key={row.year}
          x={(x(row.year) ?? 0) + x.bandwidth() / 2}
          y={height - 12}
          textAnchor="middle"
          className="chart-axis-label"
        >
          {String(row.year).slice(2)}
        </text>
      ))}
    </svg>
  );
}
