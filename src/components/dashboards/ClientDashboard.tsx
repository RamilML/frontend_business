import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Building2, Package, FileText, Download, Truck } from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Личный кабинет Клиента</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Контрагент: <b>{user?.clientName || 'ООО "Модный Гардероб"'}</b>
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Ваши поставки</span>
            <Package size={20} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>3 поставки</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Товаров на складе ВБ</span>
            <Truck size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>540 шт.</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Доступно актов</span>
            <FileText size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>5 документов</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          <Building2 size={18} color="#8b5cf6" /> Изолированный доступ Клиента
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Вы видите только свои товары, распределение коробок по складам Wildberries и подписываемые Акты выполненных работ. Другие клиенты и внутренние данные фулфилмента недоступны.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary">
            <Package size={16} /> Посмотреть состав коробок
          </button>
          <button className="btn-secondary">
            <Download size={16} /> Скачать Акт (PDF / Excel / Word)
          </button>
        </div>
      </div>
    </div>
  );
};
