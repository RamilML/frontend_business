import React, { useState, useEffect } from 'react';
import { Shipment, CreateShipmentDto } from '../../types/shipment';
import { ShipmentService } from '../../services/shipmentService';
import { BarcodeScanScreen } from '../scanning/BarcodeScanScreen';
import { NewShipmentModal } from '../scanning/NewShipmentModal';
import {
  PackageCheck,
  Barcode,
  Box,
  Truck,
  PlusCircle,
  Play,
  CheckCircle2,
  Building2,
  Clock
} from 'lucide-react';

export const OperatorDashboard: React.FC = () => {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [activeShipmentId, setActiveShipmentId] = useState<string | null>(null);
  const [isNewShipmentOpen, setIsNewShipmentOpen] = useState(false);
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

  return (
    <div className="dashboard-container">
      {/* Header Bar */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <PackageCheck color="#10b981" size={24} /> Рабочее место Оператора (ТСД)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Приёмка товаров по штрихкодам, скан-контроль и ручной учет на складе
          </p>
        </div>

        <button className="btn-primary" onClick={() => setIsNewShipmentOpen(true)} style={{ width: 'auto' }}>
          <PlusCircle size={18} /> Новая поставка
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
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
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>
                        {shp.shipmentNumber}
                      </span>
                      <span className="badge badge-operator">
                        {shp.status === 'receiving' ? 'В приёмке' : shp.status}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Building2 size={14} /> Клиент: <b>{shp.clientName}</b>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <Truck size={14} /> Склады ВБ: {shp.targetWarehouses.join(', ')}
                      </div>
                    </div>

                    {/* Progress */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                        <span>Отсканировано:</span>
                        <b>{totalScanned} / {totalPlanned} шт. ({percent}%)</b>
                      </div>
                      <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 999 }}>
                        <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary)', borderRadius: 999 }} />
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => setActiveShipmentId(shp.id)}
                    style={{ width: '100%' }}
                  >
                    <Play size={16} /> Начать / Продолжить сканирование
                  </button>
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
    </div>
  );
};
