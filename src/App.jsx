import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Scan from './pages/Scan';
import Scans from './pages/Scans';
import ScanDetail from './pages/ScanDetail';
import Topics from './pages/Topics';
import Learn from './pages/Learn';
import LearnPractice from './pages/LearnPractice';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Curio from './pages/Curio';
import PokedexGallery from './pages/PokedexGallery';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/scan" element={<Scan />} />
        <Route path="/scans" element={<Scans />} />
        <Route path="/scan/:id" element={<ScanDetail />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/learn/practice" element={<LearnPractice />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/curio" element={<Curio />} />
        <Route path="/pokedex" element={<PokedexGallery />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App