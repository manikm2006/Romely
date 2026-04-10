import { v4 as uuidv4 } from 'uuid';

export interface Event {
  id: string;
  time: string;
  title: string;
  description: string;
  durationMinutes: number;
  estimatedCost: number;
  type: "activity" | "transport";
  lat?: number;
  lon?: number;
}

export interface Day {
  dayNumber: number;
  date: string;
  weatherInfo: string;
  events: Event[];
}

export interface TransportLogistics {
  estimatedTime: string;
  estimatedPrice: number;
  availabilityStatus: string;
}

export interface Plan {
  planId: string;
  totalEstimatedCost: number;
  origin: string;
  destination: string;
  transportMode: string;
  transportLogistics: TransportLogistics;
  days: Day[];
}

const planStore = new Map<string, Plan>();

export const savePlan = (plan: Plan): void => {
  planStore.set(plan.planId, plan);
};

export const getPlan = (planId: string): Plan | undefined => {
  return planStore.get(planId);
};

export const updatePlan = (planId: string, plan: Plan): void => {
  planStore.set(planId, plan);
};

export const generateId = (): string => uuidv4();
