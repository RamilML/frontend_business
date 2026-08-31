import { User, UserRole } from '../types/auth';
import { ActExecutorRequisites, ActServiceItem } from '../types/act';
import { OFFICIAL_EXECUTOR_REQUISITES, STANDARD_13_SERVICES } from './actService';

const STORAGE_KEY_USERS = 'ff_assistant_admin_users';
const STORAGE_KEY_TARIFFS = 'ff_assistant_admin_tariffs';
const STORAGE_KEY_REQUISITES = 'ff_assistant_admin_requisites';
const STORAGE_KEY_GATES = 'ff_assistant_admin_gates';
const STORAGE_KEY_INTEGRATIONS = 'ff_assistant_admin_integrations';

export interface TariffItem {
  id: string;
  code: string;
  name: string;
  category: 'inbound' | 'processing' | 'packaging' | 'logistics';
  unit: string;
  defaultPrice: number;
  description: string;
  isDefaultEnabled: boolean;
}

export interface WarehouseGate {
  id: string;
  name: string;
  type: 'ramp' | 'standard' | 'pallet' | 'storage';
  isActive: boolean;
  maxTruckCapacity: string;
}

export interface IntegrationItem {
  id: string;
  name: string;
  code: 'wb' | 'ozon' | '1c' | 'kaspi' | 'telegram' | 'yandex' | 'custom';
  category: 'marketplace' | 'accounting' | 'notifications';
  status: 'connected' | 'not_configured' | 'error';
  description: string;
  apiKey?: string;
  apiUrl?: string;
  webhookUrl?: string;
  extraParam?: string; // Client ID, Chat ID, Org ID
  lastSyncAt?: string;
  isEnabled: boolean;
}

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_1',
    name: 'Главный Администратор',
    username: 'admin',
    email: 'admin@ff-assistant.kg',
    role: 'admin',
    phone: '+996 555 100-200',
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z'
  },
  {
    id: 'usr_2',
    name: 'Елена Ковалева',
    username: 'manager_elena',
    email: 'elena@ff-assistant.kg',
    role: 'manager',
    phone: '+996 700 345-678',
    isActive: true,
    createdAt: '2026-02-15T09:30:00Z'
  },
  {
    id: 'usr_3',
    name: 'Алексей Смирнов',
    username: 'operator_alex',
    email: 'alexey@ff-assistant.kg',
    role: 'operator',
    phone: '+996 777 987-654',
    isActive: true,
    createdAt: '2026-03-01T10:00:00Z'
  },
  {
    id: 'usr_4',
    name: 'Рустам Алиев (Бригадир)',
    username: 'operator_rustam',
    email: 'rustam@ff-assistant.kg',
    role: 'operator',
    phone: '+996 500 112-233',
    isActive: true,
    createdAt: '2026-04-12T11:20:00Z'
  },
  {
    id: 'usr_5',
    name: 'ООО "Модный Гардероб"',
    username: 'seller_fashion',
    email: 'info@fashion-wardrobe.ru',
    role: 'client',
    clientId: 'cl_9921',
    clientName: 'ООО "Модный Гардероб"',
    phone: '+7 495 123-45-67',
    isActive: true,
    createdAt: '2026-05-01T14:00:00Z'
  },
  {
    id: 'usr_6',
    name: 'ИП Смирнов В.А. (KidsWear)',
    username: 'seller_kidswear',
    email: 'smirnov@kids-wear.ru',
    role: 'client',
    clientId: 'cl_9922',
    clientName: 'ИП Смирнов В.А. (KidsWear)',
    phone: '+7 916 555-44-33',
    isActive: true,
    createdAt: '2026-05-15T16:45:00Z'
  }
];

