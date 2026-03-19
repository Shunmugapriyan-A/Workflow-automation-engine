import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import {
    Play, RotateCcw, XCircle, CheckCircle, Clock,
    AlertCircle, ArrowLeft, Zap, Activity, ChevronRight, Hourglass
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNotification } from '../contexts/NotificationContext';

/* ── Status Badge ── */
function StatusBadge({ status }: { status: string }) {
    const map: Record<string, { cls: string; icon: any; label: string }> = {
        pending:     { cls: 'bg-amber-50 text-amber-700 border-amber-200',    icon: Clock,      label: 'Pending' },
        in_progress: { cls: 'bg-blue-50 text-blue-700 border-blue-200',       icon: RotateCcw,  label: 'In Progress' },
        completed:   { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle, label: 'Completed' },
        failed:      { cls: 'bg-red-50 text-red-700 border-red-200',          icon: XCircle,    label: 'Failed' },
        canceled:    { cls: 'bg-slate-100 text-slate-600 border-slate-200',   icon: AlertCircle, label: 'Canceled' },
    };
    const { cls, icon: Icon, label } = map[status] || map['pending'];
    return (
        <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border", cls)}>
            <Icon className={cn("h-3.5 w-3.5", status === 'in_progress' ? 'animate-spin' : '')} />
            {label}
        </span>
    );
}

/* ── Step Timeline Icon ── */
function StepIcon({ status }: { status: 'done' | 'active' | 'pending' | 'failed' }) {
    if (status === 'done') return (
        <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400">
            <CheckCircle className="h-5 w-5 text-white" />
        </div>
    );
    if (status === 'active') return (
        <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(234,179,8,0.3)] ring-2 ring-yellow-400">
            <Hourglass className="h-5 w-5 text-white animate-spin" />
        </div>
    );
    if (status === 'failed') return (
        <div className="w-9 h-9 rounded-full bg-red-500 flex items-center justify-center shrink-0 shadow-[0_0_10px_rgba(239,68,68,0.3)] ring-2 ring-red-400">
            <XCircle className="h-5 w-5 text-white" />
        </div>
    );
    return (
        <div className="w-9 h-9 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0 border-2 border-slate-300 dark:border-slate-600">
            <div className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-500" />
        </div>
    );
}

const STEP_TYPE_CLS: Record<string, string> = {
    task:         'bg-blue-100 text-blue-700 border-blue-200/50',
    approval:     'bg-amber-100 text-amber-700 border-amber-200/50',
    notification: 'bg-violet-100 text-violet-700 border-violet-200/50',
};

