import { HateoasResponse } from '../../types/api';

export interface CreateBlogDto {
  title: string;
  summary?: string;
  content: string; // Tiptap JSON content as string
  isPublished: boolean;
}

export interface UpdateBlogDto {
  title: string;
  summary?: string;
  content: string; // Tiptap JSON content as string
  isPublished: boolean;
}

export interface Blog extends HateoasResponse {
  id: string;
  title: string;
  summary?: string;
  content: string;
  isPublished: boolean;
  isArchived: boolean;
  publishedAtUtc?: string;
  createdAtUtc: string;
  updatedAtUtc: string | null;
  tags: string[];
  relevance?: number;
}