export const INITIAL_TARIFFS: TariffItem[] = [
  { id: 't_1', code: 'srv_1', name: 'Прием товара', category: 'inbound', unit: 'за 1 шт.', defaultPrice: 4, description: 'Выгрузка, пересчет и сверка с накладной', isDefaultEnabled: true },
  { id: 't_2', code: 'srv_2', name: 'Укладка в короб', category: 'packaging', unit: 'за 1 шт.', defaultPrice: 2, description: 'Аккуратная укладка подготовленных товаров в коробку', isDefaultEnabled: true },
  { id: 't_3', code: 'srv_3', name: 'Маркировка ШК (Wildberries)', category: 'processing', unit: 'за 1 шт.', defaultPrice: 8, description: 'Печать термоэтикетки и оклейка товара', isDefaultEnabled: true },
  { id: 't_4', code: 'srv_4', name: 'Маркировка Честный Знак (DataMatrix)', category: 'processing', unit: 'за 1 шт.', defaultPrice: 8, description: 'Нанесение КИЗ кодов национальной системы маркировки', isDefaultEnabled: false },
  { id: 't_5', code: 'srv_5', name: 'ОТК (Проверка на брак)', category: 'processing', unit: 'за 1 шт.', defaultPrice: 22, description: 'Детальная инспекция швов, замков, замеры и фотофиксация', isDefaultEnabled: false },
  { id: 't_6', code: 'srv_6', name: 'Чистка изделия (нитки/ворс)', category: 'processing', unit: 'за 1 шт.', defaultPrice: 5, description: 'Удаление производственных нитей и очистка от пыли', isDefaultEnabled: false },
  { id: 't_7', code: 'srv_7', name: 'Индивидуальная упаковка (БОПП/ЗИП)', category: 'packaging', unit: 'за 1 шт.', defaultPrice: 5, description: 'Запайка в плотный пакет с клеевым клапаном или ZIP-lock', isDefaultEnabled: true },
  { id: 't_8', code: 'srv_8', name: 'Транспортный короб (600х400х400 Т-23/Т-24)', category: 'packaging', unit: 'за 1 короб', defaultPrice: 180, description: 'Предоставление гофрокороба стандарта WB', isDefaultEnabled: true },
  { id: 't_9', code: 'srv_9', name: 'Забор товара от поставщика в Бишкеке', category: 'logistics', unit: 'за 1 рейс', defaultPrice: 1000, description: 'Экспедирование с рынков Дордой/Мадина или цеха', isDefaultEnabled: false },
  { id: 't_10', code: 'srv_10', name: 'Проверка и валидация маркировки', category: 'processing', unit: 'за 1 шт.', defaultPrice: 4, description: 'Считывание сканером ТСД на читаемость и дубли', isDefaultEnabled: false },
  { id: 't_11', code: 'srv_11', name: 'Выездная инспекция на производство', category: 'processing', unit: 'за 1 выезд', defaultPrice: 2000, description: 'Выезд технолога склада на швейное производство', isDefaultEnabled: false },
  { id: 't_12', code: 'srv_12', name: 'Магистральная доставка (Бишкек → Москва РЦ)', category: 'logistics', unit: 'за 1 отправку', defaultPrice: 5000, description: 'Авиа / Авто доставка сборным грузом до распределительного центра', isDefaultEnabled: true },
  { id: 't_13', code: 'srv_13', name: 'Сдача и отгрузка на склад WB (Коледино)', category: 'logistics', unit: 'за 1 поставку', defaultPrice: 1500, description: 'Заезд машины в ворота WB по QR-коду поставки', isDefaultEnabled: true }
];

export const INITIAL_GATES: WarehouseGate[] = [
  { id: 'g_1', name: 'Ворота № 1 (Рампа)', type: 'ramp', isActive: true, maxTruckCapacity: 'Фура 20т / Тент' },
  { id: 'g_2', name: 'Ворота № 2 (Малый тоннаж)', type: 'standard', isActive: true, maxTruckCapacity: 'Газель / Портер до 3.5т' },
  { id: 'g_3', name: 'Ворота № 3 (Паллетная зона)', type: 'pallet', isActive: true, maxTruckCapacity: 'Паллетный погрузчик' },
  { id: 'g_4', name: 'Сектор B (Складской запас)', type: 'storage', isActive: true, maxTruckCapacity: 'Внутреннее перемещение' }
];

