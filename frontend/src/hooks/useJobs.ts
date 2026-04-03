import { useState, useEffect, useCallback } from 'react';
import { Job } from '../types';
import { fetchJobs } from '../api/client';

const POLL_INTERVAL_MS = 2500;

export function useJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchJobs();
      setJobs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [refresh]);

  return { jobs, error, loading, refresh };
}
