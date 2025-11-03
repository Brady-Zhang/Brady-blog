import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ContributionGrid } from '../features/entries/ContributionGrid';
import { LatestEntries } from '../features/entries/LatestEntries';
import { QuickEntryHabits } from '../features/habits/QuickEntryHabits';
import { useBlogs } from '../features/blogs/useBlogs';
import type { Blog } from '../features/blogs/types';
import type { HypermediaLink } from '../types/api';

const Dashboard: React.FC = () => {
  const { listBlogs, isLoading: isLoadingBlogs } = useBlogs();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [createLink, setCreateLink] = useState<HypermediaLink | null>(null);

  useEffect(() => {
    loadBlogs();
  }, []);

  const loadBlogs = async () => {
    const result = await listBlogs({
      pageSize: 5,
      fields: 'id,title,summary,isPublished,publishedAtUtc,createdAtUtc',
    });
    if (result) {
      setBlogs(result.items);
      setCreateLink(result.links.find((l: HypermediaLink) => l.rel === 'create') || null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900">
        Dashboard - {new Date().toISOString().split('T')[0]}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 space-y-6">
        <div className="space-y-6">
          <ContributionGrid />
          <LatestEntries />
        </div>
        <QuickEntryHabits />
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">My Blogs</h2>
          {createLink && (
            <Link
              to="/blogs/create"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer text-sm"
            >
              Create New Blog
            </Link>
          )}
        </div>

        {isLoadingBlogs ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500 mb-4">You haven't created any blogs yet.</p>
            {createLink && (
              <Link to="/blogs/create" className="text-blue-600 hover:text-blue-800">
                Create your first blog
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {blogs.map(blog => (
              <Link
                key={blog.links.find(l => l.rel === 'self')?.href}
                to={`/blogs/${blog.id}`}
                className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-semibold">{blog.title}</h3>
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
        )}
      </div>
    </div>
  );
};

export default Dashboard;
