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
  ArrowLeft,
  Lock,
  Unlock,
  CheckCheck,
  Sparkles,
  Rocket,
  ShieldCheck,
  AlertCircle,
  Plus,
  Minus
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modals
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Packing form state
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [packQuantity, setPackQuantity] = useState<number | string>(1);

  const loadShipment = async () => {
    setIsLoading(true);
    try {
      const data = await ShipmentService.getShipmentById(shipmentId);
      if (data) {
        // Guarantee strictly unique box numbers (1, 2, 3...)
        data.boxes.forEach((b, idx) => {
          b.boxNumber = idx + 1;
        });
        setShipment(data);
        if (data.boxes.length === 0) {
          // Auto create Box 1 if no boxes exist
          const newBox = await ShipmentService.createBox(shipmentId, data.targetWarehouses[0] || 'Коледино');
          const refreshed = await ShipmentService.getShipmentById(shipmentId);
          if (refreshed) {
            refreshed.boxes.forEach((b, idx) => {
              b.boxNumber = idx + 1;
            });
            setShipment(refreshed);
            setActiveBoxNumber(newBox.boxNumber || 1);
          }
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

  // Calculations for progress
  const totalScannedInShipment = shipment.items.reduce((acc, it) => acc + it.scannedQuantity, 0);
  const totalPackedInBoxes = shipment.boxes.reduce((acc, b) => acc + b.items.reduce((sum, bi) => sum + bi.quantity, 0), 0);
  const remainingUnpacked = Math.max(0, totalScannedInShipment - totalPackedInBoxes);
  const packingProgressPercent = totalScannedInShipment > 0 ? Math.min(100, Math.round((totalPackedInBoxes / totalScannedInShipment) * 100)) : 0;
  
  const sealedBoxesCount = shipment.boxes.filter((b) => b.isPacked).length;
  const allBoxesSealed = shipment.boxes.length > 0 && sealedBoxesCount === shipment.boxes.length;
  const isFullyPacked = totalScannedInShipment > 0 && remainingUnpacked === 0 && allBoxesSealed;

  const handleCreateNewBox = async () => {
    const defaultWarehouse = shipment.targetWarehouses[0] || 'Коледино';
    const newBox = await ShipmentService.createBox(shipmentId, defaultWarehouse);
    const refreshed = await ShipmentService.getShipmentById(shipmentId);
    if (refreshed) {
      refreshed.boxes.forEach((b, idx) => {
        b.boxNumber = idx + 1;
      });
      setShipment(refreshed);
      if (newBox?.boxNumber) {
        setActiveBoxNumber(newBox.boxNumber);
      } else if (refreshed.boxes.length > 0) {
        setActiveBoxNumber(refreshed.boxes[refreshed.boxes.length - 1].boxNumber);
      }
    }
  };

  const handleWarehouseChange = async (boxNumber: number, newWarehouse: WBWarehouse) => {
    await ShipmentService.updateBoxWarehouse(shipmentId, boxNumber, newWarehouse);
    loadShipment();
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    if (!itemId || !shipment) {
      setPackQuantity(1);
      return;
    }
    const item = shipment.items.find((it) => it.id === itemId);
    if (item) {
      // Считаем сколько уже уложено этого товара во все коробки
      const alreadyPacked = shipment.boxes.reduce((acc, b) => {
        const found = b.items.find((bi) => bi.itemId === itemId);
        return acc + (found ? found.quantity : 0);
      }, 0);

      // По умолчанию подставляем оставшееся неупакованное количество (или все принятое)
      const remaining = Math.max(1, item.scannedQuantity - alreadyPacked);
      setPackQuantity(remaining);
    } else {
      setPackQuantity(1);
    }
  };

  const handlePackItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || !activeBox) return;

    const qtyToPack = Math.max(1, Number(packQuantity) || 1);
    await ShipmentService.packItemToBox(shipmentId, activeBox.boxNumber, selectedItemId, qtyToPack);
    setSelectedItemId('');
    setPackQuantity(1);
    loadShipment();
  };

  const handleSealToggle = async (boxNumber: number) => {
    try {
      const updated = await ShipmentService.sealBox(shipmentId, boxNumber);
      setShipment(updated);
      const box = updated.boxes.find((b) => b.boxNumber === boxNumber);
      if (box?.isPacked) {
        setSuccessMessage(`Коробка №${boxNumber} успешно запечатана и готова к маркировке!`);
      } else {
        setSuccessMessage(`Коробка №${boxNumber} вскрыта для корректировки содержимого.`);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      console.error('Seal box error:', err);
    }
  };

  const handleFinalizeShipment = async () => {
    try {
      const updated = await ShipmentService.finalizePacking(shipmentId);
      setShipment(updated);
      setSuccessMessage('🎉 Поставка успешно запечатана и переведена в статус «Готова к отгрузке»!');
    } catch (e) {
      console.warn('Finalize error:', e);
    }
  };

  const handleShipToDriver = async () => {
    try {
      const updated = await ShipmentService.shipShipment(shipmentId);
      setShipment(updated);
      setSuccessMessage('🚚 Поставка успешно передана водителю и переведена в статус «Отгружена»!');
    } catch (e) {
      console.warn('Ship error:', e);
    }
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
            <ArrowLeft size={16} /> Назад к сканеру
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Box color="var(--primary)" size={24} /> Упаковка в коробки: {shipment.shipmentNumber}
              </h2>
              {shipment.status === 'shipped' ? (
                <span className="badge badge-client" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Truck size={14} /> Отгружена водителю
                </span>
              ) : shipment.status === 'ready_to_ship' ? (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <ShieldCheck size={14} /> Готова к отгрузке
                </span>
              ) : (
                <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)' }}>
                  В процессе упаковки
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Контрагент: <b>{shipment.clientName}</b> • Всего коробок: <b>{shipment.boxes.length} шт.</b> (Запечатано: <b>{sealedBoxesCount}/{shipment.boxes.length}</b>)
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button className="btn-secondary" onClick={() => setIsPrintModalOpen(true)}>
            <Printer size={16} /> Упаковочный лист (Печать)
          </button>

          {allBoxesSealed && shipment.status !== 'ready_to_ship' && shipment.status !== 'shipped' && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleFinalizeShipment}
              style={{ background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto' }}
            >
              <Rocket size={16} /> Завершить упаковку поставки
            </button>
          )}

          {shipment.status === 'ready_to_ship' && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleShipToDriver}
              style={{ background: '#38bdf8', borderColor: '#38bdf8', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto' }}
            >
              <Truck size={16} /> 🚚 Отгрузить водителю
            </button>
          )}

          {shipment.status !== 'shipped' && (
            <button className="btn-primary" onClick={handleCreateNewBox} style={{ width: 'auto' }}>
              <PlusCircle size={16} /> Добавить Коробку
            </button>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#34d399',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 600
          }}
        >
          <Sparkles size={18} />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Packing Progress & Summary Banner */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.9rem' }}>
            <div>
              Принято товаров: <b>{totalScannedInShipment} шт.</b>
            </div>
            <div>
              Разложено по коробкам: <b style={{ color: totalPackedInBoxes === totalScannedInShipment && totalScannedInShipment > 0 ? '#10b981' : 'var(--primary)' }}>{totalPackedInBoxes} шт.</b>
            </div>
            {remainingUnpacked > 0 && (
              <div style={{ color: '#f59e0b', fontWeight: 600 }}>
                Осталось упаковать: <b>{remainingUnpacked} шт.</b>
              </div>
            )}
            <div>
              Запечатано коробок: <b style={{ color: allBoxesSealed ? '#10b981' : 'var(--text-main)' }}>{sealedBoxesCount} из {shipment.boxes.length}</b>
            </div>
          </div>

          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: totalPackedInBoxes === totalScannedInShipment && totalScannedInShipment > 0 ? '#10b981' : 'var(--primary)' }}>
            Прогресс: {packingProgressPercent}%
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div style={{ width: '100%', height: 8, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 4, overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${packingProgressPercent}%`,
              background: packingProgressPercent === 100 ? '#10b981' : 'linear-gradient(90deg, #f59e0b, #eab308)',
              transition: 'width 0.3s ease'
            }}
          />
        </div>
      </div>

      {/* Manual Box Selector Bar */}
      <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.75rem', fontWeight: 600 }}>
          Выбор рабочей коробки для укладки и маркировки:
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {shipment.boxes.map((box, index) => {
            const boxNum = box.boxNumber || (index + 1);
            const isActive = boxNum === activeBoxNumber;
            const totalQtyInBox = box.items.reduce((acc, it) => acc + it.quantity, 0);
            const isSealed = Boolean(box.isPacked);

            return (
              <div
                key={`box-card-${boxNum}-${index}`}
                onClick={() => setActiveBoxNumber(boxNum)}
                style={{
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1px solid ${isActive ? 'var(--primary)' : isSealed ? 'rgba(16, 185, 129, 0.4)' : 'var(--border)'}`,
                  background: isActive
                    ? 'var(--primary-light)'
                    : isSealed
                    ? 'rgba(16, 185, 129, 0.08)'
                    : 'rgba(30, 41, 59, 0.5)',
                  cursor: 'pointer',
                  minWidth: 175,
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, color: isActive ? 'var(--primary)' : 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {isSealed ? <Lock size={13} color="#10b981" /> : <Box size={13} />}
                    Коробка №{box.boxNumber}
                  </span>
                  <span style={{ fontSize: '0.75rem', background: isSealed ? 'rgba(16, 185, 129, 0.25)' : 'rgba(0,0,0,0.3)', color: isSealed ? '#34d399' : 'inherit', padding: '0.15rem 0.45rem', borderRadius: 4, fontWeight: 700 }}>
                    {totalQtyInBox} шт.
                  </span>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Склад ВБ: <b>{box.targetWarehouse}</b>
                </div>

                <div style={{ marginTop: '0.4rem', fontSize: '0.72rem' }}>
                  {isSealed ? (
                    <span style={{ color: '#34d399', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                      <CheckCheck size={12} /> Запечатана ✓
                    </span>
                  ) : (
                    <span style={{ color: '#f59e0b', fontWeight: 500 }}>
                      🟡 В укладке
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Box Workspace Grid */}
      {activeBox && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.9fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          {/* Left Column: Box Settings & Packing Form */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {activeBox.isPacked ? <Lock size={18} color="#10b981" /> : <Truck size={18} color="var(--primary)" />}
                Коробка №{activeBox.boxNumber}
              </h3>
              {activeBox.isPacked ? (
                <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem' }}>
                  <CheckCheck size={13} /> Запечатана
                </span>
              ) : (
                <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                  Открыта
                </span>
              )}
            </div>

            {/* Seal / Unseal Box Action Button */}
            <div style={{ marginBottom: '1.25rem' }}>
              {activeBox.isPacked ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <div
                    style={{
                      background: 'rgba(16, 185, 129, 0.12)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.65rem 0.85rem',
                      color: '#34d399',
                      fontSize: '0.84rem'
                    }}
                  >
                    <b>✓ Коробка запечатана и зафиксирована.</b> Содержимое защищено от случайных изменений.
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => handleSealToggle(activeBox.boxNumber)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                    >
                      <Unlock size={15} /> Вскрыть для правок
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setIsPrintModalOpen(true)}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    >
                      <Printer size={15} /> Печать ШК
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => handleSealToggle(activeBox.boxNumber)}
                  style={{
                    background: '#10b981',
                    borderColor: '#10b981',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    width: '100%',
                    padding: '0.65rem'
                  }}
                  disabled={activeBox.items.length === 0}
                  title={activeBox.items.length === 0 ? 'Сначала положите вещи в коробку' : 'Запечатать коробку'}
                >
                  <CheckCheck size={16} /> Запечатать и заклеить Коробку №{activeBox.boxNumber}
                </button>
              )}
            </div>

            {/* Target WB Warehouse Select */}
            <div className="form-group">
              <label className="form-label">Склад назначения Wildberries</label>
              <select
                className="form-input"
                value={activeBox.targetWarehouse}
                onChange={(e) => handleWarehouseChange(activeBox.boxNumber, e.target.value as WBWarehouse)}
                disabled={activeBox.isPacked}
                style={{ paddingLeft: '0.75rem', opacity: activeBox.isPacked ? 0.6 : 1 }}
              >
                {AVAILABLE_WB_WAREHOUSES.map((wh) => (
                  <option key={wh} value={wh}>
                    {wh}
                  </option>
                ))}
              </select>
            </div>

            {/* Pack item into active box form */}
            {!activeBox.isPacked ? (
              <form onSubmit={handlePackItemSubmit} style={{ marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                  Положить товар в Коробку №{activeBox.boxNumber}:
                </div>

                <div className="form-group">
                  <label className="form-label">Товар из поставки</label>
                  <select
                    className="form-input"
                    value={selectedItemId}
                    onChange={(e) => handleSelectItem(e.target.value)}
                    style={{ paddingLeft: '0.75rem' }}
                    required
                  >
                    <option value="">-- Выберите товар для укладки --</option>
                    {shipment.items.map((item) => {
                      const alreadyPacked = shipment.boxes.reduce((acc, b) => {
                        const found = b.items.find((bi) => bi.itemId === item.id);
                        return acc + (found ? found.quantity : 0);
                      }, 0);
                      const remaining = Math.max(0, item.scannedQuantity - alreadyPacked);

                      return (
                        <option key={item.id} value={item.id}>
                          {item.title} (Принято: {item.scannedQuantity} шт. • Не упаковано: {remaining} шт.)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Количество для укладки</label>
                    {selectedItemId && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                        По умолчанию: всё принятое
                      </span>
                    )}
                  </div>

                  <div className="number-stepper">
                    <button
                      type="button"
                      className="number-stepper-btn"
                      onClick={() => setPackQuantity((q) => Math.max(1, (Number(q) || 0) - 1))}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="form-input form-input-number"
                      style={{ textAlign: 'center', padding: '0.4rem 0.5rem', background: 'transparent', border: 'none' }}
                      value={packQuantity}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setPackQuantity('');
                        } else {
                          const parsed = parseInt(val, 10);
                          setPackQuantity(isNaN(parsed) ? '' : Math.max(0, parsed));
                        }
                      }}
                      onBlur={() => {
                        if (!packQuantity || Number(packQuantity) < 1) {
                          setPackQuantity(1);
                        }
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="number-stepper-btn"
                      onClick={() => setPackQuantity((q) => (Number(q) || 0) + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={!selectedItemId}>
                  <PackageCheck size={16} /> Положить {packQuantity || 1} шт. в коробку
                </button>
              </form>
            ) : null}

            <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
              <button
                className="btn-secondary"
                onClick={() => handleDeleteBox(activeBox.boxNumber)}
                disabled={activeBox.isPacked}
                style={{ borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e', fontSize: '0.78rem', opacity: activeBox.isPacked ? 0.4 : 1 }}
              >
                <Trash2 size={14} /> Удалить Коробку №{activeBox.boxNumber}
              </button>
            </div>
          </div>

          {/* Right Column: Items inside Active Box */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Содержимое Коробки №{activeBox.boxNumber} ({activeBox.items.reduce((a, c) => a + c.quantity, 0)} шт.)</span>
              {activeBox.items.length > 0 && shipment.boxes.length > 1 && !activeBox.isPacked && (
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
