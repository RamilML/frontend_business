import React from 'react';
import { PackageCheck, Barcode, Box, Truck, CheckCircle2, Play } from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Рабочее место Оператора (ТСД)</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Приёмка товаров, сканирование штрихкодов и упаковка в коробки</p>
        </div>
        <button className="btn-primary" style={{ width: 'auto' }}>
          <Play size={16} /> Начать сканирование поставки
        </button>
      </div>

      {/* Operator stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Активная поставка</span>
            <Box size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>№ WB-2026-0805</div>
          <span style={{ fontSize: '0.8rem', color: '#10b981' }}>Клиент: ООО "Модный Гардероб"</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Отсканировано ШК</span>
            <Barcode size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>148 / 200 шт.</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Прогресс: 74%</span>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Сформировано коробок</span>
            <Truck size={20} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '0.5rem' }}>6 коробов</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Склады: Коледино, Тула</span>
        </div>
      </div>

      <div className="card">
        <h3 className="card-title">
          <PackageCheck size={18} color="#10b981" /> Ваше назначение и доступные действия
        </h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Как <b>Оператор</b>, вы имеете доступ к сканированию штрихкодов, ручному выбору номеров коробок и привязке их к складам Wildberries.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn-secondary">
            <Barcode size={16} /> Сканер ШК (Камера / ТСД)
          </button>
          <button className="btn-secondary">
            <Box size={16} /> Распределение по коробкам
          </button>
          <button className="btn-secondary">
            <CheckCircle2 size={16} /> Завершить смену
          </button>
        </div>
      </div>
    </div>
  );
};
