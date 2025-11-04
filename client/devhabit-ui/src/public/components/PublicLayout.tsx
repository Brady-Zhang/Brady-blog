import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';
import PublicFooter from './PublicFooter';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'rgb(241, 241, 241)' }}>                                                                            
      <PublicNavbar />
      <main className="flex-1 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
};

export default PublicLayout;

