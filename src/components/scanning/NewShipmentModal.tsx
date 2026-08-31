import React, { useState, useEffect } from 'react';
import { CreateShipmentDto, WBWarehouse, ShipmentItem, ShipmentStatus } from '../../types/shipment';
import { Client } from '../../types/client';
import { ClientService } from '../../services/clientService';
import {
  X,
  Truck,
  Building2,
  PackagePlus,
  CheckCircle2,
  Plus,
  Trash2,
  Sparkles,
  Barcode,
  Layers
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreateShipment: (dto: CreateShipmentDto) => Promise<void>;
  forcedClientId?: string;
  forcedClientName?: string;
  isClientMode?: boolean;
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

type PlannedItemDraft = Omit<ShipmentItem, 'id' | 'scannedQuantity'>;

export const NewShipmentModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onCreateShipment,
  forcedClientId,
  forcedClientName,
  isClientMode = false
}) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState(forcedClientId || '');
  const [shipmentNumber, setShipmentNumber] = useState('');
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const [plannedDeliveryDate, setPlannedDeliveryDate] = useState(tomorrow);
  const [driverInfo, setDriverInfo] = useState('');
  const [assignedGate, setAssignedGate] = useState('Ворота № 1 (Рампа)');
  const [managerLaunchMode, setManagerLaunchMode] = useState<'approved' | 'receiving'>('approved');
  const [selectedWarehouses, setSelectedWarehouses] = useState<WBWarehouse[]>(['Коледино']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dynamic Planned Items State
  const [plannedItems, setPlannedItems] = useState<PlannedItemDraft[]>([
    {
      title: 'Футболка базовая Черная M',
      barcode: '4601234567890',
      sku: 'FUT-BLK-M',
      plannedQuantity: 20
    },
    {
      title: 'Худи утепленное Серый L',
      barcode: '4601234567891',
      sku: 'HOOD-GRY-L',
      plannedQuantity: 15
    }
  ]);

  // Form fields for adding a new item
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemBarcode, setNewItemBarcode] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemQty, setNewItemQty] = useState<number | string>(10);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const defaultNumber = `WB-${today}-${Math.floor(100 + Math.random() * 900)}`;
      setShipmentNumber(defaultNumber);

      if (forcedClientId) {
        setSelectedClientId(forcedClientId);
      } else {
        ClientService.getClients().then((data) => {
          setClients(data);
          if (data.length > 0) setSelectedClientId(data[0].id);
        });
      }
    }
  }, [isOpen, forcedClientId]);

  if (!isOpen) return null;

  const toggleWarehouse = (wh: WBWarehouse) => {
    if (selectedWarehouses.includes(wh)) {
      if (selectedWarehouses.length === 1) return; // Keep at least one
      setSelectedWarehouses(selectedWarehouses.filter((w) => w !== wh));
    } else {
      setSelectedWarehouses([...selectedWarehouses, wh]);
    }
  };

  const handleAddItemToPlan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newItemTitle.trim()) {
      setError('Укажите наименование товара');
      return;
    }
    const barcode = newItemBarcode.trim() || `460${Math.floor(1000000000 + Math.random() * 9000000000)}`;
    const sku = newItemSku.trim() || `SKU-${barcode.slice(-6)}`;
    const qty = Math.max(1, Number(newItemQty) || 1);

    setPlannedItems((prev) => [
      ...prev,
      {
        title: newItemTitle.trim(),
        barcode,
        sku,
        plannedQuantity: qty
      }
    ]);

    // Reset inputs
    setNewItemTitle('');
    setNewItemBarcode('');
    setNewItemSku('');
    setNewItemQty(10);
    setError(null);
  };

  const handleRemoveItem = (index: number) => {
    setPlannedItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleFillDemoItems = () => {
    setPlannedItems([
      {
        title: 'Футболка базовая Черная M',
        barcode: '4601234567890',
        sku: 'FUT-BLK-M',
        plannedQuantity: 20
      },
      {
        title: 'Худи утепленное Серый L',
        barcode: '4601234567891',
        sku: 'HOOD-GRY-L',
        plannedQuantity: 15
      }
    ]);
  };

  const handleClearItems = () => {
    setPlannedItems([]);
  };

  const totalPlannedQuantity = plannedItems.reduce((acc, it) => acc + (it.plannedQuantity || 0), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalClientId = forcedClientId || selectedClientId;
    if (!finalClientId) {
      setError('Выберите контрагента');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const finalStatus: ShipmentStatus = isClientMode ? 'draft' : managerLaunchMode;

      const dto: CreateShipmentDto = {
        shipmentNumber: shipmentNumber.trim(),
        clientId: finalClientId,
        targetWarehouses: selectedWarehouses,
        status: finalStatus,
        plannedDeliveryDate,
        driverInfo: driverInfo.trim() || undefined,
        gateNumber: isClientMode ? undefined : assignedGate,
        initialItems: plannedItems
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
      <div className="modal-content" style={{ maxWidth: 740, maxHeight: '92vh', overflowY: 'auto' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isClientMode ? (
                <>
                  <PackagePlus color="#8b5cf6" size={24} />
                  <span>Заявка на согласование ввоза товаров</span>
                </>
              ) : (
                <>
                  <Building2 color="#3b82f6" size={24} />
                  <span>Регистрация поставки складом (Менеджер)</span>
                </>
              )}
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {isClientMode
                ? 'Заполните заявку на слот приёмки. После одобрения менеджером склада вам будет назначен номер ворот.'
                : 'Прямой запуск поставки в график приёмки (по накладной из чата, самопривозу или из складских запасов)'}
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
          {/* Section 0 (Manager Only): Launch Scenario */}
          {!isClientMode && (
            <div style={{ marginBottom: '1.25rem', background: 'rgba(30, 41, 59, 0.5)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Сценарий запуска поставки менеджером:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                <button
                  type="button"
                  onClick={() => setManagerLaunchMode('approved')}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: managerLaunchMode === 'approved' ? '2px solid #10b981' : '1px solid var(--border)',
                    background: managerLaunchMode === 'approved' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                    color: managerLaunchMode === 'approved' ? '#34d399' : 'var(--text-muted)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <b style={{ fontSize: '0.85rem', color: managerLaunchMode === 'approved' ? '#10b981' : 'var(--text-main)' }}>
                    ✅ 1. Слот подтверждён (Ждём авто)
                  </b>
                  <span style={{ fontSize: '0.73rem', opacity: 0.85 }}>Поставка внесена в график приёмки на дату</span>
                </button>

                <button
                  type="button"
                  onClick={() => setManagerLaunchMode('receiving')}
                  style={{
                    padding: '0.6rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    border: managerLaunchMode === 'receiving' ? '2px solid #f59e0b' : '1px solid var(--border)',
                    background: managerLaunchMode === 'receiving' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(15, 23, 42, 0.5)',
                    color: managerLaunchMode === 'receiving' ? '#fbbf24' : 'var(--text-muted)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.2rem'
                  }}
                >
                  <b style={{ fontSize: '0.85rem', color: managerLaunchMode === 'receiving' ? '#f59e0b' : 'var(--text-main)' }}>
                    🟡 2. Товар у ворот / Самопривоз
                  </b>
                  <span style={{ fontSize: '0.73rem', opacity: 0.85 }}>Сразу открыть приёмку операторам по ТСД</span>
                </button>
              </div>
            </div>
          )}

          {/* Section 1: Client and Shipment Metadata */}
          <div style={{ display: 'grid', gridTemplateColumns: forcedClientId ? '1fr 1.2fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            {/* Client Selection / Display */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">
                {isClientMode ? 'Ваша организация' : 'Выбор Контрагента (Клиента) *'}
              </label>
              {forcedClientId ? (
                <div
                  style={{
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#c4b5fd'
                  }}
                >
                  <Building2 size={18} color="#8b5cf6" />
                  <span>{forcedClientName || 'Ваш личный кабинет'}</span>
                </div>
              ) : (
                <div className="input-with-icon">
                  <Building2 className="input-icon" size={18} />
                  <select
                    className="form-input"
                    value={selectedClientId}
                    onChange={(e) => setSelectedClientId(e.target.value)}
                    required
                  >
                    {clients.length === 0 && <option value="">Загрузка списка клиентов...</option>}
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {client.name} {client.requisites?.inn ? `(ИНН: ${client.requisites.inn})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Shipment Number */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Номер / Задание поставки *</label>
              <input
                type="text"
                className="form-input"
                value={shipmentNumber}
                onChange={(e) => setShipmentNumber(e.target.value)}
                placeholder="WB-20260831-01"
                style={{ paddingLeft: '0.75rem' }}
                required
              />
            </div>
          </div>

          {/* Section 1.5: Inbound Slot & Gate Settings */}
          {isClientMode ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Желаемая дата привоза на склад *</label>
                <input
                  type="date"
                  className="form-input"
                  value={plannedDeliveryDate}
                  onChange={(e) => setPlannedDeliveryDate(e.target.value)}
                  required
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Перевозчик / Авто / Водитель (опционально)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Например: Газель У777МР777, водитель Марат"
                  value={driverInfo}
                  onChange={(e) => setDriverInfo(e.target.value)}
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.5fr', gap: '0.75rem', marginBottom: '1rem' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Дата слота приёмки *</label>
                <input
                  type="date"
                  className="form-input"
                  value={plannedDeliveryDate}
                  onChange={(e) => setPlannedDeliveryDate(e.target.value)}
                  required
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Назначить ворота склада</label>
                <select
                  className="form-input"
                  value={assignedGate}
                  onChange={(e) => setAssignedGate(e.target.value)}
                  style={{ paddingLeft: '0.75rem' }}
                >
                  <option value="Ворота № 1 (Рампа)">Ворота № 1 (Рампа)</option>
                  <option value="Ворота № 2 (Малый тоннаж)">Ворота № 2 (Малый тоннаж)</option>
                  <option value="Ворота № 3 (Паллетная зона)">Ворота № 3 (Паллетная зона)</option>
                  <option value="Сектор B (Складской запас)">Сектор B (Складской запас)</option>
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Данные авто / ТТН (опционально)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Водитель, номер авто или ТТН"
                  value={driverInfo}
                  onChange={(e) => setDriverInfo(e.target.value)}
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>
            </div>
          )}

          {/* Section 2: Target WB Warehouses */}
          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Truck size={16} color="var(--primary)" /> Склады назначения Wildberries (можно выбрать несколько) *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.4rem', marginTop: '0.4rem' }}>
              {AVAILABLE_WB_WAREHOUSES.map((wh) => {
                const isSelected = selectedWarehouses.includes(wh);
                return (
                  <button
                    key={wh}
                    type="button"
                    className={`role-pill ${isSelected ? 'active' : ''}`}
                    onClick={() => toggleWarehouse(wh)}
                    style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem', justifyContent: 'space-between' }}
                  >
                    <span>{wh}</span>
                    {isSelected && <CheckCircle2 size={13} color="var(--primary)" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Planned Goods Section (ПЛАН ТОВАРОВ) */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              marginBottom: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Layers size={16} color="var(--primary)" /> План товаров в поставке ({plannedItems.length} позиций, {totalPlannedQuantity} шт.)
                </span>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.15rem 0 0' }}>
                  Оператор на складе будет сканировать и сверять факт с этим планом.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleFillDemoItems}
                  style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  title="Подставить демо-товары для быстрого теста"
                >
                  <Sparkles size={12} color="#f59e0b" /> Шаблон (20+15 шт.)
                </button>
                {plannedItems.length > 0 && (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleClearItems}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#f43f5e', borderColor: 'rgba(244,63,94,0.3)' }}
                    title="Очистить (приёмка по факту со сканера)"
                  >
                    Очистить
                  </button>
                )}
              </div>
            </div>

            {/* Planned Items Table */}
            {plannedItems.length === 0 ? (
              <div
                style={{
                  padding: '1.25rem',
                  textAlign: 'center',
                  background: 'rgba(30, 41, 59, 0.4)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-muted)',
                  fontSize: '0.85rem',
                  marginBottom: '0.75rem'
                }}
              >
                📭 Список товаров пуст. Вы можете добавить товары ниже или создать пустую поставку для <b>приёмки по факту со сканера</b>.
              </div>
            ) : (
              <div style={{ overflowX: 'auto', marginBottom: '0.75rem', maxHeight: 180, overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                      <th style={{ padding: '0.4rem 0.5rem' }}>Наименование</th>
                      <th style={{ padding: '0.4rem 0.5rem' }}>Штрихкод</th>
                      <th style={{ padding: '0.4rem 0.5rem' }}>Артикул / SKU</th>
                      <th style={{ padding: '0.4rem 0.5rem', textAlign: 'right' }}>План (шт.)</th>
                      <th style={{ padding: '0.4rem 0.5rem', width: 36 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {plannedItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.3)' }}>
                        <td style={{ padding: '0.4rem 0.5rem', fontWeight: 600 }}>{item.title}</td>
                        <td style={{ padding: '0.4rem 0.5rem', fontFamily: 'var(--font-mono)' }}>{item.barcode}</td>
                        <td style={{ padding: '0.4rem 0.5rem', color: 'var(--text-muted)' }}>{item.sku || '—'}</td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--primary)' }}>
                          {item.plannedQuantity} шт.
                        </td>
                        <td style={{ padding: '0.4rem 0.5rem', textAlign: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#f43f5e',
                              cursor: 'pointer',
                              padding: '0.2rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Удалить из плана"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Quick Add Planned Item Subform */}
            <div
              style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: '1px dashed var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '0.65rem 0.75rem'
              }}
            >
              <div style={{ fontSize: '0.78rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-muted)' }}>
                + Добавить позицию в план:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.3fr 1fr 0.8fr auto', gap: '0.4rem', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Наименование (напр: Футболка XL)"
                  className="form-input"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Штрихкод (EAN-13)"
                  className="form-input"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                  value={newItemBarcode}
                  onChange={(e) => setNewItemBarcode(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Артикул"
                  className="form-input"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem' }}
                  value={newItemSku}
                  onChange={(e) => setNewItemSku(e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Кол-во"
                  className="form-input"
                  style={{ padding: '0.35rem 0.5rem', fontSize: '0.8rem', textAlign: 'center' }}
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => handleAddItemToPlan()}
                  style={{ padding: '0.4rem 0.65rem', fontSize: '0.8rem', whiteSpace: 'nowrap', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                >
                  <Plus size={14} /> Добавить
                </button>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isSubmitting}
              style={{
                width: 'auto',
                background: isClientMode
                  ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                  : managerLaunchMode === 'receiving'
                  ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                  : 'linear-gradient(135deg, #10b981, #059669)',
                borderColor: 'transparent'
              }}
            >
              <CheckCircle2 size={16} />
              {isSubmitting
                ? 'Сохранение...'
                : isClientMode
                ? `📨 Отправить заявку на согласование (${totalPlannedQuantity} шт.)`
                : managerLaunchMode === 'receiving'
                ? `🟡 Запустить в приёмку на ТСД (${totalPlannedQuantity} шт.)`
                : `✅ Подтвердить слот и создать (${totalPlannedQuantity} шт.)`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