export const INITIAL_INTEGRATIONS: IntegrationItem[] = [
  {
    id: 'int_1',
    name: 'Wildberries Vendor API',
    code: 'wb',
    category: 'marketplace',
    status: 'connected',
    description: 'Сверка баркодов, валидация карточек товаров и генерация ШК поставок WB',
    apiKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.wb_prod_sec_token_9921',
    apiUrl: 'https://suppliers-api.wildberries.ru',
    lastSyncAt: 'Сегодня, 11:42',
    isEnabled: true
  },
  {
    id: 'int_2',
    name: 'Ozon Seller API',
    code: 'ozon',
    category: 'marketplace',
    status: 'not_configured',
    description: 'Подготовка этикеток FBO/FBS и выгрузка актов приёмки Ozon',
    apiKey: '',
    apiUrl: 'https://api-seller.ozon.ru',
    extraParam: '',
    isEnabled: false
  },
  {
    id: 'int_3',
    name: '1С:Предприятие / МойСклад',
    code: '1c',
    category: 'accounting',
    status: 'connected',
    description: 'Автоматическая выгрузка бухгалтерских актов и счетов в учетную систему склада',
    apiKey: '1c_auth_bearer_98234710',
    apiUrl: 'https://1c.warehouse-bishkek.kg/hs/fulfillment/v1',
    lastSyncAt: 'Сегодня, 12:15',
    isEnabled: true
  },
  {
    id: 'int_4',
    name: 'Kaspi.kz Магазин (API)',
    code: 'kaspi',
    category: 'marketplace',
    status: 'not_configured',
    description: 'Синхронизация заказов Kaspi Доставка и печать накладных',
    apiKey: '',
    apiUrl: 'https://kaspi.kz/merchantcabinet/api/v1',
    isEnabled: false
  },
  {
    id: 'int_5',
    name: 'Telegram Бот Склада (Уведомления)',
    code: 'telegram',
    category: 'notifications',
    status: 'connected',
    description: 'Мгновенные push-уведомления селлерам о прибытии машин на ворота и готовности актов',
    apiKey: 'bot7123984512:AAH9fkl23Jkl2j4l23j4lkj234lk',
    extraParam: '@ff_warehouse_bot',
    lastSyncAt: 'Сегодня, 12:40',
    isEnabled: true
  }
];

