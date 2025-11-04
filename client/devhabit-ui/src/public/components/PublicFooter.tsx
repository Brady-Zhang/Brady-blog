import React from 'react';
import { FaLinkedin, FaGithub } from 'react-icons/fa';

const PublicFooter = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-black text-gray-400 py-6 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Copyright */}
        <div className="text-sm">
          © {currentYear} Brady ZHANG
        </div>

        {/* Contact & Social Media */}
        <div className="flex items-center gap-4">
          <span className="text-sm">Contact</span>
          <div className="flex items-center gap-3">
            <a
              href="https://www.linkedin.com/in/depeng-zhang/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="LinkedIn"
            >
              <FaLinkedin className="w-5 h-5" />
            </a>
            <a
              href="https://github.com/Brady-Zhang"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="GitHub"
            >
              <FaGithub className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
