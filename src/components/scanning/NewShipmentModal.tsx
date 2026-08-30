import React, { useState, useEffect } from 'react';
import { CreateShipmentDto, WBWarehouse } from '../../types/shipment';
import { Client } from '../../types/client';
import { ClientService } from '../../services/clientService';
import { X, Truck, Building2, PackagePlus, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateShipment: (dto: CreateShipmentDto) => Promise<void>;
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

export const NewShipmentModal: React.FC<Props> = ({ isOpen, onClose, onCreateShipment }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [shipmentNumber, setShipmentNumber] = useState('');
  const [selectedWarehouses, setSelectedWarehouses] = useState<WBWarehouse[]>(['Коледино']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const defaultNumber = `WB-${today}-${Math.floor(100 + Math.random() * 900)}`;
      setShipmentNumber(defaultNumber);

      ClientService.getClients().then((data) => {
        setClients(data);
        if (data.length > 0) setSelectedClientId(data[0].id);
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleWarehouse = (wh: WBWarehouse) => {
    if (selectedWarehouses.includes(wh)) {
      if (selectedWarehouses.length === 1) return; // Keep at least one
      setSelectedWarehouses(selectedWarehouses.filter((w) => w !== wh));
    } else {
      setSelectedWarehouses([...selectedWarehouses, wh]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setError('Выберите контрагента');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const client = clients.find((c) => c.id === selectedClientId);

      const dto: CreateShipmentDto = {
        shipmentNumber,
        clientId: selectedClientId,
        targetWarehouses: selectedWarehouses,
        initialItems: [
          {
            barcode: '4601234567890',
            sku: 'FUT-BLK-M',
            title: 'Футболка базовая Черная M',
            plannedQuantity: 20
          },
          {
            barcode: '4601234567891',
            sku: 'HOOD-GRY-L',
            title: 'Худи утепленное Серый L',
            plannedQuantity: 15
          }
        ]
      };

      await onCreateShipment(dto);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка создания поставки');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 580 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PackagePlus color="var(--primary)" size={22} /> Создание новой поставки Wildberries
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Определите контрагента, номер задания и целевые склады WB
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Step 1: Client Selection */}
          <div className="form-group">
            <label className="form-label">Выбор Контрагента (Клиента) *</label>
            <div className="input-with-icon">
              <Building2 className="input-icon" size={18} />
              <select
                className="form-input"
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                required
              >
                {clients.length === 0 && (
                  <option value="">Загрузка списка клиентов...</option>
                )}
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} {client.requisites?.inn ? `(ИНН: ${client.requisites.inn})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Step 2: Shipment Number */}
          <div className="form-group">
            <label className="form-label">Номер / Задание поставки *</label>
            <input
              type="text"
              className="form-input"
              value={shipmentNumber}
              onChange={(e) => setShipmentNumber(e.target.value)}
              placeholder="WB-2026-0805-01"
              style={{ paddingLeft: '0.75rem' }}
              required
            />
          </div>

          {/* Step 3: Target WB Warehouses (Multiple Selection) */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Truck size={16} color="var(--primary)" /> Склады назначения Wildberries (можно выбрать несколько) *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
              {AVAILABLE_WB_WAREHOUSES.map((wh) => {
                const isSelected = selectedWarehouses.includes(wh);
                return (
                  <button
                    key={wh}
                    type="button"
                    className={`role-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleWarehouse(wh)}
                    style={{ padding: '0.5rem 0.75rem', justifyContent: 'space-between' }}
                  >
                    <span>{wh}</span>
                    {isSelected && <CheckCircle2 size={14} color="var(--primary)" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: 'auto' }}>
              <CheckCircle2 size={16} /> {isSubmitting ? 'Создание...' : 'Открыть приемку поставки'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
