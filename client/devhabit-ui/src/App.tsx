import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Login from './features/auth/Login';
import Signup from './features/auth/Signup';
import Dashboard from './pages/Dashboard';
import Profile from './features/users/Profile';
import { CreateHabitPage } from './features/habits/CreateHabitPage';
import { HabitDetailsPage } from './features/habits/HabitDetailsPage';
import { EditHabitPage } from './features/habits/EditHabitPage';
import { HabitsPage } from './features/habits/HabitsPage';
import { BlogsPage } from './features/blogs/BlogsPage';
import { CreateBlogPage } from './features/blogs/CreateBlogPage';
import { BlogDetailsPage } from './features/blogs/BlogDetailsPage';
import { EditBlogPage } from './features/blogs/EditBlogPage';
import { TagsPage } from './features/tags/TagsPage';
import { EntriesPage } from './features/entries/EntriesPage';
import { CreateEntryPage } from './features/entries/CreateEntryPage';
import { EditEntryPage } from './features/entries/EditEntryPage';
import { CreateBatchEntriesPage } from './features/entries/CreateBatchEntriesPage';
import { EntryImportsPage } from './features/entries/EntryImportsPage';
import PublicLayout from './public/components/PublicLayout';
import PublicBlogListPage from './public/pages/PublicBlogListPage';
import PublicBlogDetailPage from './public/pages/PublicBlogDetailPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes - 展示端（无需登录） */}
          <Route element={<PublicLayout />}>
            <Route path="/public/blog" element={<PublicBlogListPage />} />
            <Route path="/public/blog/:id" element={<PublicBlogDetailPage />} />
            {/* 可以继续添加更多公开展示页面 */}
          </Route>

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* Protected routes - 运营端（需要登录） */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/habits" element={<HabitsPage />} />
            <Route path="/habits/create" element={<CreateHabitPage />} />
            <Route path="/habits/:id" element={<HabitDetailsPage />} />
            <Route path="/habits/:id/edit" element={<EditHabitPage />} />
            <Route path="/blogs" element={<BlogsPage />} />
            <Route path="/blogs/create" element={<CreateBlogPage />} />
            <Route path="/blogs/:id" element={<BlogDetailsPage />} />
            <Route path="/blogs/:id/edit" element={<EditBlogPage />} />
            <Route path="/entries" element={<EntriesPage />} />
            <Route path="/entries/create" element={<CreateEntryPage />} />
            <Route path="/entries/create-batch" element={<CreateBatchEntriesPage />} />
            <Route path="/entries/:id/edit" element={<EditEntryPage />} />
            <Route path="/tags" element={<TagsPage />} />
            <Route path="/entries/imports" element={<EntryImportsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
