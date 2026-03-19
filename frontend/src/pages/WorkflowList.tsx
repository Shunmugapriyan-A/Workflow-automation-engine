import { useQuery } from '@tanstack/react-query';
import { api } from '../api/client';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Play, Edit, Trash2, Search, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { useState, useMemo } from 'react';

export function WorkflowList() {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

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
        } catch (e: any) {
            alert(e.message);
        }
    };

    const workflows = result?.workflows || [];

    const filteredWorkflows = useMemo(() => {
        return workflows.filter((wf: any) => 
            wf.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [workflows, searchTerm]);

    const totalPages = Math.ceil(filteredWorkflows.length / itemsPerPage);
    const paginatedWorkflows = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredWorkflows.slice(start, start + itemsPerPage);
    }, [filteredWorkflows, currentPage, itemsPerPage]);

    // Reset pagination when search changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useMemo(() => { setCurrentPage(1); }, [searchTerm]);

    if (isLoading) return (
        <div className="flex h-64 items-center justify-center">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Workflows</h1>
                    <p className="text-sm text-slate-500 mt-1">Manage and execute your automated processes</p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Search className="h-4 w-4 text-slate-400" />
                         </div>
                         <input
                             type="text"
                             className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                             placeholder="Search workflows..."
                             value={searchTerm}
                             onChange={(e) => setSearchTerm(e.target.value)}
                         />
                    </div>
                    <Link 
                        to="/workflows/new" 
                        className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-indigo-600 text-white h-9 px-4 hover:bg-indigo-700 shadow-sm transition-colors shrink-0"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Create Workflow
                    </Link>
                </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-200">
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Workflow Name</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Steps Count</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Version</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {paginatedWorkflows.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Layers className="h-10 w-10 text-slate-300" />
                                            <p className="text-base font-medium text-slate-900">No workflows found</p>
                                            <p className="text-sm">Get started by creating a new workflow.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedWorkflows.map((wf: any) => (
                                    <tr 
                                        key={wf.id} 
                                        className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                                        onClick={() => navigate(`/workflows/${wf.id}/edit`)}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-slate-900 group-hover:text-indigo-600 transition-colors">{wf.name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            {wf._count?.steps || 0} steps
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                            v{wf.version}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${wf.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                                                {wf.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/executions/new/${wf.id}`); }}
                                                    className="p-1.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-md transition-colors"
                                                    title="Execute"
                                                >
                                                    <Play className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/workflows/${wf.id}/edit`); }}
                                                    className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button 
                                                    onClick={(e) => handleDelete(wf.id, e)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredWorkflows.length)}</span> of <span className="font-medium">{filteredWorkflows.length}</span> results
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </button>
                            <span className="text-sm text-slate-600 px-2">Page {currentPage} of {totalPages}</span>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-1.5 rounded-md border border-slate-300 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

