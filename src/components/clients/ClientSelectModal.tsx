import React, { useState, useEffect } from 'react';
import { Client, CreateClientDto } from '../../types/client';
import { ClientService } from '../../services/clientService';
import { ClientCardModal } from './ClientCardModal';
import { X, Search, PlusCircle, Building2, Check, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelectClient: (client: Client) => void;
}

export const ClientSelectModal: React.FC<Props> = ({ isOpen, onClose, onSelectClient }) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadClients();
    }
  }, [isOpen, searchQuery]);

  const loadClients = async () => {
    setIsLoading(true);
    try {
      const data = await ClientService.getClients(searchQuery);
      setClients(data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCreateNewClient = async (dto: CreateClientDto) => {
    const created = await ClientService.createClient(dto);
    onSelectClient(created);
    setIsCreateModalOpen(false);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 600 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 color="var(--primary)" size={20} /> Выбор контрагента для поставки
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Перед началом сканирования выберите клиента или создайте нового
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Search & Add Bar */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <div className="input-with-icon" style={{ flex: 1 }}>
            <Search className="input-icon" size={18} />
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по ИНН или названию клиента..."
              autoFocus
            />
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setIsCreateModalOpen(true)}
            style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}
          >
            <PlusCircle size={16} /> Создать клиента
          </button>
        </div>

        {/* Client List selection */}
        <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {isLoading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Загрузка контрагентов...
            </div>
          ) : clients.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
              Контрагент не найден. Создайте нового нажатием кнопки выше.
            </div>
          ) : (
            clients.map((client) => (
              <div
                key={client.id}
                onClick={() => {
                  onSelectClient(client);
                  onClose();
                }}
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                className="role-pill"
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{client.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '1rem', marginTop: '0.2rem' }}>
                    <span>ИНН: <b>{client.requisites.inn}</b></span>
                    <span>Контакт: {client.contact.contactPerson || '—'}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Выбрать</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal for creating a new client on the fly */}
      <ClientCardModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateNewClient}
      />
    </div>
  );
};
