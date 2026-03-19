import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/Layout';
import { WorkflowsLayout, WorkflowWelcome } from './pages/WorkflowsLayout';
import { WorkflowEditor } from './pages/WorkflowEditor';
import { WorkflowExecution } from './pages/WorkflowExecution';
import { AuditLogs } from './pages/AuditLogs';
import { GlobalLogs } from './pages/GlobalLogs';
import { NotificationProvider } from './contexts/NotificationContext';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route element={<WorkflowsLayout />}>
                  <Route index element={<WorkflowWelcome />} />
                  <Route path="workflows/new" element={<WorkflowEditor />} />
                  <Route path="workflows/:id/edit" element={<WorkflowEditor />} />
                  <Route path="executions/new/:workflowId" element={<WorkflowExecution />} />
                  <Route path="executions/:id" element={<WorkflowExecution />} />
              </Route>
              <Route path="audit" element={<AuditLogs />} />
              <Route path="audit/global" element={<GlobalLogs />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </QueryClientProvider>
  );
}
