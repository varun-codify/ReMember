import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Landing = lazy(() => import('./pages/Landing'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const PasswordVault = lazy(() => import('./pages/PasswordVault'));
const Tasks = lazy(() => import('./pages/Tasks'));
const Videos = lazy(() => import('./pages/Videos'));
const Websites = lazy(() => import('./pages/Websites'));
const Settings = lazy(() => import('./pages/Settings'));
const Search = lazy(() => import('./pages/Search'));
const Capture = lazy(() => import('./pages/Capture'));
const Notes = lazy(() => import('./pages/Notes'));
const Collections = lazy(() => import('./pages/Collections'));
const Assistant = lazy(() => import('./pages/Assistant'));
const KnowledgeGraph = lazy(() => import('./pages/KnowledgeGraph'));

// Fallback shown while a route chunk loads
const PageFallback = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
    <div className="neo-spinner" style={{ width: '48px', height: '48px', borderWidth: '4px' }}></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/passwords"
              element={
                <PrivateRoute>
                  <PasswordVault />
                </PrivateRoute>
              }
            />
            <Route
              path="/tasks"
              element={
                <PrivateRoute>
                  <Tasks />
                </PrivateRoute>
              }
            />
            <Route
              path="/videos"
              element={
                <PrivateRoute>
                  <Videos />
                </PrivateRoute>
              }
            />
            <Route
              path="/websites"
              element={
                <PrivateRoute>
                  <Websites />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route
              path="/search"
              element={
                <PrivateRoute>
                  <Search />
                </PrivateRoute>
              }
            />
            <Route
              path="/capture"
              element={
                <PrivateRoute>
                  <Capture />
                </PrivateRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <PrivateRoute>
                  <Notes />
                </PrivateRoute>
              }
            />
            <Route
              path="/collections"
              element={
                <PrivateRoute>
                  <Collections />
                </PrivateRoute>
              }
            />
            <Route
              path="/assistant"
              element={
                <PrivateRoute>
                  <Assistant />
                </PrivateRoute>
              }
            />
            <Route
              path="/knowledge"
              element={
                <PrivateRoute>
                  <KnowledgeGraph />
                </PrivateRoute>
              }
            />
            {/* Public landing page (logged-in users are redirected to /dashboard inside it) */}
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