export function WorkflowExecution() {
    const { workflowId: rawWfId, id } = useParams();
    const navigate = useNavigate();
    const isNew = !!rawWfId;
    const [inputData, setInputData] = useState<any>({});
    const [starting, setStarting] = useState(false);
    const { addNotification } = useNotification();
    const [notified, setNotified] = useState(false);

    const { data: execution, refetch: refetchExec } = useQuery({
        queryKey: ['execution', id],
        queryFn: () => api.get(`/executions/${id}`),
        enabled: !isNew,
        refetchInterval: (query) => query.state.data?.status === 'in_progress' ? 1000 : false
    });

    const activeWorkflowId = isNew ? rawWfId : execution?.workflow_id;

    const { data: workflow, isLoading: wfLoading } = useQuery({
        queryKey: ['workflow', activeWorkflowId],
        queryFn: () => api.get(`/workflows/${activeWorkflowId}`),
        enabled: !!activeWorkflowId
    });

    if (execution && ['completed', 'failed'].includes(execution.status) && !notified) {
        setNotified(true);
        addNotification(`Workflow execution ${execution.status === 'completed' ? 'finished successfully' : 'failed'}`);
    }

    const handleStart = async () => {
        setStarting(true);
        try {
            const res = await api.post(`/workflows/${activeWorkflowId}/execute`, inputData);
            navigate(`/executions/${res.id}`);
        } catch (e: any) {
            alert(e.message);
        } finally {
            setStarting(false);
        }
    };

    const handleAction = async (actionStr: string) => {
        try {
            await api.post(`/executions/${id}/approve`, { action: actionStr });
            refetchExec();
            addNotification(`Step ${actionStr}`);
        } catch (e: any) {
            alert(e.message);
        }
    };

    /* ━━━━━━━━━━ NEW EXECUTION FORM ━━━━━━━━━━ */
    if (isNew) {
        if (wfLoading) return (
            <div className="flex justify-center items-center py-32">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center animate-pulse">
                        <Zap className="h-6 w-6 text-violet-600" />
                    </div>
                    <p className="text-sm text-slate-500">Loading workflow…</p>
                </div>
            </div>
        );
        if (!workflow) return (
            <div className="text-center py-20">
                <XCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
                <p className="text-red-600 font-medium">Workflow not found</p>
            </div>
        );

        const schemaEntries = Object.entries(workflow.input_schema || {});

        return (
            <div className="space-y-5 animate-fade-in max-w-3xl">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="btn btn-secondary btn-sm px-2.5 py-2 shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Execute Workflow</h1>
                        <p className="text-sm text-slate-500 mt-0.5">
                            Configure inputs for <span className="font-semibold text-violet-600">{workflow.name}</span>
                        </p>
                    </div>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                            <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Input Parameters</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{schemaEntries.length} field{schemaEntries.length !== 1 ? 's' : ''} required</p>
                        </div>
                    </div>

                    <div className="p-6">
                        {schemaEntries.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-slate-200 rounded-xl">
                                <Zap className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                <p className="text-sm text-slate-500">This workflow requires no input parameters</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                {schemaEntries.map(([key, schema]: [string, any]) => (
                                    <div key={key}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="text-sm font-semibold text-slate-700 capitalize">{key}</label>
                                            <span className={cn(
                                                "text-[11px] font-semibold px-2 py-0.5 rounded-full border",
                                                schema.required
                                                    ? 'bg-red-50 text-red-600 border-red-200'
                                                    : 'bg-slate-100 text-slate-500 border-slate-200'
                                            )}>
                                                {schema.required ? 'Required' : 'Optional'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 mb-2 font-mono">{schema.type}</p>
                                        {schema.allowed_values && schema.allowed_values.length > 0 ? (
                                            <div className="relative">
                                                <select
                                                    className="input pr-8 appearance-none"
                                                    onChange={e => setInputData({ ...inputData, [key]: e.target.value })}
                                                >
                                                    <option value="">— Select an option —</option>
                                                    {schema.allowed_values.map((v: string) => (
                                                        <option key={v} value={v}>{v}</option>
                                                    ))}
                                                </select>
                                                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none" />
                                            </div>
                                        ) : (
                                            <input
                                                type={schema.type === 'number' ? 'number' : 'text'}
                                                className="input font-mono"
                                                placeholder={`Enter ${schema.type} value`}
                                                onChange={e => setInputData({
                                                    ...inputData,
                                                    [key]: schema.type === 'number' ? Number(e.target.value) : e.target.value
                                                })}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                            <p className="text-xs text-slate-400">Fields marked <span className="text-red-500 font-semibold">Required</span> must be filled</p>
                            <button
                                onClick={handleStart}
                                disabled={starting}
                                className="btn btn-primary btn-lg shadow-lg shadow-violet-500/20 gap-2"
                            >
                                {starting ? (
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                                    </svg>
                                ) : (
                                    <Play className="h-4 w-4 fill-white/20" />
                                )}
                                {starting ? 'Starting…' : 'Start Execution'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* ━━━━━━━━━━ EXECUTION VIEW ━━━━━━━━━━ */
    if (!execution) return (
        <div className="flex justify-center items-center py-32">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center animate-pulse">
                    <Activity className="h-6 w-6 text-violet-600" />
                </div>
                <p className="text-sm text-slate-500">Loading execution…</p>
            </div>
        </div>
    );

    const logs: any[] = execution.execution_logs || [];
    const successCount = logs.filter(l => l.status === 'success').length;
    const progress = logs.length > 0 ? (successCount / logs.length) * 100 : 0;

    return (
        <div className="space-y-5 animate-fade-in">

            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="btn btn-secondary dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 btn-sm px-2.5 py-2 shrink-0">
                        <ArrowLeft className="h-4 w-4" />
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            Execution
                            <code className="text-sm font-mono text-slate-400 dark:text-slate-300 font-normal bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                                #{execution.id.split('-')[0]}
                            </code>
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            Started {new Date(execution.started_at).toLocaleString()}
                        </p>
                    </div>
                </div>
                <StatusBadge status={execution.status} />
            </div>

            {/* ── Approval Banner ── */}
            {(execution.status === 'in_progress' || execution.status === 'pending') && execution.current_step_id && (
                <div className="bg-gradient-to-r from-violet-600 to-violet-700 text-white rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-violet-500/20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                            <AlertCircle className="h-5 w-5 text-violet-200" />
                        </div>
                        <div>
                            <p className="font-semibold">Approval Required</p>
                            <p className="text-sm text-violet-200 mt-0.5">This workflow is paused and awaiting your decision.</p>
                        </div>
                    </div>
                    <div className="flex gap-2.5 shrink-0">
                        <button
                            onClick={() => handleAction('Approved')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-violet-700 text-sm font-semibold rounded-lg hover:bg-violet-50 transition-colors shadow-sm"
                        >
                            <CheckCircle className="h-4 w-4 text-emerald-500" /> Approve
                        </button>
                        <button
                            onClick={() => handleAction('Rejected')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 text-white text-sm font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
                        >
                            <XCircle className="h-4 w-4" /> Reject
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                {/* ── LEFT: Timeline ── */}
                <div className="lg:col-span-2 space-y-3">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-violet-500" />
                        Execution Timeline
                    </h2>

                    {logs.length === 0 && (
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 p-10 text-center">
                            <Activity className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
                            <p className="text-sm text-slate-500 dark:text-slate-400">No execution logs generated yet</p>
                        </div>
                    )}

                    <div className="relative space-y-3">
                        {logs.map((log: any, idx: number) => {
                            const rules = log.evaluated_rules
                                ? (typeof log.evaluated_rules === 'string' ? JSON.parse(log.evaluated_rules) : log.evaluated_rules)
                                : [];
                            const isSuccess = log.status === 'success';

                            return (
                                <div key={idx} className="relative flex gap-3">
                                    {/* Connector */}
                                    {idx < logs.length - 1 && (
                                        <div className="absolute left-[1.1rem] top-9 bottom-0 w-0.5 bg-gradient-to-b from-slate-300 to-slate-100 z-0" />
                                    )}

                                    <StepIcon status={isSuccess ? 'done' : 'failed'} />

                                    <div className="flex-1 bg-white dark:bg-slate-800/80 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-card overflow-hidden mb-0.5">
                                        {/* Card Header */}
                                        <div className={cn(
                                            "flex items-center justify-between px-4 py-3",
                                            isSuccess ? "bg-emerald-50/50 dark:bg-emerald-900/10" : "bg-red-50/50 dark:bg-red-900/10"
                                        )}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{log.step_name}</p>
                                                    <span className={cn("step-chip border mt-0.5", STEP_TYPE_CLS[log.step_type] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600')}>
                                                        {log.step_type}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2.5 shrink-0 ml-2">
                                                {log.duration != null && (
                                                    <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">{log.duration}ms</span>
                                                )}
                                                <span className={cn(
                                                    "text-xs font-bold px-2.5 py-1 rounded-full",
                                                    isSuccess ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400" : "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400"
                                                )}>
                                                    {isSuccess ? '✓ Success' : '✗ Failed'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Rule Evaluations */}
                                        {rules.length > 0 && (
                                            <div className="px-4 py-3 border-t border-slate-100">
                                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Rule Evaluation</p>
                                                <div className="space-y-1.5">
                                                    {rules.map((rule: any, rIdx: number) => {
                                                        const isObj = typeof rule === 'object';
                                                        const condition = isObj ? rule.condition : rule;
                                                        const matched = isObj ? rule.matched : false;
                                                        return (
                                                            <div key={rIdx} className={cn(
                                                                "flex items-start gap-2 p-2 rounded-lg text-xs font-mono border",
                                                                matched
                                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                                                    : 'bg-slate-50 border-slate-200 text-slate-500'
                                                            )}>
                                                                <span className={cn(
                                                                    "font-bold px-1.5 py-0.5 rounded text-[10px] shrink-0 uppercase",
                                                                    matched ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-200 text-slate-500'
                                                                )}>
                                                                    {matched ? 'MATCH' : 'SKIP'}
                                                                </span>
                                                                <code className="flex-1 break-all">{condition}</code>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                {log.matched_condition && (
                                                    <div className="mt-2 p-2 bg-violet-50 border border-violet-100 rounded-lg text-xs text-violet-700">
                                                        <span className="font-semibold">Matched: </span>
                                                        <code className="font-mono">{log.matched_condition}</code>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Error */}
                                        {log.error_message && (
                                            <div className="px-4 py-2.5 border-t border-red-100 bg-red-50/50">
                                                <p className="text-xs font-mono text-red-600">
                                                    <span className="font-bold">Error: </span>{log.error_message}
                                                </p>
                                            </div>
                                        )}

                                        {/* Next Step */}
                                        {log.selected_next_step !== undefined && (
                                            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50/30 flex items-center gap-2 text-xs text-slate-500">
                                                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="font-medium">Next Step:</span>
                                                {log.selected_next_step
                                                    ? <code className="text-violet-600 font-semibold font-mono">{log.selected_next_step.substring(0, 8)}…</code>
                                                    : <span className="text-emerald-600 font-semibold">Workflow Complete</span>
                                                }
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Active step */}
                        {(execution.status === 'in_progress' || execution.status === 'pending') && execution.current_step_id && (
                            <div className="flex gap-3 relative">
                                <StepIcon status="active" />
                                <div className="flex-1 bg-yellow-50/50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200/80 dark:border-yellow-700/50 shadow-lg px-4 py-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                                {workflow?.steps?.find((s: any) => s.id === execution.current_step_id)?.name || 'Processing Step'}
                                                <Hourglass className="h-3 w-3 text-yellow-600 dark:text-yellow-500 animate-spin" />
                                            </p>
                                            <p className="text-xs text-yellow-600 dark:text-yellow-500 font-medium mt-1">Pending action / In Progress...</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Final marker */}
                        {['completed', 'failed', 'canceled'].includes(execution.status) && (
                            <div className="flex gap-3">
                                <StepIcon status={execution.status === 'completed' ? 'done' : 'failed'} />
                                <div className={cn(
                                    "flex-1 flex items-center px-4 py-3 rounded-xl text-sm font-bold shadow-lg border",
                                    execution.status === 'completed'
                                        ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400"
                                        : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-400"
                                )}>
                                    Workflow {execution.status.toUpperCase()}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── RIGHT: Summary Panel ── */}
                <div className="space-y-4">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-violet-500" />
                        Summary
                    </h2>

                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 shadow-card p-5 space-y-4">

                        {/* Status */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-500 font-medium">Status</span>
                            <StatusBadge status={execution.status} />
                        </div>

                        {/* Progress */}
                        <div>
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                <span className="font-medium">Progress</span>
                                <span className="font-semibold text-slate-700">{successCount}/{logs.length} steps</span>
                            </div>
                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-violet-500 to-emerald-500 rounded-full transition-all duration-700"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <p className="text-xs text-slate-400 mt-1 text-right">{Math.round(progress)}%</p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 space-y-3 text-sm">
                            {[
                                { label: 'Steps Run', value: logs.length },
                                { label: 'Completed', value: successCount, cls: 'text-emerald-600 font-bold' },
                                { label: 'Failed', value: logs.filter(l => l.status !== 'success').length, cls: 'text-red-500 font-bold' },
                            ].map(row => (
                                <div key={row.label} className="flex justify-between items-center">
                                    <span className="text-slate-500">{row.label}</span>
                                    <span className={row.cls || 'font-semibold text-slate-800'}>{row.value}</span>
                                </div>
                            ))}
                            {execution.ended_at && (
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Ended</span>
                                    <span className="font-mono text-slate-600">{new Date(execution.ended_at).toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                        {/* Input Data */}
                        {execution.input_data && Object.keys(execution.input_data).length > 0 && (
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">Input Data</p>
                                <div className="space-y-2">
                                    {Object.entries(execution.input_data).map(([k, v]: any) => (
                                        <div key={k} className="flex justify-between items-center text-xs bg-slate-50 rounded-lg px-3 py-2">
                                            <span className="text-slate-500 capitalize font-medium">{k}</span>
                                            <code className="text-slate-800 font-semibold font-mono">{String(v)}</code>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
