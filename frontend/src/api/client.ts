import { Job, JobCreatePayload } from '../types';

const BASE_URL = 'http://localhost:8000';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    const message =
      typeof err.detail === 'string'
        ? err.detail
        : err.detail?.map((d: any) => d.msg).join(', ') ?? 'Request failed';
    throw new Error(message);
  }
  return res.json();
}

export async function fetchJobs(): Promise<Job[]> {
  const res = await fetch(`${BASE_URL}/jobs`);
  return handleResponse<Job[]>(res);
}

export async function fetchJob(id: string): Promise<Job> {
  const res = await fetch(`${BASE_URL}/jobs/${id}`);
  return handleResponse<Job>(res);
}

export async function submitJob(payload: JobCreatePayload): Promise<Job> {
  const res = await fetch(`${BASE_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<Job>(res);
}
