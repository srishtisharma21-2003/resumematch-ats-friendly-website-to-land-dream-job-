import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ResumeData {
  personal: {
    name: string;
    title: string;
    email: string;
    phone: string;
    city: string;
    linkedin: string;
  };
  summary: string;
  experience: Array<{
    company: string;
    role: string;
    startDate: string;
    endDate: string;
    bullets: string[];
  }>;
  education: Array<{
    degree: string;
    school: string;
    graduationDate: string;
    location: string;
    additional: string;
  }>;
  projects: Array<{
    title: string;
    bullets: string[];
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
    date: string;
  }>;
  skills: string[];
  languages: Array<{
    language: string;
    proficiency: string;
  }>;
}

const initialState: ResumeData = {
  personal: { name: '', title: '', email: '', phone: '', city: '', linkedin: '' },
  summary: '',
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  skills: [],
  languages: [],
};

function pathParts(path: string) {
  return path.replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
}

interface ResumeStore {
  data: ResumeData;
  setData: (data: ResumeData) => void;
  updateField: (path: string, value: unknown) => void;
  updateArrayItem: (path: string, index: number, field: string, value: unknown) => void;
  updateBullet: (parentPath: string, itemIndex: number, bulletIndex: number, newText: string) => void;
  addItem: (path: string, newItem: unknown) => void;
  removeItem: (path: string, index: number) => void;
}

export const useResumeStore = create<ResumeStore>()(
  persist(
    (set, get) => ({
      data: initialState,
      setData: (newData) => set({ data: newData }),
      updateField: (path, value) =>
        set((state) => {
          const newData = JSON.parse(JSON.stringify(state.data));
          const parts = pathParts(path);
          let obj: any = newData;
          for (let i = 0; i < parts.length - 1; i++) {
            if (obj[parts[i]] === undefined) obj[parts[i]] = /^\d+$/.test(parts[i + 1]) ? [] : {};
            obj = obj[parts[i]];
          }
          obj[parts[parts.length - 1]] = value;
          return { data: newData };
        }),
      updateArrayItem: (path, index, field, value) =>
        set((state) => {
          const newData = JSON.parse(JSON.stringify(state.data));
          const parts = pathParts(path);
          let arr: any = newData;
          for (let i = 0; i < parts.length; i++) arr = arr[parts[i]];
          arr[index][field] = value;
          return { data: newData };
        }),
      updateBullet: (parentPath, itemIndex, bulletIndex, newText) =>
        set((state) => {
          const newData = JSON.parse(JSON.stringify(state.data));
          const parts = pathParts(parentPath);
          let parent: any = newData;
          for (let i = 0; i < parts.length; i++) parent = parent[parts[i]];
          parent[itemIndex].bullets[bulletIndex] = newText;
          return { data: newData };
        }),
      addItem: (path, newItem) =>
        set((state) => {
          const newData = JSON.parse(JSON.stringify(state.data));
          const parts = pathParts(path);
          let arr: any = newData;
          for (let i = 0; i < parts.length; i++) arr = arr[parts[i]];
          arr.push(newItem);
          return { data: newData };
        }),
      removeItem: (path, index) =>
        set((state) => {
          const newData = JSON.parse(JSON.stringify(state.data));
          const parts = pathParts(path);
          let arr: any = newData;
          for (let i = 0; i < parts.length; i++) arr = arr[parts[i]];
          arr.splice(index, 1);
          return { data: newData };
        }),
    }),
    { name: 'resume-editor', skipHydration: true }
  )
);
