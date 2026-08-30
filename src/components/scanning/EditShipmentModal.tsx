import React, { useState, useEffect } from 'react';
import { Shipment, WBWarehouse, WB_WAREHOUSES } from '../../types/shipment';
import { ClientService } from '../../services/clientService';
import { Client } from '../../types/client';
import { Edit2, X, Truck, Building2, Layers, Check, UserCheck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  shipment: Shipment | null;
  onClose: () => void;
  onSave: (updatedShipment: Partial<Shipment>) => Promise<void>;
}

export const EditShipmentModal: React.FC<Props> = ({
  isOpen,
  shipment,
  onClose,
  onSave
}) => {
  const [shipmentNumber, setShipmentNumber] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientName, setClientName] = useState('');
  const [selectedWarehouses, setSelectedWarehouses] = useState<WBWarehouse[]>([]);
  const [status, setStatus] = useState<Shipment['status']>('receiving');
  const [operatorName, setOperatorName] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (shipment) {
      setShipmentNumber(shipment.shipmentNumber);
      setClientId(shipment.clientId);
      setClientName(shipment.clientName);
      setSelectedWarehouses(shipment.targetWarehouses || []);
      setStatus(shipment.status || 'receiving');
      setOperatorName(shipment.operatorName || '');
    }
    // Load clients for dropdown
    ClientService.getClients().then((list) => setClients(list));
  }, [shipment, isOpen]);

  if (!isOpen || !shipment) return null;

  const toggleWarehouse = (wh: WBWarehouse) => {
    setSelectedWarehouses((prev) =>
      prev.includes(wh) ? prev.filter((w) => w !== wh) : [...prev, wh]
    );
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cid = e.target.value;
    setClientId(cid);
    const found = clients.find((c) => c.id === cid);
    if (found) {
      setClientName(found.name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWarehouses.length === 0) {
      alert('Выберите хотя бы один склад Wildberries');
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        shipmentNumber: shipmentNumber.trim(),
        clientId,
        clientName,
        targetWarehouses: selectedWarehouses,
        status,
        operatorName: operatorName.trim() || undefined
      });
      onClose();
    } catch (err) {
      console.error('Save shipment error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 540 }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ padding: '0.5rem', background: 'rgba(56, 189, 248, 0.15)', borderRadius: 'var(--radius-md)' }}>
              <Edit2 size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Редактирование поставки</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: {shipment.id}</div>
            </div>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Number & Client */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Номер поставки *</label>
              <input
                type="text"
                className="form-input"
                value={shipmentNumber}
                onChange={(e) => setShipmentNumber(e.target.value)}
                placeholder="WB-2026-0805-01"
                required
                style={{ paddingLeft: '1rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Контрагент / Клиент *</label>
              <select
                className="form-input"
                value={clientId}
                onChange={handleClientChange}
                style={{ paddingLeft: '0.75rem' }}
                required
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status & Operator */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Статус жизненного цикла</label>
              <select
                className="form-input"
                value={status}
                onChange={(e) => setStatus(e.target.value as Shipment['status'])}
                style={{ paddingLeft: '0.75rem' }}
              >
                <option value="receiving">🟡 В приёмке (receiving)</option>
                <option value="packing">📦 В упаковке (packing)</option>
                <option value="ready_to_ship">🟢 Готова к отгрузке (ready_to_ship)</option>
                <option value="shipped">🚚 Отгружена (shipped)</option>
                <option value="completed">🏁 Завершена (completed)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Ответственный оператор</label>
              <input
                type="text"
                className="form-input"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                placeholder="Имя кладовщика"
                style={{ paddingLeft: '1rem' }}
              />
            </div>
          </div>

          {/* Destination Warehouses */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Truck size={14} color="var(--primary)" /> Целевые склады Wildberries ({selectedWarehouses.length} выбрано)
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '0.4rem',
                maxHeight: '160px',
                overflowY: 'auto',
                padding: '0.5rem',
                background: 'rgba(15, 23, 42, 0.6)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)'
              }}
            >
              {WB_WAREHOUSES.map((wh) => {
                const isSelected = selectedWarehouses.includes(wh);
                return (
                  <button
                    type="button"
                    key={wh}
                    onClick={() => toggleWarehouse(wh)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.35rem 0.5rem',
                      fontSize: '0.78rem',
                      borderRadius: 4,
                      border: '1px solid',
                      borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
                      background: isSelected ? 'rgba(245, 158, 11, 0.15)' : 'rgba(30, 41, 59, 0.5)',
                      color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: 3,
                        border: '1px solid',
                        borderColor: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: isSelected ? 'var(--primary)' : 'transparent',
                        flexShrink: 0
                      }}
                    >
                      {isSelected && <Check size={10} color="#000" strokeWidth={3} />}
                    </div>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{wh}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSaving}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" style={{ width: 'auto' }} disabled={isSaving}>
              {isSaving ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
