import { useState, useEffect } from 'react';
import { api } from '../../api/client';
import { Plus, GripVertical, Trash2, AlertTriangle, Info } from 'lucide-react';
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates,
    verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '../../lib/utils';

function SortableItem({ id, rule, workflowSteps, onDelete, onUpdate }: any) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    const style = { transform: CSS.Transform.toString(transform), transition };
    const isDefault = rule.condition?.trim().toUpperCase() === 'DEFAULT';

    return (
        <tr
            ref={setNodeRef}
            style={style}
            className={cn(
                "group border-b border-slate-100 dark:border-slate-700/50 transition-colors",
                isDefault 
                    ? "bg-amber-50/40 hover:bg-amber-50/70 dark:bg-amber-900/10 dark:hover:bg-amber-900/20" 
                    : "bg-white hover:bg-slate-50/60 dark:bg-slate-800 dark:hover:bg-slate-700/40"
            )}
        >
            {/* Drag Handle */}
            <td className="pl-4 pr-2 py-3 w-10">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 p-1 rounded-md transition-colors"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
            </td>

            {/* Priority */}
            <td className="px-3 py-3 w-16 text-center">
                <span className={cn(
                    "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold shrink-0",
                    isDefault
                        ? 'bg-amber-100 text-amber-700 border border-amber-200/60 dark:bg-amber-900/40 dark:text-amber-400 dark:border-amber-700/50'
                        : 'bg-violet-100 text-violet-700 border border-violet-200/60 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-700/50'
                )}>
                    {isDefault ? '★' : rule.priority}
                </span>
            </td>

            {/* Condition */}
            <td className="px-3 py-3">
                <div className="relative">
                    <input
                        type="text"
                        className={cn(
                            "w-full border rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 transition-all pr-8",
                            isDefault
                                ? "border-amber-200 bg-amber-50 text-amber-900 placeholder:text-amber-400 focus:ring-amber-500/30 focus:border-amber-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                                : "border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-violet-500/30 focus:border-violet-400 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                        )}
                        value={rule.condition}
                        onChange={e => onUpdate(rule.id, 'condition', e.target.value)}
                        placeholder="e.g. amount > 1000 && country == 'US'"
                    />
                    {isDefault && (
                        <AlertTriangle className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-400 pointer-events-none" />
                    )}
                </div>
                {isDefault && (
                    <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-1 font-medium flex items-center gap-1">
                        <Info className="h-3 w-3" />
                        Catch-all fallback — evaluated last
                    </p>
                )}
            </td>

            {/* Next Step */}
            <td className="px-3 py-3 w-52">
                <div className="relative">
                    <select
                        className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-2 text-xs font-medium text-slate-700 cursor-pointer pr-7 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-400 appearance-none transition-all dark:bg-slate-900 dark:border-slate-700 dark:text-slate-200"
                        value={rule.next_step_id || ''}
                        onChange={e => onUpdate(rule.id, 'next_step_id', e.target.value || null)}
                    >
                        <option value="">— End Workflow —</option>
                        {workflowSteps.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </td>

            {/* Delete */}
            <td className="px-3 py-3 w-12 text-right">
                <button
                    onClick={() => onDelete(rule.id)}
                    className="p-1.5 text-slate-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    title="Delete rule"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </td>
        </tr>
    );
}

export function RuleEditor({ step, workflowSteps, onUpdate }: any) {
    const [rules, setRules] = useState<any[]>([]);

    useEffect(() => {
        if (step.rules) {
            setRules([...step.rules].sort((a, b) => a.priority - b.priority));
        }
    }, [step.rules]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragEnd = async (event: any) => {
        const { active, over } = event;
        if (active.id !== over?.id) {
            setRules(items => {
                const oldIdx = items.findIndex(i => i.id === active.id);
                const newIdx = items.findIndex(i => i.id === over.id);
                const newItems = arrayMove(items, oldIdx, newIdx);
                newItems.forEach((r, idx) => { r.priority = idx + 1; });
                Promise.all(
                    newItems.map(r =>
                        api.put(`/rules/${r.id}`, { priority: r.priority, condition: r.condition, next_step_id: r.next_step_id })
                    )
                ).then(() => onUpdate()).catch(console.error);
                return newItems;
            });
        }
    };

    const handleAddRule = async () => {
        const priority = rules.length + 1;
        const res = await api.post(`/steps/${step.id}/rules`, { condition: 'DEFAULT', next_step_id: null, priority });
        setRules([...rules, res]);
        onUpdate();
    };

    const handleUpdateRule = async (id: string, field: string, value: any) => {
        setRules(items => items.map(r => r.id === id ? { ...r, [field]: value } : r));
        const rule = rules.find(r => r.id === id);
        if (rule) {
            await api.put(`/rules/${id}`, { condition: rule.condition, next_step_id: rule.next_step_id, priority: rule.priority, [field]: value });
            onUpdate();
        }
    };

    const handleDeleteRule = async (id: string) => {
        await api.delete(`/rules/${id}`);
        setRules(items => items.filter(r => r.id !== id));
        onUpdate();
    };

    return (
        <div className="p-4 sm:p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Transition Rules</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Rules determine the next step in the flow. Evaluated in priority order.
                    </p>
                </div>
                <button
                    onClick={handleAddRule}
                    className="btn btn-primary btn-sm px-4 shadow-lg shadow-violet-500/20"
                >
                    <Plus className="h-3.5 w-3.5" /> Add Rule
                </button>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-xl overflow-hidden shadow-card">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200/80 dark:bg-slate-700/50 dark:border-slate-700">
                            <tr>
                                <th className="pl-4 pr-2 py-3 w-10" />
                                <th className="px-3 py-3 w-16 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Prio</th>
                                <th className="px-3 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Condition Line</th>
                                <th className="px-3 py-3 w-52 text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">Target Step</th>
                                <th className="px-3 py-3 w-12" />
                            </tr>
                        </thead>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                <SortableContext items={rules.map(r => r.id)} strategy={verticalListSortingStrategy}>
                                    {rules.map(rule => (
                                        <SortableItem
                                            key={rule.id}
                                            id={rule.id}
                                            rule={rule}
                                            workflowSteps={workflowSteps}
                                            onDelete={handleDeleteRule}
                                            onUpdate={handleUpdateRule}
                                        />
                                    ))}
                                </SortableContext>
                                {rules.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-14 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center border border-slate-200/50 dark:border-slate-700/50">
                                                    <Plus className="h-6 w-6 text-slate-300 dark:text-slate-600" />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-slate-700 dark:text-slate-300">No transition rules defined</p>
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-[240px] mx-auto">
                                                        Without rules, the execution will stop successfully after completing this step.
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </DndContext>
                    </table>
                </div>
                {rules.length > 0 && (
                    <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2 text-xs text-slate-400">
                        <GripVertical className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600" />
                        <span>Drag rows to reorder. Priority 1 is checked first. Catch-all (DEFAULT) is best at the bottom.</span>
                    </div>
                )}
            </div>
        </div>
    );
}
