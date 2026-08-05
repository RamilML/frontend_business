import React from 'react';
import { useAuth } from './context/AuthContext';
import { LoginForm } from './components/auth/LoginForm';
import { Header } from './components/layout/Header';
import { OperatorDashboard } from './components/dashboards/OperatorDashboard';
import { ManagerDashboard } from './components/dashboards/ManagerDashboard';
import { ClientDashboard } from './components/dashboards/ClientDashboard';
import { AdminDashboard } from './components/dashboards/AdminDashboard';
import { Loader2 } from 'lucide-react';

export const AppContent: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div 
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem'
        }}
      >
        <Loader2 size={40} className="animate-spin" color="var(--primary)" />
        <span style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Загрузка профиля пользователя...
        </span>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <LoginForm />;
  }

  const renderDashboardByRole = () => {
    switch (user.role) {
      case 'operator':
        return <OperatorDashboard />;
      case 'manager':
        return <ManagerDashboard />;
      case 'client':
        return <ClientDashboard />;
      case 'admin':
        return <AdminDashboard />;
      default:
        return <OperatorDashboard />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1 }}>
        {renderDashboardByRole()}
      </main>
    </div>
  );
};

export function App() {
  return <AppContent />;
}
