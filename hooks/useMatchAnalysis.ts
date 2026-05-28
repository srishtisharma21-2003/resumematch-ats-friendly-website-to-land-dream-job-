import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/api';

export const useMatchAnalysis = () => {
  const [results, setResults] = useState<unknown>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const runAnalysis = useCallback(async (resumeText: string, jobText: string) => {
    setIsAnalyzing(true);
    try {
      const data = await apiClient<unknown>('/api/analyze', {
        method: 'POST',
        body: { resumeText, jobDescription: jobText },
      });
      setResults(data);
      return data;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const rewriteBullet = useCallback(async (bullet: string, jobText: string) => {
    return apiClient('/api/rewrite', {
      method: 'POST',
      body: { bullet, jobDescription: jobText },
    });
  }, []);

  return { results, isAnalyzing, runAnalysis, rewriteBullet, setResults };
};
