import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import type { FailureCluster, TestCase, TestSet } from '../types';
import { traceById } from '../data/sessions';
import { useStore } from '../store/useStore';
import { Modal } from './Modal';
import { YamlSnippet } from './YamlSnippet';

type Props = {
  open: boolean;
  onClose: () => void;
  sourceCluster?: FailureCluster;
};

const CI_YAML = `# .github/workflows/evals.yml
name: Evals
on: pull_request
jobs:
  evals:
    runs-on: ubuntu-latest
    steps:
      - uses: anthropic/evals-action@v1
        with:
          api-key: \${{ secrets.ANTHROPIC_API_KEY }}
`;

// The one real interaction in the prototype: spec §6.4 / §7.
// - Pre-fills name from the source cluster
// - Lists the cluster's exampleTraceIds as checkboxes
// - Tag chip input (Enter / comma to add, Backspace to remove last)
// - "Connect to CI" toggle reveals the action snippet
// - Save → addTestSet + showToast + navigate to the new test set
export function SaveAsTestSetModal({ open, onClose, sourceCluster }: Props) {
  const navigate = useNavigate();
  const addTestSet = useStore((s) => s.addTestSet);
  const showToast = useStore((s) => s.showToast);

  // Resolve trace IDs against the seeded data so we can show input snippets
  // and derive expectedBehavior from each trace's failed-score reasoning.
  const resolvedTraces = useMemo(() => {
    if (!sourceCluster) return [];
    return sourceCluster.exampleTraceIds
      .map((id) => {
        const hit = traceById[id];
        if (!hit) return null;
        const failedScore = hit.trace.scores.find((s) => s.verdict === 'fail');
        return {
          id,
          inputSnippet: hit.trace.inputPreview,
          expectedReasoning:
            failedScore?.reasoning ?? 'agent should match the expected behavior for this prompt',
        };
      })
      .filter((t): t is NonNullable<typeof t> => t !== null);
  }, [sourceCluster]);

  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [connectToCI, setConnectToCI] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Reset / hydrate form whenever the modal is (re)opened with a cluster
  useEffect(() => {
    if (!open) return;
    setName(sourceCluster ? `${sourceCluster.title} v1` : '');
    setSelectedIds(new Set(resolvedTraces.map((t) => t.id)));
    setTags([]);
    setTagInput('');
    setConnectToCI(false);
    setSaving(false);
    // Focus name field shortly after the modal appears
    setTimeout(() => nameInputRef.current?.focus(), 0);
  }, [open, sourceCluster, resolvedTraces]);

  const extraSimilarCount = sourceCluster
    ? Math.max(0, sourceCluster.count - resolvedTraces.length)
    : 0;
  const selectedCount = selectedIds.size;
  const totalCount = selectedCount + extraSimilarCount;

  function toggleTrace(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function commitTagFromInput() {
    const cleaned = tagInput.trim().replace(/,$/, '').trim();
    if (!cleaned) return;
    if (!tags.includes(cleaned)) setTags((prev) => [...prev, cleaned]);
    setTagInput('');
  }

  function onTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitTagFromInput();
    } else if (e.key === 'Backspace' && tagInput === '' && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function handleSave() {
    // Guard against double-click — without this, a fast double-click can fire
    // addTestSet twice and create two entries before navigation kicks in.
    if (saving) return;
    if (!name.trim()) return;
    setSaving(true);
    const newId = `ts_${Date.now()}`;
    const clusterTag = sourceCluster?.title.toLowerCase().split(' ').slice(0, 3).join('-');
    const baseTags = clusterTag ? [clusterTag, ...tags] : tags;

    const selectedCases: TestCase[] = resolvedTraces
      .filter((t) => selectedIds.has(t.id))
      .map((t, i) => ({
        id: `tc_${newId}_${i}`,
        inputSnippet: t.inputSnippet,
        expectedBehavior: t.expectedReasoning,
        tags: baseTags,
      }));

    // Pad out to cluster.count so caseCount stays canonical
    const padded: TestCase[] = [];
    for (let i = 0; i < extraSimilarCount; i++) {
      padded.push({
        id: `tc_${newId}_extra_${i}`,
        inputSnippet: `Auto-extracted similar trace #${i + 1}`,
        expectedBehavior: sourceCluster?.description ?? 'matches the cluster failure pattern',
        tags: baseTags,
      });
    }

    const newTestSet: TestSet = {
      id: newId,
      name: name.trim(),
      caseCount: totalCount,
      cases: [...selectedCases, ...padded],
      createdAt: new Date().toISOString(),
      lastRunSummary: null,
      source: 'from-cluster',
      sourceClusterId: sourceCluster?.id,
    };

    addTestSet(newTestSet);
    showToast(`Saved "${newTestSet.name}" to Test Sets`, {
      label: 'View test set',
      to: `/eval/travel-agent/test-sets/${newId}`,
    });
    onClose();
    navigate(`/eval/travel-agent/test-sets/${newId}`);
  }

  return (
    <Modal open={open} onClose={onClose} width={520} ariaLabel="Save cluster as test set">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="font-serif text-lg text-ink">Save cluster as test set</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted hover:text-ink transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
          {/* Name */}
          <label className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted">Name</span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border border-border rounded px-3 py-2 text-sm text-ink focus:outline-none focus:border-coral"
              placeholder="e.g. Tool-arg mismatch v1"
            />
          </label>

          {/* Trace selection */}
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide text-muted">
              Traces to include
            </span>
            <div className="border border-border rounded divide-y divide-border max-h-[200px] overflow-y-auto">
              {resolvedTraces.length === 0 && (
                <div className="px-3 py-2 text-xs text-muted">No example traces available.</div>
              )}
              {resolvedTraces.map((t) => {
                const checked = selectedIds.has(t.id);
                return (
                  <label
                    key={t.id}
                    className="flex items-start gap-2 px-3 py-2 cursor-pointer hover:bg-canvas"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTrace(t.id)}
                      className="mt-1 accent-coral"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[11px] text-ink/70 truncate">{t.id}</div>
                      <div className="text-sm text-ink truncate">{t.inputSnippet}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            {extraSimilarCount > 0 && (
              <p className="text-xs text-muted">
                Plus {extraSimilarCount} more similar traces will be included automatically.
              </p>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-1">
            <span className="text-xs uppercase tracking-wide text-muted">Tags</span>
            <div className="border border-border rounded px-2 py-1.5 flex flex-wrap gap-1.5 items-center focus-within:border-coral">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 bg-canvas border border-border rounded px-2 py-0.5 text-xs text-ink"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}
                    className="text-muted hover:text-coral"
                    aria-label={`Remove ${tag}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={onTagKeyDown}
                onBlur={commitTagFromInput}
                placeholder={tags.length === 0 ? 'comma or Enter to add' : ''}
                className="flex-1 min-w-[120px] text-sm text-ink bg-transparent focus:outline-none py-1"
              />
            </div>
          </div>

          {/* Connect to CI toggle */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm text-ink">Connect to CI</span>
              <span
                className={
                  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors ' +
                  (connectToCI ? 'bg-coral' : 'bg-border')
                }
                onClick={() => setConnectToCI((v) => !v)}
              >
                <span
                  className={
                    'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' +
                    (connectToCI ? 'translate-x-4' : 'translate-x-0.5')
                  }
                />
              </span>
            </label>
            {connectToCI && <YamlSnippet code={CI_YAML} />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-chrome">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-ink/80 hover:text-ink transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || totalCount === 0 || saving}
            className="px-3 py-1.5 text-sm bg-ink text-white rounded hover:bg-ink/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save test set'}
          </button>
        </div>
    </Modal>
  );
}
