import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';

export interface ChartDatum {
  Symbol: string;
  Time: string;
  Close: number;
  High: number;
  Low: number;
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

    const isLargeData = chartData.length > 180; // More than ~6 months of daily data
    const margin = { top: 40, right: 30, bottom: 60, left: 60 };
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
    const yExt = [
      d3.min(chartData, d => d.Low) ?? 0,
      d3.max(chartData, d => d.High) ?? 0
    ] as [number, number];

    // Scales
    const xScale = d3.scaleTime()
      .domain(dsExt) // Fixed: Use full range for accuracy
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

    // Defs for gradients & filters
    const defs = svg.append("defs");
    
    // Drop shadow filter (Restored original for premium look)
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
      .call(g1 => g1.selectAll(".tick line").attr("stroke", "currentColor").attr("class", "text-slate-200 dark:text-slate-800/50").attr("stroke-dasharray", "4,4"));

    g.append("g")
      .attr("class", "grid-y-down")
      .call(d3.axisLeft(yScaleDown).ticks(5).tickSize(-innerWidth).tickFormat(() => ""))
      .call(g1 => g1.select(".domain").remove())
      .call(g1 => g1.selectAll(".tick line").attr("stroke", "currentColor").attr("class", "text-slate-200 dark:text-slate-800/50").attr("stroke-dasharray", "4,4"));

    // Axes
    const xAxis = d3.axisBottom(xScale).ticks(isLargeData ? d3.timeMonth.every(1) : d3.timeWeek.every(1)).tickFormat(d => d3.timeFormat("%m-%d")(d as Date));
    g.append("g")
      .attr("transform", `translate(0, ${centerY})`) // Central X Axis
      .call(xAxis)
      .call(g1 => g1.select(".domain").attr("stroke", "currentColor").attr("class", "text-slate-300 dark:text-slate-700"))
      .call(g1 => g1.selectAll("text").attr("fill", "currentColor").attr("class", "text-slate-500 dark:text-slate-400 font-mono text-[10px]").attr("dy", d => (d3.timeFormat("%m-%d")(d as Date) === "01-01" ? 15 : 10)))
      .call(g1 => g1.selectAll("line").attr("stroke", "currentColor").attr("class", "text-slate-300 dark:text-slate-700"));

    const yAxisUp = d3.axisLeft(yScaleUp).ticks(5);
    g.append("g")
      .call(yAxisUp)
      .call(g1 => g1.select(".domain").attr("stroke", "transparent"))
      .call(g1 => g1.selectAll("text").attr("fill", colorUp).attr("class", "font-mono text-[10px]"));

    const yAxisDown = d3.axisLeft(yScaleDown).ticks(5);
    g.append("g")
      .call(yAxisDown)
      .call(g1 => g1.select(".domain").attr("stroke", "transparent"))
      .call(g1 => g1.selectAll("text").attr("fill", colorDown).attr("class", "font-mono text-[10px]"));

    // Tooltip logic
    let tooltip = d3.select(containerRef.current).select<HTMLDivElement>(".chart-tooltip");
    if (tooltip.empty()) {
      tooltip = d3.select(containerRef.current)
        .append("div")
        .attr("class", "chart-tooltip absolute hidden bg-white/95 dark:bg-slate-800/95 backdrop-blur-sm text-slate-800 dark:text-white p-3 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl pointer-events-none z-50 transition-all duration-150 ease-out")
    }

    const updateTooltipPosition = (event: any) => {
      const node = tooltip.node();
      if (!node || !containerRef.current) return;
      
      const [px, py] = d3.pointer(event, containerRef.current);
      const ttW = node.offsetWidth;
      const ttH = node.offsetHeight;
      const containerW = containerRef.current.clientWidth;

      let x = px - ttW / 2;
      let y = py - ttH - 20;

      if (x < 10) x = 10;
      if (x + ttW > containerW - 10) x = containerW - ttW - 10;
      if (y < 10) y = py + 25;

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
      .attr("class", "text-indigo-400/20 dark:text-indigo-400/20")
      .attr("x1", d => xScale(d.dateObj))
      .attr("x2", d => xScale(d.dateObj))
      .attr("y1", 0)
      .attr("y2", innerHeight)
      .attr("stroke", "currentColor")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "4,4");

    // Range lines (High to Low)
    const rangeGroup = g.append("g").attr("class", "ranges");
    
