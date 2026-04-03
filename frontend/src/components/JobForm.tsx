import React, { useState } from 'react';
import { submitJob } from '../api/client';
import { Job } from '../types';

interface Props {
  onJobSubmitted: (job: Job) => void;
}

export function JobForm({ onJobSubmitted }: Props) {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('Job name is required.');
      return;
    }
    if (duration < 5 || duration > 30) {
      setError('Duration must be between 5 and 30 seconds.');
      return;
    }

    setSubmitting(true);
    try {
      const job = await submitJob({ name: name.trim(), duration });
      onJobSubmitted(job);
      setSuccessMsg(`Job "${job.name}" submitted (ID: ${job.id.slice(0, 8)}…)`);
      setName('');
      setDuration(10);
    } catch (err: any) {
      setError(err.message ?? 'Failed to submit job.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="card">
      <h2>Submit a Job</h2>
      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="name">Job Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nightly report"
            maxLength={100}
            disabled={submitting}
          />
        </div>

        <div className="field">
          <label htmlFor="duration">
            Duration: <strong>{duration}s</strong>
          </label>
          <input
            id="duration"
            type="range"
            min={5}
            max={30}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            disabled={submitting}
          />
          <div className="range-labels">
            <span>5s</span>
            <span>30s</span>
          </div>
        </div>

        {error && <p className="msg error">{error}</p>}
        {successMsg && <p className="msg success">{successMsg}</p>}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit Job'}
        </button>
      </form>
    </div>
  );
}
