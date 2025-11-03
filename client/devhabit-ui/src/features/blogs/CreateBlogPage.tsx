import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useBlogs } from './useBlogs';
import { TiptapEditor } from './TiptapEditor';
import type { CreateBlogDto } from './types';

export const CreateBlogPage: React.FC = () => {
  const navigate = useNavigate();
  const { createBlog, isLoading, error } = useBlogs();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CreateBlogDto>({
    title: '',
    summary: '',
    content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    isPublished: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || isLoading) return;
    
    setIsSubmitting(true);

    try {
      const result = await createBlog(formData);
      if (result) {
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

