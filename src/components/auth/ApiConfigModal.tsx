import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Server, CheckCircle2, Copy, Code2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiConfigModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { apiConfig, updateApiConfig } = useAuth();
  const [baseUrl, setBaseUrl] = useState(apiConfig.baseUrl);
  const [useMock, setUseMock] = useState(apiConfig.useMock);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateApiConfig({ baseUrl, useMock });
    onClose();
  };

  const mockApiContractJson = `{
  "POST /api/v1/auth/login": {
    "request": {
      "username": "operator",
      "password": "secret_password"
    },
    "response_200": {
      "user": {
        "id": "usr_op_01",
        "name": "Алексей Смирнов",
        "email": "operator@fulfillment.ru",
        "role": "operator | manager | client | admin",
        "clientId": "cl_9921 (опционально для роли client)"
      },
      "tokens": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6..."
      }
    }
  },
  "GET /api/v1/auth/me": {
    "headers": { "Authorization": "Bearer <accessToken>" },
    "response_200": {
      "id": "usr_op_01",
      "name": "Алексей Смирнов",
      "role": "operator"
    }
  }
}`;

  const copyContract = () => {
    navigator.clipboard.writeText(mockApiContractJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server size={20} color="#f59e0b" /> Настройка соединения с Бэкендом
          </h3>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Режим работы авторизации</label>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="radio"
                  name="useMock"
                  checked={useMock}
                  onChange={() => setUseMock(true)}
                />
                🟢 <b>Mock Mode</b> (Standalone-демо без сервера)
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                <input
                  type="radio"
                  name="useMock"
                  checked={!useMock}
                  onChange={() => setUseMock(false)}
                />
                🔵 <b>Real REST API</b> (Запросы к бэкенду)
              </label>
            </div>
          </div>

          {!useMock && (
            <div className="form-group">
              <label className="form-label">Base API URL бэкенд-сервера</label>
              <input
                type="url"
                className="form-input"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="http://localhost:8000/api/v1"
                required
                style={{ paddingLeft: '1rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.35rem', display: 'block' }}>
                Введите URL, где развернут API второго разработчика
              </span>
            </div>
          )}

          <div style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <span className="form-label" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Code2 size={16} /> JSON Контракт для Бэкендера:
              </span>
              <button type="button" className="btn-secondary" onClick={copyContract} style={{ fontSize: '0.75rem' }}>
                {copied ? <CheckCircle2 size={14} color="#10b981" /> : <Copy size={14} />}
                {copied ? 'Скопировано' : 'Копировать JSON'}
              </button>
            </div>
            <pre className="code-block">{mockApiContractJson}</pre>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
              Сохранить настройки
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
