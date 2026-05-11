import { useState } from 'react';
import type { FailureCluster } from '../types';

// Hoisted from the three views that need to open the SaveAsTestSetModal
// (ProjectHome, ClusterList, ClusterDetail). Keeps the open/cluster state in
// one place and gives a stable API: openWith(cluster) / close().
export function useSaveClusterModal() {
  const [open, setOpen] = useState(false);
  const [cluster, setCluster] = useState<FailureCluster | undefined>();

  const openWith = (c: FailureCluster) => {
    setCluster(c);
    setOpen(true);
  };
  const close = () => setOpen(false);

  return { open, cluster, openWith, close };
}
