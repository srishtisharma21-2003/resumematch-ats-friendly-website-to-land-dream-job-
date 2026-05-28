
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  matchScore: number;
  platform: string;
  posted_at: string;
  type: string;
  description: string;
  url: string;
}

export interface Tip {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}