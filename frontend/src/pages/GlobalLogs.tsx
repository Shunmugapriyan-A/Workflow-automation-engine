import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { 
  Activity, 
  Search, 
  Filter, 
  Terminal, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  ExternalLink,
  Cpu,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export function GlobalLogs() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');

    const { data: logs, isLoading } = useQuery({
        queryKey: ['global-logs'],
        queryFn: () => api.get('/executions/global-logs'),
        refetchInterval: 5000 // Auto-refresh for live feed feel
    });

    const filteredLogs = logs?.filter((log: any) => {
        const matchesSearch = 
            log.step_name.toLowerCase().includes(search.toLowerCase()) ||
            log.execution.workflow.name.toLowerCase().includes(search.toLowerCase()) ||
            log.execution_id.includes(search);
        
        const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    if (isLoading) return (
        <div className="flex h-64 items-center justify-center">
             <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
                <Activity className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-primary h-6 w-6 animate-pulse" />
             </div>
        </div>
    );

    return (
        <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="relative overflow-hidden bg-slate-900 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl border border-white/10 group">
                {/* Background Glow */}
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/20 rounded-full blur-[100px] group-hover:bg-primary/30 transition-all duration-1000"></div>
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10 backdrop-blur-md">
                            <Zap className="h-4 w-4 text-yellow-400 fill-yellow-400 animate-pulse" />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">Live System Feed</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white flex items-center gap-4">
                            Global <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400">Audit Logs</span>
                        </h1>
                        <p className="text-slate-400 text-lg max-w-xl leading-relaxed">
                            A real-time, granular visualization of every step execution, rule evaluation, and system decision across your entire workflow ecosystem.
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-3">
                         <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-inner flex items-center gap-6">
                            <div className="text-center">
                                <p className="text-[0.65rem] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Total Activities</p>
                                <p className="text-3xl font-black text-white">{logs?.length || 0}</p>
                            </div>
                            <div className="w-px h-10 bg-white/10"></div>
                            <div className="text-center">
                                <p className="text-[0.65rem] text-slate-500 uppercase font-black tracking-[0.2em] mb-1">Active Now</p>
                                <div className="flex items-center gap-2 justify-center">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
                                    <p className="text-3xl font-black text-white">{logs?.filter((l:any) => l.status === 'success').length}</p>
                                </div>
                            </div>
                         </div>
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col lg:flex-row gap-4 sticky top-6 z-30">
                <div className="flex-1 relative group">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-500 h-5 w-5 group-focus-within:text-primary group-focus-within:scale-110 transition-all" />
                    <input 
                        type="text"
                        placeholder="Search step names, workflows, or execution IDs..."
                        className="w-full pl-14 pr-6 py-5 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-2xl transition-all"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500 h-4 w-4" />
                        <select 
                            className="pl-10 pr-10 py-5 bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl text-white appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50 shadow-2xl cursor-pointer hover:bg-slate-800 transition-all"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">Every Status</option>
                            <option value="success">✓ Success Only</option>
                            <option value="failed">✗ Failures Only</option>
                            <option value="pending">⏳ Pending</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Logs List */}
            <div className="space-y-4 relative">
                {/* Timeline connector line */}
                <div className="absolute left-[3.25rem] top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-indigo-500/20 to-transparent hidden md:block"></div>

                {(!filteredLogs || filteredLogs.length === 0) ? (
                    <div className="bg-slate-900/50 backdrop-blur-md rounded-[2.5rem] p-24 text-center border border-white/5 border-dashed">
                        <Activity className="h-16 w-16 text-slate-700 mx-auto mb-6 opacity-20" />
                        <h3 className="text-2xl font-bold text-slate-400">No logs found matching your filters.</h3>
                        <p className="text-slate-600 mt-2">Try adjusting your search or status filter to see more data.</p>
                    </div>
                ) : filteredLogs.map((log: any, idx: number) => {
                    const rules = log.evaluated_rules ? (typeof log.evaluated_rules === 'string' ? JSON.parse(log.evaluated_rules) : log.evaluated_rules) : [];
                    
                    return (
                        <div key={log.id} 
                            className="group relative md:pl-20 transition-all animate-in fade-in slide-in-from-left-4 duration-500" 
                            style={{ animationDelay: `${idx * 50}ms` }}
                        >
                            {/* Connector dot */}
                            <div className="absolute left-[3rem] top-[2.5rem] w-2 h-2 rounded-full bg-slate-800 border-2 border-primary z-10 hidden md:block group-hover:scale-150 transition-transform shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]"></div>
                            
                            <div className="bg-slate-900/40 backdrop-blur-xl rounded-3xl p-6 sm:p-8 border border-white/5 shadow-2xl hover:bg-slate-800/60 hover:border-white/20 transition-all duration-300 relative overflow-hidden">
                                {/* Side accent bar */}
                                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${log.status === 'success' ? 'bg-emerald-500' : log.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'} opacity-50`}></div>
                                
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                                    {/* Column 1: Time & Identity */}
                                    <div className="lg:col-span-3 space-y-3">
                                        <div className="flex items-center gap-2 text-slate-500 font-mono text-[0.7rem] uppercase tracking-widest">
                                            <Clock className="h-3 w-3" />
                                            {new Date(log.started_at).toLocaleDateString()}
                                        </div>
                                        <div className="text-2xl font-black text-white tracking-tight">
                                            {new Date(log.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5 uppercase tracking-tighter">
                                                {log.duration || 0}ms Latency
                                            </span>
                                        </div>
                                    </div>

                                    {/* Column 2: Context */}
                                    <div className="lg:col-span-3 space-y-4">
                                        <div>
                                            <p className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-1">Workflow / Pipe</p>
                                            <div className="flex items-center gap-2">
                                                <Cpu className="h-4 w-4 text-emerald-400" />
                                                <h4 className="font-bold text-slate-200 truncate">{log.execution.workflow.name}</h4>
                                            </div>
                                            <Link to={`/executions/${log.execution_id}`} className="text-[0.65rem] font-mono text-primary/80 hover:text-primary mt-1 flex items-center gap-1 group/link">
                                                ID: {log.execution_id.split('-')[0]}
                                                <ExternalLink className="h-2.5 w-2.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                            </Link>
                                        </div>
                                        <div>
                                            <p className="text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-1">Step Details</p>
                                            <div className="flex items-center gap-2">
                                                <Terminal className="h-4 w-4 text-indigo-400" />
                                                <h4 className="font-bold text-white uppercase tracking-tight">{log.step_name}</h4>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Column 3: Status */}
                                    <div className="lg:col-span-2 flex flex-col justify-center">
                                         <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-sm font-bold shadow-lg ${
                                            log.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 
                                            log.status === 'failed' ? 'bg-red-500/10 text-red-400 border-red-500/30' : 
                                            'bg-blue-500/10 text-blue-400 border-blue-500/30'
                                         }`}>
                                            {log.status === 'success' ? (
                                                <>
                                                    <CheckCircle className="h-4 w-4" />
                                                    COMPLETED
                                                </>
                                            ) : log.status === 'failed' ? (
                                                <>
                                                    <XCircle className="h-4 w-4" />
                                                    FAILED
                                                </>
                                            ) : (
                                                <>
                                                    <Clock className="h-4 w-4" />
                                                    PENDING
                                                </>
                                            )}
                                         </div>
                                    </div>

                                    {/* Column 4: Engine Logic */}
                                    <div className="lg:col-span-4 bg-black/40 rounded-2xl p-4 border border-white/5 relative group/logic">
                                        <p className="text-[0.65rem] font-black text-slate-600 uppercase tracking-widest mb-3 flex justify-between items-center">
                                            Evaluation Pipeline
                                            {rules.length > 0 && <span className="text-[0.6rem] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded uppercase tracking-normal">{rules.length} Rules Engine</span>}
                                        </p>
                                        
                                        <div className="space-y-2">
                                            {rules.length === 0 ? (
                                                <div className="text-[0.7rem] text-slate-600 italic font-mono flex items-center gap-2 py-1">
                                                    <Activity className="h-3 w-3 opacity-30" />
                                                    No rule override detected.
                                                </div>
                                            ) : rules.slice(0, 2).map((rule: any, idx: number) => {
                                                const matched = typeof rule === 'object' ? rule.matched : false;
                                                const condition = typeof rule === 'object' ? rule.condition : rule;
                                                return (
                                                    <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg border text-[0.65rem] font-mono leading-tight transition-all ${
                                                        matched ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-white/[0.02] border-white/5 text-slate-500'
                                                    }`}>
                                                        <span className={`flex-shrink-0 px-1 py-0.5 rounded-sm font-black ${matched ? 'bg-emerald-500 text-black shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-slate-800 text-slate-500 uppercase'}`}>
                                                            {matched ? 'PASS' : 'SKIP'}
                                                        </span>
                                                        <code className="break-all opacity-80">{condition}</code>
                                                    </div>
                                                )
                                            })}
                                            {rules.length > 2 && (
                                                <p className="text-[0.6rem] text-slate-600 font-bold tracking-widest text-right mt-1">+ {rules.length - 2} More Evaluated</p>
                                            )}
                                        </div>

                                        {log.selected_next_step && (
                                            <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5">
                                                    <Zap className="h-3 w-3 text-yellow-400" />
                                                    <span className="text-[0.6rem] font-black text-slate-400 uppercase">Routing to</span>
                                                </div>
                                                <span className="text-[0.6rem] font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 tracking-tighter shadow-sm">
                                                    NEXT: {log.selected_next_step.substring(0, 8)}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {/* Hover Detail Overlay */}
                                        <Link 
                                            to={`/executions/${log.execution_id}`}
                                            className="absolute inset-0 bg-primary/90 backdrop-blur-sm opacity-0 group-hover/logic:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3 text-black font-black uppercase text-sm rounded-2xl"
                                        >
                                            <Eye className="h-5 w-5" />
                                            Deep Trace Analysis
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

