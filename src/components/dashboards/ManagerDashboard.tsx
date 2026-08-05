import React, { useState } from 'react';
import { Client } from '../../types/client';
import { ClientList } from '../clients/ClientList';
import { ClientSelectModal } from '../clients/ClientSelectModal';
import {
  ShieldCheck,
  Users,
  FileText,
  PlusCircle,
  Building2,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients'>('dashboard');
  const [isSelectClientModalOpen, setIsSelectClientModalOpen] = useState(false);
  const [selectedClientForShipment, setSelectedClientForShipment] = useState<Client | null>(null);

  const handleStartShipment = (client: Client) => {
    setSelectedClientForShipment(client);
    alert(`Поставка для клиента "${client.name}" открыта! Следующий шаг: сканирование штрихкодов и привязка коробок.`);
  };

  return (
    <div>
      {/* Sub-header navigation bar for Manager */}
      <div 
        style={{
          background: 'rgba(30, 41, 59, 0.4)',
          borderBottom: '1px solid var(--border)',
          padding: '0.5rem 1.5rem',
          display: 'flex',
          gap: '0.75rem'
        }}
      >
        <button
          className={`btn-secondary ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          style={{
            borderColor: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--border)',
            color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)'
          }}
        >
          <LayoutDashboard size={15} /> Обзор Менеджера
        </button>

        <button
          className={`btn-secondary ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => setActiveTab('clients')}
          style={{
            borderColor: activeTab === 'clients' ? 'var(--primary)' : 'var(--border)',
            color: activeTab === 'clients' ? 'var(--primary)' : 'var(--text-muted)'
          }}
        >
          <Building2 size={15} /> Справочник Клиентов
        </button>
      </div>

      {activeTab === 'clients' ? (
        <ClientList onSelectClientForShipment={handleStartShipment} />
      ) : (
        <div className="dashboard-container">
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Панель Менеджера Склада</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Управление поставками, карточками контрагентов и генерация Актов выполненных работ
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={() => setActiveTab('clients')}>
                <Building2 size={16} /> Карточки Клиентов
              </button>
              <button 
                className="btn-primary" 
                onClick={() => setIsSelectClientModalOpen(true)}
                style={{ width: 'auto' }}
              >
                <PlusCircle size={16} /> Создать Поставку
              </button>
            </div>
          </div>

          {selectedClientForShipment && (
            <div className="alert-info" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b>Выбран контрагент:</b> {selectedClientForShipment.name} (ИНН: {selectedClientForShipment.requisites.inn})
              </div>
              <button className="btn-secondary" onClick={() => setSelectedClientForShipment(null)} style={{ fontSize: '0.75rem' }}>
                Сбросить выбор
              </button>
            </div>
          )}

          {/* Stats grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ cursor: 'pointer' }} onClick={() => setActiveTab('clients')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Активных контрагентов</span>
                <Users size={20} color="#3b82f6" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.4rem' }}>3 контрагента</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Нажмите для просмотра карточек $\rightarrow$</span>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Поставок в работе</span>
                <TrendingUp size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.4rem' }}>6 поставок</div>
            </div>

            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Сформировано Актов</span>
                <FileText size={20} color="#10b981" />
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.4rem' }}>27 актов</div>
            </div>
          </div>

          <div className="card">
            <h3 className="card-title">
              <ShieldCheck size={18} color="#3b82f6" /> Модуль управления Клиентами (Контрагентами)
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Перед каждой новой поставкой операторы или менеджеры выбирают клиента из справочника либо создают нового. Все реквизиты (ИНН, Юр. адрес, Расчетный счет) сохраняются для автоматического формирования Актов выполненных работ.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button className="btn-secondary" onClick={() => setActiveTab('clients')}>
                <Building2 size={16} /> Справочник и карточки клиентов
              </button>
              <button className="btn-secondary" onClick={() => setIsSelectClientModalOpen(true)}>
                <PlusCircle size={16} /> Открыть новую поставку
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select client modal */}
      <ClientSelectModal
        isOpen={isSelectClientModalOpen}
        onClose={() => setIsSelectClientModalOpen(false)}
        onSelectClient={handleStartShipment}
      />
    </div>
  );
};
