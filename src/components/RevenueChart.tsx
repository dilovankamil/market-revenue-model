import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import type { CountryYearResult, IndicationId, RegionId, Scenario, YearResult } from '../model/types';

export type RevenueColorMode = 'indication' | 'region';

interface RevenueChartProps {
  data: YearResult[];
  countryYears?: CountryYearResult[];
  scenario?: Scenario;
  showDevelopmentAnnotations?: boolean;
}

interface SegmentDatum {
  id: string;
  label: string;
  year: number;
  value: number;
  y0: number;
  y1: number;
  color: string;
}

const indicationColors: Record<IndicationId, string> = {
  gbm: '#4fd1c5',
  brainMetastasis: '#6ed7ff',
  opbt: '#f5b942',
};

const regionColors: Record<RegionId, string> = {
  'North America': '#6ed7ff',
  Europe: '#4fd1c5',
  'Asia-Pacific': '#a58bfa',
};

const formatUsd = (value: number) => {
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(0)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.round(value)}`;
};

const indicationOrder: IndicationId[] = ['gbm', 'brainMetastasis', 'opbt'];
const regionOrder: RegionId[] = ['North America', 'Europe', 'Asia-Pacific'];

export function RevenueChart({
  data,
  countryYears = [],
  scenario,
  showDevelopmentAnnotations = true,
}: RevenueChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [colorMode, setColorMode] = useState<RevenueColorMode>('indication');

  const series = useMemo(() => {
    if (!scenario || countryYears.length === 0) {
      return [{ id: 'total', label: 'Revenue', color: '#4ba7c6' }];
    }

    if (colorMode === 'region') {
      return regionOrder
        .filter((region) => Object.values(scenario.countries).some((country) => country.enabled && country.region === region))
        .map((region) => ({ id: region, label: region, color: regionColors[region] }));
    }

    return indicationOrder
      .filter((id) => scenario.indications[id].enabled)
      .map((id) => ({ id, label: scenario.indications[id].name, color: indicationColors[id] }));
  }, [scenario, countryYears.length, colorMode]);

  const segments = useMemo<SegmentDatum[]>(() => {
    if (!scenario || countryYears.length === 0) {
      return data.map((row) => ({
        id: 'total',
        label: 'Revenue',
        year: row.year,
        value: row.grossRevenueUsd,
        y0: 0,
        y1: row.grossRevenueUsd,
        color: '#4ba7c6',
      }));
    }

    const countryById = scenario.countries;
    const output: SegmentDatum[] = [];

    data.forEach((row) => {
      const yearRows = countryYears.filter((countryRow) => countryRow.year === row.year);
      let running = 0;

      series.forEach((item) => {
        let value = 0;
        if (colorMode === 'region') {
          value = yearRows
            .filter((countryRow) => countryById[countryRow.countryId]?.region === item.id)
            .reduce((sum, countryRow) => sum + countryRow.grossRevenueUsd, 0);
        } else {
          value = yearRows.reduce(
            (sum, countryRow) => sum + countryRow.grossRevenueByIndicationUsd[item.id as IndicationId],
            0,
          );
        }

        output.push({
          id: item.id,
          label: item.label,
          year: row.year,
          value,
          y0: running,
          y1: running + value,
          color: item.color,
        });
        running += value;
      });
    });

    return output;
  }, [data, countryYears, scenario, series, colorMode]);

  useEffect(() => {
    if (!svgRef.current) return;

    const width = 960;
    const height = 360;
    const margin = { top: 24, right: 22, bottom: 54, left: 76 };
    const svg = d3.select(svgRef.current);
    const x = d3.scaleBand<number>()
      .domain(data.map((d) => d.year))
      .range([margin.left, width - margin.right])
      .padding(0.24);
    const maxRevenue = d3.max(data, (d) => d.grossRevenueUsd) ?? 0;
    const y = d3.scaleLinear()
      .domain([0, maxRevenue * 1.12 || 1])
      .nice()
      .range([height - margin.bottom, margin.top]);
    const transition = svg.transition().duration(650).ease(d3.easeCubicOut);

    const grid = svg.select<SVGGElement>('.chart-grid-layer');
    const yTicks = y.ticks(5);
    grid.selectAll<SVGLineElement, number>('line')
      .data(yTicks, (tick) => String(tick))
      .join(
        (enter) => enter.append('line')
          .attr('class', 'chart-grid')
          .attr('x1', margin.left)
          .attr('x2', width - margin.right)
          .attr('y1', y(0))
          .attr('y2', y(0)),
        (update) => update,
        (exit) => exit.transition(transition).style('opacity', 0).remove(),
      )
      .transition(transition)
      .attr('x1', margin.left)
      .attr('x2', width - margin.right)
      .attr('y1', (tick) => y(tick))
      .attr('y2', (tick) => y(tick));

    const yLabels = svg.select<SVGGElement>('.chart-y-label-layer');
    yLabels.selectAll<SVGTextElement, number>('text')
      .data(yTicks, (tick) => String(tick))
      .join(
        (enter) => enter.append('text')
          .attr('class', 'chart-axis-label')
          .attr('text-anchor', 'end')
          .attr('x', margin.left - 12)
          .attr('y', y(0) + 4)
          .style('opacity', 0),
        (update) => update,
        (exit) => exit.transition(transition).style('opacity', 0).remove(),
      )
      .text((tick) => formatUsd(tick))
      .transition(transition)
      .attr('y', (tick) => y(tick) + 4)
      .style('opacity', 1);

    const bars = svg.select<SVGGElement>('.chart-bar-layer');
    const keyedSegments = segments.filter((segment) => segment.value > 0);
    const rects = bars.selectAll<SVGRectElement, SegmentDatum>('rect')
      .data(keyedSegments, (segment) => `${segment.year}-${segment.id}`);

    const entered = rects.enter()
      .append('rect')
      .attr('class', 'revenue-segment')
      .attr('x', (segment) => x(segment.year) ?? 0)
      .attr('width', x.bandwidth())
      .attr('y', y(0))
      .attr('height', 0)
      .attr('rx', 5)
      .attr('fill', (segment) => segment.color)
      .style('opacity', 0.92);

    entered.append('title');

    const merged = entered.merge(rects);
    merged.select('title').text((segment) => `${segment.year} · ${segment.label}: ${formatUsd(segment.value)}`);
    merged.transition(transition)
      .attr('x', (segment) => x(segment.year) ?? 0)
      .attr('width', x.bandwidth())
      .attr('y', (segment) => y(segment.y1))
      .attr('height', (segment) => Math.max(0, y(segment.y0) - y(segment.y1)))
      .attr('fill', (segment) => segment.color)
      .style('opacity', 0.92);

    rects.exit()
      .transition(transition)
      .attr('y', y(0))
      .attr('height', 0)
      .style('opacity', 0)
      .remove();

    const xTicks = data.filter((_, index) => index % 2 === 0);
    const xLabels = svg.select<SVGGElement>('.chart-x-label-layer');
    xLabels.selectAll<SVGTextElement, YearResult>('text')
      .data(xTicks, (row) => String(row.year))
      .join('text')
      .attr('class', 'chart-axis-label')
      .attr('text-anchor', 'middle')
      .attr('x', (row) => (x(row.year) ?? 0) + x.bandwidth() / 2)
      .attr('y', height - 13)
      .text((row) => String(row.year).slice(2));

    const annotations = svg.select<SVGGElement>('.chart-development-layer');
    const developmentRows = showDevelopmentAnnotations
      ? data.filter((row) => row.developmentCostsUsd > 0)
      : [];
    const markers = annotations.selectAll<SVGGElement, YearResult>('g')
      .data(developmentRows, (row) => String(row.year))
      .join(
        (enter) => {
          const group = enter.append('g').attr('class', 'development-annotation');
          group.append('rect').attr('rx', 3).attr('height', 5);
          group.append('title');
          return group;
        },
        (update) => update,
        (exit) => exit.remove(),
      );
    markers.select('rect')
      .attr('x', (row) => (x(row.year) ?? 0) + 2)
      .attr('y', height - margin.bottom + 9)
      .attr('width', Math.max(4, x.bandwidth() - 4));
    markers.select('title')
      .text((row) => `${row.year}: ${formatUsd(row.developmentCostsUsd)} clinical-development spend. Annotation only; not part of bar height.`);
  }, [data, segments, showDevelopmentAnnotations]);

  return (
    <div className="revenue-chart-wrap">
      {scenario && countryYears.length > 0 && (
        <div className="chart-control-row">
          <div className="chart-series-legend">
            {series.map((item) => <span key={item.id}><i style={{ background: item.color }} />{item.label}</span>)}
          </div>
          <div className="chart-mode-toggle" role="group" aria-label="Color revenue by">
            <span>Color by</span>
            <button className={colorMode === 'indication' ? 'active' : ''} onClick={() => setColorMode('indication')}>Indication</button>
            <button className={colorMode === 'region' ? 'active' : ''} onClick={() => setColorMode('region')}>Region</button>
          </div>
        </div>
      )}
      <svg ref={svgRef} className="revenue-chart" viewBox="0 0 960 360" role="img" aria-label="Revenue forecast">
        <g className="chart-grid-layer" />
        <g className="chart-y-label-layer" />
        <g className="chart-bar-layer" />
        <g className="chart-development-layer" />
        <g className="chart-x-label-layer" />
      </svg>
      {showDevelopmentAnnotations && data.some((row) => row.developmentCostsUsd > 0) && (
        <div className="development-annotation-key"><i /> <strong>Clinical-development spend</strong> — the thin red marks under 2026–32 identify years with development expenditure. They are annotations only; revenue bar height is not reduced by them.</div>
      )}
    </div>
  );
}
