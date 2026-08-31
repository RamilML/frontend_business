import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types/auth';
import { ActExecutorRequisites } from '../../types/act';
import { Client } from '../../types/client';
import { ClientService } from '../../services/clientService';
import {
  AdminService,
  TariffItem,
  WarehouseGate,
  IntegrationItem
} from '../../services/adminService';
import {
  ShieldAlert,
  ShieldCheck,
  UserCog,
  Users,
  Key,
  Settings,
  UserPlus,
  PlusCircle,
  Edit2,
  Trash2,
  DollarSign,
  Building2,
  Lock,
  Unlock,
  CheckCircle2,
  Search,
  DownloadCloud,
  RefreshCw,
  Layers,
  Sparkles,
  HelpCircle,
  Warehouse,
  Truck,
  FileText,
  Save,
  X,
  Radio,
  ExternalLink,
  Eye,
  EyeOff,
  Activity,
  AlertCircle
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'users' | 'tariffs' | 'requisites' | 'system'>('users');
  
  // Data States
  const [users, setUsers] = useState<User[]>([]);
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [requisites, setRequisites] = useState<ActExecutorRequisites>(AdminService.getRequisites());
  const [gates, setGates] = useState<WarehouseGate[]>([]);
  const [integrations, setIntegrations] = useState<IntegrationItem[]>([]);
  const [clients, setClients] = useState<Client[]>([]);

  // Search & Filters
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [tariffSearch, setTariffSearch] = useState('');
  const [tariffCategoryFilter, setTariffCategoryFilter] = useState<string>('all');

  // Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<{
    name: string;
    username: string;
    email: string;
    role: UserRole;
    phone: string;
    clientId: string;
  }>({
    name: '',
    username: '',
    email: '',
    role: 'operator',
    phone: '',
    clientId: ''
  });

  const [isTariffModalOpen, setIsTariffModalOpen] = useState(false);
  const [tariffForm, setTariffForm] = useState<{
    code: string;
    name: string;
    category: 'inbound' | 'processing' | 'packaging' | 'logistics';
    unit: string;
    defaultPrice: number;
    description: string;
  }>({
    code: '',
    name: '',
    category: 'processing',
    unit: 'за 1 шт.',
    defaultPrice: 10,
    description: ''
  });

  // Integration Config Modal
  const [isIntegrationModalOpen, setIsIntegrationModalOpen] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<IntegrationItem | null>(null);
  const [isCreatingIntegration, setIsCreatingIntegration] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [pingResult, setPingResult] = useState<{ success: boolean; message: string } | null>(null);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const loadData = () => {
    setUsers(AdminService.getUsers());
    setTariffs(AdminService.getTariffs());
    setRequisites(AdminService.getRequisites());
    setGates(AdminService.getGates());
    setIntegrations(AdminService.getIntegrations());
    ClientService.getClients().then(setClients);
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  // --- Users Handlers ---
  const handleOpenCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      name: '',
      username: '',
      email: '',
      role: 'operator',
      phone: '',
      clientId: clients[0]?.id || ''
    });
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUser(u);
    setUserForm({
      name: u.name,
      username: u.username,
      email: u.email,
      role: u.role,
      phone: u.phone || '',
      clientId: u.clientId || ''
    });
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    const matchedClient = clients.find((c) => c.id === userForm.clientId);
    const clientName = userForm.role === 'client' && matchedClient ? matchedClient.name : undefined;

    if (editingUser) {
      AdminService.updateUser(editingUser.id, {
        ...userForm,
        clientName: clientName
      });
      showNotification(`Пользователь "${userForm.name}" успешно обновлен`);
    } else {
      AdminService.createUser({
        ...userForm,
        clientName: clientName
      });
      showNotification(`Пользователь "${userForm.name}" успешно зарегистрирован`);
    }
    setIsUserModalOpen(false);
    loadData();
  };

  const handleToggleUserStatus = (u: User) => {
    const updated = AdminService.updateUser(u.id, { isActive: !u.isActive });
    showNotification(`Аккаунт ${u.name} ${updated.isActive ? 'активирован' : 'заблокирован'}`);
    loadData();
  };

  const handleDeleteUser = (u: User) => {
    if (window.confirm(`Вы уверены, что хотите удалить пользователя "${u.name}"?`)) {
      AdminService.deleteUser(u.id);
      showNotification(`Пользователь ${u.name} удален`);
      loadData();
    }
  };

  const handleResetPassword = (u: User) => {
    alert(`Временный пароль для пользователя ${u.username} сброшен на: TempPass${Math.floor(100 + Math.random() * 900)}!`);
    showNotification(`Пароль для ${u.name} успешно сброшен`);
  };

  // --- Tariffs Handlers ---
  const handlePriceChange = (id: string, newPrice: number) => {
    AdminService.updateTariff(id, { defaultPrice: Math.max(0, newPrice) });
    setTariffs(AdminService.getTariffs());
  };

  const handleSaveCustomTariff = (e: React.FormEvent) => {
    e.preventDefault();
    AdminService.addCustomTariff({
      ...tariffForm,
      isDefaultEnabled: true
    });
    showNotification(`Услуга "${tariffForm.name}" добавлена в тарифную сетку`);
    setIsTariffModalOpen(false);
    loadData();
  };

  // --- Requisites Handlers ---
  const handleSaveRequisites = (e: React.FormEvent) => {
    e.preventDefault();
    AdminService.saveRequisites(requisites);
    showNotification('Официальные реквизиты Исполнителя успешно сохранены');
  };

  // --- Gates Handlers ---
  const handleToggleGate = (id: string) => {
    const updated = gates.map((g) => (g.id === id ? { ...g, isActive: !g.isActive } : g));
    AdminService.saveGates(updated);
    setGates(updated);
    showNotification('Статус складских ворот обновлен');
  };

  // --- Integrations Handlers ---
  const handleOpenEditIntegration = (item: IntegrationItem) => {
    setEditingIntegration({ ...item });
    setIsCreatingIntegration(false);
    setShowApiKey(false);
    setPingResult(null);
    setIsIntegrationModalOpen(true);
  };

  const handleOpenCreateIntegration = () => {
    setEditingIntegration({
      id: `int_${Date.now()}`,
      name: '',
      code: 'custom',
      category: 'marketplace',
      status: 'not_configured',
      description: '',
      apiKey: '',
      apiUrl: '',
      extraParam: '',
      isEnabled: true
    });
    setIsCreatingIntegration(true);
    setShowApiKey(true);
    setPingResult(null);
    setIsIntegrationModalOpen(true);
  };

  const handleTestIntegrationPing = async () => {
    if (!editingIntegration) return;
    setIsTestingPing(true);
    setPingResult(null);
    try {
      const res = await AdminService.testIntegrationPing(editingIntegration.id);
      setPingResult(res);
    } catch {
      setPingResult({ success: false, message: 'Ошибка сети / таймаут соединения' });
    } finally {
      setIsTestingPing(false);
    }
  };

  const handleSaveIntegration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIntegration) return;

    if (isCreatingIntegration) {
      AdminService.addIntegration({
        ...editingIntegration,
        status: editingIntegration.apiKey?.trim() ? 'connected' : 'not_configured'
      });
      showNotification(`Интеграция "${editingIntegration.name}" успешно добавлена`);
    } else {
      AdminService.updateIntegration(editingIntegration.id, {
        ...editingIntegration,
        status: editingIntegration.apiKey?.trim() ? 'connected' : 'not_configured'
      });
      showNotification(`Настройки интеграции "${editingIntegration.name}" сохранены`);
    }
    setIsIntegrationModalOpen(false);
    loadData();
  };

  // --- Backup Handler ---
  const handleDownloadBackup = () => {
    const json = AdminService.exportFullSystemBackup();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ff-assistant-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Резервная копия базы данных успешно скачана');
  };

  // Filters
  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase().trim();
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.clientName && u.clientName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredTariffs = tariffs.filter((t) => {
    if (tariffCategoryFilter !== 'all' && t.category !== tariffCategoryFilter) return false;
    if (tariffSearch.trim()) {
      const q = tariffSearch.toLowerCase().trim();
      return t.name.toLowerCase().includes(q) || t.code.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="badge badge-admin">👑 Главный Админ</span>;
      case 'manager':
        return <span className="badge badge-manager">👔 Менеджер</span>;
      case 'operator':
        return <span className="badge badge-operator">📱 Оператор ТСД</span>;
      case 'client':
        return <span className="badge badge-client">👤 Селлер (Клиент)</span>;
      default:
        return <span className="badge">{role}</span>;
    }
  };

  const getCategoryBadge = (cat: TariffItem['category']) => {
    switch (cat) {
      case 'inbound':
        return <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>📥 Приёмка</span>;
      case 'processing':
        return <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' }}>🏷️ Обработка</span>;
      case 'packaging':
        return <span className="badge" style={{ background: 'rgba(139, 92, 246, 0.15)', color: '#c4b5fd', border: '1px solid rgba(139, 92, 246, 0.3)' }}>📦 Упаковка</span>;
      case 'logistics':
        return <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }}>🚚 Логистика</span>;
    }
  };

  return (
    <div>
      {/* Sleek Sub-header Navigation Bar for Admin */}
      <div 
        style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '0.6rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          overflowX: 'auto',
          position: 'sticky',
          top: 64,
          zIndex: 40
        }}
      >
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', minWidth: 'max-content' }}>
          {/* Tab 1: Users */}
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'users' ? '1px solid rgba(244, 63, 94, 0.45)' : '1px solid transparent',
              background: activeTab === 'users' ? 'rgba(244, 63, 94, 0.15)' : 'transparent',
              color: activeTab === 'users' ? '#fb7185' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'users' ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.18s ease'
            }}
          >
            <UserCog size={15} color={activeTab === 'users' ? '#fb7185' : 'currentColor'} />
            <span>Пользователи и Доступ</span>
            <span
              style={{
                background: activeTab === 'users' ? 'rgba(244, 63, 94, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                color: activeTab === 'users' ? '#fb7185' : 'var(--text-muted)',
                fontSize: '0.7rem',
                fontWeight: 600,
                padding: '0.05rem 0.4rem',
                borderRadius: 999
              }}
            >
              {users.length}
            </span>
          </button>

          {/* Tab 2: Tariffs */}
          <button
            type="button"
            onClick={() => setActiveTab('tariffs')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'tariffs' ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid transparent',
              background: activeTab === 'tariffs' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
              color: activeTab === 'tariffs' ? '#fbbf24' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'tariffs' ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.18s ease'
            }}
          >
            <DollarSign size={15} color={activeTab === 'tariffs' ? '#fbbf24' : 'currentColor'} />
            <span>Тарифная сетка ({tariffs.length} услуг)</span>
          </button>

          {/* Tab 3: Requisites */}
          <button
            type="button"
            onClick={() => setActiveTab('requisites')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'requisites' ? '1px solid rgba(139, 92, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'requisites' ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
              color: activeTab === 'requisites' ? '#c4b5fd' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'requisites' ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.18s ease'
            }}
          >
            <Building2 size={15} color={activeTab === 'requisites' ? '#c4b5fd' : 'currentColor'} />
            <span>Реквизиты Исполнителя</span>
          </button>

          {/* Tab 4: System & Warehouse */}
          <button
            type="button"
            onClick={() => setActiveTab('system')}
            style={{
              padding: '0.45rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: activeTab === 'system' ? '1px solid rgba(59, 130, 246, 0.45)' : '1px solid transparent',
              background: activeTab === 'system' ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
              color: activeTab === 'system' ? '#93c5fd' : 'var(--text-muted)',
              fontSize: '0.84rem',
              fontWeight: activeTab === 'system' ? 600 : 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.18s ease'
            }}
          >
            <Settings size={15} color={activeTab === 'system' ? '#93c5fd' : 'currentColor'} />
            <span>Складские зоны и БД</span>
          </button>
        </div>

        {/* Quick Right-side Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Права доступа: <b style={{ color: '#fb7185' }}>Root Administrator</b>
          </span>
        </div>
      </div>

      <div className="dashboard-container">
        {/* Success Notification Alert */}
        {saveSuccessMsg && (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid #10b981',
              color: '#34d399',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          >
            <CheckCircle2 size={18} color="#10b981" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* TAB 1: USERS & ACCESS */}
        {activeTab === 'users' && (
          <div>
            {/* Header Bar */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <UserCog color="#f43f5e" size={24} /> Управление Пользователями и Доступом
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Создание аккаунтов сотрудников склада, выдача доступов клиентам-селлерам и управление ролями
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn-secondary" onClick={loadData} title="Обновить список">
                  <RefreshCw size={16} /> Обновить
                </button>
                <button
                  className="btn-primary"
                  onClick={handleOpenCreateUser}
                  style={{
                    width: 'auto',
                    background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                    color: '#fff',
                    boxShadow: '0 4px 15px rgba(244, 63, 94, 0.35)',
                    border: 'none'
                  }}
                >
                  <UserPlus size={16} /> Добавить пользователя
                </button>
              </div>
            </div>

            {/* Top Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Всего аккаунтов</span>
                  <Users size={20} color="#f43f5e" />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
                  {users.length} пользователей
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Активны: {users.filter((u) => u.isActive).length} аккаунтов
                </span>
              </div>

              <div className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Сотрудников склада</span>
                  <ShieldCheck size={20} color="var(--primary)" />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
                  {users.filter((u) => u.role === 'operator' || u.role === 'manager').length} чел.
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>
                  Операторы и Менеджеры
                </span>
              </div>

              <div className="card" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)' }}>
                  <span>Клиентов (Селлеров)</span>
                  <Building2 size={20} color="#8b5cf6" />
                </div>
                <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '0.4rem' }}>
                  {users.filter((u) => u.role === 'client').length} селлеров
                </div>
                <span style={{ fontSize: '0.75rem', color: '#c4b5fd' }}>
                  С привязкой к контрагентам
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="input-with-icon" style={{ flex: 1, minWidth: 260 }}>
                <Search className="input-icon" size={16} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Поиск по ФИО, логину, email или названию компании..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem 0.45rem 2.2rem', fontSize: '0.85rem' }}
                />
              </div>

              <select
                className="form-input"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              >
                <option value="all">Все роли ({users.length})</option>
                <option value="operator">📱 Операторы ТСД</option>
                <option value="manager">👔 Менеджеры</option>
                <option value="client">👤 Клиенты (Селлеры)</option>
                <option value="admin">👑 Администраторы</option>
              </select>
            </div>

            {/* Users Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 900, borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>ФИО / Имя аккаунта</th>
                      <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>Логин / Email</th>
                      <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>Роль доступа</th>
                      <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>Привязка к контрагенту</th>
                      <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>Статус</th>
                      <th style={{ padding: '0.75rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u) => (
                      <tr key={u.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                        {/* Name */}
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{u.name}</div>
                          {u.phone && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.phone}</div>}
                        </td>

                        {/* Login & Email */}
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)' }}>
                            @{u.username}
                          </span>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </td>

                        {/* Role */}
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          {getRoleBadge(u.role)}
                        </td>

                        {/* Client binding */}
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          {u.role === 'client' && u.clientName ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c4b5fd', fontWeight: 500 }}>
                              <Building2 size={14} color="#8b5cf6" />
                              <span>{u.clientName}</span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>— (Внутренний персонал)</span>
                          )}
                        </td>

                        {/* Status */}
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          {u.isActive ? (
                            <span style={{ color: '#34d399', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              ● Активен
                            </span>
                          ) : (
                            <span style={{ color: '#f43f5e', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                              ● Заблокирован
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => handleResetPassword(u)}
                              style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem' }}
                              title="Сбросить пароль"
                            >
                              <Key size={13} />
                            </button>

                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => handleToggleUserStatus(u)}
                              style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem', color: u.isActive ? '#f59e0b' : '#34d399' }}
                              title={u.isActive ? 'Заблокировать аккаунт' : 'Разблокировать аккаунт'}
                            >
                              {u.isActive ? <Lock size={13} /> : <Unlock size={13} />}
                            </button>

                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => handleOpenEditUser(u)}
                              style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem', color: '#38bdf8' }}
                              title="Редактировать пользователя"
                            >
                              <Edit2 size={13} />
                            </button>

                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => handleDeleteUser(u)}
                              style={{ padding: '0.35rem 0.55rem', fontSize: '0.78rem', color: '#f43f5e' }}
                              title="Удалить аккаунт"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TARIFFS & PRICING */}
        {activeTab === 'tariffs' && (
          <div>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <DollarSign color="var(--primary)" size={24} /> Тарифная Сетка и Прайс-лист Фулфилмента
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Базовые расценки на 13 операций фулфилмента, автоматически подставляемые в Акты выполненных работ
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn-primary"
                  onClick={() => setIsTariffModalOpen(true)}
                  style={{ width: 'auto' }}
                >
                  <PlusCircle size={16} /> Добавить кастомную услугу
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div className="input-with-icon" style={{ flex: 1, minWidth: 240 }}>
                <Search className="input-icon" size={16} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Поиск по названию или коду услуги..."
                  value={tariffSearch}
                  onChange={(e) => setTariffSearch(e.target.value)}
                  style={{ padding: '0.45rem 0.6rem 0.45rem 2.2rem', fontSize: '0.85rem' }}
                />
              </div>

              <select
                className="form-input"
                value={tariffCategoryFilter}
                onChange={(e) => setTariffCategoryFilter(e.target.value)}
                style={{ width: 'auto', padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
              >
                <option value="all">Все категории ({tariffs.length})</option>
                <option value="inbound">📥 Приёмка</option>
                <option value="processing">🏷️ Обработка / Стикерование</option>
                <option value="packaging">📦 Упаковка / Короба</option>
                <option value="logistics">🚚 Логистика и Сдача</option>
              </select>
            </div>

            {/* Tariffs Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', minWidth: 850, borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                  <thead>
                    <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                      <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>Код</th>
                      <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>Наименование услуги</th>
                      <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>Категория</th>
                      <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>Ед. измерения</th>
                      <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>Базовая цена (сом/руб)</th>
                      <th style={{ padding: '0.75rem 1rem', whiteSpace: 'nowrap' }}>Описание операции</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTariffs.map((t) => (
                      <tr key={t.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                        <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
                          {t.code}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                          {t.name}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          {getCategoryBadge(t.category)}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {t.unit}
                        </td>
                        <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <input
                              type="number"
                              min="0"
                              className="form-input"
                              value={t.defaultPrice}
                              onChange={(e) => handlePriceChange(t.id, Number(e.target.value))}
                              style={{ width: 90, padding: '0.35rem 0.5rem', fontWeight: 700, color: '#34d399', textAlign: 'right' }}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>сом</span>
                          </div>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {t.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REQUISITES */}
        {activeTab === 'requisites' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Building2 color="#8b5cf6" size={24} /> Реквизиты Исполнителя (Склада)
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Официальные юридические и банковские реквизиты, подставляемые в шапку Актов, договоров и финансовых выгрузок
              </p>
            </div>

            <form onSubmit={handleSaveRequisites} className="card" style={{ maxWidth: 850 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Юридическое наименование компании *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={requisites.companyName}
                    onChange={(e) => setRequisites({ ...requisites, companyName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">ИНН / КПП *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={requisites.innKpp}
                    onChange={(e) => setRequisites({ ...requisites, innKpp: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                <label className="form-label">Юридический адрес склада (Бишкек) *</label>
                <input
                  type="text"
                  className="form-input"
                  value={requisites.legalAddress}
                  onChange={(e) => setRequisites({ ...requisites, legalAddress: e.target.value })}
                  required
                />
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 1rem', color: 'var(--primary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                🏦 Банковские реквизиты в Кыргызстане
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Наименование банка *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={requisites.bankName}
                    onChange={(e) => setRequisites({ ...requisites, bankName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">БИК банка *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={requisites.bik}
                    onChange={(e) => setRequisites({ ...requisites, bik: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Расчетный счет (KGS/RUB) *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={requisites.checkingAccount}
                    onChange={(e) => setRequisites({ ...requisites, checkingAccount: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Корреспондентский счет</label>
                  <input
                    type="text"
                    className="form-input"
                    value={requisites.corrAccount}
                    onChange={(e) => setRequisites({ ...requisites, corrAccount: e.target.value })}
                  />
                </div>
              </div>

              <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '1.5rem 0 1rem', color: '#38bdf8', borderBottom: '1px solid var(--border)', paddingBottom: '0.4rem' }}>
                🇷🇺 Корреспондентский банк в РФ (для оплат селлеров в рублях)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">Корр. банк в РФ</label>
                  <input
                    type="text"
                    className="form-input"
                    value={requisites.corrBank}
                    onChange={(e) => setRequisites({ ...requisites, corrBank: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">БИК корр. банка</label>
                  <input
                    type="text"
                    className="form-input"
                    value={requisites.corrBankBik}
                    onChange={(e) => setRequisites({ ...requisites, corrBankBik: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">SWIFT код</label>
                  <input
                    type="text"
                    className="form-input"
                    value={requisites.swiftCode}
                    onChange={(e) => setRequisites({ ...requisites, swiftCode: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  <Save size={16} /> Сохранить реквизиты
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 4: SYSTEM & WAREHOUSE & INTEGRATIONS */}
        {activeTab === 'system' && (
          <div>
            <div style={{ marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Settings color="#38bdf8" size={24} /> Складские Зоны, Интеграции и База Данных
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                Конфигурация складских рамп, интеграций с маркетплейсами и резервное копирование
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {/* Warehouse Gates Manager */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Warehouse size={18} color="var(--primary)" /> Складские Ворота и Рампы приёмки
                  </h3>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Ворота, доступные для назначения Менеджером при согласовании слотов селлеров
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {gates.map((g) => (
                    <div
                      key={g.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.75rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, color: g.isActive ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {g.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Вместимость: {g.maxTruckCapacity}
                        </div>
                      </div>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleToggleGate(g.id)}
                        style={{
                          padding: '0.3rem 0.65rem',
                          fontSize: '0.75rem',
                          whiteSpace: 'nowrap',
                          borderColor: g.isActive ? '#10b981' : '#f43f5e',
                          color: g.isActive ? '#34d399' : '#f43f5e'
                        }}
                      >
                        {g.isActive ? 'В работе' : 'Отключены'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Integrations & API */}
              <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h3 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Layers size={18} color="#8b5cf6" /> Интеграции с Маркетплейсами и 1С
                  </h3>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleOpenCreateIntegration}
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', borderColor: '#8b5cf6', color: '#c4b5fd' }}
                  >
                    + Добавить
                  </button>
                </div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Подключение API для сверки номенклатуры, ШК коробов и автоматической синхронизации
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {integrations.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '0.75rem',
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</span>
                          {item.status === 'connected' ? (
                            <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid #10b981', fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                              Подключено
                            </span>
                          ) : (
                            <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-muted)', fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                              Не настроено
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.description}
                        </div>
                        {item.lastSyncAt && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '0.15rem' }}>
                            Синхронизация: {item.lastSyncAt}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => handleOpenEditIntegration(item)}
                        style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                      >
                        <Settings size={13} /> Настроить
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database Backup & Snapshot */}
              <div className="card" style={{ gridColumn: '1 / -1' }}>
                <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <DownloadCloud size={18} color="#10b981" /> Резервное Копирование Базы Данных (Backup)
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  Скачивание полного снапшота базы данных (пользователи, тарифы, складские зоны, реквизиты, интеграции) в формате JSON
                </p>

                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleDownloadBackup}
                    style={{ width: 'auto', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                  >
                    <DownloadCloud size={16} /> Скачать полный бэкап системы (.JSON)
                  </button>

                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Автобэкап базы выполняется ежедневно в 03:00 UTC
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: INTEGRATION CONFIG / ADD */}
        {isIntegrationModalOpen && editingIntegration && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 580 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Layers size={22} color="#8b5cf6" />
                  {isCreatingIntegration ? 'Добавление новой интеграции' : `Настройка: ${editingIntegration.name}`}
                </h3>
                <button type="button" className="btn-secondary" onClick={() => setIsIntegrationModalOpen(false)} style={{ padding: '0.4rem' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveIntegration}>
                {isCreatingIntegration && (
                  <div className="form-group">
                    <label className="form-label">Наименование интеграции / шлюза *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Например: Kaspi.kz Магазин API или Яндекс Маркет"
                      value={editingIntegration.name}
                      onChange={(e) => setEditingIntegration({ ...editingIntegration, name: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">
                    API Токен / Секретный Ключ авторизации *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      className="form-input"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={editingIntegration.apiKey || ''}
                      onChange={(e) => setEditingIntegration({ ...editingIntegration, apiKey: e.target.value })}
                      style={{ paddingRight: '2.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      style={{
                        position: 'absolute',
                        right: 8,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        padding: 4
                      }}
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                    Токен передается в заголовке авторизации
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Endpoint URL / Базовый адрес API</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="https://api-seller.ozon.ru / https://1c.warehouse.kg/api"
                    value={editingIntegration.apiUrl || ''}
                    onChange={(e) => setEditingIntegration({ ...editingIntegration, apiUrl: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Дополнительный параметр (Client-ID / Chat-ID / Идентификатор)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Client-ID: 108239 или @channel_name"
                    value={editingIntegration.extraParam || ''}
                    onChange={(e) => setEditingIntegration({ ...editingIntegration, extraParam: e.target.value })}
                  />
                </div>

                {/* Connection Ping Test Box */}
                <div
                  style={{
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.85rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.6rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Проверка доступности шлюза:
                    </span>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={handleTestIntegrationPing}
                      disabled={isTestingPing || !editingIntegration.apiKey?.trim()}
                      style={{ padding: '0.3rem 0.65rem', fontSize: '0.78rem', borderColor: 'var(--primary)', color: 'var(--primary)' }}
                    >
                      <Activity size={13} className={isTestingPing ? 'animate-spin' : ''} />
                      {isTestingPing ? 'Проверка связи...' : '🔄 Тест API соединения'}
                    </button>
                  </div>

                  {pingResult && (
                    <div
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: 4,
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: pingResult.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                        color: pingResult.success ? '#34d399' : '#fb7185',
                        border: `1px solid ${pingResult.success ? '#10b981' : '#f43f5e'}`
                      }}
                    >
                      {pingResult.success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      <span>{pingResult.message}</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsIntegrationModalOpen(false)}>
                    Отмена
                  </button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                    <Save size={16} /> Сохранить настройки
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: USER CREATE / EDIT */}
        {isUserModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 540 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCog size={22} color="#f43f5e" />
                  {editingUser ? 'Редактирование пользователя' : 'Регистрация нового пользователя'}
                </h3>
                <button type="button" className="btn-secondary" onClick={() => setIsUserModalOpen(false)} style={{ padding: '0.4rem' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveUser}>
                <div className="form-group">
                  <label className="form-label">ФИО / Название *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Например: Иван Иванов или ООО 'Стиль'"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Логин (username) *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="ivan_operator"
                      value={userForm.username}
                      onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-input"
                      placeholder="ivan@ff.kg"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Роль доступа *</label>
                    <select
                      className="form-input"
                      value={userForm.role}
                      onChange={(e) => setUserForm({ ...userForm, role: e.target.value as UserRole })}
                      required
                    >
                      <option value="operator">📱 Оператор ТСД</option>
                      <option value="manager">👔 Менеджер Склада</option>
                      <option value="client">👤 Клиент (Селлер)</option>
                      <option value="admin">👑 Администратор</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Телефон</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="+996 555 123-456"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                {userForm.role === 'client' && (
                  <div className="form-group" style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                    <label className="form-label" style={{ color: '#c4b5fd' }}>
                      Привязать к контрагенту из базы:
                    </label>
                    <select
                      className="form-input"
                      value={userForm.clientId}
                      onChange={(e) => setUserForm({ ...userForm, clientId: e.target.value })}
                      required
                    >
                      {clients.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.requisites?.inn ? `(ИНН: ${c.requisites.inn})` : ''}
                        </option>
                      ))}
                    </select>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                      Селлер будет видеть исключительно поставки и акты своей компании.
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsUserModalOpen(false)}>
                    Отмена
                  </button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                    <CheckCircle2 size={16} /> Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: CUSTOM TARIFF CREATE */}
        {isTariffModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: 540 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <PlusCircle size={22} color="var(--primary)" /> Добавить услугу в прайс-лист
                </h3>
                <button type="button" className="btn-secondary" onClick={() => setIsTariffModalOpen(false)} style={{ padding: '0.4rem' }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCustomTariff}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Наименование услуги *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Например: Глажка парогенератором"
                      value={tariffForm.name}
                      onChange={(e) => setTariffForm({ ...tariffForm, name: e.target.value, code: `srv_custom_${Date.now().toString().slice(-4)}` })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Категория *</label>
                    <select
                      className="form-input"
                      value={tariffForm.category}
                      onChange={(e) => setTariffForm({ ...tariffForm, category: e.target.value as any })}
                    >
                      <option value="inbound">📥 Приёмка</option>
                      <option value="processing">🏷️ Обработка</option>
                      <option value="packaging">📦 Упаковка</option>
                      <option value="logistics">🚚 Логистика</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Базовая цена (сом/руб) *</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={tariffForm.defaultPrice}
                      onChange={(e) => setTariffForm({ ...tariffForm, defaultPrice: Number(e.target.value) })}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Единица измерения *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="за 1 шт. / за 1 рейс"
                      value={tariffForm.unit}
                      onChange={(e) => setTariffForm({ ...tariffForm, unit: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Описание операции</label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Что входит в операцию..."
                    value={tariffForm.description}
                    onChange={(e) => setTariffForm({ ...tariffForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                  <button type="button" className="btn-secondary" onClick={() => setIsTariffModalOpen(false)}>
                    Отмена
                  </button>
                  <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                    <CheckCircle2 size={16} /> Добавить в прайс
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
