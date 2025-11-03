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

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 
                    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${day.toString().padStart(2, '0')}, ${year}`;
  };

  const getThumbnailText = (title: string): string[] => {
    // Extract key words from title and return first 3-4 words in uppercase
    const words = title.toUpperCase().split(' ').filter(w => w.length > 2);
    return words.slice(0, 3);
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
          <div className="space-y-6">
            {blogs.map(blog => {
              const thumbnailText = getThumbnailText(blog.title);
              const displayDate = blog.publishedAtUtc || blog.createdAtUtc;
              const dateFormatted = displayDate ? formatDate(displayDate) : '';
              
              return (
                <Link
                  key={blog.links.find(l => l.rel === 'self')?.href}
                  to={`/blogs/${blog.id}`}
                  className="block bg-white hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
                >
                  <div className="flex flex-row">
                    {/* Thumbnail Side */}
                    <div className="relative w-64 h-40 bg-gradient-to-br from-purple-600 to-purple-800 flex-shrink-0 overflow-hidden">
                      {/* Abstract geometric shapes */}
                      <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-2 left-2 w-16 h-16 bg-black rounded-full"></div>
                        <div className="absolute top-8 right-4 w-8 h-8 bg-black transform rotate-45"></div>
                        <div className="absolute bottom-4 left-8 w-12 h-12 bg-black transform rotate-12"></div>
                        <div className="absolute bottom-2 right-2 w-20 h-1 bg-black"></div>
                      </div>
                      
                      {/* Text overlay */}
                      <div className="absolute inset-0 flex flex-col justify-center items-start px-6 py-4 z-10">
                        {thumbnailText.map((text, idx) => (
                          <div key={idx} className="text-white font-bold text-lg mb-1 tracking-wide">
                            {text}
                          </div>
                        ))}
                      </div>
                      
                      {/* Logo in bottom-right corner */}
                      <div className="absolute bottom-3 right-3 bg-cyan-400 px-3 py-1 rounded z-10">
                        <span className="text-white font-bold text-xs">MJ Tech</span>
                      </div>
                    </div>

                    {/* Content Side */}
                    <div className="flex-1 flex flex-col justify-between p-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-3 hover:text-purple-600 transition-colors">
                          {blog.title}
                        </h2>
                        {displayDate && (
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm text-gray-500 font-light">
                              {dateFormatted}
                            </span>
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          </div>
                        )}
                        {blog.summary && (
                          <p className="text-gray-500 text-sm leading-relaxed">
                            {blog.summary.length > 150 ? blog.summary.substring(0, 150) + '...' : blog.summary}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
