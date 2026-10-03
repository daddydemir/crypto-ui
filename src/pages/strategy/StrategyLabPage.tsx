import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import {
  Copy,
  FlaskConical,
  Pencil,
  Pause,
  Play,
  Plus,
  Square,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Modal from "@/components/common/Modal";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTopCoins } from "@/services/coinService";
import { useToast } from "@/contexts/ToastContext";
import { StrategyDrawdownChart, StrategyPerformanceChart } from "./StrategyRunCharts";
import {
  strategyApi,
  type Condition,
  type Configuration,
  type Equity,
  type Strategy,
  type StrategyRun,
  type Trade,
} from "@/services/strategyLabService";

const fields = [
  "price",
  "rsi",
  "ma7",
  "ma25",
  "ma99",
  "macd",
  "signal",
  "histogram",
  "upperBand",
  "lowerBand",
  "ma20",
];
const emptyCondition = (): Condition => ({
  left: "ma7",
  operator: "gt",
  rightField: "ma25",
});
const emptyConfiguration = (): Configuration => ({
  entry: { logic: "AND", conditions: [emptyCondition()] },
  exit: {
    logic: "OR",
    conditions: [{ left: "rsi", operator: "gt", value: 70 }],
  },
  risk: {},
});

function AppSelect({
  value,
  items,
  onChange,
  className = "w-full",
  searchPlaceholder,
}: {
  value: string;
  items: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  className?: string;
  searchPlaceholder?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent
        searchable={items.length > 6}
        searchPlaceholder={searchPlaceholder}
      >
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function StrategyLabPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [strategies, setStrategies] = useState<Strategy[]>([]),
    [runs, setRuns] = useState<StrategyRun[]>([]);
  const [coins, setCoins] = useState([{ value: "BTC", label: "BTC" }]);
  const [builderOpen, setBuilderOpen] = useState(false),
    [editing, setEditing] = useState<Strategy | null>(null);
  const [confirming, setConfirming] = useState<{
    action: "delete" | "clone";
    strategy: Strategy;
  } | null>(null);
  const [deletingRun, setDeletingRun] = useState<StrategyRun | null>(null);
  const [runFor, setRunFor] = useState<Strategy | null>(null),
    [coinSymbol, setCoinSymbol] = useState("BTC"),
    [duration, setDuration] = useState("30d");
  const [customStart, setCustomStart] = useState(""),
    [customEnd, setCustomEnd] = useState(""),
    [starting, setStarting] = useState(false);
  const [detail, setDetail] = useState<{
    run: StrategyRun;
    equity: Equity[];
    trades: Trade[];
  } | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    configuration: emptyConfiguration(),
  });
  const locale = i18n.language.startsWith("tr") ? "tr-TR" : "en-US";
  const load = async () => {
    const [s, r] = await Promise.all([strategyApi.list(), strategyApi.runs()]);
    setStrategies(s);
    setRuns(r);
  };
  useEffect(() => {
    void load();
    void getTopCoins().then((v) => {
      const options = v.map((c) => ({
        value: c.symbol.toUpperCase(),
        label: `${c.symbol.toUpperCase()} · ${c.name}`,
      }));
      if (options.length) setCoins(options);
    });
  }, []);
  useEffect(() => {
    if (
      !runs.some(
        (run) =>
          run.status === "QUEUED" ||
          (run.type === "BACKTEST" && run.status === "RUNNING"),
      )
    )
      return;
    const timer = window.setInterval(() => {
      void strategyApi.runs().then(setRuns);
    }, 2000);
    return () => window.clearInterval(timer);
  }, [runs]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", configuration: emptyConfiguration() });
    setBuilderOpen(true);
  };
  const openEdit = (s: Strategy) => {
    setEditing(s);
    setForm({
      name: s.name,
      description: s.description,
      configuration: structuredClone(s.configuration),
    });
    setBuilderOpen(true);
  };
  const updateCondition = (
    side: "entry" | "exit",
    index: number,
    next: Condition,
  ) =>
    setForm((current) => {
      const conditions = [...current.configuration[side].conditions];
      conditions[index] = next;
      return {
        ...current,
        configuration: {
          ...current.configuration,
          [side]: { ...current.configuration[side], conditions },
        },
      };
    });
  const addCondition = (side: "entry" | "exit") =>
    setForm((current) => ({
      ...current,
      configuration: {
        ...current.configuration,
        [side]: {
          ...current.configuration[side],
          conditions: [
            ...current.configuration[side].conditions,
            emptyCondition(),
          ],
        },
      },
    }));
  const save = async () => {
    const saved = editing
      ? await strategyApi.update(editing.id, form)
      : await strategyApi.create(form);
    setStrategies((current) =>
      editing
        ? current.map((s) =>
            s.id === saved.id ? { ...saved, runCount: s.runCount } : s,
          )
        : [saved, ...current],
    );
    setBuilderOpen(false);
    setEditing(null);
  };
  const confirmAction = async () => {
    if (!confirming) return;
    const target = confirming;
    setConfirming(null);
    if (target.action === "delete") {
      setStrategies((current) =>
        current.filter((s) => s.id !== target.strategy.id),
      );
      await strategyApi.remove(target.strategy.id);
    } else {
      const cloned = await strategyApi.clone(target.strategy.id);
      setStrategies((current) => [cloned, ...current]);
    }
  };
  const deleteRun = async () => {
    if (!deletingRun) return;
    const target = deletingRun;
    setDeletingRun(null);
    setRuns((current) => current.filter((run) => run.id !== target.id));
    setStrategies((current) =>
      current.map((strategy) =>
        strategy.id === target.strategyId
          ? { ...strategy, runCount: Math.max(0, strategy.runCount - 1) }
          : strategy,
      ),
    );
    try {
      await strategyApi.removeRun(target.id);
    } catch {
      await load();
      toast.error(t("common.error"));
    }
  };
  const start = async (type: "backtests" | "forward-tests") => {
    if (!runFor || starting) return;
    const now = new Date(),
      startDate = new Date(now),
      endDate = new Date(now);
    if (duration === "custom") {
      if (!customStart || !customEnd) return;
      startDate.setTime(new Date(`${customStart}T00:00:00`).getTime());
      endDate.setTime(new Date(`${customEnd}T23:59:59`).getTime());
    } else if (type === "backtests") {
      if (duration === "30d") startDate.setDate(startDate.getDate() - 30);
      if (duration === "90d") startDate.setDate(startDate.getDate() - 90);
      if (duration === "6m") startDate.setMonth(startDate.getMonth() - 6);
      if (duration === "1y") startDate.setFullYear(startDate.getFullYear() - 1);
    } else {
      if (duration === "30d") endDate.setDate(endDate.getDate() + 30);
      if (duration === "90d") endDate.setDate(endDate.getDate() + 90);
      if (duration === "6m") endDate.setMonth(endDate.getMonth() + 6);
      if (duration === "1y") endDate.setFullYear(endDate.getFullYear() + 1);
    }
    setStarting(true);
    try {
      const run = await strategyApi.start(runFor.id, type, {
        coinSymbol,
        startDate: (type === "backtests" || duration === "custom"
          ? startDate
          : now
        ).toISOString(),
        endDate:
          duration === "until_stopped" ? undefined : endDate.toISOString(),
        initialCapital: 500,
        feePercent: 0.1,
        slippagePercent: 0.05,
      });
      setRuns((current) => [run, ...current]);
      setRunFor(null);
      toast.success(
        t(type === "backtests" ? "strategyLab.queued" : "strategyLab.started"),
      );
    } finally {
      setStarting(false);
    }
  };
  const show = async (run: StrategyRun) => {
    const [fullRun, equity, trades] = await Promise.all([
      strategyApi.run(run.id),
      strategyApi.equity(run.id),
      strategyApi.trades(run.id),
    ]);
    setDetail({ run: fullRun, equity, trades });
  };
  useEffect(() => {
    const runID = Number(searchParams.get("runId"));
    const strategyID = Number(searchParams.get("strategyId"));
    if (runID && runs.length) {
      const run = runs.find((item) => item.id === runID);
      if (run) { void show(run); setSearchParams({}, { replace: true }); }
    } else if (strategyID && strategies.length) {
      const strategy = strategies.find((item) => item.id === strategyID);
      if (strategy) { openEdit(strategy); setSearchParams({}, { replace: true }); }
    }
  }, [runs, strategies, searchParams, setSearchParams]);

  return (
    <div className="page-shell">
      <section className="page-hero">
        <div className="relative z-10 flex items-end justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.2em] text-indigo-300">
              {t("strategyLab.eyebrow")}
            </p>
            <h1 className="mt-2 text-3xl font-bold">
              {t("strategyLab.title")}
            </h1>
            <p className="mt-2 text-slate-300">{t("strategyLab.subtitle")}</p>
          </div>
          <button className="primary-action" onClick={openCreate}>
            <Plus className="h-4 w-4" />
            {t("strategyLab.create")}
          </button>
        </div>
      </section>
      <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
        {t("strategyLab.dailyCloseNotice")}
      </div>
      <section>
        <h2 className="mb-3 text-lg font-bold">
          {t("strategyLab.strategies")}
        </h2>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {strategies.map((s) => (
            <div className="surface-card p-5" key={s.id}>
              <div className="flex justify-between">
                <div>
                  <h3 className="font-bold">{s.name}</h3>
                  <p className="text-xs text-slate-500">
                    v{s.version} · {s.runCount} {t("strategyLab.runs")}
                  </p>
                </div>
                <FlaskConical className="h-5 w-5 text-indigo-500" />
              </div>
              <p className="mt-3 text-sm text-slate-500">{s.description}</p>
              <div className="mt-4 flex gap-2">
                <button className="primary-action" onClick={() => setRunFor(s)}>
                  <Play className="h-4 w-4" />
                  {t("strategyLab.run")}
                </button>
                <button
                  className="rounded-lg border p-2"
                  title={t("strategyLab.edit")}
                  onClick={() => openEdit(s)}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="rounded-lg border p-2"
                  title={t("strategyLab.clone")}
                  onClick={() =>
                    setConfirming({ action: "clone", strategy: s })
                  }
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  className="rounded-lg border p-2 text-rose-500"
                  title={t("strategyLab.delete")}
                  onClick={() =>
                    setConfirming({ action: "delete", strategy: s })
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-bold">{t("strategyLab.activity")}</h2>
        <div className="surface-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-slate-500">
                <th className="p-4">{t("strategyLab.strategy")}</th>
                <th>{t("strategyLab.coin")}</th>
                <th>{t("strategyLab.mode")}</th>
                <th>{t("strategyLab.status")}</th>
                <th>{t("strategyLab.return")}</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => (
                <tr className="border-b dark:border-slate-800" key={run.id}>
                  <td className="p-4 font-semibold">
                    {run.strategySnapshot.name}
                  </td>
                  <td>{run.coinSymbol}</td>
                  <td>{run.type}</td>
                  <td>{run.status}</td>
                  <td
                    className={
                      run.metrics.totalReturn >= 0
                        ? "text-emerald-600"
                        : "text-rose-600"
                    }
                  >
                    {run.metrics.totalReturn?.toFixed(2)}%
                  </td>
                  <td className="flex gap-2 p-2">
                    <button
                      className="rounded-lg border px-3 py-2"
                      onClick={() => void show(run)}
                    >
                      {t("strategyLab.details")}
                    </button>
                    {run.type === "FORWARD_TEST" && (
                      <>
                        {run.status === "RUNNING" ? (
                          <button
                            className="p-2"
                            onClick={async () => {
                              await strategyApi.status(run.id, "pause");
                              await load();
                            }}
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        ) : run.status === "PAUSED" ? (
                          <button
                            className="p-2"
                            onClick={async () => {
                              await strategyApi.status(run.id, "resume");
                              await load();
                            }}
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          className="p-2"
                          onClick={async () => {
                            await strategyApi.status(run.id, "stop");
                            await load();
                          }}
                        >
                          <Square className="h-4 w-4" />
                        </button>
                      </>
                    )}
                    {run.status !== "QUEUED" && run.status !== "RUNNING" && (
                      <button
                        className="rounded-lg border p-2 text-rose-500"
                        title={t("strategyLab.delete")}
                        onClick={() => setDeletingRun(run)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <Modal
        isOpen={builderOpen}
        onClose={() => setBuilderOpen(false)}
        title={t(
          editing
            ? "strategyLab.builder.editTitle"
            : "strategyLab.builder.title",
        )}
        maxWidth="max-w-4xl"
      >
        <div className="space-y-5">
          <input
            className="w-full rounded-xl border bg-transparent p-3"
            placeholder={t("strategyLab.builder.name")}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="w-full rounded-xl border bg-transparent p-3"
            placeholder={t("strategyLab.builder.description")}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          {(["entry", "exit"] as const).map((side) => (
            <div key={side}>
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold">
                  {t(`strategyLab.builder.${side}`)}
                </h3>
                <AppSelect
                  className="w-28"
                  value={form.configuration[side].logic}
                  items={[
                    { value: "AND", label: "AND" },
                    { value: "OR", label: "OR" },
                  ]}
                  onChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      configuration: {
                        ...current.configuration,
                        [side]: {
                          ...current.configuration[side],
                          logic: value as "AND" | "OR",
                        },
                      },
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                {form.configuration[side].conditions.map((condition, index) => (
                  <div
                    className="grid gap-2 md:grid-cols-[1fr_90px_130px_1fr]"
                    key={index}
                  >
                    <AppSelect
                      value={condition.left}
                      items={fields.map((value) => ({ value, label: value }))}
                      onChange={(value) =>
                        updateCondition(side, index, {
                          ...condition,
                          left: value,
                        })
                      }
                    />
                    <AppSelect
                      value={condition.operator}
                      items={[
                        { value: "gt", label: ">" },
                        { value: "lt", label: "<" },
                      ]}
                      onChange={(value) =>
                        updateCondition(side, index, {
                          ...condition,
                          operator: value as "gt" | "lt",
                        })
                      }
                    />
                    <AppSelect
                      value={condition.rightField ? "field" : "value"}
                      items={[
                        { value: "field", label: t("topbar.indicator") },
                        { value: "value", label: t("topbar.fixedValue") },
                      ]}
                      onChange={(mode) =>
                        updateCondition(
                          side,
                          index,
                          mode === "field"
                            ? { left: condition.left, operator: condition.operator, rightField: "ma25" }
                            : { left: condition.left, operator: condition.operator, value: 0 },
                        )
                      }
                    />
                    {condition.rightField ? (
                      <AppSelect
                        value={condition.rightField}
                        items={fields.map((value) => ({ value, label: value }))}
                        onChange={(value) => updateCondition(side, index, { left: condition.left, operator: condition.operator, rightField: value })}
                      />
                    ) : (
                      <input
                        type="number"
                        className="h-9 rounded-md border bg-transparent px-3"
                        placeholder={t("topbar.fixedValue")}
                        value={condition.value ?? ""}
                        onChange={(e) => updateCondition(side, index, { left: condition.left, operator: condition.operator, value: e.target.value === "" ? undefined : Number(e.target.value) })}
                      />
                    )}
                  </div>
                ))}
              </div>
              <button
                className="mt-2 text-sm font-medium text-indigo-500"
                onClick={() => addCondition(side)}
              >
                + {t("strategyLab.builder.condition")}
              </button>
            </div>
          ))}
          <div className="grid gap-3 md:grid-cols-2">
            <input
              type="number"
              className="rounded-xl border bg-transparent p-3"
              placeholder={t("strategyLab.builder.stopLoss")}
              value={form.configuration.risk.stopLossPercent ?? ""}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  configuration: {
                    ...current.configuration,
                    risk: {
                      ...current.configuration.risk,
                      stopLossPercent: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    },
                  },
                }))
              }
            />
            <input
              type="number"
              className="rounded-xl border bg-transparent p-3"
              placeholder={t("strategyLab.builder.takeProfit")}
              value={form.configuration.risk.takeProfitPercent ?? ""}
              onChange={(e) =>
                setForm((current) => ({
                  ...current,
                  configuration: {
                    ...current.configuration,
                    risk: {
                      ...current.configuration.risk,
                      takeProfitPercent: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    },
                  },
                }))
              }
            />
          </div>
          <button className="primary-action" onClick={() => void save()}>
            {t(
              editing
                ? "strategyLab.builder.update"
                : "strategyLab.builder.save",
            )}
          </button>
        </div>
      </Modal>
      <Modal
        isOpen={!!runFor}
        onClose={() => !starting && setRunFor(null)}
        title={t("strategyLab.start")}
      >
        <div className="space-y-4">
          <p>{runFor?.name}</p>
          <label className="block text-sm font-semibold">
            {t("strategyLab.coin")}
            <AppSelect
              value={coinSymbol}
              items={coins}
              onChange={setCoinSymbol}
              searchPlaceholder={t("strategyLab.searchCoin")}
            />
          </label>
          <p className="text-sm text-slate-500">
            1D · $500 · Fee 0.10% · Slippage 0.05%
          </p>
          <AppSelect
            value={duration}
            items={[
              { value: "30d", label: t("strategyLab.duration.30d") },
              { value: "90d", label: t("strategyLab.duration.90d") },
              { value: "6m", label: t("strategyLab.duration.6m") },
              { value: "1y", label: t("strategyLab.duration.1y") },
              { value: "custom", label: t("strategyLab.duration.custom") },
              {
                value: "until_stopped",
                label: t("strategyLab.duration.untilStopped"),
              },
            ]}
            onChange={setDuration}
          />
          {duration === "custom" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm font-medium">
                {t("strategyLab.startDate")}
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border bg-transparent p-2"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(e) => setCustomStart(e.target.value)}
                />
              </label>
              <label className="text-sm font-medium">
                {t("strategyLab.endDate")}
                <input
                  type="date"
                  className="mt-1 w-full rounded-lg border bg-transparent p-2"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(e) => setCustomEnd(e.target.value)}
                />
              </label>
            </div>
          )}
          <div className="flex gap-3">
            <button
              disabled={
                starting ||
                duration === "until_stopped" ||
                (duration === "custom" && (!customStart || !customEnd))
              }
              className="primary-action disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void start("backtests")}
            >
              {starting ? t("strategyLab.queueing") : t("strategyLab.backtest")}
            </button>
            <button
              disabled={
                starting ||
                (duration === "custom" && (!customStart || !customEnd))
              }
              className="primary-action disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => void start("forward-tests")}
            >
              {starting ? t("strategyLab.starting") : t("strategyLab.forward")}
            </button>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.run.strategySnapshot.name ?? ""}
        maxWidth="max-w-5xl"
      >
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {detail &&
            Object.entries({
              equity: detail.run.metrics.currentEquity,
              return: detail.run.metrics.totalReturn,
              drawdown: detail.run.metrics.maxDrawdown,
              winRate: detail.run.metrics.winRate,
              trades: detail.run.metrics.numberOfTrades,
              fees: detail.run.metrics.totalFees,
              benchmark: detail.run.metrics.benchmarkReturn,
              difference: detail.run.metrics.difference,
            }).map(([key, value]) => (
              <div
                className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800"
                key={key}
              >
                <p className="text-xs text-slate-500">
                  {t(`strategyLab.metrics.${key}`)}
                </p>
                <p className="text-xl font-bold">
                  {Number(value).toLocaleString(locale, {
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
            ))}
        </div>
        {detail && <>
          <StrategyPerformanceChart history={detail.equity} locale={locale}/>
          <StrategyDrawdownChart history={detail.equity} maxDrawdown={detail.run.metrics.maxDrawdown} locale={locale}/>
        </>}
        <h3 className="mt-6 font-bold">{t("strategyLab.tradeHistory")}</h3>
        <div className="mt-3 space-y-2">
          {detail?.trades.map((trade) => {
            const profitable = trade.pnl >= 0;
            return (
              <div
                className={`flex items-center justify-between rounded-xl border p-4 ${profitable ? "border-emerald-200 bg-emerald-50/70 dark:border-emerald-900 dark:bg-emerald-950/20" : "border-rose-200 bg-rose-50/70 dark:border-rose-900 dark:bg-rose-950/20"}`}
                key={trade.id}
              >
                <div className="flex items-center gap-3">
                  {profitable ? (
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-rose-600" />
                  )}
                  <div>
                    <p className="font-semibold">
                      ${trade.entryPrice.toFixed(2)} →{" "}
                      {trade.exitExecutionDate
                        ? `$${trade.exitPrice.toFixed(2)}`
                        : t("strategyLab.openTrade")}
                    </p>
                    <p className="text-xs text-slate-500">
                      {new Date(trade.entryExecutionDate).toLocaleDateString(
                        locale,
                      )}
                      {trade.exitExecutionDate
                        ? ` → ${new Date(trade.exitExecutionDate).toLocaleDateString(locale)}`
                        : ""}{" "}
                      · {trade.holdingDays} {t("strategyLab.days")}
                    </p>
                  </div>
                </div>
                <div
                  className={`text-right font-bold ${profitable ? "text-emerald-600" : "text-rose-600"}`}
                >
                  <p>
                    {trade.pnl >= 0 ? "+" : ""}
                    {trade.pnl.toFixed(2)}
                  </p>
                  <p className="text-xs">
                    {trade.pnlPercent >= 0 ? "+" : ""}
                    {trade.pnlPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Modal>
      <ConfirmDialog
        isOpen={!!confirming}
        onClose={() => setConfirming(null)}
        onConfirm={() => void confirmAction()}
        title={t(
          confirming?.action === "delete"
            ? "strategyLab.confirm.deleteTitle"
            : "strategyLab.confirm.cloneTitle",
        )}
        message={t(
          confirming?.action === "delete"
            ? "strategyLab.confirm.deleteMessage"
            : "strategyLab.confirm.cloneMessage",
          { name: confirming?.strategy.name ?? "" },
        )}
        confirmText={t(
          confirming?.action === "delete"
            ? "strategyLab.delete"
            : "strategyLab.clone",
        )}
        variant={confirming?.action === "delete" ? "danger" : "info"}
      />
      <ConfirmDialog
        isOpen={!!deletingRun}
        onClose={() => setDeletingRun(null)}
        onConfirm={() => void deleteRun()}
        title={t("topbar.deleteRunTitle")}
        message={t("topbar.deleteRunMessage")}
        confirmText={t("strategyLab.delete")}
        variant="danger"
      />
    </div>
  );
}
