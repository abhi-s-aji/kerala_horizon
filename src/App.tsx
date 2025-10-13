import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Sidebar from './components/Layout/Sidebar';
import Header from './components/Layout/Header';
import MainContent from './components/Layout/MainContent';
import PWAInstallButton from './components/Common/PWAInstallButton';
import PageTransition from './components/Common/PageTransition';
import './i18n';
import './App.css';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  // Extract section from URL path
  const activeSection = location.pathname.slice(1) || 'transport';

  const handleSearch = (query: string) => {
    // Handle search logic here - could redirect to search results page
    console.log('Searching for:', query);
  };

  const handleSectionChange = (section: string) => {
    navigate(`/${section}`);
  };

  return (
    <div className="App min-h-screen bg-gray-50 dark:bg-gray-900">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Sidebar
        activeSection={activeSection}
        onSectionChange={handleSectionChange}
      />
      <Header onSearch={handleSearch} />
      <PageTransition pageKey={activeSection}>
        <MainContent activeSection={activeSection} />
      </PageTransition>
      <PWAInstallButton />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <Routes>
              <Route path="/*" element={<AppContent />} />
            </Routes>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
