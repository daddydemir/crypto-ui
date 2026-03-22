import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';

export interface ChartDatum {
  Symbol: string;
  Time: string;
  Close: number;
}

interface DirectionalRangeStripProps {
  data: ChartDatum[];
  width?: number;
  height?: number;
  year?: string;
}

export const DirectionalRangeStrip: React.FC<DirectionalRangeStripProps> = ({ 
  data, 
  width = 1000, 
  height = 500,
  year = "2026"
}) => {
  const { t } = useTranslation();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current || !containerRef.current) return;

    const chartData = data.map((d, i) => {
      const prevClose = i > 0 ? data[i - 1].Close : d.Close;
      const isUp = d.Close >= prevClose;
      return {
        ...d,
        dateObj: new Date(d.Time),
        prevClose,
        isUp,
        yearStr: d.Time.substring(0, 4),
        mmdd: d.Time.substring(5, 10)
      };
    });

    if (chartData.length === 0) {
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const margin = { top: 30, right: 30, bottom: 40, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const centerY = innerHeight / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove(); // Clear previous render

    const g = svg
      .attr('viewBox', `0 0 ${width} ${height}`)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Extents
    const dsExt = d3.extent(chartData, d => d.dateObj) as [Date, Date];
    const yExt = d3.extent(chartData, d => d.Close) as [number, number];

    // Scales
    const xScale = d3.scaleTime()
      .domain(dsExt)
      .range([0, innerWidth]);

    // Top half: ranges from centerline (min val) to top (max val)
    const yScaleUp = d3.scaleLinear()
      .domain([yExt[0], yExt[1]])
      .range([centerY, 0]);

    // Bottom half: ranges from centerline (min val) to bottom (max val)
    const yScaleDown = d3.scaleLinear()
      .domain([yExt[0], yExt[1]])
      .range([centerY, innerHeight]);

    // Styling Tokens
    const colorUp = "rgba(16, 185, 129, 0.9)"; // Tailwind emerald-500
    const colorDown = "rgba(239, 68, 68, 0.9)"; // Tailwind red-500
    const colorUpGlow = "rgba(16, 185, 129, 0.3)";
    const colorDownGlow = "rgba(239, 68, 68, 0.3)";

    // Defs for gradients & filters
    const defs = svg.append("defs");
    
    // Drop shadow filter for dots
    const filter = defs.append("filter")
      .attr("id", "glow")
      .attr("x", "-20%")
      .attr("y", "-20%")
      .attr("width", "140%")
      .attr("height", "140%");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3")
      .attr("result", "blur");
    filter.append("feComposite")
      .attr("in", "SourceGraphic")
      .attr("in2", "blur")
      .attr("operator", "over");

    // Background Grid
    g.append("g")
      .attr("class", "grid-y-up")
      .call(d3.axisLeft(yScaleUp).ticks(5).tickSize(-innerWidth).tickFormat(() => ""))
      .call(g1 => g1.select(".domain").remove())
      .call(g1 => g1.selectAll(".tick line").attr("stroke", "currentColor").attr("class", "text-slate-200 dark:text-slate-800").attr("stroke-dasharray", "4,4"));

    g.append("g")
      .attr("class", "grid-y-down")
      .call(d3.axisLeft(yScaleDown).ticks(5).tickSize(-innerWidth).tickFormat(() => ""))
      .call(g1 => g1.select(".domain").remove())
      .call(g1 => g1.selectAll(".tick line").attr("stroke", "currentColor").attr("class", "text-slate-200 dark:text-slate-800").attr("stroke-dasharray", "4,4"));

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(d3.timeMonth.every(1)).tickFormat(d => d3.timeFormat("%m-%d")(d as Date));
    g.append("g")
      .attr("transform", `translate(0, ${centerY})`) // Central X Axis
      .call(xAxis)
      .call(g1 => g1.select(".domain").attr("stroke", "currentColor").attr("class", "text-slate-300 dark:text-slate-700"))
      .call(g1 => g1.selectAll("text").attr("fill", "currentColor").attr("class", "text-slate-500 dark:text-slate-400").attr("dy", d => (d3.timeFormat("%m-%d")(d as Date) === "01-01" ? 15 : 10)))
      .call(g1 => g1.selectAll("line").attr("stroke", "currentColor").attr("class", "text-slate-300 dark:text-slate-700"));

    const yAxisUp = d3.axisLeft(yScaleUp).ticks(5);
    g.append("g")
      .call(yAxisUp)
      .call(g1 => g1.select(".domain").attr("stroke", "transparent"))
      .call(g1 => g1.selectAll("text").attr("fill", colorUp));

    const yAxisDown = d3.axisLeft(yScaleDown).ticks(5);
    g.append("g")
      .call(yAxisDown)
      .call(g1 => g1.select(".domain").attr("stroke", "transparent"))
      .call(g1 => g1.selectAll("text").attr("fill", colorDown));

    // Tooltip logic
    let tooltip = d3.select(containerRef.current).select<HTMLDivElement>(".chart-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select(containerRef.current)
        .append("div")
        .attr("class", "chart-tooltip absolute hidden bg-white dark:bg-slate-800 text-slate-800 dark:text-white p-3 rounded-lg border border-slate-200 dark:border-slate-700 shadow-xl pointer-events-none z-50 transition-opacity")
    }

    const updateTooltipPosition = (event: any) => {
      const node = tooltip.node();
      if (!node || !containerRef.current) return;
      const [px, py] = d3.pointer(event, containerRef.current);
      const ttW = node.offsetWidth;
      const ttH = node.offsetHeight;
      const containerW = containerRef.current.clientWidth;

      let x = px - ttW / 2;
      let y = py - ttH - 15; // 15px above cursor

      if (x < 10) x = 10;
      if (x + ttW > containerW - 10) x = containerW - ttW - 10;
      if (y < 10) y = py + 20; // Flip below cursor if too high

      tooltip.style("left", `${x}px`).style("top", `${y}px`);
    };

    // Draw End of Month lines
    const endOfMonths = chartData.filter((d, i, arr) => {
      if (i === arr.length - 1) return true;
      return d.dateObj.getMonth() !== arr[i + 1].dateObj.getMonth();
    });

    g.append("g")
      .attr("class", "eom-lines")
      .selectAll("line")
      .data(endOfMonths)
      .enter()
      .append("line")
      .attr("class", "text-indigo-400/40 dark:text-indigo-400/40")
      .attr("x1", d => xScale(d.dateObj))
      .attr("x2", d => xScale(d.dateObj))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "6,6")
      .style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1);

    // Connecting Drop lines behind dots
    g.append("g")
      .selectAll("line")
      .data(chartData)
      .enter()
      .append("line")
      .attr("x1", d => xScale(d.dateObj))
      .attr("x2", d => xScale(d.dateObj))
      .attr("y1", centerY)
      .attr("y2", d => d.isUp ? yScaleUp(d.Close) : yScaleDown(d.Close))
      .attr("stroke", d => d.isUp ? colorUpGlow : colorDownGlow)
      .attr("stroke-width", 1.5)
      .attr("stroke-dasharray", "2,2")
      .style("opacity", 0)
      .transition()
      .duration(800)
      .delay((_d, i) => i * 5)
      .style("opacity", 1);

    // Render the dots
    g.append("g")
      .selectAll("circle")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.dateObj))
      .attr("cy", centerY) // Start from center for animation
      .attr("r", 0)
      .attr("fill", d => d.isUp ? colorUp : colorDown)
      .attr("filter", "url(#glow)")
      .style("cursor", "crosshair")
      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 6)
          .attr("stroke", "#fff")
          .attr("stroke-width", 1.5);
          
        tooltip.classed("hidden", false)
          .html(`
            <div class="font-bold text-sm mb-1">${d.Symbol} • ${d.mmdd}</div>
            <div class="text-xs text-slate-500 dark:text-slate-300">${t('coins.price', 'Price')}: <span class="text-slate-900 dark:text-white font-mono">$${d.Close.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></div>
            <div class="text-xs mt-1 ${d.isUp ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500 dark:text-red-400'}">
              ${d.isUp ? '▲' : '▼'} ${Math.abs(d.Close - d.prevClose).toFixed(2)} (${(((d.Close - d.prevClose) / d.prevClose) * 100).toFixed(2)}%)
            </div>
          `)
          .style("opacity", 1);
          
        // update position immediately after content is added (so width/height is calculated)
        updateTooltipPosition(event);
      })
      .on("mousemove", function (event) {
        updateTooltipPosition(event);
      })
      .on("mouseout", function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr("r", 3.5)
          .attr("stroke", "none");
          
        tooltip.style("opacity", 0);
        setTimeout(() => tooltip.classed("hidden", true), 200); // Wait for transition
      })
      .transition()
      .duration(800)
      .delay((_d, i) => i * 5)
      .attr("cy", d => d.isUp ? yScaleUp(d.Close) : yScaleDown(d.Close))
      .attr("r", 3.5);

    // Cleanup tooltips on unmount
    return () => {
      d3.select(containerRef.current).selectAll(".chart-tooltip").remove();
    };

  }, [data, width, height, year]);

  return (
    <div 
      ref={containerRef} 
      className="relative w-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm dark:shadow-2xl p-4"
    >
      <div className="absolute top-4 right-6 flex flex-col pointer-events-none items-end">
        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono tracking-wider border border-slate-200 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-md inline-block shadow-sm">
          {year} {t('common.data', 'DATA')}
        </p>
      </div>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="block"
      />
    </div>
  );
};
