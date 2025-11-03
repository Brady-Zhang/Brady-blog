import { Link } from 'react-router-dom';
import { HiCode } from 'react-icons/hi';

const PublicNavbar = () => {
  return (
    <nav className="border-b border-gray-300 px-6 py-4" style={{ backgroundColor: 'rgb(235, 235, 235)' }}>
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <Link to="/public/blog" className="text-2xl font-bold flex items-center">
          <HiCode className="inline-block w-7 h-7 mr-2" /> DevHabit
        </Link>
        
        <div className="flex items-center gap-6">
          <Link 
            to="/public/blog" 
            className="text-gray-700 hover:text-blue-600 font-medium"
          >
            Blog
          </Link>
          <Link 
            to="/login" 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Login
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;

