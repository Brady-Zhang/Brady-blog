import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useBlogs } from './useBlogs';
import type { Blog } from './types';
import type { Link as HypermediaLink } from '../../types/api';

export const BlogsPage: React.FC = () => {
  const { listBlogs, isLoading, error } = useBlogs();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [createLink, setCreateLink] = useState<HypermediaLink | null>(null);
  const [nextPageLink, setNextPageLink] = useState<HypermediaLink | null>(null);
  const [prevPageLink, setPrevPageLink] = useState<HypermediaLink | null>(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    const result = await listBlogs({
      pageSize: 10,
      fields: 'id,title,summary,isPublished,publishedAtUtc,createdAtUtc',
    });
    if (result) {
      setBlogs(result.items);
      setCreateLink(result.links.find(l => l.rel === 'create') || null);
      setNextPageLink(result.links.find(l => l.rel === 'next-page') || null);
      setPrevPageLink(result.links.find(l => l.rel === 'previous-page') || null);
    }
  };

  const handlePageChange = async (link: HypermediaLink) => {
    const result = await listBlogs({ pageSize: 10, url: link.href });
    if (result) {
      setBlogs(result.items);
      setNextPageLink(result.links.find(l => l.rel === 'next-page') || null);
      setPrevPageLink(result.links.find(l => l.rel === 'previous-page') || null);
    }
  };

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Blogs</h1>
        <div className="flex gap-4">
          {createLink && (
            <Link
              to="/blogs/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
            >
              Create New Blog
            </Link>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-gray-100 rounded-lg"></div>
            </div>
          ))}
        </div>
      ) : blogs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">You haven't created any blogs yet.</p>
          {createLink && (
            <Link to="/blogs/create" className="text-blue-600 hover:text-blue-800">
              Create your first blog
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4">
            {blogs.map(blog => (
              <Link
                key={blog.links.find(l => l.rel === 'self')?.href}
                to={`/blogs/${blog.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold">{blog.title}</h2>
                  {blog.isPublished ? (
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                      Published
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-md">
                      Draft
                    </span>
                  )}
                </div>
                {blog.summary && <p className="text-gray-600 mt-2">{blog.summary}</p>}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  {blog.publishedAtUtc && (
                    <span>Published: {new Date(blog.publishedAtUtc).toLocaleDateString()}</span>
                  )}
                  <span>Created: {new Date(blog.createdAtUtc).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>

          <div className="flex justify-center gap-4 mt-6">
            {prevPageLink && (
              <button
                onClick={() => handlePageChange(prevPageLink)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 cursor-pointer"
                disabled={isLoading}
              >
                ← Previous
              </button>
            )}
            {nextPageLink && (
              <button
                onClick={() => handlePageChange(nextPageLink)}
                className="px-4 py-2 text-blue-600 hover:text-blue-800 cursor-pointer"
                disabled={isLoading}
              >
                Next →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

