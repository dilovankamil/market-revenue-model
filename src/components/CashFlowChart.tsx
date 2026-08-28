import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { YearResult } from '../model/types';

interface CashFlowChartProps { data: YearResult[]; }

const formatAxisUsd = (value: number) => {
  const abs = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(abs >= 10_000_000_000 ? 0 : 1)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 100_000_000 ? 0 : 1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${Math.round(abs)}`;
};

export function CashFlowChart({ data }: CashFlowChartProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();
    const width = 900;
    const height = 290;
    const margin = { top: 28, right: 20, bottom: 36, left: 72 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const g = svg.attr('viewBox', `0 0 ${width} ${height}`).append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const x = d3.scaleLinear().domain(d3.extent(data, (d) => d.year) as [number, number]).range([0, innerWidth]);
    const financingPresent = data.some((row) => row.financingCashUsd !== 0);
    const values = data.flatMap((row) => financingPresent ? [row.cumulativeCashFlowUsd, row.cashBalanceUsd] : [row.cumulativeCashFlowUsd]);
    const extent = d3.extent(values) as [number, number];
    const y = d3.scaleLinear().domain([Math.min(0, extent[0]), Math.max(0, extent[1])]).nice().range([innerHeight, 0]);

    g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8))
      .call((axis) => axis.select('.domain').attr('stroke', '#40505f')).call((axis) => axis.selectAll('text').attr('fill', '#91a1b1'));
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat((d) => formatAxisUsd(Number(d))))
      .call((axis) => axis.select('.domain').remove()).call((axis) => axis.selectAll('text').attr('fill', '#91a1b1'))
      .call((axis) => axis.selectAll('.tick line').attr('stroke', '#263441').attr('x2', innerWidth));

    const zero = y(0);
    g.append('line').attr('x1', 0).attr('x2', innerWidth).attr('y1', zero).attr('y2', zero).attr('stroke', '#718096').attr('stroke-dasharray', '4 4');
    const operatingLine = d3.line<YearResult>().x((d) => x(d.year)).y((d) => y(d.cumulativeCashFlowUsd)).curve(d3.curveMonotoneX);
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#65d6ff').attr('stroke-width', 2.5).attr('d', operatingLine);

    if (financingPresent) {
      const balanceLine = d3.line<YearResult>().x((d) => x(d.year)).y((d) => y(d.cashBalanceUsd)).curve(d3.curveMonotoneX);
      g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#f5b942').attr('stroke-width', 2).attr('stroke-dasharray', '6 4').attr('d', balanceLine);
      const legend = g.append('g').attr('transform', `translate(${innerWidth - 240},-16)`);
      legend.append('line').attr('x1', 0).attr('x2', 18).attr('y1', 0).attr('y2', 0).attr('stroke', '#65d6ff').attr('stroke-width', 2.5);
      legend.append('text').attr('x', 24).attr('y', 4).attr('fill', '#91a1b1').attr('font-size', 9).text('Operating cash flow');
      legend.append('line').attr('x1', 116).attr('x2', 134).attr('y1', 0).attr('y2', 0).attr('stroke', '#f5b942').attr('stroke-width', 2).attr('stroke-dasharray', '5 3');
      legend.append('text').attr('x', 140).attr('y', 4).attr('fill', '#91a1b1').attr('font-size', 9).text('Cash after financing');
    }
  }, [data]);

  return <svg ref={ref} className="cashflow-chart" role="img" aria-label="Cumulative cash flow forecast" />;
}
