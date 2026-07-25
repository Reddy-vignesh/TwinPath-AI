import { create } from 'zustand';
import { apiClient } from '../api/client';

export interface Recommendation {
  rank: number;
  career_id: string;
  similarity_score: number;
  career: {
    title: string;
    category: string;
    description?: string;
    median_salary_usd?: number;
    market_demand?: string;
    growth_rate_percent?: number;
    automation_risk_percent?: number;
    salary_range_low?: number;
    salary_range_high?: number;
  };
  skill_gap?: {
    match_score: number;
    required_met: number;
    required_total: number;
    gaps: Array<{ name: string; required_level: number; current_level: number; priority: string }>;
    strengths: string[];
  };
  explanation?: {
    top_reasons?: string[];
    feature_contributions?: Record<string, number>;
    suggestions_to_improve?: string[];
    confidence_level?: string;
  };
}

export interface SimulationImpact {
  careers_gained: number;
  careers_lost: number;
  careers_improved: number;
  careers_declined: number;
}

export interface SalaryPrediction {
  career_id: string;
  career_title: string;
  predicted_salary_low: number;
  predicted_salary_mid: number;
  predicted_salary_high: number;
  confidence: string;
  factors?: Record<string, number>;
}

interface TwinState {
  recommendations: Recommendation[];
  isLoadingRecs: boolean;

  simulatedRecommendations: Recommendation[] | null;
  simulationImpact: SimulationImpact | null;
  isLoadingSim: boolean;
  lastSimulationResult: any | null;

  salaryPredictions: SalaryPrediction[];
  isLoadingSalary: boolean;

  fetchRecommendations: () => Promise<void>;
  runSimulation: (mutations: any[]) => Promise<any>;
  fetchSalaryPredictions: (careerIds?: string[]) => Promise<void>;
  clearSimulation: () => void;
}

export const useTwinStore = create<TwinState>((set, get) => ({
  recommendations: [],
  isLoadingRecs: false,

  simulatedRecommendations: null,
  simulationImpact: null,
  isLoadingSim: false,
  lastSimulationResult: null,

  salaryPredictions: [],
  isLoadingSalary: false,

  fetchRecommendations: async () => {
    // Avoid duplicate fetches if already loading
    if (get().isLoadingRecs) return;
    set({ isLoadingRecs: true });
    try {
      const response = await apiClient.post('/recommendations', {
        top_k: 10,
        include_explanation: true,
        include_skill_gap: true,
      });
      set({ recommendations: response.data.data.recommendations ?? [] });
    } catch (error) {
      console.error('Failed to fetch recommendations', error);
    } finally {
      set({ isLoadingRecs: false });
    }
  },

  runSimulation: async (mutations: any[]) => {
    set({ isLoadingSim: true, lastSimulationResult: null });
    try {
      const response = await apiClient.post('/simulations', { mutations, top_k: 10 });
      const result = response.data.data;
      // Simulation returns flat {title, rank, career_id, similarity_score}
      // Normalize to be usable by both the store and the Simulator page
      const rawSimCareers = result.simulated?.top_careers ?? [];
      const simulated = rawSimCareers.map((c: any) => ({
        ...c,
        career: { title: c.title, category: c.category ?? '', ...c.career },
      }));
      const impact = result.impact?.summary ?? null;

      set({
        simulatedRecommendations: simulated,
        simulationImpact: impact,
        lastSimulationResult: result,
      });

      return result;

    } catch (error) {
      console.error('Failed to run simulation', error);
      return null;
    } finally {
      set({ isLoadingSim: false });
    }
  },

  fetchSalaryPredictions: async (careerIds?: string[]) => {
    set({ isLoadingSalary: true });
    try {
      const body = careerIds && careerIds.length > 0 ? { career_ids: careerIds } : {};
      const response = await apiClient.post('/salary-predictions', body);
      set({ salaryPredictions: response.data.data.predictions ?? [] });
    } catch (error) {
      console.error('Failed to fetch salary predictions', error);
    } finally {
      set({ isLoadingSalary: false });
    }
  },

  clearSimulation: () => {
    set({ simulatedRecommendations: null, simulationImpact: null, lastSimulationResult: null });
  },
}));
