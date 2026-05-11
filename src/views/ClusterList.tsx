import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clusters } from '../data/clusters';
import { ClusterCard } from '../components/ClusterCard';
import { ProjectShell } from '../components/ProjectShell';
import { SaveAsTestSetModal } from '../components/SaveAsTestSetModal';
import type { FailureCluster } from '../types';

export function ClusterList() {
  const navigate = useNavigate();
  const [activeCluster, setActiveCluster] = useState<FailureCluster | undefined>();

  return (
    <ProjectShell activeTab="clusters">
      <section>
        <h2 className="font-serif text-lg text-ink">Failure clusters</h2>
        <p className="text-sm text-muted mt-1">Detected in the last 14 days.</p>
        <div className="grid grid-cols-3 gap-4 mt-4">
          {clusters.map((c) => (
            <ClusterCard
              key={c.id}
              cluster={c}
              onView={() => navigate(`/eval/travel-agent/clusters/${c.id}`)}
              onSave={() => setActiveCluster(c)}
            />
          ))}
        </div>
      </section>

      <SaveAsTestSetModal
        open={!!activeCluster}
        onClose={() => setActiveCluster(undefined)}
        sourceCluster={activeCluster}
      />
    </ProjectShell>
  );
}
