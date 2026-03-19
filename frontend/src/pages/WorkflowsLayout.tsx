import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Plus, Play, Edit, Trash2, Zap, Activity, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useMemo } from 'react';

export function WorkflowsLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [search, setSearch] = useState('');

    const { data: result, isLoading, refetch } = useQuery({
        queryKey: ['workflows'],
        queryFn: () => api.get('/workflows')
    });

    const handleDelete = async (id: string, e: any) => {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Are you sure you want to delete this workflow?')) return;
        try {
            await api.delete(`/workflows/${id}`);
            refetch();
            if (location.pathname.includes(id)) navigate('/');
        } catch (e: any) {
            alert(e.message);
        }
    };

    const workflows = result?.workflows || [];

    const filtered = useMemo(() =>
        workflows.filter((wf: any) =>
            wf.name.toLowerCase().includes(search.toLowerCase())
        ), [workflows, search]);

    return (
        <div className="flex flex-col xl:flex-row gap-5 min-h-[calc(100vh-9rem)]">

            {/* ══ LEFT SIDEBAR ══ */}
            <aside className="w-full xl:w-64 shrink-0 flex flex-col bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden">

                {/* Sidebar Header */}
                <div className="px-4 pt-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <Zap className="h-4 w-4 text-violet-500" />
                            Workflows
                        </h2>
                        <Link
                            to="/workflows/new"
                            className="p-1.5 rounded-lg text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-100/80 transition-colors"
                            title="New Workflow"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </Link>
                    </div>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 transition-all"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Workflow List */}
                <div className="flex-1 overflow-y-auto scrollbar-hidden">
                    {isLoading ? (
                        <div className="p-4 space-y-2.5">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="skeleton h-14 rounded-lg" />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
                                <Zap className="h-5 w-5 text-slate-400" />
                            </div>
                            <p className="text-xs font-medium text-slate-600">No workflows yet</p>
                            <p className="text-xs text-slate-400 mt-1">Create one to get started</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {filtered.map((wf: any) => {
                                const isActive = location.pathname.includes(wf.id);
                                return (
                                    <div
                                        key={wf.id}
                                        onClick={() => navigate(`/workflows/${wf.id}/edit`)}
                                        className={cn(
                                            "group px-4 py-3 cursor-pointer transition-all duration-150 relative",
                                            isActive
                                                ? "bg-violet-50/80 border-l-2 border-violet-500"
                                                : "border-l-2 border-transparent hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0 flex-1">
                                                <p className={cn(
                                                    "text-sm font-medium truncate",
                                                    isActive ? "text-violet-700" : "text-slate-800 group-hover:text-violet-600"
                                                )}>
                                                    {wf.name}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400">{wf._count?.steps || 0} steps</span>
                                                    <span className="text-slate-300">·</span>
                                                    <span className="text-xs text-slate-400">v{wf.version}</span>
                                                    <span className={`w-1.5 h-1.5 rounded-full ml-auto ${wf.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions Row */}
                                        <div className="flex items-center gap-1.5 mt-2.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                            <Link
                                                to={`/executions/new/${wf.id}`}
                                                className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold text-white bg-violet-600 hover:bg-violet-700 rounded-md shadow-sm shadow-violet-500/20 transition-all active:scale-95"
                                            >
                                                <Play className="h-2.5 w-2.5 fill-white" /> Run
                                            </Link>
                                            <Link
                                                to={`/workflows/${wf.id}/edit`}
                                                className="p-1.5 text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-100/50 rounded-md transition-colors"
                                                title="Edit Workflow"
                                            >
                                                <Edit className="h-3 w-3" />
                                            </Link>
                                            <button
                                                onClick={e => handleDelete(wf.id, e)}
                                                className="p-1.5 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-100/50 rounded-md transition-colors"
                                                title="Delete Workflow"
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Sidebar Footer */}
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[11px] text-slate-400 text-center">
                        {filtered.length} of {workflows.length} workflows
                    </p>
                </div>
            </aside>

            {/* ══ RIGHT CONTENT ══ */}
            <div className="flex-1 min-w-0">
                <Outlet />
            </div>
        </div>
    );
}

export function WorkflowWelcome() {
    return (
        <div className="h-full min-h-[500px] flex flex-col items-center justify-center text-center p-10 bg-white rounded-xl border border-slate-200/80 shadow-card">
            <div className="relative mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-600 flex items-center justify-center shadow-lg shadow-violet-500/25 animate-float">
                    <Activity className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">✓</span>
                </div>
            </div>

            <h2 className="text-2xl font-bold text-slate-800 mb-2 tracking-tight">Select a Workflow</h2>
            <p className="text-sm text-slate-500 max-w-sm mb-8 leading-relaxed">
                Pick a workflow from the sidebar to view, edit, and manage its steps and rules — or create a new one.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
                <Link
                    to="/workflows/new"
                    className="btn btn-primary btn-md px-5 py-2.5 shadow-lg shadow-violet-500/20"
                >
                    <Plus className="h-4 w-4" /> Create New Workflow
                </Link>
            </div>

            {/* Decorative dots */}
            <div className="mt-12 flex gap-2">
                {[1,2,3,4,5].map(i => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === 3 ? 'bg-violet-500' : 'bg-slate-200'}`} />
                ))}
            </div>
        </div>
    );
}
