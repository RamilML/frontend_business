import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { DocumentRegistryScreen } from '../documents/DocumentRegistryScreen';
import { Building2, Package, FileText, Download, Truck } from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [showDocuments, setShowDocuments] = useState(false);

  if (showDocuments) {
    return (
      <div>
        <div style={{ padding: '0.75rem 1.5rem', background: 'rgba(30,41,59,0.5)', borderBottom: '1px solid var(--border)' }}>
          <button className="btn-secondary" onClick={() => setShowDocuments(false)}>
            $\leftarrow$ Вернуться в Обзор Личного Кабинета
          </button>
        </div>
        <DocumentRegistryScreen />
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Личный кабинет Клиента (Селлера)</h2>
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
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.4rem' }}>3 поставки</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Товаров на складах ВБ</span>
            <Truck size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.4rem' }}>540 шт.</div>
        </div>

        <div className="card" style={{ cursor: 'pointer' }} onClick={() => setShowDocuments(true)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Доступно актов для выгрузки</span>
            <FileText size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.4rem' }}>5 документов</div>
          <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Скачать документы $\rightarrow$</span>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          <Building2 size={18} color="#8b5cf6" /> Изолированный доступ Клиента к выгрузкам
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Вы можете в любой момент просмотреть раскладку ваших коробок по складам Wildberries, а также скачать сформированные Акты выполненных работ в форматах Excel, Word и PDF.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-primary" onClick={() => setShowDocuments(true)} style={{ width: 'auto' }}>
            <Download size={16} /> Скачать Акты (Excel / Word / PDF)
          </button>
        </div>
      </div>
    </div>
  );
};
