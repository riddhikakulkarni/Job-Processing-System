import React from 'react';
import { Job, JobStatus } from '../types';

interface Props {
  jobs: Job[];
  loading: boolean;
  error: string | null;
}

const STATUS_LABELS: Record<JobStatus, string> = {
  pending: '⏳ Pending',
  processing: '⚙️ Processing',
  completed: '✅ Completed',
  failed: '❌ Failed',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString();
}

function elapsed(created: string, completed: string | null): string {
  if (!completed) return '—';
  const ms = new Date(completed).getTime() - new Date(created).getTime();
  return `${(ms / 1000).toFixed(1)}s`;
}

export function JobTable({ jobs, loading, error }: Props) {
  if (loading) return <p className="hint">Loading jobs…</p>;
  if (error) return <p className="msg error">Error: {error}</p>;

  return (
    <div className="card">
      <div className="table-header">
        <h2>Jobs</h2>
        <span className="hint">{jobs.length} total · polling every 2.5s</span>
      </div>

      {jobs.length === 0 ? (
        <p className="hint">No jobs yet. Submit one above.</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Completed</th>
                <th>Elapsed</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id} className={`row-${job.status}`}>
                  <td className="mono">{job.id.slice(0, 8)}…</td>
                  <td>{job.name}</td>
                  <td>{job.duration}s</td>
                  <td>
                    <span className={`badge badge-${job.status}`}>
                      {STATUS_LABELS[job.status]}
                    </span>
                  </td>
                  <td>{formatDate(job.created_at)}</td>
                  <td>{formatDate(job.completed_at)}</td>
                  <td>{elapsed(job.created_at, job.completed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
