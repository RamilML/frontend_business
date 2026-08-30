import React, { useState, useEffect } from 'react';
import { Act, ActServiceItem, ActExecutorRequisites } from '../../types/act';
import { Client } from '../../types/client';
import { Shipment } from '../../types/shipment';
import { ActService, OFFICIAL_EXECUTOR_REQUISITES } from '../../services/actService';
import { ClientService } from '../../services/clientService';
import { useAuth } from '../../context/AuthContext';
import {
  FileText,
  Printer,
  Save,
  PlusCircle,
  Trash2,
  Building2,
  CheckCircle2,
  ArrowLeft,
  Copy,
  Calculator,
  RefreshCw
} from 'lucide-react';

interface Props {
  shipment?: Shipment | null;
  actToEdit?: Act | null;
  onBack: () => void;
  onSaved?: () => void;
}

export const ActGeneratorScreen: React.FC<Props> = ({ shipment, actToEdit, onBack, onSaved }) => {
  const { user } = useAuth();

  const [actNumber, setActNumber] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [operatorName, setOperatorName] = useState<string>(user?.name || 'Алексей Смирнов');

  // Client Selection & Requisites
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientRequisitesText, setClientRequisitesText] = useState<string>('');

  // Executor Requisites (Bishkek)
  const [executorReqs, setExecutorReqs] = useState<ActExecutorRequisites>(OFFICIAL_EXECUTOR_REQUISITES);

  // Service Table Items (13 Standard Services + Custom)
  const [serviceItems, setServiceItems] = useState<ActServiceItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Load clients
    ClientService.getClients().then((data) => {
      setClients(data);

      if (actToEdit) {
        setActNumber(actToEdit.actNumber);
        setDate(actToEdit.date);
        setOperatorName(actToEdit.operatorName);
        setSelectedClientId(actToEdit.clientId);
        setClientName(actToEdit.clientName);
        setClientRequisitesText(actToEdit.clientRequisitesText);
        setServiceItems(actToEdit.items);
      } else {
        const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const defaultNum = `АКТ-${today}-${Math.floor(10 + Math.random() * 90)}`;
        setActNumber(defaultNum);

        // Pre-fill client from shipment or first client
        const targetClient = shipment
          ? data.find((c) => c.id === shipment.clientId) || data[0]
          : data[0];

        if (targetClient) {
          setSelectedClientId(targetClient.id);
          setClientName(targetClient.name);
          setClientRequisitesText(
            `Заказчик: ${targetClient.requisites.fullName || targetClient.name}, ИНН: ${targetClient.requisites.inn}${targetClient.requisites.kpp ? `, КПП: ${targetClient.requisites.kpp}` : ''}, Адрес: ${targetClient.requisites.legalAddress}, р/с: ${targetClient.requisites.checkingAccount} в ${targetClient.requisites.bankName}, БИК: ${targetClient.requisites.bik}`
          );
        }

        // Calculate initial quantities from shipment
        const totalItems = shipment ? shipment.items.reduce((a, c) => a + c.scannedQuantity, 0) || 50 : 50;
        const totalBoxes = shipment ? shipment.boxes.length || 2 : 2;
        setServiceItems(ActService.getInitialServicesForShipment(totalItems, totalBoxes));
      }
    });
  }, [shipment, actToEdit]);

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client) {
      setClientName(client.name);
      setClientRequisitesText(
        `Заказчик: ${client.requisites.fullName || client.name}, ИНН: ${client.requisites.inn}${client.requisites.kpp ? `, КПП: ${client.requisites.kpp}` : ''}, Адрес: ${client.requisites.legalAddress}, р/с: ${client.requisites.checkingAccount} в ${client.requisites.bankName}, БИК: ${client.requisites.bik}`
      );
    }
  };

  // Toggle Service Checkbox (Column 1)
  const toggleServiceEnabled = (id: string) => {
    setServiceItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  // Update Price (Column 2)
  const updateServicePrice = (id: string, price: number) => {
    setServiceItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, price: Math.max(0, price), amount: Math.max(0, price) * item.quantity }
          : item
      )
    );
  };

  // Update Quantity (Column 3)
  const updateServiceQuantity = (id: string, quantity: number) => {
    setServiceItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(0, quantity), amount: item.price * Math.max(0, quantity) }
          : item
      )
    );
  };

  // Duplicate / Multiply service line
  const handleDuplicateService = (itemToDuplicate: ActServiceItem) => {
    const newItem: ActServiceItem = {
      ...itemToDuplicate,
      id: `act_srv_dup_${Date.now()}`,
      name: `${itemToDuplicate.name} (доп. объем)`,
      isCustom: true
    };
    setServiceItems((prev) => [...prev, newItem]);
  };

  // Add custom service line (adds to top of list for instant visibility)
  const handleAddCustomService = () => {
    const newItem: ActServiceItem = {
      id: `act_srv_custom_${Date.now()}`,
      code: 'custom',
      name: 'Новая услуга (ручная)',
      defaultPrice: 100,
      price: 100,
      quantity: 1,
      amount: 100,
      enabled: true,
      isCustom: true
    };
    setServiceItems((prev) => [newItem, ...prev]);
  };

  const handleDeleteServiceLine = (id: string) => {
    setServiceItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetToDefaultServices = () => {
    if (window.confirm('Восстановить базовый перечень из 13 услуг фулфилмента?')) {
      const totalItems = shipment ? shipment.items.reduce((a, c) => a + c.scannedQuantity, 0) || 50 : 50;
      const totalBoxes = shipment ? shipment.boxes.length || 2 : 2;
      setServiceItems(ActService.getInitialServicesForShipment(totalItems, totalBoxes));
    }
  };

  // Calculate TOTAL SUM of all active enabled services
  const totalSum = serviceItems
    .filter((i) => i.enabled)
    .reduce((acc, item) => acc + item.amount, 0);

  const handleSaveAct = async () => {
    if (!actNumber.trim()) {
      alert('Укажите номер акта');
      return;
    }

    setIsSubmitting(true);
    try {
      const actData = {
        actNumber,
        shipmentId: shipment?.id,
        shipmentNumber: shipment?.shipmentNumber,
        date,
        operatorName,
        clientId: selectedClientId,
        clientName,
        clientRequisitesText,
        executorRequisites: executorReqs,
        items: serviceItems,
        totalSum,
        status: 'signed' as const
      };

      if (actToEdit) {
        await ActService.updateAct(actToEdit.id, actData);
      } else {
        await ActService.createAct(actData);
      }

      alert(`Акт выполненных работ ${actNumber} на сумму ${totalSum.toLocaleString()} сом/руб. успешно сохранен!`);
      if (onSaved) onSaved();
      else onBack();
    } catch (err: any) {
      alert(err.message || 'Ошибка сохранения акта');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="dashboard-container">
      {/* Top Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }} className="no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 0.75rem' }}>
            <ArrowLeft size={16} /> Назад
          </button>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText color="var(--primary)" size={24} /> Интерактивный Акт Выполненных Работ
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Формирование спецификации 13 услуг, цен и реквизитов (п. 11 ТЗ)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn-secondary" onClick={handlePrint}>
            <Printer size={16} /> Печать / PDF
          </button>
          <button className="btn-primary" onClick={handleSaveAct} disabled={isSubmitting} style={{ width: 'auto' }}>
            <Save size={16} /> {isSubmitting ? 'Сохранение...' : 'Сохранить Акт'}
          </button>
        </div>
      </div>

      {/* Printable / Editable Document Canvas */}
      <div className="card print-document" style={{ padding: '2rem' }}>
        
        {/* Header Fields Section (п. 11 ТЗ) */}
        <div style={{ borderBottom: '2px solid var(--border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Номер Акта *</label>
              <input
                type="text"
                className="form-input"
                value={actNumber}
                onChange={(e) => setActNumber(e.target.value)}
                style={{ paddingLeft: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Дата акта *</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ paddingLeft: '0.75rem' }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Имя оператора (Сдал) *</label>
              <input
                type="text"
                className="form-input"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                style={{ paddingLeft: '0.75rem' }}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Выбор Контрагента *</label>
              <select
                className="form-input"
                value={selectedClientId}
                onChange={(e) => handleClientChange(e.target.value)}
                style={{ paddingLeft: '0.75rem' }}
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (ИНН: {c.requisites.inn})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 13 Standard Services Interactive Table */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calculator size={18} color="var(--primary)" /> Перечень выполненных услуг (13 стандартных пунктов + кастом)
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn-secondary no-print"
                onClick={handleResetToDefaultServices}
                style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                title="Восстановить стандартные 13 услуг"
              >
                <RefreshCw size={13} /> 13 базовых услуг
              </button>
              <button
                type="button"
                className="btn-primary no-print"
                onClick={handleAddCustomService}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', width: 'auto', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <PlusCircle size={14} /> + Добавить услугу
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.8)', borderBottom: '2px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem', width: 40 }} className="no-print">Вкл</th>
                  <th style={{ padding: '0.75rem' }}>1. Выполненная услуга</th>
                  <th style={{ padding: '0.75rem', width: 140 }}>2. Цена (сом/руб)</th>
                  <th style={{ padding: '0.75rem', width: 140 }}>3. Количество</th>
                  <th style={{ padding: '0.75rem', width: 160, textAlign: 'right' }}>4. Сумма</th>
                  <th style={{ padding: '0.75rem', width: 60, textAlign: 'center' }} className="no-print">Действия</th>
                </tr>
              </thead>
              <tbody>
                {serviceItems.map((item) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
                      opacity: item.enabled ? 1 : 0.45,
                      background: item.enabled ? 'transparent' : 'rgba(0,0,0,0.2)'
                    }}
                  >
                    {/* Checkbox (Column 1 toggle) */}
                    <td style={{ padding: '0.75rem', textAlign: 'center' }} className="no-print">
                      <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={() => toggleServiceEnabled(item.id)}
                        style={{ width: 18, height: 18, cursor: 'pointer' }}
                      />
                    </td>

                    {/* Service Name */}
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="text"
                        className="form-input"
                        value={item.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setServiceItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, name: val, enabled: true } : i))
                          );
                        }}
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.85rem',
                          fontWeight: item.enabled ? 600 : 400,
                          background: item.enabled ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.4)',
                          borderColor: item.enabled ? 'var(--border)' : 'rgba(51, 65, 85, 0.3)'
                        }}
                      />
                    </td>

                    {/* Price (Column 2 - Editable) */}
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={item.price || ''}
                        onFocus={(e) => {
                          if (!item.enabled) toggleServiceEnabled(item.id);
                          e.target.select();
                        }}
                        onChange={(e) => updateServicePrice(item.id, Number(e.target.value))}
                        placeholder="0"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.85rem',
                          width: '100%',
                          fontFamily: 'var(--font-mono)',
                          background: item.enabled ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.4)'
                        }}
                      />
                    </td>

                    {/* Quantity (Column 3 - Editable) */}
                    <td style={{ padding: '0.75rem' }}>
                      <input
                        type="number"
                        className="form-input"
                        value={item.quantity || ''}
                        onFocus={(e) => {
                          if (!item.enabled) toggleServiceEnabled(item.id);
                          e.target.select();
                        }}
                        onChange={(e) => updateServiceQuantity(item.id, Number(e.target.value))}
                        min={0}
                        placeholder="0"
                        style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.85rem',
                          width: '100%',
                          fontFamily: 'var(--font-mono)',
                          background: item.enabled ? 'rgba(30, 41, 59, 0.6)' : 'rgba(15, 23, 42, 0.4)'
                        }}
                      />
                    </td>

                    {/* Amount (Column 4 - Auto calculated) */}
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, fontFamily: 'var(--font-mono)', color: item.enabled ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {item.enabled ? item.amount.toLocaleString() : 0}
                    </td>

                    {/* Duplicate / Multiplier button */}
                    <td style={{ padding: '0.75rem', textAlign: 'center' }} className="no-print">
                      <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleDuplicateService(item)}
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem' }}
                          title="Продублировать услугу"
                        >
                          <Copy size={12} />
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => handleDeleteServiceLine(item.id)}
                          style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: '#f43f5e' }}
                          title="Удалить услугу из акта"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* TOTAL SUM ROW */}
                <tr style={{ background: 'rgba(245, 158, 11, 0.1)', borderTop: '2px solid var(--primary)' }}>
                  <td colSpan={4} style={{ padding: '1rem', fontWeight: 700, fontSize: '1.1rem', textAlign: 'right' }}>
                    ИТОГО К ОПЛАТЕ:
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 800, fontSize: '1.3rem', color: 'var(--primary)', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                    {totalSum.toLocaleString()} сом / руб.
                  </td>
                  <td className="no-print"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Requisites Section (п. 11 ТЗ) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', paddingTop: '1.25rem', borderTop: '2px solid var(--border)' }}>
          {/* Executor Details (Bishkek) */}
          <div style={{ fontSize: '0.82rem', background: 'rgba(15,23,42,0.5)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Исполнитель:
            </div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{executorReqs.companyName}</div>
            <div style={{ marginTop: '0.25rem' }}>Юридический адрес: {executorReqs.legalAddress}</div>
            <div style={{ marginTop: '0.25rem' }}>ИНН/КПП: <b>{executorReqs.innKpp}</b></div>
            <div style={{ marginTop: '0.25rem' }}>Расчетный счет: <b>{executorReqs.checkingAccount}</b></div>
            <div>Кор. счет: {executorReqs.corrAccount}</div>
            <div>Банк: <b>{executorReqs.bankName}</b> SWIFT: {executorReqs.swiftCode}</div>
            <div>БИК: <b>{executorReqs.bik}</b></div>
            <div style={{ marginTop: '0.25rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Корр.банк: {executorReqs.corrBank}, БИК {executorReqs.corrBankBik}, К/с: {executorReqs.corrBankKs}
            </div>

            <div style={{ marginTop: '2rem', fontWeight: 600 }}>
              Сдал: ___________________ / {operatorName}
            </div>
          </div>

          {/* Client Details */}
          <div style={{ fontSize: '0.82rem', background: 'rgba(15,23,42,0.5)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Заказчик (Контрагент):
            </div>
            <textarea
              className="form-input"
              value={clientRequisitesText}
              onChange={(e) => setClientRequisitesText(e.target.value)}
              rows={6}
              style={{ fontSize: '0.82rem', padding: '0.5rem', height: 'auto' }}
            />

            <div style={{ marginTop: '2rem', fontWeight: 600 }}>
              Принял: ___________________ / {clientName}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
