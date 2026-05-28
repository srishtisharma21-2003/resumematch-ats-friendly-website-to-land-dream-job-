import { create } from 'zustand';

export type JobResult = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  description?: string;
  matchScore?: number;
  redirect_url?: string;
  url?: string;
  platform?: string;
};

export type ApplicationItem = {
  id: string;
  job_id: string;
  title?: string;
  job_title?: string;
  company?: string;
  location?: string;
  salary?: string;
  match_score?: number;
  status?: 'applied' | 'interview' | 'rejected' | 'offer' | 'archived';
  applied_at?: string;
  job_url?: string;
};

type JobStore = {
  jobs: JobResult[];
  applications: ApplicationItem[];
  extractedSkills: string[];
  setJobs: (jobs: JobResult[]) => void;
  setApplications: (applications: ApplicationItem[]) => void;
  setExtractedSkills: (skills: string[]) => void;
};

export const useJobStore = create<JobStore>((set) => ({
  jobs: [],
  applications: [],
  extractedSkills: [],
  setJobs: (jobs) => set({ jobs }),
  setApplications: (applications) => set({ applications }),
  setExtractedSkills: (extractedSkills) => set({ extractedSkills }),
}));
