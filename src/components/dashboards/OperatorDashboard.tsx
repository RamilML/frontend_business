import React, { useState, useEffect } from 'react';
import { Shipment, CreateShipmentDto } from '../../types/shipment';
import { ShipmentService } from '../../services/shipmentService';
import { BarcodeScanScreen } from '../scanning/BarcodeScanScreen';
import { NewShipmentModal } from '../scanning/NewShipmentModal';
import { EditShipmentModal } from '../scanning/EditShipmentModal';
import {
  PackageCheck,
  Barcode,
  Truck,
  PlusCircle,
  Play,
  Building2,
  Edit2,
  Trash2,
  Box,
  CheckCircle2,
  Lock
} from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
  const [isNewShipmentOpen, setIsNewShipmentOpen] = useState(false);
  const [editingShipment, setEditingShipment] = useState<Shipment | null>(null);
  const [deletingShipment, setDeletingShipment] = useState<Shipment | null>(null);
  const [shippingShipmentId, setShippingShipmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadShipments = async () => {
    setIsLoading(true);
    try {
      const data = await ShipmentService.getShipments();
      setShipments(data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShipments();
  }, []);

  const handleCreateShipment = async (dto: CreateShipmentDto) => {
    const created = await ShipmentService.createShipment(dto);
    loadShipments();
    setActiveShipmentId(created.id);
  };

  const handleSaveShipmentEdits = async (updates: Partial<Shipment>) => {
    if (!editingShipment) return;
    const sid = editingShipment.id;

    // Optimistic UI update
    setShipments((prev) =>
      prev.map((s) => (s.id === sid ? { ...s, ...updates } : s))
    );

    try {
      await ShipmentService.updateShipment(sid, updates);
      loadShipments();
    } catch (err) {
      console.error('Update shipment error:', err);
    }
  };

  const handleConfirmDeleteShipment = async () => {
    if (!deletingShipment) return;
    const sid = deletingShipment.id;

    // Optimistic UI delete
    setShipments((prev) => prev.filter((s) => s.id !== sid));
    setDeletingShipment(null);

    try {
      await ShipmentService.deleteShipment(sid);
      loadShipments();
    } catch (err) {
      console.error('Delete shipment error:', err);
    }
  };

  const handleShipToDriver = async (shipmentId: string) => {
    const shp = shipments.find((s) => s.id === shipmentId);
    if (shp) {
      const shpScanned = shp.items.reduce((acc, it) => acc + it.scannedQuantity, 0);
      const shpPacked = shp.boxes.reduce((acc, b) => acc + b.items.reduce((s, bi) => s + bi.quantity, 0), 0);
      const shpAllSealed = shp.boxes.length > 0 && shp.boxes.every(b => b.isPacked && b.items.length > 0);
      if (shpScanned === 0 || shpScanned !== shpPacked || !shpAllSealed) {
        alert('Нельзя отгрузить: убедитесь, что все принятые товары уложены в коробки и все коробки запечатаны.');
        setActiveShipmentId(shipmentId);
        return;
      }
    }

    setShippingShipmentId(shipmentId);
    try {
      await ShipmentService.shipShipment(shipmentId);
      await loadShipments();
    } catch (err: any) {
      alert(err?.message || 'Ошибка отгрузки водителю');
      console.error('Ship shipment error:', err);
    } finally {
      setShippingShipmentId(null);
    }
  };

  const handleStartReceiving = async (shipmentId: string) => {
    try {
      await ShipmentService.startReceivingShipment(shipmentId);
      await loadShipments();
      setActiveShipmentId(shipmentId);
    } catch (err: any) {
      alert(err?.message || 'Ошибка запуска приёмки');
    }
  };

  if (activeShipmentId) {
    return (
      <BarcodeScanScreen
        shipmentId={activeShipmentId}
        onBack={() => {
          setActiveShipmentId(null);
          loadShipments();
        }}
      />
    );
  }

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
        return <span className="badge badge-operator">{status}</span>;
    }
  };

  return (
    <div className="dashboard-container">
      {/* Header Bar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <PackageCheck color="#10b981" size={24} /> Рабочее место Оператора (ТСД)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Очередь поставок от селлеров на приёмку сканером, упаковку в коробки и отгрузку
          </p>
        </div>

        <button className="btn-secondary" onClick={() => setIsNewShipmentOpen(true)} style={{ width: 'auto', fontSize: '0.85rem' }}>
          <PlusCircle size={15} /> Приёмка самопривоза (без заявки)
        </button>
      </div>

      {/* Active Shipments Table / Cards */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">
          <Barcode size={18} color="var(--primary)" /> Активные поставки в приёмке
        </h3>

        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Загрузка списка поставок...
          </div>
        ) : shipments.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Нет активных поставок. Нажмите «Новая поставка», чтобы начать приёмку.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
            {shipments.map((shp) => {
              const totalPlanned = shp.items.reduce((acc, it) => acc + it.plannedQuantity, 0);
              const totalScanned = shp.items.reduce((acc, it) => acc + it.scannedQuantity, 0);
              const percent = totalPlanned > 0 ? Math.round((totalScanned / totalPlanned) * 100) : 0;

              return (
                <div
                  key={shp.id}
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.15rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                        {shp.shipmentNumber}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {getStatusBadge(shp.status)}
                        {/* Edit Shipment - only for active */}
                        {shp.status !== 'shipped' && shp.status !== 'completed' && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingShipment(shp);
                            }}
                            style={{ padding: '0.25rem 0.45rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                            title="Редактировать поставку"
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                        {/* Delete Shipment - only for active */}
                        {shp.status !== 'shipped' && shp.status !== 'completed' && (
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeletingShipment(shp);
                            }}
                            style={{ padding: '0.25rem 0.45rem', color: '#f43f5e', borderColor: 'rgba(244, 63, 94, 0.4)' }}
                            title="Удалить поставку"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={14} /> Клиент: <b style={{ color: 'var(--text-main)' }}>{shp.clientName}</b>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                        <Truck size={14} color="var(--primary)" /> Склады ВБ: <span style={{ color: 'var(--text-main)' }}>{shp.targetWarehouses.join(', ')}</span>
                      </div>
                      {shp.operatorName && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                          Оператор: {shp.operatorName}
                        </div>
                      )}
                    </div>

                    {/* Progress */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                        <span>Принято:</span>
                        <b style={{ color: percent >= 100 ? '#10b981' : 'var(--primary)' }}>{totalScanned} / {totalPlanned} шт. ({percent}%)</b>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
                        <div
                          style={{
                            width: `${Math.min(100, percent)}%`,
                            height: '100%',
                            background: percent >= 100 ? '#10b981' : 'var(--primary)',
                            borderRadius: 999
                          }}
                        />
                      </div>
                    </div>
                  </div>

                    {/* Action buttons depending on shipment status */}
                    {(() => {
                      const shpScanned = shp.items.reduce((acc, it) => acc + it.scannedQuantity, 0);
                      const shpPacked = shp.boxes.reduce((acc, b) => acc + b.items.reduce((s, bi) => s + bi.quantity, 0), 0);
                      const shpAllSealed = shp.boxes.length > 0 && shp.boxes.every(b => b.isPacked && b.items.length > 0);
                      const shpCanShip = shpScanned > 0 && shpScanned === shpPacked && shpAllSealed;

                      if (shp.status === 'ready_to_ship') {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {shpCanShip ? (
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() => handleShipToDriver(shp.id)}
                                disabled={shippingShipmentId === shp.id}
                                style={{
                                  background: '#10b981',
                                  borderColor: '#10b981',
                                  color: '#fff',
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem',
                                  padding: '0.65rem'
                                }}
                              >
                                <Truck size={16} />
                                {shippingShipmentId === shp.id ? 'Отгрузка...' : '🚚 Отгрузить водителю'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn-primary"
                                onClick={() => setActiveShipmentId(shp.id)}
                                style={{
                                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                  borderColor: '#f59e0b',
                                  color: '#fff',
                                  width: '100%',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '0.5rem',
                                  padding: '0.65rem'
                                }}
                              >
                                <Box size={16} /> 📦 Завершить упаковку и запечатать
                              </button>
                            )}
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setActiveShipmentId(shp.id)}
                              style={{ width: '100%', fontSize: '0.8rem', padding: '0.4rem' }}
                            >
                              <Box size={14} /> Открыть коробки / Сканер
                            </button>
                          </div>
                        );
                      }

                      if (shp.status === 'shipped' || shp.status === 'completed') {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => setActiveShipmentId(shp.id)}
                              style={{ width: '100%', borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                            >
                              <Lock size={15} /> {shp.status === 'completed' ? '🏁 Завершена (Просмотр)' : '🚚 Отгружена (Просмотр)'}
                            </button>
                          </div>
                        );
                      }

                      if (shp.status === 'draft') {
                        return (
                          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 'var(--radius-sm)', padding: '0.55rem', fontSize: '0.8rem', color: '#fbbf24', textAlign: 'center' }}>
                            ⏳ Заявка ожидает согласования слота менеджером
                          </div>
                        );
                      }

                      if (shp.status === 'approved') {
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            <div style={{ fontSize: '0.78rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.1)', padding: '0.35rem 0.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.25)', textAlign: 'center' }}>
                              📅 Слот: <b>{shp.plannedDeliveryDate ? new Date(shp.plannedDeliveryDate).toLocaleDateString('ru-RU') : 'Сегодня'}</b> | <b>{shp.gateNumber || 'Ворота №1'}</b>
                            </div>
                            <button
                              type="button"
                              className="btn-primary"
                              onClick={() => handleStartReceiving(shp.id)}
                              style={{ width: '100%', background: '#10b981', borderColor: '#10b981', color: '#fff', padding: '0.65rem' }}
                            >
                              <Truck size={16} /> 🚚 Машина прибыла → Начать приёмку
                            </button>
                          </div>
                        );
                      }

                      if (shp.status === 'packing') {
                        return (
                          <button
                            className="btn-primary"
                            onClick={() => setActiveShipmentId(shp.id)}
                            style={{ width: '100%', background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                          >
                            <Box size={16} /> 📦 Упаковка в коробки
                          </button>
                        );
                      }

                      return (
                        <button
                          className="btn-primary"
                          onClick={() => setActiveShipmentId(shp.id)}
                          style={{ width: '100%' }}
                        >
                          <Play size={16} /> 📱 Сканировать ШК (Приёмка)
                        </button>
                      );
                    })()}
                  </div>
                );
              })}
          </div>
        )}
      </div>

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
        onSave={handleSaveShipmentEdits}
      />

      {/* Delete Shipment Confirmation Modal */}
      {deletingShipment && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', color: '#f43f5e' }}>
              <Trash2 size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Удалить поставку?</h3>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              Вы уверены, что хотите удалить поставку <b>«{deletingShipment.shipmentNumber}»</b> (клиент: {deletingShipment.clientName})?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Все отсканированные товары ({deletingShipment.items.length} поз.) и сформированные коробки ({deletingShipment.boxes.length} шт.) будут безвозвратно удалены.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeletingShipment(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmDeleteShipment}
                style={{ background: '#f43f5e', borderColor: '#f43f5e', width: 'auto' }}
              >
                Да, удалить поставку
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
