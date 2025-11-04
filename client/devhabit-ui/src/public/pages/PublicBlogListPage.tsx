import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams, useNavigationType } from 'react-router-dom';
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
  const initialPage = Number.parseInt(searchParams.get('page') || '1', 10) || 1;
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [activeSearchQuery, setActiveSearchQuery] = useState(initialSearch);
  const [page, setPage] = useState<number>(initialPage);
  const initialPageSize = Number.parseInt(searchParams.get('pageSize') || '10', 10) || 10;
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [hasNextPage, setHasNextPage] = useState<boolean>(false);
  const [hasPreviousPage, setHasPreviousPage] = useState<boolean>(false);
  const [totalPages, setTotalPages] = useState<number>(1);
  const ringRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigationType = useNavigationType();
  const hasRestoredRef = useRef<boolean>(false);
  const scrollInstantToY = (y: number) => {
    const se = (document.scrollingElement || document.documentElement) as HTMLElement;
    se.scrollTop = Math.max(0, y);
  };
  const scrollInstantToElementTop = (el: HTMLElement) => {
    const rect = el.getBoundingClientRect();
    const absoluteTop = rect.top + (window.pageYOffset || document.documentElement.scrollTop || 0);
    scrollInstantToY(absoluteTop);
  };
  // Build a scroll key that ignores the transient `restore` flag
  const searchForKey = (() => {
    try {
      const params = new URLSearchParams(location.search);
      params.delete('restore');
      const s = params.toString();
      return s ? `?${s}` : '';
    } catch {
      return location.search || '';
    }
  })();
  const SCROLL_KEY = `scroll:${location.pathname}${searchForKey}`;
  const shouldForceRestore = (searchParams.get('restore') || '') === '1';

  // Earliest possible, pre-paint restore: prefer hash anchor, then saved Y
  useLayoutEffect(() => {
    if (hasRestoredRef.current) return;
    if (navigationType === 'POP' || shouldForceRestore) {
      try {
        if (location.hash) {
          const id = location.hash.replace('#', '');
          const el = document.getElementById(id) as HTMLElement | null;
          if (el) {
            scrollInstantToElementTop(el);
            hasRestoredRef.current = true;
            return;
          }
        }
        const saved = sessionStorage.getItem(SCROLL_KEY);
        const y = saved ? parseInt(saved, 10) : NaN;
        if (!Number.isNaN(y) && y > 0) {
          scrollInstantToY(y);
          hasRestoredRef.current = true;
        }
      } catch {}
    }
  }, [SCROLL_KEY, navigationType, shouldForceRestore, location.hash]);
  
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
        const url = `${API_BASE_URL}/public/blogs?page=${page}&pageSize=${pageSize}${searchParam}`;
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
          },
        });
        
        if (response.ok) {
          const data: BlogList = await response.json();
          setBlogs(data.items.map(item => ({ ...item, links: [] })));
          setHasNextPage(Boolean(data.hasNextPage));
          setHasPreviousPage(Boolean(data.hasPreviousPage));
          setTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load public blogs:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadPublicBlogs();
  }, [activeSearchQuery, page, pageSize]);

  // Restore scroll after data loads and DOM is ready (before paint to avoid flicker)
  useLayoutEffect(() => {
    if (hasRestoredRef.current) return;
    if (!isLoading && blogs.length > 0) {
      // Ensure DOM is fully rendered
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            if (navigationType === 'POP' || shouldForceRestore) {
              // If there is a hash anchor, prefer it and stop
              if (location.hash) {
                const id = location.hash.replace('#', '');
                const el = document.getElementById(id) as HTMLElement | null;
                if (el) {
                  scrollInstantToElementTop(el);
                  hasRestoredRef.current = true;
                  return;
                }
              }
              // Prefer element-based restore using the last clicked blog id
              try {
                const targetId = sessionStorage.getItem('restoreTargetId');
                if (targetId) {
                  const el = document.getElementById(`blog-${targetId}`) as HTMLElement | null;
                  if (el) {
                    scrollInstantToElementTop(el);
                    // Clean once used
                    sessionStorage.removeItem('restoreTargetId');
                    hasRestoredRef.current = true;
                    return;
                  }
                }
              } catch {}
              const saved = sessionStorage.getItem(SCROLL_KEY);
              if (saved) {
                const y = parseInt(saved, 10);
                if (!Number.isNaN(y) && y > 0) {
                  scrollInstantToY(y);
                } else {
                  scrollInstantToY(0);
                }
              } else {
                scrollInstantToY(0);
              }
              hasRestoredRef.current = true;
            } else {
              // For normal navigation into list, do not reuse saved positions
              scrollInstantToY(0);
              hasRestoredRef.current = true;
            }
          } catch {}
        });
      });
    }
  }, [isLoading, blogs.length, SCROLL_KEY, navigationType, shouldForceRestore]);

  // Save scroll position periodically and on unmount
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      try { window.history.scrollRestoration = 'manual'; } catch {}
    }

    const saveScroll = () => {
      try { sessionStorage.setItem(SCROLL_KEY, String(window.scrollY)); } catch {}
    };

    // Save on scroll (throttled)
    let scrollTimer: number | null = null;
    const handleScroll = () => {
      if (scrollTimer) return;
      scrollTimer = window.setTimeout(() => {
        saveScroll();
        scrollTimer = null;
      }, 300);
    };

    // Save on visibility change (tab switch, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveScroll();
      }
    };

    // Save on page lifecycle events
    window.addEventListener('beforeunload', saveScroll);
    window.addEventListener('pagehide', saveScroll as any);

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', saveScroll);
      window.removeEventListener('pagehide', saveScroll as any);
      if (scrollTimer) clearTimeout(scrollTimer);
      saveScroll(); // Final save on unmount
    };
  }, [SCROLL_KEY]);

  // Restore scroll on location change (browser back/forward)
  useLayoutEffect(() => {
    if (hasRestoredRef.current) return;
    const restoreScroll = () => {
      if (hasRestoredRef.current) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          try {
            if (navigationType === 'POP' || shouldForceRestore) {
              // If there is a hash anchor, prefer it and stop
              if (location.hash) {
                const id = location.hash.replace('#', '');
                const el = document.getElementById(id) as HTMLElement | null;
                if (el) {
                  scrollInstantToElementTop(el);
                  hasRestoredRef.current = true;
                  return;
                }
              }
              // Prefer element-based restore using the last clicked blog id
              try {
                const targetId = sessionStorage.getItem('restoreTargetId');
                if (targetId) {
                  const el = document.getElementById(`blog-${targetId}`) as HTMLElement | null;
                  if (el) {
                    scrollInstantToElementTop(el);
                    sessionStorage.removeItem('restoreTargetId');
                    hasRestoredRef.current = true;
                    return;
                  }
                }
              } catch {}
              const saved = sessionStorage.getItem(SCROLL_KEY);
              if (saved) {
                const y = parseInt(saved, 10);
                if (!Number.isNaN(y) && y > 0) {
                  scrollInstantToY(y);
                  hasRestoredRef.current = true;
                  return;
                }
              }
              // No element and no valid saved Y yet: do not force top here; allow data-loaded effect to handle later
            } else {
              scrollInstantToY(0);
              hasRestoredRef.current = true;
            }
          } catch {}
        });
      });
    };

    // Restore immediately
    restoreScroll();

    // Also restore after a short delay to handle slow renders
    const timer = setTimeout(restoreScroll, 200);
    // Also restore after all resources load (images, fonts)
    window.addEventListener('load', restoreScroll, { once: true });
    // Also after fonts are ready (to avoid reflow shifting)
    try {
      // document.fonts may not exist in all browsers
      // @ts-ignore
      const fonts = document.fonts;
      if (fonts && typeof fonts.ready?.then === 'function') {
        // @ts-ignore
        fonts.ready.then(() => restoreScroll());
      }
    } catch {}

    return () => {
      clearTimeout(timer);
      // no need to remove once load listener
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, location.search, navigationType, shouldForceRestore]);

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery.trim());
    // Update URL search params
    if (searchQuery.trim()) {
      setSearchParams({ search: searchQuery.trim(), page: '1', pageSize: String(pageSize) });
    } else {
      setSearchParams({ page: '1', pageSize: String(pageSize) });
    }
    setPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Sync activeSearchQuery, page, pageSize with URL params when URL changes (e.g., browser back/forward)
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlPage = Number.parseInt(searchParams.get('page') || '1', 10) || 1;
    const urlPageSize = Number.parseInt(searchParams.get('pageSize') || String(pageSize), 10) || pageSize;
    // Only update if URL search param is different from active search
    // This handles browser back/forward navigation
    if (urlSearch !== activeSearchQuery) {
      setActiveSearchQuery(urlSearch);
      setSearchQuery(urlSearch);
    }
    if (urlPage !== page) {
      setPage(urlPage);
    }
    if (urlPageSize !== pageSize) {
      setPageSize(urlPageSize);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const goToPage = (nextPage: number) => {
    const params: Record<string, string> = {};
    if (activeSearchQuery.trim()) params.search = activeSearchQuery.trim();
    params.page = String(nextPage);
    params.pageSize = String(pageSize);
    setSearchParams(params);
    setPage(nextPage);
  };

  const changePageSize = (newSize: number) => {
    const nextSize = Math.max(1, newSize);
    setPageSize(nextSize);
    // reset to page 1 when page size changes
    const params: Record<string, string> = { page: '1', pageSize: String(nextSize) };
    if (activeSearchQuery.trim()) params.search = activeSearchQuery.trim();
    setSearchParams(params);
    setPage(1);
  };

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
            className="text-center text-6xl md:text-8xl font-black mb-2 select-none flex flex-col md:flex-row md:gap-4 gap-2 items-center justify-center tracking-tight"
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
          <div className="relative w-full h-[400px] -mt-20 mb-8 overflow-hidden" style={{ perspective: '800px' }}>
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

        {/* Search & Controls Section */}
        <div className="mb-12">
          <h2
            className="text-center text-5xl md:text-6xl font-black mb-8 select-none"
            style={{
              color: '#ffffff',
              backgroundColor: '#000000',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              textShadow: '3px 5px 8px rgba(0, 0, 0, 0.7), 0 0 30px rgba(0, 0, 0, 0.5), 1px 2px 4px rgba(0, 0, 0, 0.9)',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              fontWeight: 900,
              letterSpacing: '-0.02em',
            }}
            aria-label="Previous Blog Posts"
          >
            {renderAnimatedText('Previous Blog Posts')}
          </h2>
          <div className="flex flex-col items-center gap-4">
            <div className="w-full max-w-2xl">
              <div className="flex rounded-lg overflow-hidden shadow-sm border border-gray-300 bg-white w-full">
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
            <div className="w-full max-w-2xl flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span>Page size:</span>
                <select
                  className="border border-gray-300 rounded px-2 py-1 bg-white"
                  value={pageSize}
                  onChange={(e) => changePageSize(Number(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span>Jump to:</span>
                <input
                  type="number"
                  min={1}
                  max={Math.max(1, totalPages)}
                  className="w-20 border border-gray-300 rounded px-2 py-1"
                  defaultValue={page}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const raw = (e.target as HTMLInputElement).value;
                      const n = Number.parseInt(raw, 10);
                      if (!Number.isNaN(n)) {
                        const clamped = Math.min(Math.max(1, n), Math.max(1, totalPages));
                        goToPage(clamped);
                      }
                    }
                  }}
                />
                <button
                  className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50"
                  onClick={(e) => {
                    const container = e.currentTarget.parentElement;
                    const input = container ? (container.querySelector('input[type="number"]') as HTMLInputElement | null) : null;
                    if (input) {
                      const n = Number.parseInt(input.value, 10);
                      if (!Number.isNaN(n)) {
                        const clamped = Math.min(Math.max(1, n), Math.max(1, totalPages));
                        goToPage(clamped);
                      }
                    }
                  }}
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Blog List */}
        <div className="flex justify-center">
          <div className="w-full max-w-2xl space-y-0">
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
                <div key={blog.id} id={`blog-${blog.id}`}>
                  {index > 0 && <div className="border-t border-gray-300 my-8"></div>}
                  <Link
                    to={`/public/blog/${blog.id}?${[
                      activeSearchQuery ? `search=${encodeURIComponent(activeSearchQuery)}` : '',
                      `page=${encodeURIComponent(String(page))}`,
                      `pageSize=${encodeURIComponent(String(pageSize))}`,
                    ].filter(Boolean).join('&')}`}
                    className="block hover:opacity-80 transition-opacity cursor-pointer"
                    onClick={() => {
                      try {
                        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
                        sessionStorage.setItem('restoreTargetId', String(blog.id));
                        // Inject hash into current history entry so that browser back uses the anchor
                        const urlWithoutHash = `${location.pathname}${location.search}`;
                        const nextUrlWithHash = `${urlWithoutHash}#blog-${blog.id}`;
                        window.history.replaceState(window.history.state, '', nextUrlWithHash);
                      } catch {}
                    }}
                  >
                    <div className="flex flex-row">
                      {/* Thumbnail Side */}
                      <div className="relative w-70 h-40 bg-gradient-to-br from-purple-600 to-purple-800 flex-shrink-0 overflow-hidden rounded-lg shadow-xl hover:shadow-2xl transition-shadow">
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
          {/* Pagination Controls */}
          <div className="flex justify-center items-center gap-4 mt-8">
            <button
              className="px-4 py-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={() => goToPage(Math.max(1, page - 1))}
              disabled={!hasPreviousPage || isLoading}
            >
              ← Previous
            </button>
            <span className="text-sm text-gray-500">Page {page} {totalPages > 1 ? `of ${totalPages}` : ''}</span>
            <button
              className="px-4 py-2 text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
              onClick={() => goToPage(page + 1)}
              disabled={!hasNextPage || isLoading}
            >
              Next →
            </button>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicBlogListPage;

