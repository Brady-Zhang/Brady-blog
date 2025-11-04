import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useBlogs } from './useBlogs';
import { TiptapEditor } from './TiptapEditor';
import { API_BASE_URL } from '../../api/config';
import type { Blog, UpdateBlogDto } from './types';
import type { Link as HypermediaLink } from '../../types/api';

export const BlogDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBlog, updateBlog, deleteBlog, isLoading, error } = useBlogs();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [formData, setFormData] = useState<UpdateBlogDto>({
    title: '',
    summary: '',
    thumbnailTitle: '',
    thumbnailSummary: '',
    content: JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] }),
    isPublished: false,
  });

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
    }
  };

  useEffect(() => {
    loadBlog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (blog && !isEditing) {
      setFormData({
        title: blog.title,
        summary: blog.summary || '',
        thumbnailTitle: blog.thumbnailTitle || '',
        thumbnailSummary: blog.thumbnailSummary || '',
        content: blog.content,
        isPublished: blog.isPublished,
      });
    }
  }, [blog, isEditing]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (blog) {
      setFormData({
        title: blog.title,
        summary: blog.summary || '',
        thumbnailTitle: blog.thumbnailTitle || '',
        thumbnailSummary: blog.thumbnailSummary || '',
        content: blog.content,
        isPublished: blog.isPublished,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blog) return;

    const updateLink = blog.links.find(link => link.rel === 'update');
    if (!updateLink) {
      return;
    }

    const result = await updateBlog(updateLink, formData);
    if (result) {
      await loadBlog();
      setIsEditing(false);
    }
  };

  const confirmDelete = async () => {
    if (!blog) return;
    const deleteLink = blog.links.find(link => link.rel === 'delete');
    if (!deleteLink) return;
    const ok = await deleteBlog(deleteLink);
    if (ok) navigate('/blogs');
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
    setFormData(prev => ({ ...prev, content }));
  };

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="mb-6">
          <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
            ← Back to Dashboard
          </Link>
        </div>
        <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
      </div>
    );
  }

  if (isLoading || !blog) {
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
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
          ← Back to Dashboard
        </Link>
        {!isEditing && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleEdit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Edit Blog
            </button>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        )}

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

      {isEditing ? (
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
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-200 text-gray-700 px-6 py-3 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <article className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold">{blog.title}</h1>
              {blog.isPublished ? (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                  Published
                </span>
              ) : (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-md">
                  Draft
                </span>
              )}
            </div>
            {blog.summary && (
              <p className="text-xl text-gray-600 mt-4">{blog.summary}</p>
            )}
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              {blog.publishedAtUtc && (
                <span>Published: {new Date(blog.publishedAtUtc).toLocaleDateString()}</span>
              )}
              <span>Created: {new Date(blog.createdAtUtc).toLocaleDateString()}</span>
              {blog.updatedAtUtc && (
                <span>Updated: {new Date(blog.updatedAtUtc).toLocaleDateString()}</span>
              )}
            </div>
          </div>

          <hr className="my-6" />

          <div className="mt-8">
            <TiptapEditor content={blog.content} onChange={() => {}} editable={false} />
          </div>
        </article>
      )}
    </div>
  );
};

