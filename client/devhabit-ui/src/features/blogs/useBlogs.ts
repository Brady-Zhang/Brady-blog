import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../api/config';
import { fetchWithAuth } from '../../utils/fetchUtils';
import type { Blog, CreateBlogDto, UpdateBlogDto } from './types';
import type { Link, PaginationResult } from '../../types/api';

interface ListBlogsParams {
  page?: number;
  pageSize?: number;
  search?: string;
  isPublished?: boolean;
  sort?: string;
  fields?: string;
  url?: string;
}

export const useBlogs = () => {
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listBlogs = async (params: ListBlogsParams): Promise<PaginationResult<Blog> | null> => {
    if (!accessToken) return null;
    setIsLoading(true);
    setError(null);

    try {
      let url: string;
      if (params.url) {
        url = params.url;
      } else {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.pageSize) queryParams.append('pageSize', params.pageSize.toString());
        if (params.search) queryParams.append('q', params.search);
        if (params.isPublished !== undefined)
          queryParams.append('isPublished', params.isPublished.toString());
        if (params.sort) queryParams.append('sort', params.sort);
        if (params.fields) queryParams.append('fields', params.fields);
        queryParams.append('includeLinks', 'true');

        url = `${API_BASE_URL}/blogs?${queryParams.toString()}`;
      }

      const result = await fetchWithAuth<PaginationResult<Blog>>(url, accessToken, {
        headers: {
          Accept: 'application/vnd.dev-habit.hateoas+json',
        },
      });
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch blogs');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getBlog = async (link: Link): Promise<Blog | null> => {
    if (!accessToken) return null;
    setIsLoading(true);
    setError(null);

    try {
      const url = `${link.href}?includeLinks=true`;
      const result = await fetchWithAuth<Blog>(url, accessToken, {
        headers: {
          Accept: 'application/vnd.dev-habit.hateoas+json',
        },
      });
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch blog');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const createBlog = async (blog: CreateBlogDto): Promise<Blog | null> => {
    if (!accessToken) return null;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchWithAuth<Blog>(`${API_BASE_URL}/blogs`, accessToken, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/vnd.dev-habit.hateoas+json',
        },
        body: JSON.stringify(blog),
      });
      return result;
    } catch (err: any) {
      setError(err.message || 'Failed to create blog');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBlog = async (link: Link, blog: UpdateBlogDto): Promise<boolean> => {
    if (!accessToken) return false;
    setIsLoading(true);
    setError(null);

    try {
      await fetchWithAuth<void>(link.href, accessToken, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(blog),
      });
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to update blog');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBlog = async (link: Link): Promise<boolean> => {
    if (!accessToken) return false;
    setIsLoading(true);
    setError(null);

    try {
      await fetchWithAuth<void>(link.href, accessToken, {
        method: 'DELETE',
      });
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete blog');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    listBlogs,
    getBlog,
    createBlog,
    updateBlog,
    deleteBlog,
    isLoading,
    error,
  };
};

