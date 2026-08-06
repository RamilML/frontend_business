import React, { useState } from 'react';
import { PackingBox } from '../../types/shipment';
import { X, ArrowRight, Box, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  fromBox: PackingBox;
  allBoxes: PackingBox[];
  onClose: () => void;
  onMove: (fromBoxNum: number, toBoxNum: number, itemId: string, qty: number) => Promise<void>;
}

export const MoveItemsModal: React.FC<Props> = ({ isOpen, fromBox, allBoxes, onClose, onMove }) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(fromBox.items[0]?.itemId || '');
  const [targetBoxNum, setTargetBoxNum] = useState<number>(
    allBoxes.find((b) => b.boxNumber !== fromBox.boxNumber)?.boxNumber || fromBox.boxNumber
  );
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const currentItem = fromBox.items.find((i) => i.itemId === selectedItemId);
  const maxQty = currentItem ? currentItem.quantity : 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || targetBoxNum === fromBox.boxNumber) return;

    setIsSubmitting(true);
    try {
      await onMove(fromBox.boxNumber, targetBoxNum, selectedItemId, quantity);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Ошибка перемещения');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Box color="var(--primary)" size={20} /> Перемещение товара из Коробки №{fromBox.boxNumber}
          </h3>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Item Selector */}
          <div className="form-group">
            <label className="form-label">Выберите товар в коробке</label>
            <select
              className="form-input"
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                setQuantity(1);
              }}
              style={{ paddingLeft: '0.75rem' }}
              required
            >
              {fromBox.items.map((item) => (
                <option key={item.itemId} value={item.itemId}>
                  {item.title} (В коробке: {item.quantity} шт.)
                </option>
              ))}
            </select>
          </div>

          {/* Target Box Selector */}
          <div className="form-group">
            <label className="form-label">Куда переместить (Целевая коробка)</label>
            <select
              className="form-input"
              value={targetBoxNum}
              onChange={(e) => setTargetBoxNum(Number(e.target.value))}
              style={{ paddingLeft: '0.75rem' }}
              required
            >
              {allBoxes
                .filter((b) => b.boxNumber !== fromBox.boxNumber)
                .map((b) => (
                  <option key={b.boxNumber} value={b.boxNumber}>
                    Коробка №{b.boxNumber} (Склад ВБ: {b.targetWarehouse}) — предметов: {b.items.reduce((a, c) => a + c.quantity, 0)} шт.
                  </option>
                ))}
            </select>
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label className="form-label">Количество для переноса (макс. {maxQty} шт.)</label>
            <input
              type="number"
              className="form-input"
              value={quantity}
              onChange={(e) => setQuantity(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
              min={1}
              max={maxQty}
              style={{ paddingLeft: '0.75rem' }}
              required
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: 'auto' }}>
              <ArrowRight size={16} /> {isSubmitting ? 'Перемещение...' : 'Переместить товар'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
