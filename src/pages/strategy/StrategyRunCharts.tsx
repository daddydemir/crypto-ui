import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, Legend, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Equity } from "@/services/strategyLabService";

type PerformanceTooltipProps = { active?: boolean; payload?: Array<{ payload?: Equity }>; label?: string; mode: "return" | "value"; locale: string };

function PerformanceTooltip({ active, payload, label, mode, locale }: PerformanceTooltipProps) {
  const { t } = useTranslation();
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  const format = (value: number) => mode === "return" ? `${value >= 0 ? "+" : ""}${value.toFixed(2)}%` : `$${value.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const strategy = mode === "return" ? point.strategyReturn : point.equity;
  const benchmark = mode === "return" ? point.benchmarkReturn : point.benchmarkEquity;
  return <div className="min-w-48 rounded-xl border bg-white p-3 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900">
    <p className="mb-2 font-semibold">{new Date(label ?? point.date).toLocaleDateString(locale)}</p>
    <p className="flex justify-between gap-6"><span>{t(mode === "return" ? "strategyChartSeries.strategyReturn" : "strategyChartSeries.strategyPortfolio")}</span><strong>{format(strategy)}</strong></p>
    <p className="flex justify-between gap-6"><span>{t(mode === "return" ? "strategyChartSeries.buyHoldReturn" : "strategyChartSeries.buyHoldPortfolio")}</span><strong>{format(benchmark)}</strong></p>
    {mode === "return" && <p className="mt-2 flex justify-between gap-6 border-t pt-2 dark:border-slate-700"><span>{t("strategyCharts.difference")}</span><strong>{strategy - benchmark >= 0 ? "+" : ""}{(strategy - benchmark).toFixed(2)} pp</strong></p>}
  </div>;
}

export function StrategyPerformanceChart({ history, locale }: { history: Equity[]; locale: string }) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<"return" | "value">("return");
  const strategyKey = mode === "return" ? "strategyReturn" : "equity";
  const benchmarkKey = mode === "return" ? "benchmarkReturn" : "benchmarkEquity";
  const strategyName = t(mode === "return" ? "strategyChartSeries.strategyReturn" : "strategyChartSeries.strategyPortfolio");
  const benchmarkName = t(mode === "return" ? "strategyChartSeries.buyHoldReturn" : "strategyChartSeries.buyHoldPortfolio");
  const axis = (value: number) => mode === "return" ? `${value.toFixed(0)}%` : `$${value.toLocaleString(locale, { maximumFractionDigits: 0 })}`;
  return <section className="mt-6 rounded-2xl border p-4">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><h3 className="font-bold">{t("strategyCharts.performance")}</h3><p className="text-sm text-slate-500">{t("strategyCharts.performanceDescription")}</p></div><div className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 text-sm dark:bg-slate-800">{(["return", "value"] as const).map((value) => <button key={value} onClick={() => setMode(value)} className={`rounded-md px-3 py-2 font-semibold transition ${mode === value ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-indigo-300" : "text-slate-500"}`}>{t(`strategyCharts.${value}`)}</button>)}</div></div>
    <div className="mt-4 h-72 min-w-0 sm:h-80"><ResponsiveContainer width="100%" height="100%"><AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><defs><linearGradient id="runStrategy" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient><linearGradient id="runBenchmark" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f59e0b" stopOpacity={0.18}/><stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="4 6" vertical={false} opacity={0.3}/><XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString(locale, { month: "short", day: "numeric" })} minTickGap={35} tickLine={false} axisLine={false}/><YAxis tickFormatter={axis} width={64} tickLine={false} axisLine={false}/>{mode === "return" && <ReferenceLine y={0} stroke="#64748b" strokeDasharray="4 4"/>}<Tooltip content={<PerformanceTooltip mode={mode} locale={locale}/>}/><Legend/><Area type="monotone" dataKey={strategyKey} name={strategyName} stroke="#6366f1" strokeWidth={3} fill="url(#runStrategy)" connectNulls/><Area type="monotone" dataKey={benchmarkKey} name={benchmarkName} stroke="#f59e0b" strokeWidth={2} fill="url(#runBenchmark)" connectNulls/></AreaChart></ResponsiveContainer></div>
  </section>;
}

function DrawdownTooltip({ active, payload, label, locale }: { active?: boolean; payload?: Array<{ payload?: Equity }>; label?: string; locale: string }) {
  const { t } = useTranslation();
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return <div className="rounded-xl border bg-white p-3 text-sm shadow-xl dark:border-slate-700 dark:bg-slate-900"><p className="mb-2 font-semibold">{new Date(label ?? point.date).toLocaleDateString(locale)}</p><p className="flex justify-between gap-6"><span>{t("strategyCharts.drawdown")}</span><strong>{point.drawdown.toFixed(2)}%</strong></p><p className="flex justify-between gap-6"><span>{t("strategyCharts.previousPeak")}</span><strong>${point.runningPeak.toLocaleString(locale, { maximumFractionDigits: 2 })}</strong></p><p className="flex justify-between gap-6"><span>{t("strategyCharts.currentEquity")}</span><strong>${point.equity.toLocaleString(locale, { maximumFractionDigits: 2 })}</strong></p></div>;
}

export function StrategyDrawdownChart({ history, maxDrawdown, locale }: { history: Equity[]; maxDrawdown: number; locale: string }) {
  const { t } = useTranslation();
  return <section className="mt-4 rounded-2xl border p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-bold">{t("strategyCharts.drawdown")}</h3><p className="text-sm text-slate-500">{t("strategyCharts.dailyValues")}</p></div><div className="rounded-lg bg-rose-50 px-3 py-2 text-right dark:bg-rose-950/30"><p className="text-xs text-slate-500">{t("strategyCharts.maxDrawdown")}</p><p className="font-bold text-rose-600">{maxDrawdown.toFixed(2)}%</p></div></div><div className="mt-4 h-56 min-w-0 sm:h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={history} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}><defs><linearGradient id="runDrawdown" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/><stop offset="95%" stopColor="#f43f5e" stopOpacity={0.04}/></linearGradient></defs><CartesianGrid strokeDasharray="4 6" vertical={false} opacity={0.3}/><XAxis dataKey="date" tickFormatter={(value) => new Date(value).toLocaleDateString(locale, { month: "short", day: "numeric" })} minTickGap={35} tickLine={false} axisLine={false}/><YAxis tickFormatter={(value) => `${Number(value).toFixed(0)}%`} width={54} domain={["dataMin", 0]} tickLine={false} axisLine={false}/><ReferenceLine y={0} stroke="#64748b"/><Tooltip content={<DrawdownTooltip locale={locale}/>}/><Area type="monotone" dataKey="drawdown" name={t("strategyCharts.drawdown")} stroke="#f43f5e" strokeWidth={2} fill="url(#runDrawdown)"/></AreaChart></ResponsiveContainer></div></section>;
}
