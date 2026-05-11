import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { Session, JudgeDimension, JudgeScore } from '../types';
import { JudgePill } from './JudgePill';
import { relTime } from '../lib/time';

function worstVerdictForDim(session: Session, dim: JudgeDimension): JudgeScore['verdict'] {
  const verdicts = session.traces.flatMap((t) => t.scores.filter((s) => s.dimension === dim).map((s) => s.verdict));
  if (verdicts.includes('fail')) return 'fail';
  if (verdicts.includes('partial')) return 'partial';
  return 'pass';
}

const STATUS_LABEL: Record<Session['dominantStatus'], string> = {
  pass: 'pass',
  partial: 'partial',
  fail: 'fail',
};

const STATUS_CLS: Record<Session['dominantStatus'], string> = {
  pass: 'text-ink/70',
  partial: 'text-coral/80',
  fail: 'text-coral font-medium',
};

type Props = { sessions: Session[]; limit?: number };

export function SessionTable({ sessions, limit }: Props) {
  const navigate = useNavigate();
  const data = useMemo(() => (limit ? sessions.slice(0, limit) : sessions), [sessions, limit]);

  const columnHelper = createColumnHelper<Session>();
  const columns = useMemo(
    () => [
      columnHelper.accessor('startedAt', {
        header: 'time',
        cell: (info) => <span className="text-muted">{relTime(info.getValue())}</span>,
      }),
      columnHelper.accessor('id', {
        header: 'session_id',
        cell: (info) => <span className="font-mono text-xs text-ink truncate inline-block max-w-[200px] align-bottom">{info.getValue()}</span>,
      }),
      columnHelper.accessor('turns', {
        header: 'turns',
        cell: (info) => <span className="font-mono text-xs text-ink/80">{info.getValue()}</span>,
      }),
      columnHelper.display({
        id: 'judges',
        header: 'tool · safety · faith',
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <JudgePill dimension="tool-use" verdict={worstVerdictForDim(row.original, 'tool-use')} size="sm" />
            <JudgePill dimension="safety" verdict={worstVerdictForDim(row.original, 'safety')} size="sm" />
            <JudgePill dimension="faithfulness" verdict={worstVerdictForDim(row.original, 'faithfulness')} size="sm" />
          </div>
        ),
      }),
      columnHelper.accessor('dominantStatus', {
        header: 'status',
        cell: (info) => <span className={'text-xs ' + STATUS_CLS[info.getValue()]}>{STATUS_LABEL[info.getValue()]}</span>,
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  return (
    <div className="bg-white border border-border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-chrome border-b border-border">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="text-left text-[11px] uppercase tracking-wide text-muted font-medium px-4 py-2">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => navigate(`/eval/travel-agent/sessions/${row.original.id}`)}
              className="border-b border-border last:border-b-0 hover:bg-canvas cursor-pointer transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-2.5">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
