import { Outlet } from 'react-router-dom';
import PublicNavbar from './PublicNavbar';

const PublicLayout = () => {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'rgb(241, 241, 241)' }}>
      <PublicNavbar />
      <main className="max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default PublicLayout;

