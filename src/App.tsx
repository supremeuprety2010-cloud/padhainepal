import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { handleGoogleRedirect } from './lib/googleAuth';
import ProtectedRoute from './components/ProtectedRoute';
import OnboardingGate from './components/OnboardingGate';
import BottomNav from './components/BottomNav';
import LoadingSpinner from './components/LoadingSpinner';

// Public
import Landing from './pages/Landing';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';

// App — main tabs
import Home from './pages/app/Home';
import Study from './pages/app/Study';
import SubjectHub from './pages/app/SubjectHub';
import PracticeHub from './pages/app/PracticeHub';
import CommunityHub from './pages/app/CommunityHub';
import ProfileHub from './pages/app/ProfileHub';

// Utility pages
import StudyRoomDetail, { StudyRoomList } from './pages/app/StudyRoom';
import { DoubtsHub, DoubtDetail } from './pages/app/DoubtsHub';
import PublicProfile from './pages/app/PublicProfile';
import EditProfile from './pages/app/EditProfile';
import GpaCalculatorPage from './pages/app/GpaCalculator';
import Leaderboard from './pages/Leaderboard';
import Subscribe from './pages/Subscribe';
import AITutor from './pages/AITutor';
import Pomodoro from './pages/Pomodoro';

// Admin Panel
import AdminDashboard from './pages/admin/AdminDashboard';

handleGoogleRedirect();

// Pages that should NOT show the bottom tab nav
const HIDE_NAV_PREFIXES = ['/', '/login', '/onboarding', '/study-room/', '/doubts/', '/user/', '/profile/edit', '/gpa-calculator', '/admin'];
const HIDE_NAV_EXACT = ['/', '/login', '/onboarding', '/gpa-calculator'];

function LandingOrHome() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <LoadingSpinner size="lg" text="Loading PadhaiNepal..." />
      </div>
    );
  }
  if (user) {
    return <Navigate to="/home" replace />;
  }
  return <Landing />;
}

function LoginOrHome() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <LoadingSpinner size="lg" text="Loading..." />
      </div>
    );
  }
  if (user) {
    return <Navigate to="/home" replace />;
  }
  return <Login />;
}

function AppLayout() {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useAuth();

  // Hide bottom nav on subject sub-sections (e.g. /study/Physics/tracker, /study/Physics/practice, etc.)
  const isSubSection = /^\/study\/[^/]+\/(practice|videos|tracker|ppa|mock|notes|doubts)/.test(path);

  const showNav = !isSubSection && !(
    HIDE_NAV_EXACT.includes(path) ||
    HIDE_NAV_PREFIXES.some(p => p !== '/' && path.startsWith(p))
  );

  return (
    <>
      <Routes>
        {/* ── Public ── */}
        <Route path="/" element={<LandingOrHome />} />
        <Route path="/login" element={<LoginOrHome />} />
        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />

        {/* ── Admin Panel ── */}
        <Route path="/admin/*" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />

        {/* ── Main App Tabs ── */}
        <Route path="/home"      element={<OnboardingGate><Home /></OnboardingGate>} />
        <Route path="/study"     element={<OnboardingGate><Study /></OnboardingGate>} />
        <Route path="/practice"  element={<OnboardingGate><PracticeHub /></OnboardingGate>} />
        <Route path="/community" element={<OnboardingGate><CommunityHub /></OnboardingGate>} />
        <Route path="/profile"   element={<OnboardingGate><ProfileHub /></OnboardingGate>} />

        {/* ── Subject Hub with sub-routes ── */}
        <Route path="/study/:subject/*" element={<OnboardingGate><SubjectHub /></OnboardingGate>} />

        {/* ── Study Room ── */}
        <Route path="/study-room"        element={<OnboardingGate><StudyRoomList /></OnboardingGate>} />
        <Route path="/study-room/:roomId" element={<OnboardingGate><StudyRoomDetail /></OnboardingGate>} />

        {/* ── Doubts ── */}
        <Route path="/doubts"          element={<OnboardingGate><DoubtsHub /></OnboardingGate>} />
        <Route path="/doubts/:doubtId" element={<OnboardingGate><DoubtDetail /></OnboardingGate>} />

        {/* ── Profile ── */}
        <Route path="/user/:userId"  element={<OnboardingGate><PublicProfile /></OnboardingGate>} />
        <Route path="/profile/edit"  element={<OnboardingGate><EditProfile /></OnboardingGate>} />

        {/* ── GPA Calculator ── */}
        <Route path="/gpa-calculator" element={<OnboardingGate><GpaCalculatorPage /></OnboardingGate>} />

        {/* ── Utilities ── */}
        <Route path="/ai-tutor"    element={<OnboardingGate><AITutor /></OnboardingGate>} />
        <Route path="/pomodoro"    element={<OnboardingGate><Pomodoro /></OnboardingGate>} />
        <Route path="/leaderboard" element={<OnboardingGate><Leaderboard /></OnboardingGate>} />
        <Route path="/subscribe"   element={<OnboardingGate><Subscribe /></OnboardingGate>} />

        {/* ── Legacy redirects ── */}
        <Route path="/dashboard" element={<OnboardingGate><Home /></OnboardingGate>} />

        {/* ── Fallback ── */}
        <Route path="*" element={user ? <Navigate to="/home" replace /> : <Landing />} />
      </Routes>

      {showNav && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}
