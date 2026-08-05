import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';
import { ApiConfigModal } from './ApiConfigModal';
import {
  Lock,
  User,
  PackageCheck,
  ShieldCheck,
  Building2,
  UserCog,
  Settings2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Boxes
} from 'lucide-react';

export const LoginForm: React.FC = () => {
  const { login, quickSwitchRole, isLoading, error, clearError, apiConfig } = useAuth();
  
  const [username, setUsername] = useState('operator');
  const [password, setPassword] = useState('123456');
  const [selectedRole, setSelectedRole] = useState<UserRole>('operator');
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({
        username,
        password,
        role: selectedRole
      });
    } catch {
      // Error handles in context
    }
  };

  const handleRoleSelect = (role: UserRole, defaultUser: string) => {
    setSelectedRole(role);
    setUsername(defaultUser);
    clearError();
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card glass-panel">
        
        {/* Brand logo & Header */}
        <div className="brand-header">
          <div className="brand-badge">
            <Boxes size={16} /> Фулфилмент ВБ • MVP
          </div>
          <h1 className="brand-title">ФФ Ассистент</h1>
          <p className="brand-subtitle">Система учета, приёмки и формирования актов</p>
        </div>

        {/* Backend API status bar */}
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.6)',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
            marginBottom: '1.25rem',
            fontSize: '0.8rem'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span 
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: apiConfig.useMock ? '#10b981' : '#3b82f6'
              }}
            />
            {apiConfig.useMock ? 'Автономный режим (Mock)' : 'Подключен API Бэкенда'}
          </span>

          <button 
            type="button" 
            className="btn-secondary" 
            onClick={() => setIsConfigOpen(true)}
            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
          >
            <Settings2 size={13} /> API Конфиг
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="alert-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Main Login Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Имя пользователя / Логин</label>
            <div className="input-with-icon">
              <User className="input-icon" size={18} />
              <input
                type="text"
                className="form-input"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  clearError();
                }}
                placeholder="Введите логин"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Пароль</label>
            <div className="input-with-icon">
              <Lock className="input-icon" size={18} />
              <input
                type="password"
                className="form-input"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={isLoading} style={{ marginTop: '0.5rem' }}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Вход в систему...
              </>
            ) : (
              <>
                Войти в систему <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Role Selectors */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500 }}>
              Быстрый вход для тестирования ролей:
            </span>
          </div>

          <div className="role-grid">
            <button
              type="button"
              className={`role-pill ${selectedRole === 'operator' ? 'active' : ''}`}
              onClick={() => {
                handleRoleSelect('operator', 'operator');
                quickSwitchRole('operator');
              }}
            >
              <PackageCheck size={16} color="#10b981" />
              <span>Оператор</span>
            </button>

            <button
              type="button"
              className={`role-pill ${selectedRole === 'manager' ? 'active' : ''}`}
              onClick={() => {
                handleRoleSelect('manager', 'manager');
                quickSwitchRole('manager');
              }}
            >
              <ShieldCheck size={16} color="#3b82f6" />
              <span>Менеджер</span>
            </button>

            <button
              type="button"
              className={`role-pill ${selectedRole === 'client' ? 'active' : ''}`}
              onClick={() => {
                handleRoleSelect('client', 'client');
                quickSwitchRole('client');
              }}
            >
              <Building2 size={16} color="#8b5cf6" />
              <span>Клиент</span>
            </button>

            <button
              type="button"
              className={`role-pill ${selectedRole === 'admin' ? 'active' : ''}`}
              onClick={() => {
                handleRoleSelect('admin', 'admin');
                quickSwitchRole('admin');
              }}
            >
              <UserCog size={16} color="#f43f5e" />
              <span>Админ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Backend Integration Modal */}
      <ApiConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </div>
  );
};
