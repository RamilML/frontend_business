import React, { useState, useEffect } from 'react';
import { Shipment, PackingBox, WBWarehouse, ShipmentItem } from '../../types/shipment';
import { ShipmentService } from '../../services/shipmentService';
import { MoveItemsModal } from './MoveItemsModal';
import { PackingSlipPrintModal } from './PackingSlipPrintModal';
import {
  Box,
  Truck,
  PlusCircle,
  ArrowRight,
  Printer,
  Trash2,
  MoveHorizontal,
  PackageCheck,
  Building2,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';

interface Props {
  shipmentId: string;
  onBack: () => void;
}

const AVAILABLE_WB_WAREHOUSES: WBWarehouse[] = [
  'Коледино',
  'Электросталь',
  'Тула',
  'Казань',
  'Невинномысск',
  'Екатеринбург',
  'Новосибирск',
  'СПб Уткина Заводь'
];

export const PackingScreen: React.FC<Props> = ({ shipmentId, onBack }) => {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [activeBoxNumber, setActiveBoxNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Packing form state
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [packQuantity, setPackQuantity] = useState<number>(1);

  const loadShipment = async () => {
    setIsLoading(true);
    try {
      const data = await ShipmentService.getShipmentById(shipmentId);
      if (data) {
        setShipment(data);
        if (data.boxes.length === 0) {
          // Auto create Box 1 if no boxes exist
          await ShipmentService.createBox(shipmentId, data.targetWarehouses[0] || 'Коледино');
          const refreshed = await ShipmentService.getShipmentById(shipmentId);
          setShipment(refreshed);
        } else if (!data.boxes.some((b) => b.boxNumber === activeBoxNumber)) {
          setActiveBoxNumber(data.boxes[0].boxNumber);
        }
      }
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShipment();
  }, [shipmentId]);

  if (isLoading || !shipment) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '4rem' }}>
        <Box size={36} color="var(--primary)" className="animate-spin" />
        <div style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Загрузка модуля упаковки...</div>
      </div>
    );
  }

  const activeBox = shipment.boxes.find((b) => b.boxNumber === activeBoxNumber) || shipment.boxes[0];

  const handleCreateNewBox = async () => {
    const defaultWarehouse = shipment.targetWarehouses[0] || 'Коледино';
    const newBox = await ShipmentService.createBox(shipmentId, defaultWarehouse);
    await loadShipment();
    setActiveBoxNumber(newBox.boxNumber);
  };

  const handleWarehouseChange = async (boxNumber: number, newWarehouse: WBWarehouse) => {
    await ShipmentService.updateBoxWarehouse(shipmentId, boxNumber, newWarehouse);
    loadShipment();
  };

  const handlePackItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !activeBox) return;

    await ShipmentService.packItemToBox(shipmentId, activeBox.boxNumber, selectedItemId, packQuantity);
    setPackQuantity(1);
    loadShipment();
  };

  const handleMoveItems = async (fromBoxNum: number, toBoxNum: number, itemId: string, qty: number) => {
    await ShipmentService.moveItemBetweenBoxes(shipmentId, fromBoxNum, toBoxNum, itemId, qty);
    loadShipment();
  };

  const handleDeleteBox = async (boxNumber: number) => {
    if (window.confirm(`Вы действительно хотите удалить Коробку №${boxNumber}?`)) {
      await ShipmentService.deleteBox(shipmentId, boxNumber);
      loadShipment();
    }
  };

  return (
    <div className="dashboard-container">
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 0.75rem' }}>
            <ArrowLeft size={16} /> Назад
          </button>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Box color="var(--primary)" size={24} /> Упаковка в коробки: {shipment.shipmentNumber}
            </h2>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Контрагент: <b>{shipment.clientName}</b> • Всего коробок: <b>{shipment.boxes.length} шт.</b>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={() => setIsPrintModalOpen(true)}>
            <Printer size={16} /> Упаковочный лист (Печать)
          </button>
          <button className="btn-primary" onClick={handleCreateNewBox} style={{ width: 'auto' }}>
            <PlusCircle size={16} /> Добавить Коробку
          </button>
        </div>
      </div>

      {/* Manual Box Selector Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>
          Выбор рабочей коробки для укладки:
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {shipment.boxes.map((box) => {
            const isActive = box.boxNumber === activeBoxNumber;
            const totalQtyInBox = box.items.reduce((acc, it) => acc + it.quantity, 0);

            return (
              <div
                key={box.boxNumber}
                onClick={() => setActiveBoxNumber(box.boxNumber)}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isActive ? 'var(--primary)' : 'var(--border)'}`,
                  background: isActive ? 'var(--primary-light)' : 'rgba(30, 41, 59, 0.5)',
                  cursor: 'pointer',
                  minWidth: 160,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, color: isActive ? 'var(--primary)' : 'var(--text-main)' }}>
                    Коробка №{box.boxNumber}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '0.1rem 0.4rem', borderRadius: 4 }}>
                    {totalQtyInBox} шт.
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  Склад ВБ: <b>{box.targetWarehouse}</b>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Box Workspace Grid */}
      {activeBox && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Left Column: Box Settings & Packing Form */}
          <div className="card">
            <h3 className="card-title">
              <Truck size={18} color="var(--primary)" /> Настройка Коробки №{activeBox.boxNumber}
            </h3>

            {/* Target WB Warehouse Select */}
            <div className="form-group">
              <label className="form-label">Склад назначения Wildberries</label>
              <select
                className="form-input"
                value={activeBox.targetWarehouse}
                onChange={(e) => handleWarehouseChange(activeBox.boxNumber, e.target.value as WBWarehouse)}
                style={{ paddingLeft: '0.75rem' }}
              >
                {AVAILABLE_WB_WAREHOUSES.map((wh) => (
                  <option key={wh} value={wh}>
                    {wh}
                  </option>
                ))}
              </select>
            </div>

            {/* Pack item into active box form */}
            <form onSubmit={handlePackItemSubmit} style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                Положить товар в Коробку №{activeBox.boxNumber}:
              </div>

              <div className="form-group">
                <label className="form-label">Товар из поставки</label>
                <select
                  className="form-input"
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  style={{ paddingLeft: '0.75rem' }}
                  required
                >
                  <option value="">-- Выберите товар --</option>
                  {shipment.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.title} (Отсканировано: {item.scannedQuantity} шт.)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Количество для укладки</label>
                <input
                  type="number"
                  className="form-input"
                  value={packQuantity}
                  onChange={(e) => setPackQuantity(Math.max(1, Number(e.target.value)))}
                  min={1}
                  style={{ paddingLeft: '0.75rem' }}
                  required
                />
              </div>

              <button type="submit" className="btn-primary" disabled={!selectedItemId}>
                <PackageCheck size={16} /> Положить в коробку
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                className="btn-secondary"
                onClick={() => handleDeleteBox(activeBox.boxNumber)}
                style={{ borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e', fontSize: '0.78rem' }}
              >
                <Trash2 size={14} /> Удалить Коробку №{activeBox.boxNumber}
              </button>
            </div>
          </div>

          {/* Right Column: Items inside Active Box */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Содержимое Коробки №{activeBox.boxNumber} ({activeBox.items.reduce((a, c) => a + c.quantity, 0)} шт.)</span>
              {activeBox.items.length > 0 && shipment.boxes.length > 1 && (
                <button
                  className="btn-secondary"
                  onClick={() => setIsMoveModalOpen(true)}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem' }}
                >
                  <MoveHorizontal size={14} /> Переместить товары
                </button>
              )}
            </div>

            {activeBox.items.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                Коробка пока пуста. Выберите товар слева и нажмите «Положить в коробку».
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 1.25rem' }}>Наименование товара</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Штрихкод</th>
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>Количество</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBox.items.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                        <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>{item.title}</td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{item.barcode}</td>
                        <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                          {item.quantity} шт.
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Move Items Modal */}
      {activeBox && (
        <MoveItemsModal
          isOpen={isMoveModalOpen}
          fromBox={activeBox}
          allBoxes={shipment.boxes}
          onClose={() => setIsMoveModalOpen(false)}
          onMove={handleMoveItems}
        />
      )}

      {/* Print Packing Slip Modal */}
      <PackingSlipPrintModal
        isOpen={isPrintModalOpen}
        shipment={shipment}
        onClose={() => setIsPrintModalOpen(false)}
      />
    </div>
  );
};
