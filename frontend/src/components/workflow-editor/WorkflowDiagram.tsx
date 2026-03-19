import { useMemo } from 'react';
import ReactFlow, { Background, Controls, MarkerType, BackgroundVariant } from 'reactflow';
import type { Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css';

const STEP_TYPE_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    task:         { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', badge: '#dbeafe' },
    approval:     { bg: '#fffbeb', border: '#fcd34d', text: '#b45309', badge: '#fef3c7' },
    notification: { bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9', badge: '#ede9fe' },
};


export function WorkflowDiagram({ steps }: { steps: any[] }) {
    const { nodes, edges } = useMemo(() => {
        const nds: Node[] = [];
        const eds: Edge[] = [];

        const COLS = 3;
        const X_GAP = 240;
        const Y_GAP = 130;

        steps.forEach((step, index) => {
            const col = index % COLS;
            const row = Math.floor(index / COLS);
            const colors = STEP_TYPE_COLORS[step.step_type] || { bg: '#f8fafc', border: '#cbd5e1' };

            nds.push({
                id: step.id,
                position: { x: col * X_GAP, y: row * Y_GAP },
                data: {
                    label: (
                        <div style={{ fontFamily: "'Inter', sans-serif" }}>
                            <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
                                {step.name}
                            </div>
                            <span style={{
                                display: 'inline-block',
                                padding: '1px 8px',
                                borderRadius: 999,
                                fontSize: 10,
                                fontWeight: 700,
                                background: colors.bg,
                                color: STEP_TYPE_COLORS[step.step_type]?.text || '#475569',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em'
                            }}>
                                {step.step_type}
                            </span>
                        </div>
                    )
                },
                style: {
                    background: '#ffffff',
                    border: `1.5px solid ${colors.border}`,
                    borderRadius: 12,
                    padding: '12px 16px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    minWidth: 160,
                }
            });

            if (step.rules && step.rules.length > 0) {
                step.rules.forEach((rule: any, ruleIdx: number) => {
                    if (rule.next_step_id) {
                        const isDefault = rule.condition?.trim().toUpperCase() === 'DEFAULT';
                        eds.push({
                            id: `e-${step.id}-${rule.next_step_id}-${ruleIdx}`,
                            source: step.id,
                            target: rule.next_step_id,
                            label: isDefault ? 'Default' : rule.condition,
                            animated: true,
                            type: 'smoothstep',
                            style: {
                                stroke: isDefault ? '#8b5cf6' : '#64748b',
                                strokeWidth: 1.5,
                                strokeDasharray: isDefault ? undefined : '5,3'
                            },
                            labelStyle: {
                                fill: isDefault ? '#7c3aed' : '#64748b',
                                fontWeight: 600,
                                fontSize: 10,
                                fontFamily: "'JetBrains Mono', monospace"
                            },
                            labelBgStyle: {
                                fill: isDefault ? '#f5f3ff' : '#f8fafc',
                                fillOpacity: 1,
                                stroke: isDefault ? '#ddd6fe' : '#e2e8f0',
                            },
                            markerEnd: {
                                type: MarkerType.ArrowClosed,
                                color: isDefault ? '#8b5cf6' : '#94a3b8',
                                width: 18,
                                height: 18,
                            },
                        });
                    }
                });
            }
        });

        return { nodes: nds, edges: eds };
    }, [steps]);

    if (!steps || steps.length === 0) {
        return (
            <div className="h-40 flex flex-col items-center justify-center text-slate-400 bg-slate-50">
                <p className="text-sm">No steps to visualize</p>
            </div>
        );
    }

    return (
        <div style={{ height: 420, width: '100%', background: '#fafafa' }}>
            <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.3 }}>
                <Background variant={BackgroundVariant.Dots} color="#e2e8f0" gap={20} size={1.2} />
                <Controls showInteractive={false} style={{ bottom: 10, right: 10 }} />
            </ReactFlow>
        </div>
    );
}
