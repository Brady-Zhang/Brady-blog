import { HateoasResponse } from '../../types/api';

export enum HabitType {
  // eslint-disable-next-line no-unused-vars
  None = 0,
  // eslint-disable-next-line no-unused-vars
  Binary = 1,
  // eslint-disable-next-line no-unused-vars
  Measurable = 2,
}

export enum HabitStatus {
  // eslint-disable-next-line no-unused-vars
  None = 0,
  // eslint-disable-next-line no-unused-vars
  Active = 1,
  // eslint-disable-next-line no-unused-vars
  Completed = 2,
  // eslint-disable-next-line no-unused-vars
  Failed = 3,
}

export enum FrequencyType {
  // eslint-disable-next-line no-unused-vars
  None = 0,
  // eslint-disable-next-line no-unused-vars
  Daily = 1,
  // eslint-disable-next-line no-unused-vars
  Weekly = 2,
  // eslint-disable-next-line no-unused-vars
  Monthly = 3,
}

export enum AutomationSource {
  // eslint-disable-next-line no-unused-vars
  GitHub = 1,
}

export interface FrequencyDto {
  type: FrequencyType;
  timesPerPeriod: number;
}

export interface TargetDto {
  value: number;
  unit: string;
}

export interface MilestoneDto {
  target: number;
}

export interface CreateHabitDto {
  name: string;
  description?: string;
  type: HabitType;
  frequency: FrequencyDto;
  target: TargetDto;
  endDate?: string; // DateOnly will be sent as ISO string
  milestone?: MilestoneDto;
  automationSource?: AutomationSource;
}

export interface UpdateHabitDto {
  name: string;
  description?: string;
  type: HabitType;
  frequency: FrequencyDto;
  target: TargetDto;
  endDate?: string; // DateOnly will be sent as ISO string
  milestone?: MilestoneDto;
  automationSource?: AutomationSource;
}

export interface Habit extends CreateHabitDto, HateoasResponse {
  id: string;
  status: HabitStatus;
  isArchived: boolean;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  lastCompletedAtUtc: string | null;
  tags: string[];
  automationSource?: AutomationSource;
}
