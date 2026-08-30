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
  initialShipment?: Shipment;
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

export const PackingScreen: React.FC<Props> = ({ shipmentId, initialShipment, onBack }) => {
  const [shipment, setShipment] = useState<Shipment | null>(initialShipment || null);
  const [activeBoxNumber, setActiveBoxNumber] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(!initialShipment);
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
  const totalPlannedInShipment = shipment.items.reduce((acc, it) => acc + it.plannedQuantity, 0);
  const totalScannedInShipment = shipment.items.reduce((acc, it) => acc + it.scannedQuantity, 0);
  const totalPackedInBoxes = shipment.boxes.reduce((acc, b) => acc + b.items.reduce((sum, bi) => sum + bi.quantity, 0), 0);
  const remainingUnpacked = Math.max(0, totalScannedInShipment - totalPackedInBoxes);
  const packingProgressPercent = totalScannedInShipment > 0 ? Math.min(100, Math.round((totalPackedInBoxes / totalScannedInShipment) * 100)) : 0;
  
  const sealedBoxesCount = shipment.boxes.filter((b) => b.isPacked).length;
  const hasEmptyBoxes = shipment.boxes.some((b) => b.items.length === 0);
  const allBoxesSealed = shipment.boxes.length > 0 && sealedBoxesCount === shipment.boxes.length && !hasEmptyBoxes;
  const isFullyPacked = totalScannedInShipment > 0 && remainingUnpacked === 0 && allBoxesSealed;
  const isLocked = shipment.status === 'shipped' || shipment.status === 'completed';

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

  const selectedItem = shipment.items.find((it) => it.id === selectedItemId);
  const selectedItemAlreadyPacked = selectedItem
    ? shipment.boxes.reduce((acc, b) => {
        const found = b.items.find((bi) => bi.itemId === selectedItem.id);
        return acc + (found ? found.quantity : 0);
      }, 0)
    : 0;
  const selectedItemRemaining = selectedItem
    ? Math.max(0, selectedItem.scannedQuantity - selectedItemAlreadyPacked)
    : 0;

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = shipment.items.find((it) => it.id === itemId);
    if (item) {
      const alreadyPacked = shipment.boxes.reduce((acc, b) => {
        const found = b.items.find((bi) => bi.itemId === itemId);
        return acc + (found ? found.quantity : 0);
      }, 0);
      const remaining = Math.max(0, item.scannedQuantity - alreadyPacked);
      setPackQuantity(remaining > 0 ? remaining : 1);
    }
  };

  const handlePackItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId) return;
    const qty = parseInt(String(packQuantity), 10);
    if (isNaN(qty) || qty <= 0) return;

    if (qty > selectedItemRemaining) {
      alert(`Нельзя положить ${qty} шт. В наличии свободно только ${selectedItemRemaining} шт.`);
      return;
    }

    try {
      const updated = await ShipmentService.packItemToBox(shipmentId, activeBoxNumber, selectedItemId, qty);
      setShipment(updated);
      setSelectedItemId('');
      setPackQuantity(1);
      setSuccessMessage(`Успешно уложено ${qty} шт. в Коробку №${activeBoxNumber}!`);
      setTimeout(() => setSuccessMessage(null), 3500);
    } catch (err: any) {
      alert(err?.message || 'Ошибка укладки в коробку');
    }
  };

  const handleUpdateBoxItemQuantity = async (boxNumber: number, itemId: string, newQty: number) => {
    try {
      const updated = await ShipmentService.updateBoxItemQuantity(shipmentId, boxNumber, itemId, newQty);
      setShipment(updated);
    } catch (err: any) {
      alert(err?.message || 'Ошибка изменения количества');
    }
  };

  const handleRemoveItemFromBox = async (boxNumber: number, itemId: string) => {
    if (window.confirm('Выложить этот товар из коробки (вернуть в остаток)?')) {
      try {
        const updated = await ShipmentService.removeItemFromBox(shipmentId, boxNumber, itemId);
        setShipment(updated);
      } catch (err: any) {
        alert(err?.message || 'Ошибка удаления товара из коробки');
      }
    }
  };

  const handleSealToggle = async (boxNumber: number) => {
    try {
      const updated = await ShipmentService.sealBox(shipmentId, boxNumber);
      setShipment(updated);
      const isNowSealed = updated.boxes.find((b) => b.boxNumber === boxNumber)?.isPacked;
      if (isNowSealed) {
        setSuccessMessage(`Коробка №${boxNumber} успешно запечатана и зафиксирована!`);
      } else {
        setSuccessMessage(`Коробка №${boxNumber} вскрыта для правок. Статус поставки возвращен в процесс упаковки.`);
      }
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      alert(err?.message || 'Ошибка запечатывания коробки');
    }
  };

  const handleFinalizeShipment = async () => {
    if (!isFullyPacked) {
      if (remainingUnpacked > 0) {
        alert(`Нельзя завершить упаковку: осталось уложить ${remainingUnpacked} шт. товаров.`);
        return;
      }
      if (!allBoxesSealed) {
        alert(`Нельзя завершить упаковку: запечатайте все ${shipment.boxes.length} коробок.`);
        return;
      }
      return;
    }

    try {
      const updated = await ShipmentService.finalizePacking(shipmentId);
      setShipment(updated);
      setSuccessMessage('🎉 Поставка успешно запечатана и переведена в статус «Готова к отгрузке»!');
    } catch (e: any) {
      alert(e?.message || 'Ошибка завершения упаковки');
    }
  };

  const handleShipToDriver = async () => {
    if (!isFullyPacked) {
      if (remainingUnpacked > 0) {
        alert(`Нельзя отгрузить: не все принятые товары уложены в коробки (осталось уложить ${remainingUnpacked} шт.).`);
        return;
      }
      if (!allBoxesSealed) {
        alert(`Нельзя отгрузить: запечатайте все коробки перед передачей водителю (запечатано ${sealedBoxesCount} из ${shipment.boxes.length}).`);
        return;
      }
      return;
    }

    try {
      const updated = await ShipmentService.shipShipment(shipmentId);
      setShipment(updated);
      setSuccessMessage('🚚 Поставка успешно передана водителю и переведена в статус «Отгружена»!');
    } catch (e: any) {
      alert(e?.message || 'Ошибка отгрузки водителю');
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
              ) : shipment.status === 'ready_to_ship' && isFullyPacked ? (
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

          {!isLocked && isFullyPacked && shipment.status !== 'ready_to_ship' && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleFinalizeShipment}
              style={{ background: '#10b981', borderColor: '#10b981', display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto' }}
            >
              <Rocket size={16} /> Завершить упаковку поставки
            </button>
          )}

          {!isLocked && isFullyPacked && shipment.status === 'ready_to_ship' && (
            <button
              type="button"
              className="btn-primary"
              onClick={handleShipToDriver}
              style={{ background: '#38bdf8', borderColor: '#38bdf8', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'auto' }}
            >
              <Truck size={16} /> 🚚 Отгрузить водителю
            </button>
          )}

          {!isLocked && (
            <button className="btn-primary" onClick={handleCreateNewBox} style={{ width: 'auto' }}>
              <PlusCircle size={16} /> Добавить Коробку
            </button>
          )}

          {isLocked && (
            <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '0.45rem 0.85rem', fontSize: '0.85rem', fontWeight: 600 }}>
              {shipment.status === 'completed' ? '🏁 Поставка завершена' : '🚚 Поставка отгружена (Архив)'}
            </span>
          )}
        </div>
      </div>

      {/* Quality Control Checklist Warning */}
      {!isLocked && !isFullyPacked && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.1rem',
            marginBottom: '1.25rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.4rem', fontSize: '0.92rem' }}>
            <AlertCircle size={18} color="#f59e0b" />
            <span>Контроль готовности к отгрузке:</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
            {totalScannedInShipment === 0 ? (
              <span style={{ color: '#f43f5e' }}>❌ Ни один товар не принят по сканеру (примите товары в сканере)</span>
            ) : remainingUnpacked > 0 ? (
              <span style={{ color: '#f43f5e' }}>❌ Не все принятые товары уложены в коробки: <b>осталось уложить {remainingUnpacked} шт.</b></span>
            ) : (
              <span style={{ color: '#10b981' }}>✅ Все принятые товары ({totalScannedInShipment} шт.) уложены по коробкам</span>
            )}

            {hasEmptyBoxes ? (
              <span style={{ color: '#f43f5e' }}>❌ Есть пустые коробки: заполните их товаром или удалите</span>
            ) : shipment.boxes.length === 0 ? (
              <span style={{ color: '#f43f5e' }}>❌ Добавьте хотя бы 1 коробку</span>
            ) : null}

            {!allBoxesSealed && shipment.boxes.length > 0 ? (
              <span style={{ color: '#f43f5e' }}>❌ Не все коробки запечатаны: <b>запечатано {sealedBoxesCount} из {shipment.boxes.length} шт.</b> (Заклейте все коробки перед отгрузкой)</span>
            ) : shipment.boxes.length > 0 && !hasEmptyBoxes ? (
              <span style={{ color: '#10b981' }}>✅ Все {shipment.boxes.length} коробок запечатаны и готовы</span>
            ) : null}
          </div>
        </div>
      )}

      {/* ReadOnly Warning Alert */}
      {isLocked && (
        <div
          style={{
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            color: '#38bdf8',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            fontWeight: 600
          }}
        >
          <Lock size={18} />
          <span>Поставка {shipment.status === 'completed' ? 'завершена' : 'отгружена водителю'}. Режим просмотра архива (состав коробок и товаров зафиксирован).</span>
        </div>
      )}

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
            <div>
              Принято на складе: <b style={{ color: totalScannedInShipment === totalPlannedInShipment ? '#10b981' : 'var(--primary)' }}>{totalScannedInShipment} из {totalPlannedInShipment} шт.</b> <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Факт / План)</span>
            </div>
            <div>
              Разложено по коробкам: <b style={{ color: totalPackedInBoxes === totalScannedInShipment && totalScannedInShipment > 0 ? '#10b981' : '#38bdf8' }}>{totalPackedInBoxes} из {totalScannedInShipment} шт.</b>
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
            Прогресс упаковки: {packingProgressPercent}%
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

        {totalScannedInShipment < totalPlannedInShipment && (
          <div style={{ marginTop: '0.6rem', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span>ℹ️ Принято по сканеру <b>{totalScannedInShipment} из {totalPlannedInShipment} шт.</b> Чтобы принять остальные {totalPlannedInShipment - totalScannedInShipment} шт., вернитесь в сканер («Назад к сканеру»).</span>
          </div>
        )}
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
              {isLocked ? (
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsPrintModalOpen(true)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <Printer size={15} /> Печать ШК Коробки №{activeBox.boxNumber}
                </button>
              ) : activeBox.isPacked ? (
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
                disabled={isLocked || activeBox.isPacked}
                style={{ paddingLeft: '0.75rem', opacity: isLocked || activeBox.isPacked ? 0.6 : 1 }}
              >
                {AVAILABLE_WB_WAREHOUSES.map((wh) => (
                  <option key={wh} value={wh}>
                    {wh}
                  </option>
                ))}
              </select>
            </div>

            {/* Pack item into active box form */}
            {!isLocked && !activeBox.isPacked ? (
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

                      if (item.scannedQuantity === 0) {
                        return (
                          <option key={item.id} value={item.id} disabled>
                            {item.title} (❌ Не принято в сканере: 0 из {item.plannedQuantity} шт.)
                          </option>
                        );
                      }

                      if (remaining === 0) {
                        return (
                          <option key={item.id} value={item.id} disabled style={{ color: 'var(--text-muted)' }}>
                            {item.title} (✅ Упаковано 100%: {item.scannedQuantity} из {item.scannedQuantity} шт.)
                          </option>
                        );
                      }

                      return (
                        <option key={item.id} value={item.id}>
                          {item.title} (Осталось уложить: {remaining} из {item.scannedQuantity} шт.)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <label className="form-label" style={{ margin: 0 }}>Количество для укладки</label>
                    {selectedItemId && (
                      <span style={{ fontSize: '0.75rem', color: selectedItemRemaining > 0 ? 'var(--primary)' : '#f43f5e' }}>
                        Доступно для укладки: <b>{selectedItemRemaining} шт.</b>
                      </span>
                    )}
                  </div>

                  <div className="number-stepper">
                    <button
                      type="button"
                      className="number-stepper-btn"
                      onClick={() => setPackQuantity((q) => Math.max(1, (Number(q) || 0) - 1))}
                      disabled={Number(packQuantity) <= 1}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={selectedItemRemaining || 1}
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
                          if (isNaN(parsed)) {
                            setPackQuantity('');
                          } else {
                            const bounded = Math.min(selectedItemRemaining || 1, Math.max(1, parsed));
                            setPackQuantity(bounded);
                          }
                        }
                      }}
                      onBlur={() => {
                        if (!packQuantity || Number(packQuantity) < 1) {
                          setPackQuantity(1);
                        } else if (Number(packQuantity) > selectedItemRemaining && selectedItemRemaining > 0) {
                          setPackQuantity(selectedItemRemaining);
                        }
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="number-stepper-btn"
                      onClick={() => setPackQuantity((q) => Math.min(selectedItemRemaining || 1, (Number(q) || 0) + 1))}
                      disabled={selectedItemRemaining <= 0 || Number(packQuantity) >= selectedItemRemaining}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!selectedItemId || selectedItemRemaining <= 0 || Number(packQuantity) <= 0}
                >
                  <PackageCheck size={16} /> Положить {packQuantity || 1} шт. в коробку
                </button>
              </form>
            ) : null}

            {!isLocked && (
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
            )}
          </div>

          {/* Right Column: Items inside Active Box */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>Содержимое Коробки №{activeBox.boxNumber} ({activeBox.items.reduce((a, c) => a + c.quantity, 0)} шт.)</span>
              {activeBox.items.length > 0 && shipment.boxes.length > 1 && !isLocked && !activeBox.isPacked && (
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
                      <th style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>Количество в коробке</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeBox.items.map((item, idx) => {
                      // Calculate available units left for this specific item
                      const parentItem = shipment.items.find((it) => it.id === item.itemId || it.barcode === item.barcode);
                      const totalPackedAcrossBoxes = shipment.boxes.reduce((acc, b) => {
                        const found = b.items.find((bi) => bi.itemId === item.itemId || bi.barcode === item.barcode);
                        return acc + (found ? found.quantity : 0);
                      }, 0);
                      const totalScannedForThisItem = parentItem?.scannedQuantity || 0;
                      const freeUnpackedForThisItem = Math.max(0, totalScannedForThisItem - totalPackedAcrossBoxes);

                      return (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                          <td style={{ padding: '0.75rem 1.25rem', fontWeight: 600 }}>{item.title}</td>
                          <td style={{ padding: '0.75rem 1rem', fontFamily: 'var(--font-mono)' }}>{item.barcode}</td>
                          <td style={{ padding: '0.75rem 1.25rem', textAlign: 'right' }}>
                            {!isLocked && !activeBox.isPacked ? (
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.35rem' }}>
                                {/* Decrease by 1 */}
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => handleUpdateBoxItemQuantity(activeBox.boxNumber, item.itemId, item.quantity - 1)}
                                  style={{ padding: '0.2rem 0.45rem', fontSize: '0.75rem', height: 26, minWidth: 26, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                  title="Уменьшить на 1 шт."
                                >
                                  <Minus size={12} />
                                </button>

                                <span style={{ minWidth: 42, textAlign: 'center', fontWeight: 700, color: 'var(--primary)' }}>
                                  {item.quantity} шт.
                                </span>

                                {/* Increase by 1 */}
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => handleUpdateBoxItemQuantity(activeBox.boxNumber, item.itemId, item.quantity + 1)}
                                  disabled={freeUnpackedForThisItem <= 0}
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    fontSize: '0.75rem',
                                    height: 26,
                                    minWidth: 26,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    opacity: freeUnpackedForThisItem <= 0 ? 0.35 : 1
                                  }}
                                  title={freeUnpackedForThisItem <= 0 ? 'Все принятые единицы уже распределены' : 'Добавить +1 шт. в эту коробку'}
                                >
                                  <Plus size={12} />
                                </button>

                                {/* Remove item completely from box */}
                                <button
                                  type="button"
                                  className="btn-secondary"
                                  onClick={() => handleRemoveItemFromBox(activeBox.boxNumber, item.itemId)}
                                  style={{
                                    padding: '0.2rem 0.45rem',
                                    fontSize: '0.75rem',
                                    height: 26,
                                    minWidth: 26,
                                    color: '#f43f5e',
                                    borderColor: 'rgba(244,63,94,0.35)',
                                    marginLeft: '0.4rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}
                                  title="Выложить весь товар из коробки"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontWeight: 700, color: 'var(--primary)' }}>
                                {item.quantity} шт.
                              </span>
                            )}
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
