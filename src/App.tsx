import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { I18nProvider } from '@/contexts/I18nContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';
import { LandingPage } from '@/pages/LandingPage';
import { SignupPage } from '@/pages/SignupPage';
import { LoginPage } from '@/pages/LoginPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { TrackerPage } from '@/pages/TrackerPage';
import { TasbihPage } from '@/pages/TasbihPage';
import { QuranJournalPage } from '@/pages/QuranJournalPage';
import { KnowledgePage } from '@/pages/KnowledgePage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ProgressPage } from '@/pages/ProgressPage';

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <HashRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/signup" element={<SignupPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><DashboardPage /></AppLayout></ProtectedRoute>} />
              <Route path="/tracker" element={<ProtectedRoute><AppLayout><TrackerPage /></AppLayout></ProtectedRoute>} />
              <Route path="/tasbih" element={<ProtectedRoute><AppLayout><TasbihPage /></AppLayout></ProtectedRoute>} />
              <Route path="/quran" element={<ProtectedRoute><AppLayout><QuranJournalPage /></AppLayout></ProtectedRoute>} />
              <Route path="/knowledge" element={<ProtectedRoute><AppLayout><KnowledgePage /></AppLayout></ProtectedRoute>} />
              <Route path="/leaderboard" element={<ProtectedRoute><AppLayout><LeaderboardPage /></AppLayout></ProtectedRoute>} />
              <Route path="/groups" element={<ProtectedRoute><AppLayout><GroupsPage /></AppLayout></ProtectedRoute>} />
              <Route path="/progress" element={<ProtectedRoute><AppLayout><ProgressPage /></AppLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><AppLayout><SettingsPage /></AppLayout></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
