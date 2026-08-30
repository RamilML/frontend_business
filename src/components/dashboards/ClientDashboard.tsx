import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shipment, PackingBox } from '../../types/shipment';
import { Act } from '../../types/act';
import { ShipmentService } from '../../services/shipmentService';
import { ActService } from '../../services/actService';
import { ExportUtils } from '../../utils/exportUtils';
import {
  Building2,
  Package,
  FileText,
  Download,
  Truck,
  Box,
  Layers,
  FileSpreadsheet,
  FileCode,
  Printer,
  Search,
  CheckCircle2
} from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'boxes' | 'acts'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([ShipmentService.getShipments(), ActService.getActs()]).then(([shipmentsData, actsData]) => {
      // Filter only current client data if client role
      const clientName = user?.clientName || 'ООО "Модный Гардероб"';
      const myShipments = shipmentsData.filter((s) => s.clientName === clientName || !user?.clientName);
      const myActs = actsData.filter((a) => a.clientName === clientName || !user?.clientName);

      setShipments(myShipments.length > 0 ? myShipments : shipmentsData);
      setActs(myActs.length > 0 ? myActs : actsData);
      setIsLoading(false);
    });
  }, [user]);

  const totalItemsOnWb = shipments.reduce((acc, s) => {
    return acc + s.items.reduce((sum, item) => sum + item.scannedQuantity, 0);
  }, 0);

  const totalBoxes = shipments.reduce((acc, s) => acc + s.boxes.length, 0);

  const getStatusBadge = (status: Shipment['status']) => {
    switch (status) {
      case 'draft':
        return <span className="badge badge-manager" style={{ opacity: 0.85 }}>📝 Черновик</span>;
      case 'receiving':
        return <span className="badge badge-operator">🟡 В приёмке</span>;
      case 'packing':
        return <span className="badge badge-manager">📦 В упаковке</span>;
      case 'ready_to_ship':
        return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981' }}>🟢 Готова к отгрузке</span>;
      case 'shipped':
        return <span className="badge badge-client">🚚 Отгружена</span>;
      case 'completed':
        return <span className="badge badge-admin">🏁 Завершена</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Client Header */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Building2 color="#8b5cf6" size={24} /> Личный кабинет Клиента (Селлера WB)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Контрагент: <b style={{ color: 'var(--text-main)' }}>{user?.clientName || 'ООО "Модный Гардероб" (ИНН 7701234567)'}</b>
          </p>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn-secondary ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Package size={15} /> Поставки ({shipments.length})
          </button>

          <button
            className={`btn-secondary ${activeTab === 'boxes' ? 'active' : ''}`}
            onClick={() => setActiveTab('boxes')}
          >
            <Box size={15} /> Состав Коробок
          </button>

          <button
            className={`btn-secondary ${activeTab === 'acts' ? 'active' : ''}`}
            onClick={() => setActiveTab('acts')}
          >
            <FileText size={15} /> Ваши Акты ({acts.length})
          </button>
        </div>
      </div>

      {/* Top Client Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0, cursor: 'pointer' }} onClick={() => setActiveTab('overview')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Ваших поставок</span>
            <Package size={20} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.4rem' }}>{shipments.length} поставки</div>
        </div>

        <div className="card" style={{ marginBottom: 0, cursor: 'pointer' }} onClick={() => setActiveTab('boxes')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Товаров отгружено</span>
            <Truck size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.4rem' }}>{totalItemsOnWb} шт. в {totalBoxes} коробках</div>
        </div>

        <div className="card" style={{ marginBottom: 0, cursor: 'pointer' }} onClick={() => setActiveTab('acts')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Готовых Актов</span>
            <FileText size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.4rem' }}>{acts.length} документа</div>
          <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Скачать Excel / PDF →</span>
        </div>
      </div>

      {/* TAB 1: Shipments Overview */}
      {activeTab === 'overview' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
            Ваши поставки на Wildberries
          </div>

          <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {shipments.map((shp) => {
              const scanned = shp.items.reduce((a, c) => a + c.scannedQuantity, 0);
              const planned = shp.items.reduce((a, c) => a + c.plannedQuantity, 0);
              const pct = planned > 0 ? Math.round((scanned / planned) * 100) : 0;

              return (
                <div
                  key={shp.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                      {shp.shipmentNumber}
                    </span>
                    {getStatusBadge(shp.status)}
                  </div>

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Truck size={14} color="#93c5fd" /> Склады WB: <b>{shp.targetWarehouses.join(', ')}</b>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                      <Box size={14} color="#10b981" /> Упаковано коробок: <b>{shp.boxes.length} шт.</b>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span>Сборка поставки:</span>
                      <b style={{ color: pct >= 100 ? '#10b981' : 'var(--primary)' }}>
                        {scanned} / {planned} шт. ({pct}%)
                      </b>
                    </div>
                    <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 999, overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, pct))}%`,
                          height: '100%',
                          background: pct >= 100 ? '#10b981' : '#8b5cf6',
                          borderRadius: 999,
                          transition: 'width 0.3s ease'
                        }}
                      />
                    </div>
                  </div>

                  <button
                    className="btn-secondary"
                    onClick={() => ExportUtils.exportPackingToExcel(shp)}
                    style={{ width: '100%', borderColor: '#10b981', color: '#10b981', fontSize: '0.8rem' }}
                  >
                    <FileSpreadsheet size={14} /> Скачать ведомость коробок Excel
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Boxes & WB Warehouses breakdown */}
      {activeTab === 'boxes' && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 className="card-title">
            <Box size={18} color="#8b5cf6" /> Декомпозиция коробок по складам назначения Wildberries
          </h3>

          {shipments.map((shp) => (
            <div key={shp.id} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>
                Поставка {shp.shipmentNumber} (Коробок: {shp.boxes.length} шт.)
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.75rem' }}>
                {shp.boxes.map((box) => (
                  <div
                    key={box.boxNumber}
                    style={{
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.35rem' }}>
                      <span>Коробка №{box.boxNumber}</span>
                      <span style={{ color: '#93c5fd' }}>Склад: {box.targetWarehouse}</span>
                    </div>

                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {box.items.map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.2rem' }}>
                          <span>{it.title}</span>
                          <b>{it.quantity} шт.</b>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: Client Acts & Downloads */}
      {activeTab === 'acts' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 600 }}>
            Ваши Акты выполненных работ (п. 11 ТЗ)
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Номер и дата</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Исполнитель</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Сумма к оплате</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Выгрузка</th>
                </tr>
              </thead>
              <tbody>
                {acts.map((act) => (
                  <tr key={act.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{act.actNumber}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        от {new Date(act.date).toLocaleDateString('ru-RU')}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem' }}>
                      ОсОО "КРЕАТИВ ВЕЙВ БИШКЕК"
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981', fontSize: '1.05rem' }}>
                      {act.totalSum.toLocaleString()} сом/руб.
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => ExportUtils.exportActToExcel(act)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderColor: '#10b981', color: '#10b981' }}
                        >
                          <FileSpreadsheet size={14} /> Excel
                        </button>

                        <button
                          className="btn-secondary"
                          onClick={() => ExportUtils.exportActToWord(act)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderColor: '#3b82f6', color: '#3b82f6' }}
                        >
                          <FileCode size={14} /> Word
                        </button>

                        <button
                          className="btn-primary"
                          onClick={() => window.print()}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', width: 'auto' }}
                        >
                          <Printer size={14} /> PDF / Печать
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
