export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job {
  id: string;
  name: string;
  duration: number;
  status: JobStatus;
  created_at: string;
  completed_at: string | null;
}

export interface JobCreatePayload {
  name: string;
  duration: number;
}

export interface ApiError {
  detail: string | { msg: string; loc: string[] }[];
}
