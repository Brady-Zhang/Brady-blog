import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_BASE_URL } from '../../api/config';
import type { Blog } from '../../features/blogs/types';

interface BlogList {
  items: Blog[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

const PublicBlogListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeSearchQuery, setActiveSearchQuery] = useState(initialSearch);
  const ringRef = useRef<HTMLDivElement>(null);
  
  // Tech Logos
  const logos = [
    "https://raw.githubusercontent.com/devicons/devicon/master/icons/typescript/typescript-original.svg",
    "https://raw.githubusercontent.com/devicons/devicon/master/icons/dotnetcore/dotnetcore-original.svg",
    "https://raw.githubusercontent.com/devicons/devicon/master/icons/react/react-original.svg",
    "https://raw.githubusercontent.com/devicons/devicon/master/icons/azure/azure-original.svg",
    "https://raw.githubusercontent.com/devicons/devicon/master/icons/csharp/csharp-original.svg",
    "https://raw.githubusercontent.com/devicons/devicon/master/icons/nextjs/nextjs-original.svg"
  ];

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
    const words = title.toUpperCase().split(' ').filter(w => w.length > 2);
    return words.slice(0, 3);
  };

  // Load public blog list
  useEffect(() => {
    const loadPublicBlogs = async () => {
      setIsLoading(true);
      try {
        const searchParam = activeSearchQuery.trim() ? `&search=${encodeURIComponent(activeSearchQuery.trim())}` : '';
        const url = `${API_BASE_URL}/public/blogs?page=1&pageSize=10${searchParam}`;
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
          },
        });
        
        if (response.ok) {
          const data: BlogList = await response.json();
          setBlogs(data.items.map(item => ({ ...item, links: [] })));
        }
      } catch (err) {
        console.error('Failed to load public blogs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPublicBlogs();
  }, [activeSearchQuery]);

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery.trim());
    // Update URL search params
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim() });
    } else {
      setSearchParams({});
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Sync activeSearchQuery with URL params when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    // Only update if URL search param is different from active search
    // This handles browser back/forward navigation
    if (urlSearch !== activeSearchQuery) {
      setActiveSearchQuery(urlSearch);
      setSearchQuery(urlSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const renderAnimatedText = (text: string) => {
    const words = text.split(' ');
    return words.map((word, wordIdx) => (
      <span key={wordIdx} className={wordIdx > 0 ? 'md:ml-4 ml-2' : ''}>
        {word.split('').map((char, charIdx) => (
          <div
            key={charIdx}
            aria-hidden="true"
            className="inline-block"
            style={{
              position: 'relative',
              display: 'inline-block',
              translate: 'none',
              rotate: 'none',
              scale: 'none',
              transform: 'translate(0px, 0px)',
              opacity: 1,
            }}
          >
            {char}
          </div>
        ))}
      </span>
    ));
  };

  useEffect(() => {
    if (!ringRef.current) return;
    
    const ring = ringRef.current;
    ring.innerHTML = '';
    
    const N = logos.length;
    const radius = 250;
    const tilt = -4;
    
    // Create logo elements
    logos.forEach((src, i) => {
      const div = document.createElement('div');
      div.className = 'absolute left-1/2 top-1/2 w-[80px] h-[80px] pointer-events-auto transition-transform duration-150';
      div.style.transform = 'translate(-50%, -50%)';
      div.style.transformStyle = 'preserve-3d';
      
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'tech';
      img.className = 'w-full h-full object-contain rounded-xl bg-white/60 backdrop-blur-sm shadow-lg';
      
      // Add reflection effect (WebKit browsers only)
      (img.style as any).WebkitBoxReflect = 'below 18px linear-gradient(transparent, rgba(0,0,0,.08) 60%, rgba(0,0,0,.25))';
      
      div.appendChild(img);
      
      const theta = (360 / N) * i;
      div.style.transform = `
        rotateX(${tilt}deg) rotateY(${theta}deg) translateZ(${radius}px) rotateY(${-theta}deg)
      `;
      div.style.zIndex = String(Math.round(1000 * Math.cos(theta * Math.PI / 180)));
      
      ring.appendChild(div);
    });
    
    // Animation logic
    let rotY = 0;
    let auto = 0.25;
    let dragging = false;
    let lastX = 0;
    let velocity = 0;
    
    const animate = () => {
      if (!dragging) rotY += auto;
      if (!dragging && Math.abs(velocity) > 0.01) {
        rotY += velocity;
        velocity *= 0.95;
      }
      ring.style.transform = `rotateY(${rotY}deg)`;
      requestAnimationFrame(animate);
    };
    
    const onDown = (e: MouseEvent | TouchEvent) => {
      dragging = true;
      lastX = (e as TouchEvent).touches?.[0]?.clientX ?? (e as MouseEvent).clientX;
    };
    
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      const x = (e as TouchEvent).touches?.[0]?.clientX ?? (e as MouseEvent).clientX;
      const dx = x - lastX;
      rotY += dx * 0.2;
      velocity = dx * 0.1;
      lastX = x;
    };
    
    const onUp = () => {
      dragging = false;
    };
    
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchstart', onDown, { passive: true });
    window.addEventListener('touchmove', onMove, { passive: true });
    window.addEventListener('touchend', onUp);
    
    animate();
    
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchstart', onDown);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [logos]);

  return (
    <div className="py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1
            className="text-center text-6xl md:text-8xl font-black mb-4 select-none flex flex-col md:flex-row md:gap-4 gap-2 items-center justify-center tracking-tight"
            style={{
              color: '#ffffff',
              backgroundColor: '#333333',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              textShadow: '2px 4px 6px rgba(0, 0, 0, 0.5), 0 0 20px rgba(0, 0, 0, 0.3)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
                        aria-label="Welcome To My Blog"
            >
            {renderAnimatedText('Welcome To My Blog')}
          </h1>
          
          {/* 3D Rotating Tech Logo Ring */}
          <div className="relative w-full h-[400px] -mt-8 mb-8 overflow-hidden" style={{ perspective: '800px' }}>
            <div 
              ref={ringRef}
              className="absolute inset-0 m-auto w-[600px] h-[300px]"
              style={{
                transformStyle: 'preserve-3d',
                willChange: 'transform',
              }}
            />
          </div>
        </div>

        {/* Search Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Previous Blog Posts</h2>
          <div className="flex justify-center">
            <div className="flex rounded-lg overflow-hidden shadow-sm border border-gray-300 bg-white max-w-2xl w-full">
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-3 text-gray-700 focus:outline-none"
              />
              <button
                className="px-6 py-3 bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                onClick={handleSearch}
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Blog List */}
        <div className="space-y-0">
          {isLoading ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">Loading...</p>
            </div>
          ) : blogs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">No blog posts found</p>
            </div>
          ) : (
            blogs.map((blog, index) => {
              // Use custom thumbnail fields if available, otherwise fall back to title extraction
              const thumbnailTitle = blog.thumbnailTitle || (getThumbnailText(blog.title).join(' '));
              const thumbnailSummary = blog.thumbnailSummary || '';
              const displayDate = blog.publishedAtUtc || blog.createdAtUtc;
              const dateFormatted = displayDate ? formatDate(displayDate) : '';
              
              return (
                <div key={blog.id}>
                  {index > 0 && <div className="border-t border-gray-300 my-8"></div>}
                  <Link
                    to={`/public/blog/${blog.id}${activeSearchQuery ? `?search=${encodeURIComponent(activeSearchQuery)}` : ''}`}
                    className="block hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <div className="flex flex-row">
                      {/* Thumbnail Side */}
                      <div className="relative w-70 h-40 bg-gradient-to-br from-purple-600 to-purple-800 flex-shrink-0 overflow-hidden rounded-lg">
                        {/* Abstract geometric shapes */}
                        <div className="absolute inset-0 opacity-20">
                          <div className="absolute top-2 left-2 w-16 h-16 bg-black rounded-full"></div>
                          <div className="absolute top-8 right-4 w-8 h-8 bg-black transform rotate-45"></div>
                          <div className="absolute bottom-4 left-8 w-12 h-12 bg-black transform rotate-12"></div>
                          <div className="absolute bottom-2 right-2 w-20 h-1 bg-black"></div>
                        </div>
                        
                        {/* Text overlay */}
                        <div className="absolute inset-0 flex flex-col justify-center items-start px-6 py-4 z-10">
                          <div className="text-white font-bold text-xl mb-2 tracking-wide px-3 py-1.5 bg-black/30 backdrop-blur-sm rounded-md">
                            {thumbnailTitle}
                          </div>
                          {thumbnailSummary && (
                            <div className="text-white font-medium text-xl tracking-wide px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-md">
                              {thumbnailSummary}
                            </div>
                          )}
                        </div>
                        
                        {/* Logo in bottom-right corner */}
                        <div className="absolute bottom-3 right-3 bg-cyan-400 px-3 py-1 rounded z-10">
                          <div className="flex flex-col items-center leading-tight">
                            <span className="text-white font-bold text-xs">BZ</span>
                            <span className="text-white font-bold text-xs">Tech</span>
                          </div>
                        </div>
                      </div>

                      {/* Content Side */}
                      <div className="flex-1 flex flex-col justify-between pl-6 py-2">
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
                            <p className="text-gray-500 text-sm leading-relaxed mb-2">
                              {blog.summary.length > 150 ? blog.summary.substring(0, 150) + '...' : blog.summary}
                            </p>
                          )}
                          {blog.relevance != null && blog.relevance > 0 && (
                            <p className="text-sm text-purple-600 font-medium">
                              Relevance: {blog.relevance.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PublicBlogListPage;

