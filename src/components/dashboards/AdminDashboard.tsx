import React from 'react';
import { UserCog, ShieldAlert, Key, Settings, UserPlus } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Панель Администратора</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Управление пользователями, правами доступа и системными настройками</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }}>
          <UserPlus size={16} /> Добавить пользователя
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Пользователей в системе</span>
            <UserCog size={20} color="#f43f5e" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>12 аккаунтов</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Настройки интеграций</span>
            <Settings size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>WB API • 1C</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          <ShieldAlert size={18} color="#f43f5e" /> Полные права администратора
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Вам доступны функции сброса паролей, назначения ролей (Оператор, Менеджер, Клиент, Админ), а также конфигурация выгрузки документов и интеграций.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary">
            <Key size={16} /> Управление ключами доступа
          </button>
          <button className="btn-secondary">
            <Settings size={16} /> Настройка реквизитов компании Бишкек
          </button>
        </div>
      </div>
    </div>
  );
};
