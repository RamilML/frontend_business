import React from 'react';
import { ShieldCheck, Users, FileText, PlusCircle, Building2, TrendingUp } from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Панель Менеджера Склада</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Полный контроль поставок, контрагентов и генерация Актов выполненных работ</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary">
            <Building2 size={16} /> Новый Клиент
          </button>
          <button className="btn-primary" style={{ width: 'auto' }}>
            <PlusCircle size={16} /> Создать Поставку
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Активных контрагентов</span>
            <Users size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>24 клиента</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Поставок в работе</span>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>8 поставок</div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Сформировано Актов</span>
            <FileText size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>42 акта</div>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          <ShieldCheck size={18} color="#3b82f6" /> Полный доступ к модулям управления
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Вам доступны все разделы: выбор и редактирование карточек клиентов, просмотр всех коробок, генерация Актов выполненных работ (п. 11 ТЗ) и выгрузка в Excel / PDF / Word.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary">
            <Building2 size={16} /> Справочник клиентов (ИНН/Реквизиты)
          </button>
          <button className="btn-secondary">
            <FileText size={16} /> Генератор Акта (13 услуг)
          </button>
          <button className="btn-secondary">
            <FileText size={16} /> Реестр и экспорты (Excel/PDF/Word)
          </button>
        </div>
      </div>
    </div>
  );
};
