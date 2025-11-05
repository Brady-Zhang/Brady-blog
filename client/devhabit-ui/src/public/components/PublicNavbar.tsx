import { Link } from 'react-router-dom';
import selfImage from '../../assets/self01.jpg';

const PublicNavbar = () => {
    return (
    <nav className="sticky top-0 z-50 px-6 py-4 shadow-sm" style={{ backgroundColor: '#0f172a' }}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/blog" className="text-xl font-bold flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20">
            <img 
              src={selfImage} 
              alt="Brady ZHANG" 
              className="w-full h-full object-cover"
            />
          </div>
          <span className="text-white">Brady ZHANG</span>
        </Link>
        
        <div className="flex items-center gap-8">
          <Link 
            to="/about" 
            className="text-white hover:text-gray-300 font-medium transition-colors"
          >
            About Me
          </Link>
          <Link 
            to="/blog" 
            className="text-white hover:text-gray-300 font-medium transition-colors"
          >
            Blog
          </Link>
          <Link 
            to="/login" 
            className="px-4 py-2 text-white border border-white rounded-md hover:bg-white/10 font-medium transition-colors"
          >
            Log in
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;