export class AdminService {
  // Users
  public static getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEY_USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_USERS;
    }
  }

  public static saveUsers(users: User[]): void {
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
  }

  public static createUser(dto: Omit<User, 'id' | 'createdAt'>): User {
    const users = this.getUsers();
    const newUser: User = {
      ...dto,
      id: `usr_${Date.now()}`,
      isActive: true,
      createdAt: new Date().toISOString()
    };
    users.push(newUser);
    this.saveUsers(users);
    return newUser;
  }

  public static updateUser(id: string, dto: Partial<User>): User {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) throw new Error('Пользователь не найден');
    users[idx] = { ...users[idx], ...dto };
    this.saveUsers(users);
    return users[idx];
  }

  public static deleteUser(id: string): void {
    const users = this.getUsers().filter((u) => u.id !== id);
    this.saveUsers(users);
  }

  // Tariffs
  public static getTariffs(): TariffItem[] {
    const data = localStorage.getItem(STORAGE_KEY_TARIFFS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_TARIFFS, JSON.stringify(INITIAL_TARIFFS));
      return INITIAL_TARIFFS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_TARIFFS;
    }
  }

  public static saveTariffs(tariffs: TariffItem[]): void {
    localStorage.setItem(STORAGE_KEY_TARIFFS, JSON.stringify(tariffs));
  }

  public static updateTariff(id: string, dto: Partial<TariffItem>): void {
    const tariffs = this.getTariffs();
    const idx = tariffs.findIndex((t) => t.id === id);
    if (idx !== -1) {
      tariffs[idx] = { ...tariffs[idx], ...dto };
      this.saveTariffs(tariffs);
    }
  }

  public static addCustomTariff(dto: Omit<TariffItem, 'id'>): TariffItem {
    const tariffs = this.getTariffs();
    const newItem: TariffItem = {
      ...dto,
      id: `t_custom_${Date.now()}`
    };
    tariffs.push(newItem);
    this.saveTariffs(tariffs);
    return newItem;
  }

  // Requisites
  public static getRequisites(): ActExecutorRequisites {
    const data = localStorage.getItem(STORAGE_KEY_REQUISITES);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_REQUISITES, JSON.stringify(OFFICIAL_EXECUTOR_REQUISITES));
      return OFFICIAL_EXECUTOR_REQUISITES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return OFFICIAL_EXECUTOR_REQUISITES;
    }
  }

  public static saveRequisites(reqs: ActExecutorRequisites): void {
    localStorage.setItem(STORAGE_KEY_REQUISITES, JSON.stringify(reqs));
  }

  // Gates
  public static getGates(): WarehouseGate[] {
    const data = localStorage.getItem(STORAGE_KEY_GATES);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_GATES, JSON.stringify(INITIAL_GATES));
      return INITIAL_GATES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_GATES;
    }
  }

  public static saveGates(gates: WarehouseGate[]): void {
    localStorage.setItem(STORAGE_KEY_GATES, JSON.stringify(gates));
  }

  // Integrations
  public static getIntegrations(): IntegrationItem[] {
    const data = localStorage.getItem(STORAGE_KEY_INTEGRATIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_INTEGRATIONS, JSON.stringify(INITIAL_INTEGRATIONS));
      return INITIAL_INTEGRATIONS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_INTEGRATIONS;
    }
  }

  public static saveIntegrations(items: IntegrationItem[]): void {
    localStorage.setItem(STORAGE_KEY_INTEGRATIONS, JSON.stringify(items));
  }

  public static updateIntegration(id: string, dto: Partial<IntegrationItem>): void {
    const items = this.getIntegrations();
    const idx = items.findIndex((i) => i.id === id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...dto };
      this.saveIntegrations(items);
    }
  }

  public static addIntegration(dto: Omit<IntegrationItem, 'id'>): IntegrationItem {
    const items = this.getIntegrations();
    const newItem: IntegrationItem = {
      ...dto,
      id: `int_${Date.now()}`
    };
    items.push(newItem);
    this.saveIntegrations(items);
    return newItem;
  }

  public static deleteIntegration(id: string): void {
    const items = this.getIntegrations().filter((i) => i.id !== id);
    this.saveIntegrations(items);
  }

  public static async testIntegrationPing(id: string): Promise<{ success: boolean; message: string; latencyMs: number }> {
    // Simulate live test ping
    await new Promise((res) => setTimeout(res, 600));
    const items = this.getIntegrations();
    const item = items.find((i) => i.id === id);
    if (!item || !item.apiKey?.trim()) {
      return { success: false, message: 'API ключ не заполнен', latencyMs: 0 };
    }
    const latency = Math.floor(45 + Math.random() * 80);
    this.updateIntegration(id, {
      status: 'connected',
      lastSyncAt: `Сегодня, ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
    });
    return { success: true, message: `Соединение успешно установлено (200 OK, ${latency}мс)`, latencyMs: latency };
  }

  // Backup & Reset
  public static exportFullSystemBackup(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      users: this.getUsers(),
      tariffs: this.getTariffs(),
      requisites: this.getRequisites(),
      gates: this.getGates(),
      integrations: this.getIntegrations()
    };
    return JSON.stringify(backup, null, 2);
  }
}
