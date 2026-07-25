import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface SkillItem {
  id: string;
  skill: {
    id: string;
    name: string;
    category: string;
    description?: string | null;
  };
  proficiency_level: number;
  years_experience: number | null;
  is_primary: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileData {
  id: string;
  user_id: string;
  twin_completeness_score: number;
  date_of_birth: string | null;
  gender: string | null;
  location: string | null;
  bio: string | null;
  phone: string | null;
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  resume_url: string | null;
  current_cgpa: number | null;
  highest_degree: string | null;
  current_major: string | null;
  current_university: string | null;
  graduation_year: number | null;
  career_goal_primary: string | null;
  career_goal_secondary: string | null;
  preferred_industry: string | null;
  willing_to_relocate: boolean | null;
  preferred_work_style: string | null;
  total_skills_count: number;
  total_projects_count: number;
  total_certifications_count: number;
}

export interface SkillCatalogItem {
  id: string;
  name: string;
  category: string;
  description?: string | null;
}

interface ProfileState {
  profile: ProfileData | null;
  skills: SkillItem[];
  skillCatalog: SkillCatalogItem[];
  isLoading: boolean;
  isSaving: boolean;
  isLoadingSkills: boolean;
  error: string | null;

  fetchProfile: () => Promise<void>;
  updateProfile: (data: Partial<ProfileData>) => Promise<void>;
  fetchSkills: () => Promise<void>;
  searchSkillCatalog: (query: string) => Promise<void>;
  addSkill: (skillId: string, proficiencyLevel: number, yearsExperience?: number) => Promise<void>;
  removeSkill: (userSkillId: string) => Promise<void>;
  updateSkillProficiency: (userSkillId: string, proficiencyLevel: number) => Promise<void>;
  updateCompleteness: (score: number) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  skills: [],
  skillCatalog: [],
  isLoading: false,
  isSaving: false,
  isLoadingSkills: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get('/profiles');
      set({ profile: response.data.data, error: null });
    } catch (error: any) {
      if (error.response?.status === 404) {
        set({ profile: null, error: null });
      } else {
        set({ error: error.response?.data?.message || 'Failed to fetch profile' });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  updateProfile: async (data: Partial<ProfileData>) => {
    set({ isSaving: true, error: null });
    try {
      // Try PATCH first (update existing profile)
      const response = await apiClient.patch('/profiles', data);
      set({ profile: response.data.data, error: null });
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Profile doesn't exist yet — create it
        try {
          const createResp = await apiClient.post('/profiles', data);
          set({ profile: createResp.data.data, error: null });
        } catch (createError: any) {
          set({ error: createError.response?.data?.message || 'Failed to create profile' });
          throw createError;
        }
      } else {
        set({ error: error.response?.data?.message || 'Failed to update profile' });
        throw error;
      }
    } finally {
      set({ isSaving: false });
    }
  },

  fetchSkills: async () => {
    set({ isLoadingSkills: true });
    try {
      const response = await apiClient.get('/skills');
      set({ skills: response.data.data });
    } catch (error: any) {
      console.error('Failed to fetch skills', error);
    } finally {
      set({ isLoadingSkills: false });
    }
  },

  searchSkillCatalog: async (query: string) => {
    try {
      const response = await apiClient.get('/skills/catalog', { params: { q: query } });
      set({ skillCatalog: response.data.data });
    } catch (error) {
      console.error('Failed to search skills catalog', error);
    }
  },

  addSkill: async (skillId: string, proficiencyLevel: number, yearsExperience?: number) => {
    try {
      const response = await apiClient.post('/skills', {
        skill_id: skillId,
        proficiency_level: proficiencyLevel,
        years_experience: yearsExperience ?? null,
      });
      const newSkill: SkillItem = response.data.data;
      set((state) => ({ skills: [...state.skills, newSkill] }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to add skill');
    }
  },

  removeSkill: async (userSkillId: string) => {
    try {
      await apiClient.delete(`/skills/${userSkillId}`);
      set((state) => ({ skills: state.skills.filter((s) => s.id !== userSkillId) }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to remove skill');
    }
  },

  updateSkillProficiency: async (userSkillId: string, proficiencyLevel: number) => {
    try {
      const response = await apiClient.patch(`/skills/${userSkillId}`, {
        proficiency_level: proficiencyLevel,
      });
      const updated: SkillItem = response.data.data;
      set((state) => ({
        skills: state.skills.map((s) => (s.id === userSkillId ? updated : s)),
      }));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update skill');
    }
  },

  updateCompleteness: (score: number) => {
    set((state) => ({
      profile: state.profile ? { ...state.profile, twin_completeness_score: score } : null,
    }));
  },
}));
