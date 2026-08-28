import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import type { YearResult } from '../model/types';

interface CashFlowChartProps { data: YearResult[]; }

export function CashFlowChart({ data }: CashFlowChartProps) {
  const ref = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!ref.current || !data.length) return;
    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    const width = 900;
    const height = 280;
    const margin = { top: 20, right: 20, bottom: 36, left: 72 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const g = svg.attr('viewBox', `0 0 ${width} ${height}`).append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleLinear().domain(d3.extent(data, (d) => d.year) as [number, number]).range([0, innerWidth]);
    const extent = d3.extent(data, (d) => d.cumulativeCashFlowUsd) as [number, number];
    const y = d3.scaleLinear().domain([Math.min(0, extent[0]), Math.max(0, extent[1])]).nice().range([innerHeight, 0]);

    g.append('g').attr('transform', `translate(0,${innerHeight})`).call(d3.axisBottom(x).tickFormat(d3.format('d')).ticks(8)).call((axis) => axis.select('.domain').attr('stroke', '#40505f')).call((axis) => axis.selectAll('text').attr('fill', '#91a1b1'));
    g.append('g').call(d3.axisLeft(y).ticks(5).tickFormat((d) => `$${d3.format('.2s')(Number(d))}`)).call((axis) => axis.select('.domain').remove()).call((axis) => axis.selectAll('text').attr('fill', '#91a1b1')).call((axis) => axis.selectAll('.tick line').attr('stroke', '#263441').attr('x2', innerWidth));

    const zero = y(0);
    g.append('line').attr('x1', 0).attr('x2', innerWidth).attr('y1', zero).attr('y2', zero).attr('stroke', '#718096').attr('stroke-dasharray', '4 4');

    const line = d3.line<YearResult>().x((d) => x(d.year)).y((d) => y(d.cumulativeCashFlowUsd)).curve(d3.curveMonotoneX);
    g.append('path').datum(data).attr('fill', 'none').attr('stroke', '#65d6ff').attr('stroke-width', 2.5).attr('d', line);
  }, [data]);

  return <svg ref={ref} className="cashflow-chart" role="img" aria-label="Cumulative cash flow forecast" />;
}
