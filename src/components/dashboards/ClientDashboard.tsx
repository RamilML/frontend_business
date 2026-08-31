import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Shipment, PackingBox } from '../../types/shipment';
import { Act } from '../../types/act';
import { ShipmentService } from '../../services/shipmentService';
import { ActService } from '../../services/actService';
import { ExportUtils } from '../../utils/exportUtils';
import { PackingSlipPrintModal } from '../packing/PackingSlipPrintModal';
import { NewShipmentModal } from '../scanning/NewShipmentModal';
import { CreateShipmentDto } from '../../types/shipment';
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
  CheckCircle2,
  PackagePlus,
  Plus,
  RefreshCw,
  PlusCircle
} from 'lucide-react';

export const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'boxes' | 'acts'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [printShipment, setPrintShipment] = useState<Shipment | null>(null);
  const [isCreateShipmentOpen, setIsCreateShipmentOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadClientData = async () => {
    setIsLoading(true);
    try {
      const [shipmentsData, actsData] = await Promise.all([
        ShipmentService.getShipments(),
        ActService.getActs()
      ]);
      const myShipments = user?.clientId
        ? shipmentsData.filter((s) => s.clientId === user.clientId)
        : shipmentsData;
      const myActs = user?.clientId
        ? actsData.filter((a) => a.clientId === user.clientId)
        : actsData;

      setShipments(myShipments.length > 0 ? myShipments : shipmentsData);
      setActs(myActs.length > 0 ? myActs : actsData);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClientData();
  }, [user]);

  const handleCreateShipment = async (dto: CreateShipmentDto) => {
    await ShipmentService.createShipment(dto);
    await loadClientData();
    setIsCreateShipmentOpen(false);
  };

  const totalItemsOnWb = shipments.reduce((acc, s) => {
    return acc + s.items.reduce((sum, item) => sum + item.scannedQuantity, 0);
  }, 0);

  const totalBoxes = shipments.reduce((acc, s) => acc + s.boxes.length, 0);

  const getStatusBadge = (status: Shipment['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            ⏳ На согласовании слота
          </span>
        );
      case 'approved':
        return (
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981' }}>
            ✅ Слот одобрен складом
          </span>
        );
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
    <div>
      {/* Sleek Sub-header Navigation Bar for Client */}
      <div 
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.6rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          overflowX: 'auto',
          position: 'sticky',
          top: 64,
          zIndex: 40
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', minWidth: 'max-content' }}>
          {/* Tab 1: Overview */}
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'overview' ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'overview' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: activeTab === 'overview' ? '#c4b5fd' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'overview' ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.18s ease'
            }}
          >
            <Package size={15} color={activeTab === 'overview' ? '#c4b5fd' : 'currentColor'} />
            <span>Поставки селлера</span>
            <span
              style={{
                background: activeTab === 'overview' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                color: activeTab === 'overview' ? '#c4b5fd' : 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.05rem 0.4rem',
                borderRadius: 999
              }}
            >
              {shipments.length}
            </span>
          </button>

          {/* Tab 2: Boxes */}
          <button
            type="button"
            onClick={() => setActiveTab('boxes')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'boxes' ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'boxes' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: activeTab === 'boxes' ? '#c4b5fd' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'boxes' ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.18s ease'
            }}
          >
            <Box size={15} color={activeTab === 'boxes' ? '#c4b5fd' : 'currentColor'} />
            <span>Состав Коробок</span>
            <span
              style={{
                background: activeTab === 'boxes' ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 255, 255, 0.08)',
                color: activeTab === 'boxes' ? '#c4b5fd' : 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.05rem 0.4rem',
                borderRadius: 999
              }}
            >
              {totalBoxes}
            </span>
          </button>

          {/* Tab 3: Acts */}
          <button
            type="button"
            onClick={() => setActiveTab('acts')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'acts' ? '1px solid rgba(16, 185, 129, 0.45)' : '1px solid transparent',
              background: activeTab === 'acts' ? 'rgba(16, 185, 129, 0.12)' : 'transparent',
              color: activeTab === 'acts' ? '#34d399' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'acts' ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.18s ease'
            }}
          >
            <FileText size={15} color={activeTab === 'acts' ? '#34d399' : 'currentColor'} />
            <span>Ваши Акты</span>
            <span
              style={{
                background: activeTab === 'acts' ? 'rgba(16, 185, 129, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                color: activeTab === 'acts' ? '#34d399' : 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.05rem 0.4rem',
                borderRadius: 999
              }}
            >
              {acts.length}
            </span>
          </button>
        </div>

        {/* Quick Right-side Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Поставок селлера: <b style={{ color: '#c4b5fd' }}>{shipments.length}</b>
          </span>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Client Header */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Building2 color="#8b5cf6" size={24} /> Личный кабинет Клиента (Селлера WB)
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Контрагент: <b style={{ color: '#c4b5fd' }}>{user?.clientName || 'ООО "Модный Гардероб" (ИНН 7701234567)'}</b>
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-secondary" onClick={loadClientData} title="Обновить данные">
              <RefreshCw size={16} /> Обновить
            </button>
            <button 
              className="btn-primary" 
              onClick={() => setIsCreateShipmentOpen(true)}
              style={{
                width: 'auto',
                background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                color: '#fff',
                boxShadow: '0 4px 15px rgba(139, 92, 246, 0.35)',
                border: 'none'
              }}
            >
              <PlusCircle size={16} /> Создать заявку на поставку
            </button>
          </div>
        </div>

        {/* Top Client Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="card" style={{ cursor: 'pointer', marginBottom: 0 }} onClick={() => setActiveTab('overview')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Ваших поставок</span>
              <Package size={20} color="#8b5cf6" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
              {shipments.length} в работе
            </div>
            <span style={{ fontSize: '0.75rem', color: '#c4b5fd' }}>Смотреть список поставок ↓</span>
          </div>

          <div className="card" style={{ cursor: 'pointer', marginBottom: 0 }} onClick={() => setActiveTab('boxes')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Товаров на складе</span>
              <Truck size={20} color="#10b981" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
              {totalItemsOnWb} шт.
            </div>
            <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>В {totalBoxes} запечатанных коробках →</span>
          </div>

          <div className="card" style={{ cursor: 'pointer', marginBottom: 0 }} onClick={() => setActiveTab('acts')}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
              <span>Готовых Актов</span>
              <FileText size={20} color="#3b82f6" />
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
              {acts.length} документов
            </div>
            <span style={{ fontSize: '0.75rem', color: '#38bdf8' }}>Скачать Excel / PDF →</span>
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

                  {/* Slotting status indicator */}
                  {shp.status === 'draft' && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.65rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#fbbf24' }}>
                      ⏳ Заявка ожидает согласования слота складом на <b>{shp.plannedDeliveryDate ? new Date(shp.plannedDeliveryDate).toLocaleDateString('ru-RU') : 'ближайшую дату'}</b>. Ожидайте подтверждения ворот.
                    </div>
                  )}

                  {shp.status === 'approved' && (
                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--radius-sm)', padding: '0.5rem 0.65rem', marginBottom: '0.75rem', fontSize: '0.8rem', color: '#34d399' }}>
                      ✅ Слот одобрен! Привоз: <b>{shp.plannedDeliveryDate ? new Date(shp.plannedDeliveryDate).toLocaleDateString('ru-RU') : 'согласован'}</b>. Назначены: <b>{shp.gateNumber || 'Ворота № 1'}</b>. Можно отправлять машину!
                    </div>
                  )}

                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Truck size={14} color="#93c5fd" /> Склады WB: <b>{shp.targetWarehouses.join(', ')}</b>
                    </div>
                    {shp.driverInfo && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <span>🚛 Авто:</span> <b>{shp.driverInfo}</b>
                      </div>
                    )}
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
          <div style={{ marginBottom: '1.25rem' }}>
            <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Box size={18} color="#8b5cf6" /> Декомпозиция коробок по складам назначения Wildberries
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '0.25rem 0 0 0' }}>
              Точный поштучный состав каждой коробки, штрихкоды и целевой склад маркетплейса
            </p>
          </div>

          {shipments.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Нет активных поставок с коробками.
            </div>
          ) : (
            shipments.map((shp) => {
              const totalItemsInAllBoxes = shp.boxes.reduce(
                (sum, b) => sum + b.items.reduce((s, it) => s + it.quantity, 0),
                0
              );

              return (
                <div key={shp.id} style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                        Поставка {shp.shipmentNumber}
                      </span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: '0.75rem' }}>
                        Склады WB: <b>{shp.targetWarehouses.join(', ')}</b> • Коробок: <b>{shp.boxes.length} шт.</b> • Упаковано: <b style={{ color: '#10b981' }}>{totalItemsInAllBoxes} шт.</b>
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setPrintShipment(shp)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                      >
                        <Printer size={13} /> Печать упаковочного листа
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => ExportUtils.exportPackingToExcel(shp)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', borderColor: '#10b981', color: '#10b981' }}
                      >
                        <FileSpreadsheet size={13} /> Скачать Excel
                      </button>
                    </div>
                  </div>

                  {shp.boxes.length === 0 ? (
                    <div style={{ padding: '1.5rem', background: 'rgba(15, 23, 42, 0.4)', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      Оператор склада ещё не создал коробки для этой поставки.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '0.85rem' }}>
                      {shp.boxes.map((box) => {
                        const totalInBox = box.items.reduce((acc, it) => acc + it.quantity, 0);

                        return (
                          <div
                            key={box.boxNumber}
                            style={{
                              background: 'rgba(15, 23, 42, 0.7)',
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              padding: '1rem',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}
                          >
                            <div>
                              {/* Box Header */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                  <Box size={16} color="var(--primary)" /> Коробка №{box.boxNumber}
                                </div>
                                <span style={{ fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '0.15rem 0.45rem', borderRadius: 4 }}>
                                  Склад: {box.targetWarehouse}
                                </span>
                              </div>

                              {/* Seal Status & Quantity */}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.07)' }}>
                                <span>
                                  {box.isPacked ? (
                                    <b style={{ color: '#10b981' }}>🔒 Запечатана</b>
                                  ) : (
                                    <span style={{ color: '#f59e0b' }}>🔓 В процессе сборки</span>
                                  )}
                                </span>
                                <span>В коробке: <b style={{ color: totalInBox > 0 ? '#10b981' : 'var(--text-muted)' }}>{totalInBox} шт.</b></span>
                              </div>

                              {/* Box Items */}
                              {box.items.length === 0 ? (
                                <div style={{ padding: '1rem 0.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic' }}>
                                  📦 Коробка пуста (ожидает укладки товаров оператором)
                                </div>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                  {box.items.map((it, idx) => (
                                    <div
                                      key={idx}
                                      style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        fontSize: '0.82rem',
                                        background: 'rgba(30, 41, 59, 0.4)',
                                        padding: '0.4rem 0.6rem',
                                        borderRadius: 6
                                      }}
                                    >
                                      <div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{it.title}</div>
                                        {it.barcode && (
                                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                                            ШК: {it.barcode}
                                          </div>
                                        )}
                                      </div>
                                      <div style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                                        {it.quantity} шт.
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })
          )}
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

      {/* Packing Slip Print Modal */}
      {printShipment && (
        <PackingSlipPrintModal
          isOpen={!!printShipment}
          shipment={printShipment}
          onClose={() => setPrintShipment(null)}
        />
      )}

      {/* New Shipment Modal for Client */}
      {isCreateShipmentOpen && (
        <NewShipmentModal
          isOpen={isCreateShipmentOpen}
          onClose={() => setIsCreateShipmentOpen(false)}
          onCreateShipment={handleCreateShipment}
          forcedClientId={user?.clientId || 'cl_9921'}
          forcedClientName={user?.clientName || 'ООО "Модный Гардероб"'}
          isClientMode={true}
        />
      )}
      </div>
    </div>
  );
};
