import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import {
    Save, Plus, ArrowLeft, Trash2, Settings2,
    Layers, Edit2, Network, ToggleLeft, ToggleRight,
    ChevronRight, AlertCircle, Code
} from 'lucide-react';
import { RuleEditor } from '../components/workflow-editor/RuleEditor';
import { WorkflowDiagram } from '../components/workflow-editor/WorkflowDiagram';
import { cn } from '../lib/utils';
import { useNotification } from '../contexts/NotificationContext';

const STEP_TYPE_META: Record<string, { label: string; cls: string; dot: string }> = {
    task:         { label: 'Task',         cls: 'bg-blue-100 text-blue-700 border-blue-200/50',         dot: 'bg-blue-500' },
    approval:     { label: 'Approval',     cls: 'bg-amber-100 text-amber-700 border-amber-200/50',       dot: 'bg-amber-500' },
    notification: { label: 'Notification', cls: 'bg-violet-100 text-violet-700 border-violet-200/50',   dot: 'bg-violet-500' },
};

type Tab = 'general' | 'steps' | 'diagram';

export function WorkflowEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [startStepId, setStartStepId] = useState('');
    const [schema, setSchema] = useState<any[]>([]);
    const [steps, setSteps] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [selectedStep, setSelectedStep] = useState<any>(null);
    const [saving, setSaving] = useState(false);
    const { addNotification } = useNotification();

    // Modal state
    const [isStepModalOpen, setIsStepModalOpen] = useState(false);
    const [newStepForm, setNewStepForm] = useState({ name: '', type: 'task' });

    const { data: workflow, refetch } = useQuery({
        queryKey: ['workflow', id],
        queryFn: () => api.get(`/workflows/${id}`),
        enabled: !isNew
    });

    useEffect(() => {
        if (workflow) {
            setName(workflow.name);
            setDescription(workflow.description || '');
            setIsActive(workflow.is_active);
            setStartStepId(workflow.start_step_id || '');
            const schemaArr: any[] = [];
            for (const key in workflow.input_schema || {}) {
                schemaArr.push({ name: key, ...workflow.input_schema[key] });
            }
            setSchema(schemaArr);
            setSteps(workflow.steps || []);
        }
    }, [workflow]);

    const handleSaveWorkflow = async () => {
        setSaving(true);
        try {
            const schemaObj: any = {};
            for (const s of schema) {
                if (s.name) {
                    schemaObj[s.name] = {
                        type: s.type,
                        required: s.required,
                        allowed_values: s.allowed_values
                            ? s.allowed_values.split(',').map((v: any) => v.trim()).filter(Boolean)
                            : undefined
                    };
                }
            }
            const payload = { name, description, is_active: isActive, start_step_id: startStepId || null, input_schema: schemaObj };
            if (isNew) {
                const res = await api.post('/workflows', payload);
                navigate(`/workflows/${res.id}/edit`);
            } else {
                await api.put(`/workflows/${id}`, payload);
                refetch();
                addNotification('Workflow saved successfully');
            }
        } catch (e: any) {
            alert(e.message);
        } finally {
            setSaving(false);
        }
    };

    const confirmAddStep = async () => {
        if (!newStepForm.name.trim()) return;
        const maxOrder = steps.reduce((max, s) => Math.max(max, s.order || 0), 0);
        try {
            const res = await api.post(`/workflows/${id}/steps`, { 
                name: newStepForm.name.trim(), 
                step_type: newStepForm.type, 
                order: maxOrder + 1, 
                metadata: {} 
            });
            setSteps(prev => [...prev, res]);
            setSelectedStep(res); // Automatically move to the next "step" (rule editor)
            addNotification('Step added successfully');
            setIsStepModalOpen(false);
            setNewStepForm({ name: '', type: 'task' });
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteStep = async (stepId: string) => {
        if (!confirm('Delete this step and all its rules?')) return;
        await api.delete(`/steps/${stepId}`);
        setSteps(prev => prev.filter(s => s.id !== stepId));
        addNotification('Step deleted successfully');
    };

    const tabs: { key: Tab; label: string; icon: any; disabled?: boolean }[] = [
        { key: 'general', label: 'General & Schema', icon: Settings2 },
        ...(!isNew ? [{ key: 'steps' as Tab, label: 'Steps & Rules', icon: Layers }] : []),
        ...(!isNew && steps.length > 0 ? [{ key: 'diagram' as Tab, label: 'Diagram', icon: Network }] : []),
    ];

    return (
        <div className="space-y-5 animate-fade-in">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <button
                    onClick={() => navigate(-1)}
                    className="btn btn-secondary btn-sm px-2.5 py-2 shrink-0 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 truncate">
                        {isNew ? 'Create New Workflow' : (workflow?.name || 'Loading…')}
                    </h1>
                    {!isNew && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Version <span className="font-semibold text-violet-600 dark:text-violet-400">v{workflow?.version}</span></span>
                            <span className="text-slate-300 dark:text-slate-600">·</span>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${workflow?.is_active ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-600'}`} />
                            <span>{workflow?.is_active ? 'Active' : 'Inactive'}</span>
                        </p>
                    )}
                </div>
                <button
                    onClick={handleSaveWorkflow}
                    disabled={saving || !name.trim()}
                    className="btn btn-primary btn-md shrink-0 shadow-lg shadow-violet-500/20"
                >
                    {saving ? (
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    {saving ? 'Saving…' : 'Save Workflow'}
                </button>
            </div>

            {/* ── Tab Bar ── */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-card overflow-hidden dark:bg-slate-800 dark:border-slate-700">
                <div className="flex border-b border-slate-100 px-2 pt-1 gap-1 dark:border-slate-700">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => { setActiveTab(tab.key); setSelectedStep(null); }}
                            disabled={tab.disabled}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-all duration-150",
                                activeTab === tab.key
                                    ? "border-violet-500 text-violet-700 bg-violet-50/50 dark:text-violet-300 dark:bg-violet-900/30 dark:border-violet-400"
                                    : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-5">
                    {/* ══════════════ GENERAL & SCHEMA TAB ══════════════ */}
                    {activeTab === 'general' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* LEFT: Configuration */}
                            <div className="space-y-4">
                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-card">
                                    <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700">
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">General Settings</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configure workflow details and triggers</p>
                                    </div>
                                    <div className="p-4 sm:p-6 space-y-5">
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Workflow Name</label>
                                            <input
                                                type="text"
                                                className="input bg-slate-50 dark:bg-slate-900 w-full font-medium"
                                                value={name}
                                                onChange={e => setName(e.target.value)}
                                                placeholder="e.g. Employee Onboarding"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Description</label>
                                            <textarea
                                                className="input bg-slate-50 dark:bg-slate-900 w-full min-h-[100px] resize-y"
                                                value={description}
                                                onChange={e => setDescription(e.target.value)}
                                                placeholder="Briefly describe what this workflow does..."
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Active Toggle */}
                                <div className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-xl border border-slate-200/80 dark:bg-slate-900/50 dark:border-slate-700">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">Active Status</p>
                                        <p className="text-xs text-slate-500 mt-0.5 dark:text-slate-400">Allow executions of this workflow</p>
                                    </div>
                                    <button
                                        onClick={() => setIsActive(v => !v)}
                                        className={cn(
                                            "relative flex items-center w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:ring-offset-1",
                                            isActive ? "bg-emerald-500" : "bg-slate-300 dark:bg-slate-600"
                                        )}
                                    >
                                        <div className={cn(
                                            "absolute w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                                            isActive ? "translate-x-5.5" : "translate-x-0.5"
                                        )} style={{ transform: isActive ? 'translateX(1.25rem)' : 'translateX(0.125rem)' }} />
                                    </button>
                                </div>

                                {/* Start Step */}
                                {!isNew && (
                                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-card p-4 sm:p-6">
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">Start Step</label>
                                        <div className="relative">
                                            <select
                                                className="input pr-8 appearance-none bg-slate-50 dark:bg-slate-900 w-full"
                                                value={startStepId}
                                                onChange={e => setStartStepId(e.target.value)}
                                            >
                                                <option value="">— None —</option>
                                                {steps.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name} ({s.step_type})</option>
                                                ))}
                                            </select>
                                            <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 rotate-90 pointer-events-none" />
                                        </div>
                                    </div>
                                )}

                                {isNew && (
                                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200/60 rounded-xl dark:bg-amber-900/30 dark:border-amber-700">
                                        <AlertCircle className="h-4 w-4 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                                        <p className="text-xs text-amber-700 dark:text-amber-300">
                                            Save the workflow first to unlock <strong>Steps & Rules</strong> and <strong>Diagram</strong> tabs.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: Input Schema */}
                            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700/80 shadow-card">
                                <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Input Schema</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Define the JSON structure required to start this workflow</p>
                                    </div>
                                    <button
                                        onClick={() => setSchema([...schema, { name: '', type: 'string', required: false, allowed_values: '' }])}
                                        className="btn btn-secondary dark:bg-slate-700 dark:border-slate-600 dark:text-white btn-sm"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Add Field
                                    </button>
                                </div>
                                <div className="p-4 sm:p-6 space-y-4">
                                    {schema.length === 0 ? (
                                        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50/50 dark:bg-slate-900/50">
                                            <Code className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                            <p className="text-sm font-medium text-slate-600 dark:text-slate-400">No input fields defined</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">This workflow currently requires no initial parameters.</p>
                                        </div>
                                    ) : (
                                        <div className="border border-slate-200/80 rounded-xl overflow-hidden dark:border-slate-700">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 border-b border-slate-200/80 dark:bg-slate-700/50 dark:border-slate-700">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-300">Field Name</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-300">Type</th>
                                                        <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-300">Req.</th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-300">Allowed Values</th>
                                                        <th className="px-4 py-3 w-8" />
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                    {schema.map((field, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors dark:hover:bg-slate-700/50">
                                                            <td className="px-4 py-2.5">
                                                                <input
                                                                    type="text"
                                                                    placeholder="field_name"
                                                                    className="w-28 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-400 transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:placeholder-slate-500"
                                                                    value={field.name}
                                                                    onChange={e => { const n = [...schema]; n[idx].name = e.target.value; setSchema(n); }}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <select
                                                                    className="border border-slate-200 rounded-lg px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                                                                    value={field.type}
                                                                    onChange={e => { const n = [...schema]; n[idx].type = e.target.value; setSchema(n); }}
                                                                >
                                                                    <option value="string">string</option>
                                                                    <option value="number">number</option>
                                                                    <option value="boolean">boolean</option>
                                                                </select>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-center">
                                                                <button
                                                                    onClick={() => { const n = [...schema]; n[idx].required = !n[idx].required; setSchema(n); }}
                                                                    className="transition-transform active:scale-90"
                                                                >
                                                                    {field.required
                                                                        ? <ToggleRight className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                                                        : <ToggleLeft className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                                                                    }
                                                                </button>
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <input
                                                                    type="text"
                                                                    placeholder="val1, val2"
                                                                    className="w-28 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 focus:border-violet-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200 dark:placeholder-slate-500"
                                                                    value={field.allowed_values || ''}
                                                                    onChange={e => { const n = [...schema]; n[idx].allowed_values = e.target.value; setSchema(n); }}
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2.5">
                                                                <button
                                                                    onClick={() => { const n = [...schema]; n.splice(idx, 1); setSchema(n); }}
                                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/30 dark:text-slate-500"
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ══════════════ STEPS & RULES TAB ══════════════ */}
                    {activeTab === 'steps' && !selectedStep && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                            {/* LEFT: Steps List */}
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <Layers className="h-4 w-4 text-violet-500" />
                                        Steps
                                        {steps.length > 0 && (
                                            <span className="px-2 py-0.5 bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300 text-xs font-bold rounded-full">
                                                {steps.length}
                                            </span>
                                        )}
                                    </h3>
                                    <button onClick={() => setIsStepModalOpen(true)} className="btn btn-primary btn-sm">
                                        <Plus className="h-3.5 w-3.5" /> Add Step
                                    </button>
                                </div>

                                {steps.length === 0 ? (
                                    <div className="border-2 border-dashed border-slate-700/50 rounded-xl p-10 text-center bg-slate-800/20">
                                        <Layers className="h-8 w-8 text-slate-500 mx-auto mb-3 opacity-50" />
                                        <p className="text-sm font-medium text-slate-300">No steps defined</p>
                                        <p className="text-xs text-slate-500 mt-1">Add steps to build your workflow</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {steps.map((step, idx) => {
                                            const meta = STEP_TYPE_META[step.step_type] || STEP_TYPE_META.task;
                                            return (
                                                <div
                                                    key={step.id}
                                                    className="flex items-center gap-3 p-4 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 rounded-xl hover:border-violet-300 dark:hover:border-slate-500 hover:shadow-card-md cursor-pointer group transition-all duration-150"
                                                    onClick={() => setSelectedStep(step)}
                                                >
                                                    {/* Step number */}
                                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs font-bold flex items-center justify-center shrink-0 group-hover:bg-violet-100 group-hover:text-violet-700 transition-colors">
                                                        {idx + 1}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 group-hover:text-violet-700 dark:group-hover:text-violet-400 truncate transition-colors">
                                                            {step.name}
                                                        </p>
                                                        <span className={cn("step-chip mt-0.5 border dark:bg-opacity-20 dark:border-opacity-30", meta.cls)}>
                                                            <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
                                                            {meta.label}
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => setSelectedStep(step)}
                                                            className="p-1.5 text-violet-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/40 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStep(step.id)}
                                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 dark:text-slate-500 rounded-lg transition-colors"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>

                                                    <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-violet-400 transition-colors shrink-0" />
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* RIGHT: Diagram preview */}
                            {steps.length > 0 && (
                                <div>
                                    <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
                                        <Network className="h-4 w-4 text-violet-500" />
                                        Flow Preview
                                    </h3>
                                    <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl overflow-hidden">
                                        <WorkflowDiagram steps={steps} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══════════════ RULE EDITOR ══════════════ */}
                    {activeTab === 'steps' && selectedStep && (
                        <div className="animate-fade-in">
                            <div className="flex items-center gap-3 mb-5">
                                <button
                                    onClick={() => { setSelectedStep(null); refetch(); }}
                                    className="btn btn-secondary btn-sm px-2.5 py-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                <div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Editing rules for</p>
                                    <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                        {selectedStep.name}
                                        <span className={cn("step-chip border mt-0.5", STEP_TYPE_META[selectedStep.step_type]?.cls || 'bg-slate-100 text-slate-600 border-slate-200')}>
                                            {selectedStep.step_type}
                                        </span>
                                    </h2>
                                </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-card">
                                <RuleEditor step={selectedStep} workflowSteps={steps} onUpdate={() => refetch()} />
                            </div>
                        </div>
                    )}

                    {/* ══════════════ DIAGRAM TAB ══════════════ */}
                    {activeTab === 'diagram' && (
                        <div className="animate-fade-in">
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 mb-4">
                                <Network className="h-4 w-4 text-violet-500" />
                                Workflow Diagram
                            </h3>
                            <div className="border border-slate-200/80 dark:border-slate-700 rounded-xl overflow-hidden">
                                <WorkflowDiagram steps={steps} />
                            </div>
                            <p className="text-xs text-slate-400 mt-2 text-center">
                                Nodes represent steps. Edges show transition rules.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* ── MODALS ── */}
            {isStepModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
                    <div className="bg-slate-800 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-700">
                        <div className="px-5 py-4 border-b border-slate-700/50 flex justify-between items-center">
                            <h3 className="text-slate-100 font-bold">Add New Step</h3>
                            <button onClick={() => setIsStepModalOpen(false)} className="text-slate-400 hover:text-white transition-colors">✕</button>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Step Name</label>
                                <input 
                                    autoFocus
                                    type="text" 
                                    className="input bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-violet-500 w-full" 
                                    placeholder="e.g. Finance Approval" 
                                    value={newStepForm.name}
                                    onChange={e => setNewStepForm({ ...newStepForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">Step Type</label>
                                <select 
                                    className="input bg-slate-900 border-slate-700 text-white focus:border-violet-500 w-full"
                                    value={newStepForm.type}
                                    onChange={e => setNewStepForm({ ...newStepForm, type: e.target.value })}
                                >
                                    <option value="task">Task</option>
                                    <option value="approval">Approval</option>
                                    <option value="notification">Notification</option>
                                </select>
                            </div>
                        </div>
                        <div className="px-5 py-4 bg-slate-800/50 border-t border-slate-700/50 flex justify-end gap-3">
                            <button onClick={() => setIsStepModalOpen(false)} className="btn btn-secondary btn-sm dark:bg-slate-700 dark:border-slate-600">Cancel</button>
                            <button onClick={confirmAddStep} disabled={!newStepForm.name.trim()} className="btn btn-primary btn-sm px-6">Add Step</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
