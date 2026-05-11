import { useNavigate } from 'react-router-dom';
import { clusters } from '../data/clusters';
import { ClusterCard } from '../components/ClusterCard';
import { ProjectShell } from '../components/ProjectShell';
import { SaveAsTestSetModal } from '../components/SaveAsTestSetModal';
import { useSaveClusterModal } from '../components/useSaveClusterModal';

export function ClusterList() {
  const navigate = useNavigate();
  const modal = useSaveClusterModal();

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
              onSave={() => modal.openWith(c)}
            />
          ))}
        </div>
      </section>

      <SaveAsTestSetModal open={modal.open} sourceCluster={modal.cluster} onClose={modal.close} />
    </ProjectShell>
  );
}
