import { HateoasResponse } from '../../types/api';

export enum EntrySource {
  // eslint-disable-next-line no-unused-vars
  Manual = 0,
  // eslint-disable-next-line no-unused-vars
  Automation = 1,
}

export interface HabitReference {
  id: string;
  name: string;
}

export interface Entry extends HateoasResponse {
  id: string;
  habit: HabitReference;
  value: number;
  notes: string | null;
  source: EntrySource;
  externalId: string | null;
  isArchived: boolean;
  date: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
}

export interface CreateEntryDto {
  habitId: string;
  value: number;
  notes?: string;
  date: string;
}

export interface CreateBatchEntriesDto {
  entries: CreateEntryDto[];
}

export interface UpdateEntryDto {
  value: number;
  notes?: string;
  date: string;
}

export interface EntriesResponse extends HateoasResponse {
  items: Entry[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface EntryImportJob extends HateoasResponse {
  id: string;
  fileName: string;
  status: EntryImportStatus;
  createdAtUtc: string;
  processedAtUtc?: string;
  errorMessage?: string;
}

export enum EntryImportStatus {
  // eslint-disable-next-line no-unused-vars
  Pending = 0,
  // eslint-disable-next-line no-unused-vars
  Processing = 1,
  // eslint-disable-next-line no-unused-vars
  Completed = 2,
  // eslint-disable-next-line no-unused-vars
  Failed = 3,
}

export interface EntryImportJobsResponse extends HateoasResponse {
  items: EntryImportJob[];
  page: number;
  pageSize: number;
  totalCount: number;
}
