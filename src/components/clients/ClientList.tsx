import React, { useState, useEffect } from 'react';
import { Client, CreateClientDto } from '../../types/client';
import { ClientService } from '../../services/clientService';
import { ShipmentService } from '../../services/shipmentService';
import { ActService } from '../../services/actService';
import { Shipment } from '../../types/shipment';
import { Act } from '../../types/act';
import { ClientCardModal } from './ClientCardModal';
import {
  Users,
  Search,
  PlusCircle,
  Building2,
  Phone,
  Mail,
  Edit,
  Trash2,
  PackagePlus,
  CreditCard,
  CheckCircle2,
  FileText,
  TrendingUp,
  Loader2
} from 'lucide-react';

interface Props {
  onSelectClientForShipment?: (client: Client) => void;
  onNavigateTab?: (tab: 'dashboard' | 'clients' | 'acts' | 'documents') => void;
}

export const ClientList: React.FC<Props> = ({ onSelectClientForShipment, onNavigateTab }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [acts, setActs] = useState<Act[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [clientsData, shipmentsData, actsData] = await Promise.all([
        ClientService.getClients(searchQuery),
        ShipmentService.getShipments(),
        ActService.getActs()
      ]);
      setClients(clientsData);
      setShipments(shipmentsData);
      setActs(actsData);
    } catch (err: any) {
      setError(err.message || 'Не удалось загрузить данные');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, [searchQuery]);

  const activeShipments = shipments.filter((s) => s.status !== 'completed');
  const readyOrShippedCount = shipments.filter((s) => s.status === 'ready_to_ship' || s.status === 'shipped').length;
  const totalRevenue = acts.reduce((acc, a) => acc + (a.totalSum || 0), 0);

  const handleCreateNew = () => {
    setEditingClient(null);
    setIsModalOpen(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setIsModalOpen(true);
  };

  const handleDelete = async (client: Client) => {
    if (window.confirm(`Вы действительно хотите удалить контрагента "${client.name}"?`)) {
      try {
        await ClientService.deleteClient(client.id);
        fetchAllData();
      } catch (err: any) {
        alert(err.message || 'Ошибка при удалении клиента');
      }
    }
  };

  const handleSaveClient = async (dto: CreateClientDto) => {
    if (editingClient) {
      await ClientService.updateClient(editingClient.id, dto);
    } else {
      await ClientService.createClient(dto);
    }
    fetchAllData();
  };

  return (
    <div className="dashboard-container">
      {/* Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users color="var(--primary)" size={24} /> Справочник Клиентов (Контрагентов)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Управление реквизитами селлеров для оформления приёмки, коробок и Актов выполненных работ
          </p>
        </div>

        <button className="btn-primary" onClick={handleCreateNew} style={{ width: 'auto' }}>
          <PlusCircle size={18} /> Добавить контрагента
        </button>
      </div>

      {/* Top Stats Cards with Active Navigation Links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div className="card" style={{ marginBottom: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Активных поставщиков</span>
            <Users size={20} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
            {clients.length} контрагентов
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            В базе: {clients.length} компаний
          </span>
        </div>

        <div
          className="card"
          style={{ marginBottom: 0, cursor: onNavigateTab ? 'pointer' : 'default' }}
          onClick={() => onNavigateTab?.('dashboard')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Поставок в работе склада</span>
            <TrendingUp size={20} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
            {activeShipments.length} в работе
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
            {onNavigateTab ? 'Перейти к поставкам →' : `${readyOrShippedCount} готовы к расчету`}
          </span>
        </div>

        <div
          className="card"
          style={{ marginBottom: 0, cursor: onNavigateTab ? 'pointer' : 'default' }}
          onClick={() => onNavigateTab?.('acts')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
            <span>Сформировано Актов</span>
            <FileText size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
            {acts.length} актов
          </div>
          <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>
            {onNavigateTab ? 'Открыть реестр актов →' : `${totalRevenue.toLocaleString()} сом/руб. выручки`}
          </span>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="input-with-icon">
          <Search className="input-icon" size={18} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по наименованию компании, ИНН, ФИО контактера или телефону..."
          />
        </div>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto 0.5rem' }} color="var(--primary)" />
            Загрузка списка клиентов...
          </div>
        ) : error ? (
          <div style={{ padding: '2rem', color: '#f43f5e', textAlign: 'center' }}>
            {error}
          </div>
        ) : clients.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            По вашему запросу клиентов не найдено. Нажмите «Добавить контрагента», чтобы внести нового клиента.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '1rem 1.25rem' }}>Контрагент</th>
                  <th style={{ padding: '1rem 1rem' }}>ИНН / КПП</th>
                  <th style={{ padding: '1rem 1rem' }}>Контактное лицо</th>
                  <th style={{ padding: '1rem 1rem' }}>Банк и счет</th>
                  <th style={{ padding: '1rem 1rem' }}>Поставки</th>
                  <th style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    style={{
                      borderBottom: '1px solid rgba(51, 65, 85, 0.5)',
                      transition: 'background 0.15s ease'
                    }}
                    className="table-row-hover"
                  >
                    {/* Column 1: Client Name & Legal Type */}
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{client.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        {client.requisites.fullName}
                      </div>
                    </td>

                    {/* Column 2: INN & KPP */}
                    <td style={{ padding: '1rem 1rem', fontFamily: 'var(--font-mono)' }}>
                      <div>ИНН: <span style={{ color: 'var(--primary)' }}>{client.requisites.inn}</span></div>
                      {client.requisites.kpp && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          КПП: {client.requisites.kpp}
                        </div>
                      )}
                    </td>

                    {/* Column 3: Contact Person */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <div style={{ fontWeight: 500 }}>{client.contact.contactPerson || '—'}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                        {client.contact.phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Phone size={12} /> {client.contact.phone}
                          </span>
                        )}
                        {client.contact.email && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Mail size={12} /> {client.contact.email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Column 4: Banking Requisites */}
                    <td style={{ padding: '1rem 1rem', fontSize: '0.8rem' }}>
                      <div style={{ fontWeight: 500, color: '#93c5fd' }}>
                        {client.requisites.bankName || 'Не указан'}
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        р/с: {client.requisites.checkingAccount || '—'}
                      </div>
                    </td>

                    {/* Column 5: Shipments & Stats */}
                    <td style={{ padding: '1rem 1rem' }}>
                      <span className="badge badge-operator">
                        {client.activeShipmentsCount || 0} в работе
                      </span>
                    </td>

                    {/* Column 6: Actions */}
                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        {onSelectClientForShipment && (
                          <button
                            className="btn-primary"
                            onClick={() => onSelectClientForShipment(client)}
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', width: 'auto' }}
                            title="Создать поставку для этого клиента"
                          >
                            <PackagePlus size={14} /> Выбрать
                          </button>
                        )}

                        <button
                          className="btn-secondary"
                          onClick={() => handleEdit(client)}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          title="Редактировать карточку реквизитов"
                        >
                          <Edit size={14} /> Редактировать
                        </button>

                        <button
                          className="btn-secondary"
                          onClick={() => handleDelete(client)}
                          style={{ padding: '0.35rem 0.5rem', fontSize: '0.78rem', borderColor: 'rgba(244,63,94,0.3)', color: '#f43f5e' }}
                          title="Удалить контрагента"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Client Card Form */}
      <ClientCardModal
        isOpen={isModalOpen}
        clientToEdit={editingClient}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveClient}
      />
    </div>
  );
};