    rangeGroup.selectAll("line.range")
      .data(chartData)
      .enter()
      .append("line")
      .attr("class", "range")
      .attr("x1", d => xScale(d.dateObj))
      .attr("x2", d => xScale(d.dateObj))
      .attr("y1", d => d.isUp ? yScaleUp(d.High) : yScaleDown(d.High))
      .attr("y2", d => d.isUp ? yScaleUp(d.Low) : yScaleDown(d.Low))
      .attr("stroke", d => d.isUp ? colorUp : colorDown)
      .attr("stroke-width", 1.5)
      .style("opacity", 0.5);

    // Range Ticks (High)
    rangeGroup.selectAll("line.tick-high")
      .data(chartData)
      .enter()
      .append("line")
      .attr("class", "tick-high")
      .attr("x1", d => xScale(d.dateObj) - 2)
      .attr("x2", d => xScale(d.dateObj) + 2)
      .attr("y1", d => d.isUp ? yScaleUp(d.High) : yScaleDown(d.High))
      .attr("y2", d => d.isUp ? yScaleUp(d.High) : yScaleDown(d.High))
      .attr("stroke", d => d.isUp ? colorUp : colorDown)
      .attr("stroke-width", 1)
      .style("opacity", 0.8);

    // Range Ticks (Low)
    rangeGroup.selectAll("line.tick-low")
      .data(chartData)
      .enter()
      .append("line")
      .attr("class", "tick-low")
      .attr("x1", d => xScale(d.dateObj) - 2)
      .attr("x2", d => xScale(d.dateObj) + 2)
      .attr("y1", d => d.isUp ? yScaleUp(d.Low) : yScaleDown(d.Low))
      .attr("y2", d => d.isUp ? yScaleUp(d.Low) : yScaleDown(d.Low))
      .attr("stroke", d => d.isUp ? colorUp : colorDown)
      .attr("stroke-width", 1)
      .style("opacity", 0.8);

    // Period Extreme Lines
    const maxHighVal = d3.max(chartData, d => d.High) || 0;
    const minLowVal = d3.min(chartData, d => d.Low) || 0;
    const maxHighD = chartData.find(d => d.High === maxHighVal);
    const minLowD = chartData.find(d => d.Low === minLowVal);

    if (maxHighD) {
      const yPos = maxHighD.isUp ? yScaleUp(maxHighVal) : yScaleDown(maxHighVal);
      g.append("line")
        .attr("x1", 0).attr("x2", innerWidth)
        .attr("y1", yPos).attr("y2", yPos)
        .attr("stroke", colorUp).attr("stroke-dasharray", "4,4")
        .attr("stroke-width", 1).style("opacity", 0.4);

      g.append("text")
        .attr("x", innerWidth - 5).attr("y", yPos - 10)
        .attr("text-anchor", "end").attr("fill", colorUp)
        .attr("class", "text-[10px] font-mono font-bold")
        .text(`${t('drs.high', 'HIGH')}: $${maxHighVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${maxHighD.mmdd})`);
    }

    if (minLowD) {
      const yPos = minLowD.isUp ? yScaleUp(minLowVal) : yScaleDown(minLowVal);
      g.append("line")
        .attr("x1", 0).attr("x2", innerWidth)
        .attr("y1", yPos).attr("y2", yPos)
        .attr("stroke", colorDown).attr("stroke-dasharray", "4,4")
        .attr("stroke-width", 1).style("opacity", 0.4);

      g.append("text")
        .attr("x", innerWidth - 5).attr("y", yPos + 20)
        .attr("text-anchor", "end").attr("fill", colorDown)
        .attr("class", "text-[10px] font-mono font-bold")
        .text(`${t('drs.low', 'LOW')}: $${minLowVal.toLocaleString(undefined, { minimumFractionDigits: 2 })} (${minLowD.mmdd})`);
    }

    // Render the dots
    const dots = g.append("g")
      .attr("class", "dots")
      .selectAll("circle")
      .data(chartData)
      .enter()
      .append("circle")
      .attr("cx", d => xScale(d.dateObj))
      .attr("cy", d => d.isUp ? yScaleUp(d.Close) : yScaleDown(d.Close))
      .attr("r", isLargeData ? 2.5 : 3.5)
      .attr("fill", d => d.isUp ? colorUp : colorDown)
      .attr("filter", "url(#glow)")
      .style("pointer-events", "none")
      .style("opacity", 0);

