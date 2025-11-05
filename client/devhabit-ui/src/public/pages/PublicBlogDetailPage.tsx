import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { TiptapEditor } from '../../features/blogs/TiptapEditor';
import { API_BASE_URL } from '../../api/config';
import type { Blog } from '../../features/blogs/types';

const PublicBlogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const searchQuery = searchParams.get('search') || '';
  const pageParam = searchParams.get('page') || '';
  const pageSizeParam = searchParams.get('pageSize') || '';
  const backParams = [
    searchQuery ? `search=${encodeURIComponent(searchQuery)}` : '',
    pageParam ? `page=${encodeURIComponent(pageParam)}` : '',
    pageSizeParam ? `pageSize=${encodeURIComponent(pageSizeParam)}` : '',
  ].filter(Boolean).join('&');
  const backUrlBase = backParams ? `/blog?${backParams}&restore=1` : '/blog?restore=1';
  const backHash = id ? `#blog-${id}` : '';
  const backUrl = `${backUrlBase}${backHash}`;

  useEffect(() => {
    loadPublicBlog();
  }, [id]);

  const loadPublicBlog = async () => {
    if (!id || id === 'undefined') return;

    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_BASE_URL}/public/blogs/${id}`;
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        const data: Blog = await response.json();
        setBlog({ ...data, links: [] });
      } else if (response.status === 404) {
        setError('Blog not found');
      } else {
        setError('Failed to load blog');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load blog');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${day.toString().padStart(2, '0')}, ${year}`;
  };

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          type="button"
          className="text-blue-600 hover:text-blue-800"
          onClick={(e) => {
            e.preventDefault();
            try {
              if (id) {
                sessionStorage.setItem('restoreTargetId', String(id));
              }
            } catch {}
            navigate(backUrl);
          }}
        >
          ← Back to Blog List
        </button>
      </div>
    );
  }

  if (isLoading || !blog) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  const displayDate = blog.publishedAtUtc || blog.createdAtUtc;
  const dateFormatted = displayDate ? formatDate(displayDate) : '';

  return (
    <div className="py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            type="button"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
            onClick={(e) => {
              e.preventDefault();
              try {
                if (id) {
                  sessionStorage.setItem('restoreTargetId', String(id));
                }
              } catch {}
              navigate(backUrl);
            }}
          >
            ← Back to Blog List
          </button>
        </div>

        <article>
          <header className="mb-8">
            <h1 className="text-5xl font-bold text-gray-900 mb-4">{blog.title}</h1>
            
            {blog.summary && (
              <p className="text-xl text-gray-600 mb-6">{blog.summary}</p>
            )}
            
            {displayDate && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{dateFormatted}</span>
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            )}
          </header>

          <div className="prose prose-lg max-w-none">
            <TiptapEditor content={blog.content} onChange={() => {}} editable={false} className="public-display" />
          </div>
        </article>
      </div>
    </div>
  );
};

export default PublicBlogDetailPage;

