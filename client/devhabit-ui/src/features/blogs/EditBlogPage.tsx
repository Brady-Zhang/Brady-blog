import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBlogs } from './useBlogs';
import { TiptapEditor } from './TiptapEditor';
import { API_BASE_URL } from '../../api/config';
import type { Blog, UpdateBlogDto } from './types';
import type { Link as HypermediaLink } from '../../types/api';

export const EditBlogPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBlog, updateBlog, deleteBlog, isLoading, error: apiError } = useBlogs();
  const [error, setError] = useState<string | null>(null);
  const [blog, setBlog] = useState<Blog | null>(null);
  const saveTimeoutRef = useRef<number | null>(null);
  const restoredRef = useRef(false);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);

  const [formData, setFormData] = useState<UpdateBlogDto>({
    title: '',
    summary: '',
    thumbnailTitle: '',
    thumbnailSummary: '',
    content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    isPublished: false,
  });

  const draftKey = id ? `draft:editBlog:${id}` : null;

  // Early restore draft so refresh without auth still shows user's content
  useEffect(() => {
    if (!draftKey) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setFormData((prev) => ({ ...prev, ...parsed }));
          setHasLocalDraft(true);
          restoredRef.current = true;
        }
      }
    } catch {}
  }, [draftKey]);

  useEffect(() => {
    loadBlog();
  }, [id]);

  useEffect(() => {
    if (blog) {
      // If there is a local draft, offer to restore it
      if (draftKey) {
        try {
          const raw = localStorage.getItem(draftKey);
          if (raw) {
            const parsed = JSON.parse(raw);
            const shouldRestore = window.confirm('检测到未提交草稿，是否恢复到编辑器？');
            if (shouldRestore) {
              setFormData({
                title: parsed.title ?? blog.title,
                summary: parsed.summary ?? (blog.summary || ''),
                thumbnailTitle: parsed.thumbnailTitle ?? (blog.thumbnailTitle || ''),
                thumbnailSummary: parsed.thumbnailSummary ?? (blog.thumbnailSummary || ''),
                content: parsed.content ?? blog.content,
                isPublished: typeof parsed.isPublished === 'boolean' ? parsed.isPublished : blog.isPublished,
              });
              restoredRef.current = true;
              return;
            }
          }
        } catch {}
      }
      setFormData({
        title: blog.title,
        summary: blog.summary || '',
        thumbnailTitle: blog.thumbnailTitle || '',
        thumbnailSummary: blog.thumbnailSummary || '',
        content: blog.content,
        isPublished: blog.isPublished,
      });
    }
  }, [blog]);

  const loadBlog = async () => {
    if (!id || id === 'undefined') return;

    const selfLink: HypermediaLink = {
      href: `${API_BASE_URL}/blogs/${id}`,
      rel: 'self',
      method: 'GET',
    };

    const result = await getBlog(selfLink);
    if (result) {
      setBlog(result);
      setError(null);
    } else {
      setError('Failed to load blog');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog) return;

    const updateLink = blog.links.find(link => link.rel === 'update');
    if (!updateLink) {
      setError('Cannot update this blog');
      return;
    }

    const result = await updateBlog(updateLink, formData);
    if (result) {
      // clear draft on success
      if (draftKey) {
        try { localStorage.removeItem(draftKey); } catch {}
      }
      navigate(`/blogs/${blog.id}`);
    }
  };

  // Debounced autosave for edit draft
  useEffect(() => {
    if (!draftKey) return;
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      try { localStorage.setItem(draftKey, JSON.stringify(formData)); } catch {}
    }, 800);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [draftKey, formData]);

  // beforeunload guard
  useEffect(() => {
    const hasContent = Boolean(
      formData.title ||
      formData.summary ||
      formData.thumbnailTitle ||
      formData.thumbnailSummary ||
      (formData.content && formData.content !== JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }))
    );
    const handler = (e: BeforeUnloadEvent) => {
      if (hasContent) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [formData]);

  const handleDelete = async () => {
    if (!blog) return;
    if (!confirm('Are you sure you want to delete this blog?')) return;

    const deleteLink = blog.links.find(link => link.rel === 'delete');
    if (!deleteLink) {
      setError('Cannot delete this blog');
      return;
    }

    const result = await deleteBlog(deleteLink);
    if (result) {
      navigate('/blogs');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleContentChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  if (error || apiError) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
        <div className="p-3 bg-red-100 text-red-700 rounded-md">{error || apiError}</div>
      </div>
    );
  }

  if (isLoading || (!blog && !hasLocalDraft)) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <Link to={`/blogs/${id}`} className="text-blue-600 hover:text-blue-800">
          ← Back to Blog
        </Link>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Delete Blog
        </button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Edit Blog</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border rounded-md text-lg"
            required
            minLength={3}
            maxLength={200}
          />
        </div>

                  <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
            Summary (Optional)
            </label>
            <textarea
              name="summary"
              value={formData.summary}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md"
              maxLength={500}
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail Title (Optional)
            </label>
            <input
              type="text"
              name="thumbnailTitle"
              value={formData.thumbnailTitle}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md text-lg"
              maxLength={200}
              placeholder="Custom title for thumbnail display..."
            />
            <p className="mt-1 text-sm text-gray-500">This will be displayed on the thumbnail card instead of the main title</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thumbnail Summary (Optional)
            </label>
            <textarea
              name="thumbnailSummary"
              value={formData.thumbnailSummary}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border rounded-md"
              maxLength={300}
              rows={2}
              placeholder="Custom summary for thumbnail display..."
            />
            <p className="mt-1 text-sm text-gray-500">This will be displayed below the thumbnail title</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Published Status
            </label>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleInputChange}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-600">
              Publish this blog (make it public)
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
          <TiptapEditor content={formData.content} onChange={handleContentChange} />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
          <Link
            to={`/blogs/${id}`}
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

