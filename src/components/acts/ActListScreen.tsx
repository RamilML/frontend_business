import React, { useState, useEffect } from 'react';
import { Act } from '../../types/act';
import { ActService } from '../../services/actService';
import { ActGeneratorScreen } from './ActGeneratorScreen';
import { FileText, PlusCircle, Search, Printer, Edit, Trash2, Building2, CheckCircle2, TrendingUp, Users } from 'lucide-react';

export const ActListScreen: React.FC = () => {
  const [acts, setActs] = useState<Act[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Active view state
  const [activeActToEdit, setActiveActToEdit] = useState<Act | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const loadActs = async () => {
    setIsLoading(true);
    try {
      const data = await ActService.getActs();
      setActs(data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadActs();
  }, []);

  if (isCreatingNew || activeActToEdit) {
    return (
      <ActGeneratorScreen
        actToEdit={activeActToEdit}
        onBack={() => {
          setIsCreatingNew(false);
          setActiveActToEdit(null);
          loadActs();
        }}
        onSaved={() => {
          setIsCreatingNew(false);
          setActiveActToEdit(null);
          loadActs();
        }}
      />
    );
  }

  const totalRevenue = acts.reduce((acc, a) => acc + (a.totalSum || 0), 0);
  const avgCheck = acts.length > 0 ? Math.round(totalRevenue / acts.length) : 0;
  const uniqueClients = new Set(acts.map((a) => a.clientName)).size;

  const filteredActs = acts.filter(
    (a) =>
      a.actNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.operatorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteAct = async (id: string, num: string) => {
    if (window.confirm(`Удалить Акт ${num}?`)) {
      await ActService.deleteAct(id);
      loadActs();
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText color="var(--primary)" size={24} /> Реестр Актов выполненных работ
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Хранение, редактирование и выгрузка актов на 13 фулфилмент-услуг
          </p>
        </div>

        <button className="btn-primary" onClick={() => setIsCreatingNew(true)} style={{ width: 'auto' }}>
          <PlusCircle size={18} /> Сформировать новый Акт
        </button>
      </div>

      {/* Top Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Сформировано Актов</span>
            <FileText size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
            {acts.length} документов
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            {totalRevenue.toLocaleString()} сом/руб. выручки
          </span>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Средний чек акта</span>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
            {avgCheck.toLocaleString()} сом/руб.
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            По всем 13 тарифам услуг
          </span>
        </div>

        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Охвачено контрагентов</span>
            <Users size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
            {uniqueClients} селлеров
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
            Получили закрывающие акты
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="input-with-icon">
          <Search className="input-icon" size={18} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по номеру акта, названию контрагента или ФИО оператора..."
          />
        </div>
      </div>

      {/* Acts Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Загрузка актов...
          </div>
        ) : filteredActs.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Акты не найдены. Нажмите «Сформировать новый Акт» для создания.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Номер и дата</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Контрагент (Заказчик)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Оператор (Сдал)</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Сумма Акта</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {filteredActs.map((act) => (
                  <tr key={act.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{act.actNumber}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Дата: {new Date(act.date).toLocaleDateString('ru-RU')}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{act.clientName}</div>
                      {act.shipmentNumber && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Поставка: {act.shipmentNumber}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      {act.operatorName}
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', fontSize: '1.05rem', color: '#10b981' }}>
                      {act.totalSum.toLocaleString()} сом/руб
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-primary"
                          onClick={() => setActiveActToEdit(act)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', width: 'auto' }}
                        >
                          <Printer size={14} /> Печать / Просмотр
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => handleDeleteAct(act.id, act.actNumber)}
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
