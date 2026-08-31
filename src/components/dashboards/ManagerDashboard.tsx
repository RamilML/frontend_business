import React, { useState, useEffect } from 'react';
import { Client } from '../../types/client';
import { Shipment, CreateShipmentDto } from '../../types/shipment';
import { Act } from '../../types/act';
import { ClientService } from '../../services/clientService';
import { ShipmentService } from '../../services/shipmentService';
import { ActService } from '../../services/actService';
import { ClientList } from '../clients/ClientList';
import { ActListScreen } from '../acts/ActListScreen';
import { ActGeneratorScreen } from '../acts/ActGeneratorScreen';
import { DocumentRegistryScreen } from '../documents/DocumentRegistryScreen';
import { NewShipmentModal } from '../scanning/NewShipmentModal';
import { EditShipmentModal } from '../scanning/EditShipmentModal';
import { BarcodeScanScreen } from '../scanning/BarcodeScanScreen';
import {
  ShieldCheck,
  Users,
  FileText,
  PlusCircle,
  Building2,
  TrendingUp,
  LayoutDashboard,
  Download,
  Truck,
  Box,
  CheckCircle2,
  Search,
  Filter,
  Eye,
  CheckCheck,
  RefreshCw,
  Sparkles,
  ExternalLink,
  DollarSign,
  PackageCheck,
  Play,
  Edit2
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'clients' | 'acts' | 'documents'>('dashboard');
  
  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Sub-screens & Modals
  const [isNewShipmentOpen, setIsNewShipmentOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
  const [activeShipmentForAct, setActiveShipmentForAct] = useState<Shipment | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [clientsData, shipmentsData, actsData] = await Promise.all([
        ClientService.getClients(),
        ShipmentService.getShipments(),
        ActService.getActs()
      ]);
      setClients(clientsData || []);
      setShipments(shipmentsData || []);
      setActs(actsData || []);
    } catch (e) {
      console.warn('Load manager data error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateShipment = async (dto: CreateShipmentDto) => {
    await ShipmentService.createShipment(dto);
    await loadAllData();
    setIsNewShipmentOpen(false);
  };

  const handleCompleteShipment = async (shipmentId: string) => {
    if (window.confirm('Завершить поставку и закрыть работу по ней?')) {
      await ShipmentService.updateShipment(shipmentId, { status: 'completed' });
      await loadAllData();
    }
  };

  // If inspecting a specific shipment in scan/packing view
  if (activeShipmentId) {
    return (
      <BarcodeScanScreen
        shipmentId={activeShipmentId}
        onBack={() => {
          setActiveShipmentId(null);
          loadAllData();
        }}
      />
    );
  }

  // If generating an Act for a specific shipment
  if (activeShipmentForAct) {
    return (
      <ActGeneratorScreen
        shipment={activeShipmentForAct}
        onBack={() => {
          setActiveShipmentForAct(null);
          loadAllData();
        }}
        onSaved={() => {
          setActiveShipmentForAct(null);
          loadAllData();
        }}
      />
    );
  }

  // Calculations
  const activeShipments = shipments.filter((s) => s.status !== 'completed');
  const readyOrShippedCount = shipments.filter((s) => s.status === 'ready_to_ship' || s.status === 'shipped').length;
  const totalRevenue = acts.reduce((acc, a) => acc + (a.totalSum || 0), 0);

  // Filtered shipments
  const filteredShipments = shipments.filter((shp) => {
    if (selectedClientFilter !== 'all' && shp.clientId !== selectedClientFilter) {
      return false;
    }
    if (selectedStatusFilter !== 'all') {
      if (selectedStatusFilter === 'active' && shp.status === 'completed') return false;
      if (selectedStatusFilter !== 'active' && shp.status !== selectedStatusFilter) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchNum = shp.shipmentNumber.toLowerCase().includes(q);
      const matchClient = shp.clientName.toLowerCase().includes(q);
      const matchWh = shp.targetWarehouses.some((w) => w.toLowerCase().includes(q));
      if (!matchNum && !matchClient && !matchWh) return false;
    }
    return true;
  });

  const handleApproveShipment = async (shipmentId: string, gateNumber: string = 'Ворота № 1', comment?: string) => {
    try {
      await ShipmentService.approveShipment(shipmentId, gateNumber, comment);
      await loadAllData();
    } catch (err: any) {
      alert(err?.message || 'Ошибка одобрения заявки');
    }
  };

  const getStatusBadge = (status: Shipment['status']) => {
    switch (status) {
      case 'draft':
        return (
          <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
            ⏳ На согласовании
          </span>
        );
      case 'approved':
        return (
          <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid #10b981' }}>
            ✅ Одобрена складом
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

  const pendingCount = shipments.filter((s) => s.status === 'draft').length;

  return (
    <div>
      {/* Sleek Sub-header Navigation Bar for Manager */}
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
          {/* Tab 1: Dashboard */}
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'dashboard' ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid transparent',
              background: activeTab === 'dashboard' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
              color: activeTab === 'dashboard' ? '#fbbf24' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'dashboard' ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.18s ease'
            }}
          >
            <LayoutDashboard size={15} color={activeTab === 'dashboard' ? '#fbbf24' : 'currentColor'} />
            <span>Сводка и Поставки</span>
            {pendingCount > 0 && (
              <span
                style={{
                  background: '#f59e0b',
                  color: '#000',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '0.05rem 0.4rem',
                  borderRadius: 999
                }}
                title={`${pendingCount} заявок ожидают согласования слота`}
              >
                {pendingCount}
              </span>
            )}
          </button>

          {/* Tab 2: Clients */}
          <button
            type="button"
            onClick={() => setActiveTab('clients')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'clients' ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'clients' ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
              color: activeTab === 'clients' ? '#c4b5fd' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'clients' ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.18s ease'
            }}
          >
            <Building2 size={15} color={activeTab === 'clients' ? '#c4b5fd' : 'currentColor'} />
            <span>База Клиентов</span>
            <span
              style={{
                background: activeTab === 'clients' ? 'rgba(139, 92, 246, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                color: activeTab === 'clients' ? '#c4b5fd' : 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.05rem 0.4rem',
                borderRadius: 999
              }}
            >
              {clients.length}
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
            <span>Акты и Расчёты</span>
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

          {/* Tab 4: Export Center */}
          <button
            type="button"
            onClick={() => setActiveTab('documents')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'documents' ? '1px solid rgba(59, 130, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'documents' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
              color: activeTab === 'documents' ? '#93c5fd' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'documents' ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.18s ease'
            }}
          >
            <Download size={15} color={activeTab === 'documents' ? '#93c5fd' : 'currentColor'} />
            <span>Экспорт и Отчёты</span>
          </button>
        </div>

        {/* Quick Right-side Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Активных поставок: <b style={{ color: '#fbbf24' }}>{activeShipments.length}</b>
          </span>
        </div>
      </div>

      {activeTab === 'clients' ? (
        <ClientList onSelectClientForShipment={() => setIsNewShipmentOpen(true)} onNavigateTab={setActiveTab} />
      ) : activeTab === 'acts' ? (
        <ActListScreen onNavigateTab={setActiveTab} />
      ) : activeTab === 'documents' ? (
        <DocumentRegistryScreen />
      ) : (
        <div className="dashboard-container">
          {/* Header Bar */}
          <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <ShieldCheck color="var(--primary)" size={24} /> Панель Менеджера Склада
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Мониторинг приёмки складом в реальном времени, управление поставщиками и расчёт стоимости
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="btn-secondary" onClick={loadAllData} title="Обновить данные">
                <RefreshCw size={16} /> Обновить
              </button>
              <button 
                className="btn-primary" 
                onClick={() => setIsNewShipmentOpen(true)}
                style={{ width: 'auto' }}
              >
                <PlusCircle size={16} /> Создать Поставку
              </button>
            </div>
          </div>

          {/* Dynamic Stats Grid with Tab Links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ cursor: 'pointer', marginBottom: 0 }} onClick={() => setActiveTab('clients')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Активных поставщиков</span>
                <Users size={20} color="#3b82f6" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
                {clients.length} контрагентов
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>Открыть базу клиентов →</span>
            </div>

            <div
              className="card"
              style={{ cursor: 'pointer', marginBottom: 0 }}
              onClick={() => setSelectedStatusFilter('active')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Поставок в работе склада</span>
                <TrendingUp size={20} color="var(--primary)" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
                {activeShipments.length} в работе
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                {readyOrShippedCount > 0 ? `${readyOrShippedCount} готовы к расчету →` : 'Показать в работе ↓'}
              </span>
            </div>

            <div className="card" style={{ cursor: 'pointer', marginBottom: 0 }} onClick={() => setActiveTab('acts')}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                <span>Сформировано Актов</span>
                <FileText size={20} color="#10b981" />
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
                {acts.length} актов
              </div>
              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
                {totalRevenue.toLocaleString()} сом/руб. выручки →
              </span>
            </div>
          </div>

          {/* Pending Approval Shipments Alert Block */}
          {shipments.filter((s) => s.status === 'draft').length > 0 && (
            <div
              className="card"
              style={{
                border: '1px solid rgba(245, 158, 11, 0.4)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(15, 23, 42, 0.9))',
                marginBottom: '1.5rem',
                padding: '1.25rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🔔 Заявки селлеров на согласование ввоза ({shipments.filter((s) => s.status === 'draft').length})
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Проверьте емкость склада и подтвердите слот приёмки
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
                {shipments.filter((s) => s.status === 'draft').map((shp) => {
                  const plannedUnits = shp.items.reduce((sum, it) => sum + it.plannedQuantity, 0);

                  return (
                    <div
                      key={shp.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.7)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: 'var(--radius-md)',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                            {shp.clientName}
                          </span>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--primary)' }}>
                            {shp.shipmentNumber}
                          </span>
                        </div>

                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                          <div>📅 Желаемая дата привоза: <b style={{ color: '#fbbf24' }}>{shp.plannedDeliveryDate ? new Date(shp.plannedDeliveryDate).toLocaleDateString('ru-RU') : 'Ближайшая'}</b></div>
                          <div>📦 Плановый объем: <b>{shp.items.length} позиций ({plannedUnits} шт.)</b></div>
                          <div>🚚 Целевые склады WB: <b>{shp.targetWarehouses.join(', ')}</b></div>
                          {shp.driverInfo && <div>🚛 Перевозчик/Авто: <b>{shp.driverInfo}</b></div>}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <button
                          type="button"
                          className="btn-primary"
                          onClick={() => handleApproveShipment(shp.id, 'Ворота № 1')}
                          style={{ flex: 1, padding: '0.4rem', fontSize: '0.8rem', background: '#10b981', borderColor: '#10b981' }}
                        >
                          <CheckCircle2 size={14} /> Одобрить (Ворота №1)
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleApproveShipment(shp.id, 'Ворота № 2')}
                          style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                        >
                          Ворота №2
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Real-Time Shipments Registry Section */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div>
                <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PackageCheck size={18} color="var(--primary)" /> Реестр поставок поставщиков (План / Факт / Статус)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '0.2rem 0 0 0' }}>
                  Данные автоматически обновляются по мере сканирования и упаковки операторами склада
                </p>
              </div>

              {/* Filters & Search Toolbar */}
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <div className="input-with-icon" style={{ minWidth: 200 }}>
                  <Search className="input-icon" size={15} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Поиск поставки..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '0.4rem 0.6rem 0.4rem 2.2rem', fontSize: '0.85rem' }}
                  />
                </div>

                {/* Client Filter */}
                <select
                  className="form-input"
                  value={selectedClientFilter}
                  onChange={(e) => setSelectedClientFilter(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: 'auto' }}
                >
                  <option value="all">Все поставщики ({clients.length})</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {/* Status Filter */}
                <select
                  className="form-input"
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem', width: 'auto' }}
                >
                  <option value="all">Все статусы</option>
                  <option value="active">Только в работе</option>
                  <option value="receiving">🟡 В приёмке</option>
                  <option value="packing">📦 В упаковке</option>
                  <option value="ready_to_ship">🟢 Готова к отгрузке</option>
                  <option value="shipped">🚚 Отгружена</option>
                  <option value="completed">🏁 Завершена</option>
                </select>
              </div>
            </div>

            {/* Shipments Table */}
            {isLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Загрузка сводных данных по поставкам...
              </div>
            ) : filteredShipments.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                По заданным фильтрам поставок не найдено. Нажмите «Создать Поставку», чтобы открыть приёмку.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.86rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.6)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>Номер поставки</th>
                      <th style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>Поставщик (Селлер)</th>
                      <th style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>Склады WB</th>
                      <th style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>Прогресс склада</th>
                      <th style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>Коробки</th>
                      <th style={{ padding: '0.65rem 0.75rem', whiteSpace: 'nowrap' }}>Статус</th>
                      <th style={{ padding: '0.65rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.map((shp) => {
                      const totalPlanned = shp.items.reduce((acc, it) => acc + it.plannedQuantity, 0);
                      const totalScanned = shp.items.reduce((acc, it) => acc + it.scannedQuantity, 0);
                      const percent = totalPlanned > 0 ? Math.round((totalScanned / totalPlanned) * 100) : 0;
                      const sealedBoxes = shp.boxes.filter((b) => b.isPacked).length;

                      return (
                        <tr key={shp.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                          {/* Shipment Number */}
                          <td style={{ padding: '0.75rem 0.75rem', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--primary)', fontSize: '0.92rem' }}>
                              {shp.shipmentNumber}
                            </span>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginTop: 2 }}>
                              создана: {new Date(shp.createdAt).toLocaleDateString('ru-RU')}
                            </div>
                          </td>

                          {/* Client Name */}
                          <td style={{ padding: '0.75rem 0.75rem', minWidth: 150 }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}>
                              <Building2 size={14} color="#8b5cf6" /> {shp.clientName}
                            </div>
                            {shp.driverInfo && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2, whiteSpace: 'nowrap' }}>
                                🚛 {shp.driverInfo}
                              </div>
                            )}
                            {shp.operatorName && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                Оператор: {shp.operatorName}
                              </div>
                            )}
                          </td>

                          {/* WB Warehouses */}
                          <td style={{ padding: '0.75rem 0.75rem', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                              {shp.targetWarehouses.map((wh) => (
                                <span key={wh} style={{ fontSize: '0.72rem', background: 'rgba(30, 41, 59, 0.8)', border: '1px solid var(--border)', padding: '0.1rem 0.35rem', borderRadius: 4, whiteSpace: 'nowrap' }}>
                                  {wh}
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Progress */}
                          <td style={{ padding: '0.75rem 0.75rem', minWidth: 140 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: '0.25rem', whiteSpace: 'nowrap' }}>
                              <span>Принято: <b>{totalScanned}/{totalPlanned}</b></span>
                              <b style={{ color: percent >= 100 ? '#10b981' : 'var(--primary)' }}>{percent}%</b>
                            </div>
                            <div style={{ height: 5, background: 'rgba(255, 255, 255, 0.1)', borderRadius: 999 }}>
                              <div
                                style={{
                                  width: `${Math.min(100, percent)}%`,
                                  height: '100%',
                                  background: percent >= 100 ? '#10b981' : 'var(--primary)',
                                  borderRadius: 999
                                }}
                              />
                            </div>
                          </td>

                          {/* Boxes */}
                          <td style={{ padding: '0.75rem 0.75rem', whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: 600 }}>{shp.boxes.length} шт.</span>
                            {shp.boxes.length > 0 && (
                              <div style={{ fontSize: '0.72rem', color: sealedBoxes === shp.boxes.length ? '#34d399' : 'var(--text-muted)' }}>
                                Запечатано: {sealedBoxes}/{shp.boxes.length}
                              </div>
                            )}
                          </td>

                          {/* Status */}
                          <td style={{ padding: '0.75rem 0.75rem', whiteSpace: 'nowrap' }}>
                            {getStatusBadge(shp.status)}
                            {shp.status === 'approved' && (
                              <div style={{ fontSize: '0.72rem', color: '#34d399', marginTop: 3 }}>
                                {shp.gateNumber || 'Ворота № 1'}
                                {shp.plannedDeliveryDate && ` • ${new Date(shp.plannedDeliveryDate).toLocaleDateString('ru-RU')}`}
                              </div>
                            )}
                            {shp.status === 'draft' && shp.plannedDeliveryDate && (
                              <div style={{ fontSize: '0.72rem', color: '#fbbf24', marginTop: 3 }}>
                                привоз: {new Date(shp.plannedDeliveryDate).toLocaleDateString('ru-RU')}
                              </div>
                            )}
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '0.75rem 0.75rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                              {/* Conditional Primary Action based on Lifecycle */}
                              {shp.status === 'draft' && (
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => handleApproveShipment(shp.id, 'Ворота № 1')}
                                  style={{
                                    padding: '0.32rem 0.6rem',
                                    fontSize: '0.78rem',
                                    background: '#10b981',
                                    borderColor: '#10b981',
                                    color: '#fff',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="Одобрить заявку клиента и подтвердить слот"
                                >
                                  <CheckCircle2 size={13} /> Одобрить
                                </button>
                              )}

                              {shp.status === 'approved' && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => setActiveShipmentId(shp.id)}
                                  style={{ padding: '0.32rem 0.6rem', fontSize: '0.78rem', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8', whiteSpace: 'nowrap' }}
                                  title="Просмотреть план товаров поставки"
                                >
                                  <Eye size={13} /> План
                                </button>
                              )}

                              {(shp.status === 'receiving' || shp.status === 'packing') && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => setActiveShipmentId(shp.id)}
                                  style={{ padding: '0.32rem 0.6rem', fontSize: '0.78rem', borderColor: 'var(--primary)', color: 'var(--primary)', whiteSpace: 'nowrap' }}
                                  title="Открыть экран приёмки и скан-контроля"
                                >
                                  <PackageCheck size={13} /> Скан
                                </button>
                              )}

                              {(shp.status === 'ready_to_ship' || shp.status === 'shipped') && (
                                <button
                                  type="button"
                                  className="btn-primary"
                                  onClick={() => setActiveShipmentForAct(shp)}
                                  style={{
                                    padding: '0.32rem 0.65rem',
                                    fontSize: '0.78rem',
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    borderColor: '#10b981',
                                    color: '#fff',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title="Сформировать Акт выполненных работ на основе принятых товаров и коробок"
                                >
                                  <FileText size={13} /> Сформировать Акт
                                </button>
                              )}

                              {shp.status === 'completed' && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => setActiveShipmentForAct(shp)}
                                  style={{ padding: '0.32rem 0.6rem', fontSize: '0.78rem', borderColor: '#3b82f6', color: '#3b82f6', whiteSpace: 'nowrap' }}
                                  title="Просмотр выставленного Акта"
                                >
                                  <FileText size={13} /> Акт
                                </button>
                              )}

                              {/* Secondary icon buttons */}
                              {shp.status !== 'approved' && shp.status !== 'draft' && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => setActiveShipmentId(shp.id)}
                                  style={{ padding: '0.32rem 0.5rem', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                                  title="Открыть поставку (просмотр сканера и коробок)"
                                >
                                  <Eye size={13} />
                                </button>
                              )}

                              {/* Edit */}
                              {shp.status !== 'shipped' && shp.status !== 'completed' && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => setEditingShipment(shp)}
                                  style={{ padding: '0.32rem 0.5rem', fontSize: '0.78rem', color: '#38bdf8', whiteSpace: 'nowrap' }}
                                  title="Редактировать поставку"
                                >
                                  <Edit2 size={13} />
                                </button>
                              )}

                              {/* Complete button for shipped */}
                              {shp.status === 'shipped' && (
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => handleCompleteShipment(shp.id)}
                                  style={{ padding: '0.32rem 0.5rem', fontSize: '0.78rem', color: '#34d399', whiteSpace: 'nowrap' }}
                                  title="Закрыть и завершить поставку"
                                >
                                  <CheckCheck size={13} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Shipment Wizard Modal */}
      <NewShipmentModal
        isOpen={isNewShipmentOpen}
        onClose={() => setIsNewShipmentOpen(false)}
        onCreateShipment={handleCreateShipment}
      />

      {/* Edit Shipment Modal */}
      <EditShipmentModal
        isOpen={!!editingShipment}
        shipment={editingShipment}
        onClose={() => setEditingShipment(null)}
        onSave={async (updates) => {
          if (editingShipment) {
            await ShipmentService.updateShipment(editingShipment.id, updates);
            await loadAllData();
            setEditingShipment(null);
          }
        }}
      />
    </div>
  );
};

