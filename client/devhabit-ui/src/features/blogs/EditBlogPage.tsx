import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useBlogs } from './useBlogs';
import { TiptapEditor } from './TiptapEditor';
import { API_BASE_URL } from '../../api/config';
import type { Blog, UpdateBlogDto } from './types';
import { generateBlogHtmlFromJsonString } from './generateHtml';
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [formData, setFormData] = useState<UpdateBlogDto>({
    title: '',
    summary: '',
    thumbnailTitle: '',
    thumbnailSummary: '',
    content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    contentHtml: '',
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
        contentHtml: blog.contentHtml || '',
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
    console.log('[EditBlogPage] handleSubmit called');
    e.preventDefault();
    if (!blog) return;

    const updateLink = blog.links.find(link => link.rel === 'update');
    if (!updateLink) {
      setError('Cannot update this blog');
      return;
    }

    console.log('[EditBlogPage] generating HTML from content, length:', formData.content?.length || 0);
    const html = generateBlogHtmlFromJsonString(formData.content);
    const payload: UpdateBlogDto = { ...formData, contentHtml: html || formData.contentHtml || '' };
    // debug: ensure contentHtml is present in payload
    console.log('submit payload.contentHtml length:', (payload.contentHtml || '').length, payload);
    console.log('[EditBlogPage] calling updateBlog with payload keys:', Object.keys(payload));
    const result = await updateBlog(updateLink, payload);
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

  const confirmDelete = async () => {
    if (!blog) return;
    const deleteLink = blog.links.find(link => link.rel === 'delete');
    if (!deleteLink) {
      setError('Cannot delete this blog');
      setShowDeleteModal(false);
      return;
    }
    const result = await deleteBlog(deleteLink);
    if (result) navigate('/blogs');
    setShowDeleteModal(false);
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
    console.log('[EditBlogPage] handleContentChange called, content length:', content?.length || 0);
    const html = generateBlogHtmlFromJsonString(content);
    setFormData(prev => ({ ...prev, content, contentHtml: html || '' }));
    // debug: log generated html length on change
    console.log('onChange html length:', (html || '').length);
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
          onClick={() => setShowDeleteModal(true)}
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
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowDeleteModal(false)}></div>
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-2">Delete this blog?</h2>
            <p className="text-sm text-gray-600 mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
                onClick={confirmDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

