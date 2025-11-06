import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBlogs } from './useBlogs';
import { TiptapEditor } from './TiptapEditor';
import type { CreateBlogDto } from './types';
import { generateBlogHtmlFromJsonString } from './generateHtml';

export const CreateBlogPage: React.FC = () => {
  const navigate = useNavigate();
  const { createBlog, isLoading, error } = useBlogs();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isRestoredRef = useRef(false);
  const saveTimeoutRef = useRef<number | null>(null);

  const [formData, setFormData] = useState<CreateBlogDto>({
    title: '',
    summary: '',
    thumbnailTitle: '',
    thumbnailSummary: '',
    content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    isPublished: false,
  });

  const DRAFT_KEY = 'draft:createBlog';

  // Restore draft (once)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          setFormData((prev) => ({ ...prev, ...parsed }));
          isRestoredRef.current = true;
        }
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced autosave to localStorage
  useEffect(() => {
    if (saveTimeoutRef.current) {
      window.clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      } catch {}
    }, 800);
    return () => {
      if (saveTimeoutRef.current) {
        window.clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [formData]);

  // beforeunload guard if there are unsaved changes (i.e., any non-empty field)
  useEffect(() => {
    const hasContent = Boolean(
      formData.title ||
      formData.summary ||
      formData.thumbnailTitle ||
      formData.thumbnailSummary ||
      (formData.content && formData.content !== JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }))
    );
    const handler = (e: BeforeUnloadEvent) => {
      if (hasContent && !isSubmitting) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [formData, isSubmitting]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;
    
    setIsSubmitting(true);

    try {
      const html = generateBlogHtmlFromJsonString(formData.content);
      const payload: CreateBlogDto = { ...formData, contentHtml: html };
      const result = await createBlog(payload);
      if (result) {
        // clear local draft on success
        try { localStorage.removeItem(DRAFT_KEY); } catch {}
        navigate(`/blogs/${result.id}`);
      }
    } finally {
      setIsSubmitting(false);
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

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
          ← Back to Dashboard
        </Link>
      </div>

      <h1 className="text-3xl font-bold mb-6">Create New Blog</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
      )}

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
            placeholder="Enter blog title..."
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
            placeholder="Brief summary of your blog..."
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
            disabled={isSubmitting || isLoading}
          >
            {(isSubmitting || isLoading) ? 'Creating...' : 'Create Blog'}
          </button>
          <Link
            to="/dashboard"
            className="bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
};

