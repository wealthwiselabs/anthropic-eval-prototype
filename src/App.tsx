import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConsoleChrome } from './components/ConsoleChrome';
import { ProjectList } from './views/ProjectList';
import { ProjectHome } from './views/ProjectHome';
import { SessionList } from './views/SessionList';
import { SessionDetail } from './views/SessionDetail';
import { ClusterList } from './views/ClusterList';
import { ClusterDetail } from './views/ClusterDetail';
import { TestSetList } from './views/TestSetList';
import { TestSetDetail } from './views/TestSetDetail';
import { TestSetRun } from './views/TestSetRun';
import { CIIntegration } from './views/CIIntegration';
import { Judges } from './views/Judges';
import { Settings } from './views/Settings';
import { OrgJudges } from './views/OrgJudges';
import { OrgSettings } from './views/OrgSettings';

// BASE_URL is set by Vite from vite.config.ts. In dev it's '/'; in production
// build it's '/anthropic-eval-prototype/'. Strip the trailing slash so React
// Router's basename matches the GitHub Pages subpath.
const basename = import.meta.env.BASE_URL.replace(/\/$/, '');

export default function App() {
  return (
    <BrowserRouter basename={basename || '/'}>
      <ConsoleChrome>
        <Routes>
          <Route path="/" element={<Navigate to="/eval" replace />} />
          <Route path="/eval" element={<ProjectList />} />
          <Route path="/eval/judges" element={<OrgJudges />} />
          <Route path="/eval/settings" element={<OrgSettings />} />
          <Route path="/eval/travel-agent" element={<ProjectHome />} />
          <Route path="/eval/travel-agent/sessions" element={<SessionList />} />
          <Route path="/eval/travel-agent/sessions/:id" element={<SessionDetail />} />
          <Route path="/eval/travel-agent/clusters" element={<ClusterList />} />
          <Route path="/eval/travel-agent/clusters/:id" element={<ClusterDetail />} />
          <Route path="/eval/travel-agent/test-sets" element={<TestSetList />} />
          <Route path="/eval/travel-agent/test-sets/:id" element={<TestSetDetail />} />
          <Route path="/eval/travel-agent/test-sets/:id/runs/:runId" element={<TestSetRun />} />
          <Route path="/eval/travel-agent/ci" element={<CIIntegration />} />
          <Route path="/eval/travel-agent/judges" element={<Judges />} />
          <Route path="/eval/travel-agent/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/eval" replace />} />
        </Routes>
      </ConsoleChrome>
    </BrowserRouter>
  );
}
