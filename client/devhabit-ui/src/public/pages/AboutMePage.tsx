import React, { useLayoutEffect, useState } from 'react';
import { FaGithub, FaLinkedin, FaPhone } from 'react-icons/fa';
import { MdEmail, MdClose, MdContentCopy, MdOpenInNew } from 'react-icons/md';
import selfImage from '../../assets/self.jpg';
import reactSvg from '../../assets/react.svg';
import self01Image from '../../assets/self01.jpg';
import museum01 from '../../assets/museum01.png';
import museum02 from '../../assets/museum02.png';
import museum03 from '../../assets/museum03.png';
import museum04 from '../../assets/museum04.png';
import mpg01 from '../../assets/mpg01.png';
import mpg02 from '../../assets/mpg02.png';
import mpg03 from '../../assets/mpg03.png';

interface ContactInfo {
  label: string;
  info: string;
  url?: string;
  icon: React.ReactNode;
}

interface Project {
  title: string;
  technologies: string;
  description: string;
  images: string[];
  projectUrl?: string;
}

const AboutMePage: React.FC = () => {
  useLayoutEffect(() => {
    try {
      window.scrollTo({ top: 0, behavior: 'auto' });
    } catch {}
  }, []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState<{ [key: number]: number }>({});
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState('');

  const projects: Project[] = [
    {
      title: 'Museum of Human Disease – Booking System',
      technologies: 'React (TypeScript), ASP.NET Core Web API, SQL Server (EF Core), Azure App Service & Azure SQL, Azure Blob Storage',
      description:
        'A full‑stack web application that lets visitors plan and book their museum visits online, while managers securely manage time slots, capacity, and generate operational reports. It features an end‑to‑end booking flow with validation, role‑based authorization, and responsive UI.',
      images: [museum01, museum02, museum03, museum04],
      projectUrl: '#',
    },
    {
      title: 'My Pet Groomer – SaaS Platform',
      technologies: 'React (TypeScript), ASP.NET Core Web API, SQL Server (EF Core), Azure App Service & Azure SQL, Azure Blob Storage',
      description:
        'A multi‑tenant SaaS management platform that helps pet grooming businesses manage multiple stores with appointments, customers, payments, and service scheduling. Supports role‑based access, store configuration, time‑slot capacity, and operational metrics.',
      images: [mpg01, mpg02, mpg03],
      projectUrl: '#',
    },
  ];

  const getCurrentImageIndex = (projectIndex: number): number => {
    return currentImageIndex[projectIndex] || 0;
  };

  const setImageIndex = (projectIndex: number, index: number) => {
    setCurrentImageIndex(prev => ({ ...prev, [projectIndex]: index }));
  };

  const contactInfo: ContactInfo[] = [
    {
      label: 'GitHub',
      info: 'github.com/Brady-Zhang',
      url: 'https://github.com/Brady-Zhang',
      icon: <FaGithub className="w-6 h-6 text-gray-800" />,
    },
    {
      label: 'LinkedIn',
      info: 'linkedin.com/in/depeng-zhang',
      url: 'https://www.linkedin.com/in/depeng-zhang/',
      icon: <FaLinkedin className="w-6 h-6 text-gray-800" />,
    },
    {
      label: 'Email',
      info: 'zhangdepeng3@gmail.com',
      url: 'mailto:zhangdepeng3@gmail.com',
      icon: <MdEmail className="w-6 h-6 text-gray-800" />,
    },
    {
      label: 'Phone',
      info: '+61 412 456 185',
      url: 'tel:+61412456185',
      icon: <FaPhone className="w-6 h-6 text-gray-800" />,
    },
  ];

  const handleCopy = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleOpenLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleOpenModal = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleImageClick = (src: string) => {
    setSelectedImageSrc(src);
    setIsImageModalOpen(true);
  };

  const handleCloseImageModal = () => {
    setIsImageModalOpen(false);
    setSelectedImageSrc('');
  };

  return (
    <>
      <div className="min-h-screen py-16 px-6 mt-16" style={{ backgroundColor: 'rgb(241, 241, 241)' }}>
        <div className="max-w-6xl mx-auto relative">
          {/* Main About Me Card */}
          <div className="rounded-2xl border-2 border-gray-300 shadow-inner p-10 md:p-12 relative" style={{ backgroundColor: 'rgb(241, 241, 241)', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1), inset 0 0 20px rgba(0, 0, 0, 0.05)' }}>
            {/* Profile Picture - Overlapping top-right corner */}
            <div className="absolute -top-16 -right-16 hidden md:block">
              <img
                src={selfImage}
                alt="Brady ZHANG"
                className="w-36 h-36 rounded-full object-cover border-4 border-white"
                style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}
              />
            </div>

            {/* Title */}
            <h1 className="text-5xl font-bold text-gray-800 mb-6">
              About me 😊
            </h1>

            {/* Description */}
            <div className="text-lg text-gray-700 leading-relaxed mb-8">
              <p>
                Hi, I'm Brady, a passionate Full-stack Developer with expertise in Next.js and ASP.NET Core.
                My recent experience enables me to write clean, maintainable, and standards-compliant code.
                Through hands-on projects, I've honed extensive coding skills and delivered effective solutions
                to complex technical challenges. My self-learning mindset and problem-solving abilities ensure
                meaningful contributions to projects.
              </p>
            </div>

            {/* Contact Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4">
              {/* Get in touch button */}
              <button
                onClick={handleOpenModal}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-6 py-3 rounded-lg border border-gray-300 shadow-inner transition-colors cursor-pointer"
                style={{ boxShadow: 'inset 0 2px 3px rgba(0, 0, 0, 0.1)' }}
              >
                Get in touch
              </button>

              {/* Social Media Icons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleOpenModal}
                  className="bg-gray-200 hover:bg-gray-300 p-3 rounded-md border border-gray-300 shadow-inner transition-colors cursor-pointer"
                  style={{ boxShadow: 'inset 0 2px 3px rgba(0, 0, 0, 0.1)' }}
                  aria-label="GitHub"
                >
                  <FaGithub className="w-5 h-5 text-gray-800" />
                </button>
                <button
                  onClick={handleOpenModal}
                  className="bg-gray-200 hover:bg-gray-300 p-3 rounded-md border border-gray-300 shadow-inner transition-colors cursor-pointer"
                  style={{ boxShadow: 'inset 0 2px 3px rgba(0, 0, 0, 0.1)' }}
                  aria-label="LinkedIn"
                >
                  <FaLinkedin className="w-5 h-5 text-gray-800" />
                </button>
                <button
                  onClick={handleOpenModal}
                  className="bg-gray-200 hover:bg-gray-300 p-3 rounded-md border border-gray-300 shadow-inner transition-colors cursor-pointer"
                  style={{ boxShadow: 'inset 0 2px 3px rgba(0, 0, 0, 0.1)' }}
                  aria-label="Email"
                >
                  <MdEmail className="w-5 h-5 text-gray-800" />
                </button>
              </div>
            </div>
          </div>

          {/* Profile Picture for mobile - displayed below card */}
          <div className="md:hidden flex justify-center mt-8">
            <img
              src={selfImage}
              alt="Brady ZHANG"
              className="w-32 h-32 rounded-full object-cover border-4 border-white"
              style={{ boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)' }}
            />
          </div>

          {/* My Experience Section */}
          <div className="mt-20">
            <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">My experience</h2>
            
                         <div className="space-y-12">
               {projects.map((project, projectIndex) => (
                 <div
                   key={projectIndex}
                   className="rounded-xl p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-8"
                   style={{ 
                     backgroundColor: 'rgb(241, 241, 241)',
                     boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15), 0 4px 10px rgba(0, 0, 0, 0.1)'
                   }}
                                   >
                    {/* Left Side - Project Description */}
                    <div 
                      className="md:w-1/2 flex flex-col justify-between"
                      style={{ backgroundColor: 'rgb(241, 241, 241)' }}
                    >
                      <div>
                        {/* Technologies */}
                        <div className="text-xs text-gray-500 mb-2">{project.technologies}</div>
                        
                        {/* Title */}
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">{project.title}</h3>
                        
                        {/* Description */}
                        <p className="text-gray-700 leading-relaxed mb-6">{project.description}</p>
                      </div>
                      
                      {/* View Project Button temporarily disabled */}
                    </div>

                    {/* Right Side - Images with 3D Carousel */}
                    <div className="md:w-1/2 relative">
                      <div 
                        className="relative w-full h-[250px] lg:h-84 flex items-center justify-center overflow-hidden rounded-lg"
                        style={{ perspective: '1000px', backgroundColor: 'rgb(241, 241, 241)' }}
                      >
                        {project.images.map((image, index) => {
                         const current = getCurrentImageIndex(projectIndex);
                         const total = project.images.length;
                         const diff = (index - current + total) % total;
                         const normalizedDiff = diff > total / 2 ? diff - total : diff;
                         
                         let transform = '';
                         let opacity = 1;
                         let zIndex = 0;
                         let visibility: 'visible' | 'hidden' = 'visible';
                         let cursor = 'pointer';
                         
                         if (normalizedDiff === 0) {
                           // Center (Active)
                           transform = 'translateX(0px) scale(1) rotateY(0deg)';
                           opacity = 1;
                           zIndex = 100;
                           cursor = 'pointer';
                         } else if (normalizedDiff === -1 || (normalizedDiff === total - 1 && total === 2)) {
                           // Left (Partial)
                           transform = 'translateX(-120px) scale(0.7) rotateY(20deg)';
                           opacity = 0.6;
                           zIndex = 99;
                           cursor = 'pointer';
                         } else if (normalizedDiff === 1 || (normalizedDiff === -(total - 1) && total === 2)) {
                           // Right (Partial)
                           transform = 'translateX(120px) scale(0.7) rotateY(-20deg)';
                           opacity = 0.6;
                           zIndex = 99;
                           cursor = 'pointer';
                         } else if (normalizedDiff < -1 || normalizedDiff > 1) {
                           // Hidden (Off-screen)
                           if (normalizedDiff < 0) {
                             transform = `translateX(-300px) scale(0.3) rotateY(90deg)`;
                           } else {
                             transform = `translateX(300px) scale(0.3) rotateY(-90deg)`;
                           }
                           opacity = 0;
                           zIndex = 0;
                           visibility = 'hidden';
                           cursor = 'default';
                         }
                         
                         return (
                           <div
                             key={index}
                             className="absolute w-48 h-36 lg:w-64 lg:h-48 select-none"
                             style={{
                               transform,
                               opacity,
                               zIndex,
                               visibility,
                               cursor,
                               transition: 'transform 1.8s cubic-bezier(0.4, 0, 0.2, 1), opacity 1.8s ease-in-out, z-index 0s linear 0.4s',
                               transformOrigin: 'center center',
                               backfaceVisibility: 'hidden',
                               WebkitBackfaceVisibility: 'hidden',
                               perspective: '1000px',
                             }}
                             onClick={(e) => {
                               e.stopPropagation();
                               if (normalizedDiff === 0) {
                                 // Click center image to open full screen
                                 handleImageClick(image);
                               } else if (normalizedDiff !== 0 && visibility === 'visible') {
                                 // Click side image to go to that image
                                 setImageIndex(projectIndex, index);
                               }
                             }}
                           >
                             <img
                               src={image}
                               alt={`${project.title} - Image ${index + 1}`}
                               className="w-full h-full object-cover rounded-lg shadow-xl select-none"
                               draggable="false"
                               style={{
                                 transition: 'all 1.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                 backfaceVisibility: 'hidden',
                                 WebkitBackfaceVisibility: 'hidden',
                               }}
                             />
                           </div>
                         );
                       })}
                    </div>
                    
                    {/* Carousel Dots */}
                    {project.images.length > 1 && (
                      <div className="absolute bottom-4 lg:bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {project.images.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setImageIndex(projectIndex, index)}
                            className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full transition-all duration-300 ${
                              getCurrentImageIndex(projectIndex) === index
                                ? 'bg-white scale-125'
                                : 'bg-white/40 hover:bg-white/60'
                            }`}
                            aria-label={`Go to image ${index + 1}`}
                          />
                        ))}
                      </div>
                                         )}
                   </div>
                 </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)' }}
          onClick={handleCloseModal}
        >
          <div
            className="bg-gray-200 rounded-2xl shadow-xl p-6 w-full max-w-md relative"
            style={{ backgroundColor: 'rgb(220, 220, 220)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Get in touch</h2>
              <button
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-gray-300 hover:bg-gray-400 flex items-center justify-center transition-colors shadow-md"
                aria-label="Close"
              >
                <MdClose className="w-5 h-5 text-gray-800" />
              </button>
            </div>

            {/* Contact Options */}
            <div className="space-y-3">
              {contactInfo.map((contact, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-100 border border-gray-300 shadow-inner"
                  style={{ boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)' }}
                >
                  {/* Icon */}
                  <div className="w-10 h-10 flex items-center justify-center bg-gray-200 rounded-md border border-gray-300 shadow-inner flex-shrink-0">
                    {contact.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-800 text-sm">{contact.label}</div>
                    <div className="text-gray-600 text-xs truncate">{contact.info}</div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Copy Button */}
                    <button
                      onClick={() => handleCopy(contact.info, index)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-md border border-gray-300 shadow-inner transition-colors"
                      style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                      aria-label={`Copy ${contact.label}`}
                      title="Copy"
                    >
                      {copiedIndex === index ? (
                        <span className="text-green-600 text-xs">✓</span>
                      ) : (
                        <MdContentCopy className="w-4 h-4 text-gray-800" />
                      )}
                    </button>

                    {/* External Link Button */}
                    {contact.url && (
                      <button
                        onClick={() => contact.url && handleOpenLink(contact.url)}
                        className="w-8 h-8 flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-md border border-gray-300 shadow-inner transition-colors"
                        style={{ boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.1)' }}
                        aria-label={`Open ${contact.label}`}
                        title="Open link"
                      >
                        <MdOpenInNew className="w-4 h-4 text-gray-800" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Image Modal (Full Screen) */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.9)', backdropFilter: 'blur(4px)' }}
          onClick={handleCloseImageModal}
        >
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            <img
              src={selectedImageSrc}
              alt="Full size"
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={handleCloseImageModal}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors shadow-md"
              aria-label="Close"
            >
              <MdClose className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AboutMePage;
