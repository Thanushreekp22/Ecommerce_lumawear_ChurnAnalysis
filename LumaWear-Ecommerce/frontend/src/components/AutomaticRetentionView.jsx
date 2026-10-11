import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * Automation page — Automatic Retention Engine.
 * Autonomous churn-scoring scheduler with dry-run safety, cooldowns, and audit logs.
 * Extracted from RetentionAndCampaignsView into its own admin dashboard page.
 */
export default function AutomaticRetentionView() {
  const { api } = useAuth();

  // Automatic Retention Engine state
  const [autoStatus, setAutoStatus] = useState(null);
  const [autoStatusLoading, setAutoStatusLoading] = useState(false);
  const [autoLogs, setAutoLogs] = useState([]);
  const [isAutoLogsOpen, setIsAutoLogsOpen] = useState(false);
  const [autoTriggering, setAutoTriggering] = useState(false);
  const [autoTriggerResult, setAutoTriggerResult] = useState(null);

  const fetchAutoRetentionStatus = async () => {
    setAutoStatusLoading(true);
    try {
      const res = await api("/churn/automatic-retention/status");
      if (res?.success) {
        setAutoStatus(res);
      }
    } catch (err) {
      console.warn("Failed to load automatic retention status:", err.message);
    } finally {
      setAutoStatusLoading(false);
    }
  };

  const fetchAutoRetentionLogs = async () => {
    try {
      const res = await api("/churn/automatic-retention/logs?limit=50");
      if (res?.success) {
        setAutoLogs(res.logs || []);
      }
    } catch (err) {
      console.warn("Failed to load automatic retention logs:", err.message);
    }
  };

  const handleTriggerAutoEvaluation = async (dryRun = true) => {
    setAutoTriggering(true);
    setAutoTriggerResult(null);
    try {
      const res = await api("/churn/automatic-retention/trigger", {
        method: "POST",
        body: JSON.stringify({ dryRun }),
      });
      if (res?.success) {
        setAutoTriggerResult(res.result);
        fetchAutoRetentionStatus();
        fetchAutoRetentionLogs();
      } else {
        alert(res?.message || "Failed to execute automatic retention evaluation.");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setAutoTriggering(false);
    }
  };

  const handleToggleAutoEnabled = async (currentEnabled) => {
    try {
      const res = await api("/churn/automatic-retention/config", {
        method: "PATCH",
        body: JSON.stringify({ enabled: !currentEnabled }),
      });
      if (res?.success) {
        fetchAutoRetentionStatus();
      }
    } catch (err) {
      alert("Failed to update automatic retention configuration: " + err.message);
    }
  };

  useEffect(() => {
    fetchAutoRetentionStatus();
    fetchAutoRetentionLogs();
  }, []);

  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const d = new Date(isoString);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const getRiskBadgeStyles = (tier) => {
    switch (tier) {
      case "Very High":
        return "bg-rose-100 text-rose-800 border-rose-200";
      case "High":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "Medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "Low":
      default:
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ========================================================================= */}
      {/* AUTOMATIC RETENTION ENGINE DASHBOARD SECTION                             */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-br from-white to-[#FAF8F5] p-6 rounded-2xl border border-sand shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-charcoal">Automatic Retention Engine</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  autoStatus?.config?.enabled
                    ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                    : "bg-stone-100 text-stone-700 border-stone-300"
                }`}
              >
                {autoStatus?.config?.enabled ? "● ACTIVE (ENABLED)" : "○ STANDBY (OFF)"}
              </span>
              {autoStatus?.config?.dryRun && (
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                  ⚡ Dry-Run Safety Shield Active
                </span>
              )}
            </div>
            <p className="text-xs text-charcoal/70">
              Autonomous, non-invasive churn detection & retention engine. Automatically scores eligible high-risk customers, enforces 7-day cooldowns, and dispatches personalized retention strategies.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={autoTriggering}
              onClick={() => handleTriggerAutoEvaluation(true)}
              className="px-3.5 py-2 bg-charcoal text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {autoTriggering ? (
                <>
                  <span className="animate-spin text-xs">🌀</span>
                  <span>Evaluating...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Run Dry-Run Evaluation</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsAutoLogsOpen(true)}
              className="px-3.5 py-2 bg-white text-charcoal border border-sand rounded-xl text-xs font-bold hover:bg-sand/30 transition shadow-sm flex items-center gap-1.5"
            >
              <span>📋</span>
              <span>Audit Logs</span>
              {autoLogs.length > 0 && (
                <span className="bg-sand text-charcoal px-1.5 py-0.5 rounded-full text-[10px] font-mono">
                  {autoLogs.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => handleToggleAutoEnabled(autoStatus?.config?.enabled)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition shadow-sm ${
                autoStatus?.config?.enabled
                  ? "bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {autoStatus?.config?.enabled ? "Turn OFF" : "Turn ON"}
            </button>
          </div>
        </div>

        {/* Parameters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-sand/60">
          <div className="bg-white p-3 rounded-xl border border-sand/60">
            <div className="text-[10px] uppercase font-bold text-charcoal/60 tracking-wider">Churn Threshold</div>
            <div className="text-sm font-bold text-charcoal mt-0.5">
              {((autoStatus?.config?.threshold ?? 0.70) * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-charcoal/50">High-risk trigger</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-sand/60">
            <div className="text-[10px] uppercase font-bold text-charcoal/60 tracking-wider">Cooldown Period</div>
            <div className="text-sm font-bold text-charcoal mt-0.5">
              {autoStatus?.config?.cooldownDays ?? 7} Days
            </div>
            <div className="text-[10px] text-charcoal/50">Duplicate guard</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-sand/60">
            <div className="text-[10px] uppercase font-bold text-charcoal/60 tracking-wider">Batch Size</div>
            <div className="text-sm font-bold text-charcoal mt-0.5">
              {autoStatus?.config?.batchSize ?? 50} Accounts
            </div>
            <div className="text-[10px] text-charcoal/50">Rate limit window</div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-sand/60">
            <div className="text-[10px] uppercase font-bold text-charcoal/60 tracking-wider">Execution Mode</div>
            <div className="text-sm font-bold text-charcoal mt-0.5">
              {autoStatus?.config?.dryRun ? "Dry-Run" : "Live SMTP"}
            </div>
            <div className="text-[10px] text-charcoal/50">
              {autoStatus?.config?.dryRun ? "Zero emails sent" : "Live inbox delivery"}
            </div>
          </div>

          <div className="bg-white p-3 rounded-xl border border-sand/60 col-span-2 sm:col-span-1">
            <div className="text-[10px] uppercase font-bold text-charcoal/60 tracking-wider">Last Evaluation</div>
            <div className="text-xs font-bold text-charcoal mt-0.5 truncate">
              {autoStatus?.config?.lastRunAt ? formatDate(autoStatus.config.lastRunAt) : "Not run yet"}
            </div>
            <div className="text-[10px] text-charcoal/50">
              {autoStatus?.config?.lastRunStats
                ? `Eligible: ${autoStatus.config.lastRunStats.eligibleCount} | Skipped: ${autoStatus.config.lastRunStats.skippedCount}`
                : "Awaiting trigger"}
            </div>
          </div>
        </div>

        {/* Trigger Result Banner */}
        {autoTriggerResult && (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-2 text-amber-950 animate-fade-in">
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5">
                <span>⚡</span>
                <span>Automatic Retention Evaluation Completed ({autoTriggerResult.mode})</span>
              </span>
              <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-mono">
                {autoTriggerResult.timestamp ? new Date(autoTriggerResult.timestamp).toLocaleTimeString() : ""}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-[11px]">
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                <span className="block text-stone-500 font-normal">Evaluated</span>
                <span className="font-bold text-stone-900 text-sm">{autoTriggerResult.evaluatedCount}</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                <span className="block text-emerald-700 font-normal">Eligible</span>
                <span className="font-bold text-emerald-900 text-sm">{autoTriggerResult.eligibleCount}</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                <span className="block text-blue-700 font-normal">{autoTriggerResult.dryRun ? "Simulated Sent" : "Live Sent"}</span>
                <span className="font-bold text-blue-900 text-sm">{autoTriggerResult.sentCount}</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                <span className="block text-amber-700 font-normal">Skipped</span>
                <span className="font-bold text-amber-900 text-sm">{autoTriggerResult.skippedCount}</span>
              </div>
              <div className="bg-white/80 p-2 rounded-lg border border-amber-200">
                <span className="block text-rose-700 font-normal">Failed</span>
                <span className="font-bold text-rose-900 text-sm">{autoTriggerResult.failedCount}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Automatic Retention Audit Logs Modal */}
      {isAutoLogsOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-[#FAF8F5] border border-stone-300 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 bg-[#F4EFEA] border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900">
                    Automatic Retention Audit Trail
                  </h3>
                  <p className="text-xs text-stone-600">
                    Traceable decisions with exact eligibility, skip reasons, churn probabilities, and timestamps.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAutoLogsOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {autoLogs.length === 0 ? (
                <div className="text-center py-12 text-stone-500 text-sm">
                  No automatic retention decisions recorded yet. Run an on-demand evaluation to populate audit logs.
                </div>
              ) : (
                <div className="border border-sand rounded-xl overflow-hidden bg-white shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-sand/30 border-b border-sand text-charcoal/70 font-semibold">
                        <th className="p-3">Customer</th>
                        <th className="p-3">Churn Risk</th>
                        <th className="p-3">Decision</th>
                        <th className="p-3">Strategy / Skip Reason</th>
                        <th className="p-3">Mode</th>
                        <th className="p-3">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-sand/50">
                      {autoLogs.map((log, idx) => (
                        <tr key={log._id || idx} className="hover:bg-sand/10 transition-colors">
                          <td className="p-3 font-medium text-charcoal">
                            <div>{log.email}</div>
                            <div className="text-[10px] font-mono text-charcoal/50">{log.customerId}</div>
                          </td>
                          <td className="p-3">
                            <span className="font-bold">
                              {((log.churnProbability ?? 0) * 100).toFixed(1)}%
                            </span>
                            <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRiskBadgeStyles(log.riskTier || "Low")}`}>
                              {log.riskTier || "Low"}
                            </span>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                log.status === "SENT"
                                  ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                                  : log.status === "DRY_RUN"
                                  ? "bg-blue-100 text-blue-900 border border-blue-300"
                                  : log.status === "FAILED"
                                  ? "bg-rose-100 text-rose-900 border border-rose-300"
                                  : "bg-stone-100 text-stone-700 border border-stone-300"
                              }`}
                            >
                              {log.status || log.decision}
                            </span>
                          </td>
                          <td className="p-3">
                            {log.skipReason ? (
                              <span className="text-amber-800 font-mono text-[11px]">
                                ⚠️ {log.skipReason}
                              </span>
                            ) : (
                              <span className="text-charcoal font-semibold">
                                {log.campaignType || "none"}
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono text-[11px] text-charcoal/70">
                            {log.mode || "dry-run"}
                          </td>
                          <td className="p-3 text-charcoal/60 text-[11px]">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-[#F4EFEA] border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsAutoLogsOpen(false)}
                className="px-4 py-2 bg-charcoal text-white rounded-xl text-xs font-bold hover:bg-stone-800 transition"
              >
                Close Audit Logs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
