import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import {
  Boxes,
  LogOut,
  User as UserIcon,
  PackageCheck,
  ShieldCheck,
  Building2,
  UserCog,
  RefreshCw
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, quickSwitchRole, apiConfig } = useAuth();

  if (!user) return null;

  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'operator':
        return (
          <span className="badge badge-operator">
            <PackageCheck size={13} /> Оператор склада
          </span>
        );
      case 'manager':
        return (
          <span className="badge badge-manager">
            <ShieldCheck size={13} /> Менеджер
          </span>
        );
      case 'client':
        return (
          <span className="badge badge-client">
            <Building2 size={13} /> Клиент (Селлер)
          </span>
        );
      case 'admin':
        return (
          <span className="badge badge-admin">
            <UserCog size={13} /> Администратор
          </span>
        );
    }
  };

  return (
    <header className="app-header">
      {/* Brand & App title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div 
          style={{
            background: 'var(--primary)',
            color: '#000',
            padding: '0.4rem',
            borderRadius: 'var(--radius-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Boxes size={20} />
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: '1.1rem', letterSpacing: '-0.01em' }}>
            ФФ Ассистент
          </span>
          <span 
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              marginLeft: '0.5rem',
              background: 'rgba(255,255,255,0.06)',
              padding: '0.1rem 0.4rem',
              borderRadius: 4
            }}
          >
            {apiConfig.useMock ? 'Mock API' : 'REST API'}
          </span>
        </div>
      </div>

      {/* Quick Role Switcher Bar for Demo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.2rem' }}>
          Тест роли:
        </span>
        {(['operator', 'manager', 'client', 'admin'] as UserRole[]).map((r) => (
          <button
            key={r}
            className={`btn-secondary ${user.role === r ? 'active' : ''}`}
            onClick={() => quickSwitchRole(r)}
            style={{
              padding: '0.25rem 0.6rem',
              fontSize: '0.75rem',
              borderColor: user.role === r ? 'var(--primary)' : 'var(--border)',
              color: user.role === r ? 'var(--primary)' : 'var(--text-muted)'
            }}
            title={`Переключить на роль ${r}`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Logged in User profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</span>
            {renderRoleBadge(user.role)}
          </div>
          {user.clientName && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {user.clientName}
            </div>
          )}
        </div>

        <button 
          className="btn-secondary" 
          onClick={logout}
          style={{ borderColor: 'rgba(244, 63, 94, 0.4)', color: '#f43f5e' }}
          title="Выйти из аккаунта"
        >
          <LogOut size={16} /> Выход
        </button>
      </div>
    </header>
  );
};
