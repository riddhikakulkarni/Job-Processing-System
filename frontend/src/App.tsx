import React from 'react';
import { JobForm } from './components/JobForm';
import { JobTable } from './components/JobTable';
import { useJobs } from './hooks/useJobs';
import { Job } from './types';

export default function App() {
  const { jobs, error, loading, refresh } = useJobs();

  function handleJobSubmitted(_job: Job) {
    // Trigger an immediate refresh so the new job appears right away
    refresh();
  }

  return (
    <div className="app">
      <header>
        <h1>Job Queue</h1>
        <p className="subtitle">Submit async jobs and watch them get processed in real time.</p>
      </header>
      <main>
        <JobForm onJobSubmitted={handleJobSubmitted} />
        <JobTable jobs={jobs} loading={loading} error={error} />
      </main>
    </div>
  );
}
