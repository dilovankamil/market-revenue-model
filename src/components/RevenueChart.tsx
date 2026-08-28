import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { REGION_COLORS, REGION_ORDER } from '../model/marketRegions';
import type { CountryYearResult, DevelopmentStage, IndicationId, Scenario, YearResult } from '../model/types';

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

interface DevelopmentBreakdownRow {
  year: number;
  total: number;
  stages: { id: string; label: string; value: number }[];
}

const indicationColors: Record<IndicationId, string> = {
  gbm: '#4fd1c5',
  brainMetastasis: '#6ed7ff',
  opbt: '#f5b942',
};

const formatUsd = (value: number) => {
  if (Math.abs(value) >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${Math.round(value)}`;
};

const indicationOrder: IndicationId[] = ['gbm', 'brainMetastasis', 'opbt'];

const animate = <E extends d3.BaseType, D, P extends d3.BaseType, PD>(selection: d3.Selection<E, D, P, PD>) =>
  selection.transition().duration(560).ease(d3.easeCubicOut);

const stageCostForYear = (stage: DevelopmentStage, year: number) => {
  const start = new Date(`${stage.startDate}T00:00:00Z`);
  const end = new Date(`${stage.endDate}T00:00:00Z`);
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const yearEnd = new Date(Date.UTC(year, 11, 31));
  const overlapStart = start > yearStart ? start : yearStart;
  const overlapEnd = end < yearEnd ? end : yearEnd;
  if (overlapEnd < overlapStart) return 0;
  const day = 86_400_000;
  const totalDays = Math.max(1, (end.getTime() - start.getTime()) / day + 1);
  const overlapDays = (overlapEnd.getTime() - overlapStart.getTime()) / day + 1;
  return stage.publicCostUsd * overlapDays / totalDays;
};

export function RevenueChart({ data, countryYears = [], scenario, showDevelopmentAnnotations = true }: RevenueChartProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [colorMode, setColorMode] = useState<RevenueColorMode>('indication');

  const series = useMemo(() => {
    if (!scenario || countryYears.length === 0) return [{ id: 'total', label: 'Revenue', color: '#4ba7c6' }];
    if (colorMode === 'region') {
      return REGION_ORDER
        .filter((region) => Object.values(scenario.countries).some((country) => country.enabled && country.region === region))
        .map((region) => ({ id: region, label: region, color: REGION_COLORS[region] }));
    }
    return indicationOrder
      .filter((id) => scenario.indications[id].enabled)
      .map((id) => ({ id, label: scenario.indications[id].name, color: indicationColors[id] }));
  }, [scenario, countryYears.length, colorMode]);

  const segments = useMemo<SegmentDatum[]>(() => {
    if (!scenario || countryYears.length === 0) {
      return data.map((row) => ({ id: 'total', label: 'Revenue', year: row.year, value: row.grossRevenueUsd, y0: 0, y1: row.grossRevenueUsd, color: '#4ba7c6' }));
    }
    const countryById = scenario.countries;
    const output: SegmentDatum[] = [];
    data.forEach((row) => {
      const yearRows = countryYears.filter((countryRow) => countryRow.year === row.year);
      let running = 0;
      series.forEach((item) => {
        const value = colorMode === 'region'
          ? yearRows.filter((countryRow) => countryById[countryRow.countryId]?.region === item.id).reduce((sum, countryRow) => sum + countryRow.grossRevenueUsd, 0)
          : yearRows.reduce((sum, countryRow) => sum + countryRow.grossRevenueByIndicationUsd[item.id as IndicationId], 0);
        output.push({ id: item.id, label: item.label, year: row.year, value, y0: running, y1: running + value, color: item.color });
        running += value;
      });
    });
    return output;
  }, [data, countryYears, scenario, series, colorMode]);

  const developmentBreakdown = useMemo<DevelopmentBreakdownRow[]>(() => {
    if (!scenario || !showDevelopmentAnnotations) return [];
    return data.map((row) => {
      const stages = scenario.developmentStages
        .filter((stage) => scenario.indications[stage.indication].enabled)
        .map((stage) => ({ id: stage.id, label: `${scenario.indications[stage.indication].name} · ${stage.phase}`, value: stageCostForYear(stage, row.year) }))
        .filter((stage) => stage.value > 0.5);
      return { year: row.year, total: row.developmentCostsUsd, stages };
    }).filter((row) => row.total > 0);
  }, [data, scenario, showDevelopmentAnnotations]);

  useEffect(() => {
    if (!svgRef.current) return;
    const width = 960;
    const height = 372;
    const margin = { top: 40, right: 22, bottom: 54, left: 76 };
    const svg = d3.select(svgRef.current);
    const x = d3.scaleBand<number>().domain(data.map((d) => d.year)).range([margin.left, width - margin.right]).padding(0.24);
    const maxRevenue = d3.max(data, (d) => d.grossRevenueUsd) ?? 0;
    const y = d3.scaleLinear().domain([0, maxRevenue * 1.16 || 1]).nice().range([height - margin.bottom, margin.top]);

    const yTicks = y.ticks(5);
    svg.select<SVGGElement>('.chart-grid-layer').selectAll<SVGLineElement, number>('line')
      .data(yTicks, (tick) => String(tick))
      .join(
        (enter) => enter.append('line').attr('class', 'chart-grid').attr('x1', margin.left).attr('x2', width - margin.right).attr('y1', (tick) => y(tick)).attr('y2', (tick) => y(tick)).style('opacity', 0),
        (update) => update,
        (exit) => exit.transition().duration(300).style('opacity', 0).remove(),
      )
      .call((selection) => animate(selection).attr('x1', margin.left).attr('x2', width - margin.right).attr('y1', (tick) => y(tick)).attr('y2', (tick) => y(tick)).style('opacity', 1));

    svg.select<SVGGElement>('.chart-y-label-layer').selectAll<SVGTextElement, number>('text')
      .data(yTicks, (tick) => String(tick))
      .join(
        (enter) => enter.append('text').attr('class', 'chart-axis-label').attr('text-anchor', 'end').attr('x', margin.left - 12).attr('y', (tick) => y(tick) + 4).style('opacity', 0),
        (update) => update,
        (exit) => exit.transition().duration(300).style('opacity', 0).remove(),
      )
      .text((tick) => formatUsd(tick))
      .call((selection) => animate(selection).attr('y', (tick) => y(tick) + 4).style('opacity', 1));

    const bars = svg.select<SVGGElement>('.chart-bar-layer');
    const rects = bars.selectAll<SVGRectElement, SegmentDatum>('rect').data(segments.filter((segment) => segment.value > 0), (segment) => `${segment.year}-${segment.id}`);
    const entered = rects.enter().append('rect')
      .attr('class', 'revenue-segment')
      .attr('x', (segment) => x(segment.year) ?? 0).attr('width', x.bandwidth())
      .attr('y', (segment) => y(segment.y1)).attr('height', (segment) => Math.max(0, y(segment.y0) - y(segment.y1)))
      .attr('rx', 5).attr('fill', (segment) => segment.color).attr('transform', 'translate(0,5)').style('opacity', 0);
    entered.append('title');
    entered.transition().duration(380).ease(d3.easeCubicOut).attr('transform', 'translate(0,0)').style('opacity', 0.92);
    rects.select('title').text((segment) => `${segment.year} · ${segment.label}: ${formatUsd(segment.value)}`);
    entered.select('title').text((segment) => `${segment.year} · ${segment.label}: ${formatUsd(segment.value)}`);
    animate(rects).attr('x', (segment) => x(segment.year) ?? 0).attr('width', x.bandwidth()).attr('y', (segment) => y(segment.y1))
      .attr('height', (segment) => Math.max(0, y(segment.y0) - y(segment.y1))).attr('fill', (segment) => segment.color).attr('transform', 'translate(0,0)').style('opacity', 0.92);
    rects.exit().transition().duration(260).ease(d3.easeCubicOut).style('opacity', 0).remove();

    const revenueRows = data.filter((row) => row.grossRevenueUsd > 0);
    svg.select<SVGGElement>('.chart-total-label-layer').selectAll<SVGTextElement, YearResult>('text')
      .data(revenueRows, (row) => String(row.year))
      .join(
        (enter) => enter.append('text').attr('class', 'bar-total-label').attr('text-anchor', 'middle').style('opacity', 0),
        (update) => update,
        (exit) => exit.transition().duration(220).style('opacity', 0).remove(),
      )
      .text((row) => formatUsd(row.grossRevenueUsd))
      .call((selection) => animate(selection)
        .attr('x', (row) => (x(row.year) ?? 0) + x.bandwidth() / 2)
        .attr('y', (row) => Math.max(16, y(row.grossRevenueUsd) - 7))
        .style('opacity', 1));

    const xTicks = data.filter((_, index) => index % 2 === 0);
    svg.select<SVGGElement>('.chart-x-label-layer').selectAll<SVGTextElement, YearResult>('text')
      .data(xTicks, (row) => String(row.year)).join('text').attr('class', 'chart-axis-label').attr('text-anchor', 'middle')
      .attr('x', (row) => (x(row.year) ?? 0) + x.bandwidth() / 2).attr('y', height - 13).text((row) => String(row.year).slice(2));

    const developmentRows = showDevelopmentAnnotations ? developmentBreakdown : [];
    const markers = svg.select<SVGGElement>('.chart-development-layer').selectAll<SVGGElement, DevelopmentBreakdownRow>('g')
      .data(developmentRows, (row) => String(row.year))
      .join(
        (enter) => { const group = enter.append('g').attr('class', 'development-annotation'); group.append('rect').attr('rx', 3).attr('height', 5); group.append('title'); return group; },
        (update) => update,
        (exit) => exit.transition().duration(250).style('opacity', 0).remove(),
      );
    markers.select('rect').attr('x', (row) => (x(row.year) ?? 0) + 2).attr('y', height - margin.bottom + 9).attr('width', Math.max(4, x.bandwidth() - 4));
    markers.select('title').text((row) => {
      const detail = row.stages.map((stage) => `${stage.label} ${formatUsd(stage.value)}`).join(' · ');
      return `${row.year}: ${formatUsd(row.total)} clinical-development spend${detail ? ` — ${detail}` : ''}`;
    });
  }, [data, segments, showDevelopmentAnnotations, developmentBreakdown]);

  return (
    <div className="revenue-chart-wrap">
      {scenario && countryYears.length > 0 && (
        <div className="chart-control-row">
          <div className="chart-series-legend">{series.map((item) => <span key={item.id}><i style={{ background: item.color }} />{item.label}</span>)}</div>
          <div className="chart-mode-toggle" role="group" aria-label="Color revenue by">
            <span>Color by</span>
            <button className={colorMode === 'indication' ? 'active' : ''} onClick={() => setColorMode('indication')}>Indication</button>
            <button className={colorMode === 'region' ? 'active' : ''} onClick={() => setColorMode('region')}>Region</button>
          </div>
        </div>
      )}
      <svg ref={svgRef} className="revenue-chart" viewBox="0 0 960 372" role="img" aria-label="Revenue forecast">
        <g className="chart-grid-layer" />
        <g className="chart-y-label-layer" />
        <g className="chart-bar-layer" />
        <g className="chart-total-label-layer" />
        <g className="chart-development-layer" />
        <g className="chart-x-label-layer" />
      </svg>
      {developmentBreakdown.length > 0 && (
        <div className="development-explainer">
          <div className="development-annotation-key"><i /> <strong>Clinical-development spend</strong> — annual modeled trial/program expenditure. The red marks annotate spend; they do not reduce revenue bar height.</div>
          <details className="development-breakdown">
            <summary>See stage-level development spend</summary>
            <div className="development-breakdown-grid">
              {developmentBreakdown.map((row) => (
                <div className="development-year-card" key={row.year}>
                  <div className="development-year-heading"><strong>{row.year}</strong><b>{formatUsd(row.total)}</b></div>
                  {row.stages.map((stage) => <div className="development-stage-line" key={stage.id}><span>{stage.label}</span><b>{formatUsd(stage.value)}</b></div>)}
                </div>
              ))}
            </div>
            <p className="development-breakdown-note">Only stage-level public/demo budgets are available here. The model does not invent a more granular clinical-cost breakdown.</p>
          </details>
        </div>
      )}
    </div>
  );
}