    // Dynamic animation performance
    const delayFactor = isLargeData ? 1 : 3;
    const maxDelay = 600; // Cap stagger delay at 600ms

    dots.transition()
      .duration(700)
      .delay((_d, i) => Math.min(i * delayFactor, maxDelay))
      .style("opacity", 1);

    // Animate range lines as well (subtle fade in)
    rangeGroup.style("opacity", 0)
      .transition()
      .duration(1000)
      .style("opacity", 1);

    // End of Month lines subtle animation
    g.select(".eom-lines")
      .style("opacity", 0)
      .transition()
      .duration(1200)
      .style("opacity", 1);

    // Interactive Marker (only one circle for hover)
    const focus = g.append("g")
      .style("display", "none");

    const focusCircle = focus.append("circle")
      .attr("r", 7)
      .attr("fill", "none")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("filter", "url(#glow)");

    const focusDot = focus.append("circle")
      .attr("r", 4)
      .attr("stroke-width", 0);

    // Proximity lookup with d3.bisector
    const bisectDate = d3.bisector((d: any) => d.dateObj).left;

    // Overlay to capture mouse events for the whole chart area
    g.append("rect")
      .attr("width", innerWidth)
      .attr("height", innerHeight)
      .attr("fill", "transparent")
      .style("cursor", "crosshair")
      .on("mouseover", () => {
        focus.style("display", null);
        tooltip.classed("hidden", false).style("opacity", 1);
      })
      .on("mouseout", () => {
        focus.style("display", "none");
        tooltip.style("opacity", 0);
        setTimeout(() => tooltip.classed("hidden", true), 200);
      })
      .on("mousemove", function (event) {
        const [mx] = d3.pointer(event);
        const x0 = xScale.invert(mx);
        const i = bisectDate(chartData, x0, 1);
        const d0 = chartData[i - 1];
        const d1 = chartData[i];
        if (!d0 || !d1) return;
        
        const d = (x0.getTime() - d0.dateObj.getTime()) > (d1.dateObj.getTime() - x0.getTime()) ? d1 : d0;
        
        const xPos = xScale(d.dateObj);
        const yPos = d.isUp ? yScaleUp(d.Close) : yScaleDown(d.Close);
        
        focus.attr("transform", `translate(${xPos}, ${yPos})`);
        focusCircle.attr("stroke", d.isUp ? colorUp : colorDown);
        focusDot.attr("fill", d.isUp ? colorUp : colorDown);

        tooltip.html(`
          <div class="font-bold text-sm mb-2 border-b border-slate-200 dark:border-slate-700 pb-1 flex items-center justify-between">
            <span>${d.Symbol}</span>
            <span class="text-[10px] font-mono opacity-60">${d.mmdd}</span>
          </div>
          <div class="space-y-1.5">
            <div class="flex justify-between gap-6 text-xs">
              <span class="text-slate-500 dark:text-slate-400">${t('common.price', 'Price')}:</span>
              <span class="text-slate-900 dark:text-white font-mono font-bold">$${d.Close.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
            <div class="flex justify-between gap-6 text-[10px]">
              <span class="text-slate-500 dark:text-slate-400">${t('drs.rangeHL', 'Range (H/L)')}:</span>
              <span class="text-slate-800 dark:text-slate-200 font-mono">
                <span class="text-emerald-500">$${d.High.toFixed(2)}</span> / <span class="text-red-500">$${d.Low.toFixed(2)}</span>
              </span>
            </div>
            <div class="pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
               <span class="text-[10px] text-slate-500">${t('common.change', 'Change')}:</span>
               <span class="text-xs font-bold font-mono ${d.isUp ? 'text-emerald-500' : 'text-red-500'}">
                 ${d.isUp ? '▲' : '▼'} ${Math.abs(d.Close - d.prevClose).toFixed(2)} (${(((d.Close - d.prevClose) / d.prevClose) * 100).toFixed(2)}%)
               </span>
            </div>
          </div>
        `);
        
        updateTooltipPosition(event);
      });

    // Cleanup tooltips on unmount
    return () => {
      d3.select(containerRef.current).selectAll(".chart-tooltip").remove();
    };

  }, [data, width, height, year, t]);

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
