import { User, UserRole } from '../types/auth';
import { ActExecutorRequisites, ActServiceItem } from '../types/act';
import { OFFICIAL_EXECUTOR_REQUISITES, STANDARD_13_SERVICES } from './actService';

const STORAGE_KEY_USERS = 'ff_assistant_admin_users';
const STORAGE_KEY_TARIFFS = 'ff_assistant_admin_tariffs';
const STORAGE_KEY_REQUISITES = 'ff_assistant_admin_requisites';
const STORAGE_KEY_GATES = 'ff_assistant_admin_gates';

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

  // Backup & Reset
  public static exportFullSystemBackup(): string {
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      users: this.getUsers(),
      tariffs: this.getTariffs(),
      requisites: this.getRequisites(),
      gates: this.getGates()
    };
    return JSON.stringify(backup, null, 2);
  }
}
