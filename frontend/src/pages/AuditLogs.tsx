import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Link } from 'react-router-dom';
import {
    Eye, FileText, Activity, CheckCircle, XCircle,
    RotateCcw, Clock, ArrowUpRight, TrendingUp, Zap
} from 'lucide-react';
import { cn } from '../lib/utils';

function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { cls: string; dot: string }> = {
        completed:   { cls: 'bg-emerald-100 text-emerald-700 border-emerald-200/60', dot: 'bg-emerald-500' },
        failed:      { cls: 'bg-red-100 text-red-700 border-red-200/60',             dot: 'bg-red-500' },
        canceled:    { cls: 'bg-slate-100 text-slate-600 border-slate-200/60',       dot: 'bg-slate-400' },
        in_progress: { cls: 'bg-blue-100 text-blue-700 border-blue-200/60',          dot: 'bg-blue-500 animate-pulse' },
        pending:     { cls: 'bg-amber-100 text-amber-700 border-amber-200/60',       dot: 'bg-amber-500' },
    };
    const { cls, dot } = map[status] || map['pending'];
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border", cls)}>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dot)} />
            {status.replace('_', ' ').toUpperCase()}
        </span>
    );
}

export function AuditLogs() {
    const { data: executions, isLoading } = useQuery({
        queryKey: ['executions'],
        queryFn: () => api.get('/executions')
    });

    if (isLoading) return (
        <div className="space-y-5 animate-pulse">
            <div className="skeleton h-32 rounded-xl" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="skeleton h-20 rounded-xl" />)}
            </div>
            <div className="skeleton h-80 rounded-xl" />
        </div>
    );

    const execs = executions || [];
    const totalCompleted = execs.filter((e: any) => e.status === 'completed').length;
    const totalFailed = execs.filter((e: any) => e.status === 'failed').length;
    const totalRunning = execs.filter((e: any) => e.status === 'in_progress' || e.status === 'pending').length;
    const successRate = execs.length > 0 ? Math.round((totalCompleted / execs.length) * 100) : 0;

    const stats = [
        { label: 'Total Executions', value: execs.length,     icon: FileText,     iconCls: 'bg-violet-100 text-violet-600',  valueCls: 'text-slate-900' },
        { label: 'Total Executions', value: execs.length,     icon: FileText,     iconCls: 'bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',  valueCls: 'text-slate-900 dark:text-slate-100' },
        { label: 'Completed',        value: totalCompleted,   icon: CheckCircle,  iconCls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-300', valueCls: 'text-emerald-600 dark:text-emerald-300' },
        { label: 'Failed',           value: totalFailed,      icon: XCircle,      iconCls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300',         valueCls: 'text-red-600 dark:text-red-300' },
        { label: 'In Progress',      value: totalRunning,     icon: RotateCcw,    iconCls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',       valueCls: 'text-blue-600 dark:text-blue-300' },
    ];

    return (
        <div className="space-y-5 animate-fade-in">

            {/* ── Hero Header ── */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-violet-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl border border-slate-700">
                {/* Decorative blobs */}
                <div className="absolute top-0 right-0 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-500/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full mb-4">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">Audit System</span>
                        </div>
                        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Audit Logs</h1>
                        <p className="text-slate-400 text-sm max-w-md">
                            Historic timeline of all workflow execution activities. Monitor performance, track failures, and ensure compliance.
                        </p>
                    </div>

                    <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">
                        {/* Success Rate Ring */}
                        <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                            <div className="relative w-14 h-14 shrink-0">
                                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
                                    <circle
                                        cx="18" cy="18" r="15.9" fill="none"
                                        stroke={successRate >= 70 ? '#34d399' : successRate >= 40 ? '#f59e0b' : '#f87171'}
                                        strokeWidth="3"
                                        strokeDasharray={`${successRate} ${100 - successRate}`}
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">{successRate}%</span>
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold">Success Rate</p>
                                <p className="text-2xl font-black text-white">{successRate}%</p>
                            </div>
                        </div>

                        <Link
                            to="/audit/global"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-slate-900 text-sm font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
                        >
                            <Zap className="h-3.5 w-3.5 text-violet-600" />
                            Global System Feed
                            <ArrowUpRight className="h-3.5 w-3.5 text-slate-500" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className="stat-card">
                            <div className={cn("stat-icon", stat.iconCls)}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <div>
                                <p className={cn("text-2xl font-bold tabular-nums", stat.valueCls)}>{stat.value}</p>
                                <p className="text-xs text-slate-500 font-medium mt-0.5">{stat.label}</p>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Table ── */}
            <div className="table-container">
                {/* Table Header */}
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <Activity className="h-4 w-4 text-violet-500" />
                    <h2 className="text-sm font-semibold text-slate-800">Execution History</h2>
                    <span className="ml-auto text-xs text-slate-400">{execs.length} total executions</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="table-header">
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200/80">Execution ID</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200/80">Workflow Name</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200/80">Version</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200/80">Status</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200/80">Started At</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200/80">Ended At</th>
                                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200/80">Duration</th>
                                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/80 border-b border-slate-200/80">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {execs.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-5 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                                                <Clock className="h-6 w-6 text-slate-400" />
                                            </div>
                                            <p className="text-sm font-semibold text-slate-600">No executions logged yet</p>
                                            <p className="text-xs text-slate-400">Execute a workflow to see audit logs here</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                execs.map((exec: any) => {
                                    const duration = exec.started_at && exec.ended_at
                                        ? Math.round((new Date(exec.ended_at).getTime() - new Date(exec.started_at).getTime()) / 1000)
                                        : null;

                                    return (
                                        <tr key={exec.id} className="table-row hover:bg-slate-50/60 transition-colors group">
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <code className="inline-flex items-center px-2.5 py-1 bg-slate-100 rounded-md text-xs font-mono font-semibold text-slate-600 group-hover:bg-violet-100 group-hover:text-violet-700 transition-colors">
                                                    #{exec.id.split('-')[0]}
                                                </code>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <p className="text-sm font-semibold text-slate-900">{exec.workflow?.name || 'Unknown'}</p>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 rounded text-xs font-mono text-slate-600">
                                                    v{exec.workflow_version}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <StatusBadge status={exec.status} />
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                                                {new Date(exec.started_at).toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-xs">
                                                {exec.ended_at ? (
                                                    <span className="text-slate-500 font-mono">{new Date(exec.ended_at).toLocaleString()}</span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 text-blue-500 font-medium">
                                                        <RotateCcw className="h-3 w-3 animate-spin" /> Running…
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-xs">
                                                {duration !== null ? (
                                                    <span className="inline-flex items-center gap-1 text-slate-500 font-mono">
                                                        <TrendingUp className="h-3 w-3 text-slate-400" />
                                                        {duration}s
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-300">—</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 whitespace-nowrap text-right">
                                                <Link
                                                    to={`/executions/${exec.id}`}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors border border-violet-100"
                                                >
                                                    <Eye className="h-3.5 w-3.5" /> View Logs
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
