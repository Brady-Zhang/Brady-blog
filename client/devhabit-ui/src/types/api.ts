export interface Link {
  href: string;
  rel: string;
  method: string;
}

export type HypermediaLink = Link;

export interface HateoasResponse {
  links: Link[];
}

export interface PaginationResult<T> extends HateoasResponse {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
