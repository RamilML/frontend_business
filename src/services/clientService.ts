import { Client, CreateClientDto } from '../types/client';
import { AuthService } from './authService';

const STORAGE_KEY_CLIENTS = 'ff_assistant_clients_data';

export const INITIAL_MOCK_CLIENTS: Client[] = [
  {
    id: 'cl_9921',
    name: 'ООО "Модный Гардероб"',
    status: 'active',
    activeShipmentsCount: 3,
    totalActsCount: 14,
    loginUsername: 'client',
    createdAt: '2026-01-15T10:00:00Z',
    updatedAt: '2026-08-01T14:20:00Z',
    contact: {
      contactPerson: 'Смирнова Анна Сергеевна',
      phone: '+7 (999) 123-45-67',
      email: 'seller@fashion-store.ru'
    },
    requisites: {
      legalType: 'OOO',
      shortName: 'ООО "Модный Гардероб"',
      fullName: 'Общество с ограниченной ответственностью "Модный Гардероб"',
      inn: '7701234567',
      kpp: '770101001',
      ogrn: '1157746001122',
      legalAddress: 'г. Москва, ул. Тверская, д. 12, стр. 1, оф. 405',
      actualAddress: 'г. Москва, Складской проезд, д. 8',
      checkingAccount: '40702810938000012345',
      bankName: 'ПАО Сбербанк',
      bik: '044525225',
      corrAccount: '30101810400000000225'
    }
  },
  {
    id: 'cl_9922',
    name: 'ИП Смирнов В.А. (KidsWear)',
    status: 'active',
    activeShipmentsCount: 1,
    totalActsCount: 8,
    loginUsername: 'smirnov_kidswear',
    createdAt: '2026-03-10T11:30:00Z',
    updatedAt: '2026-08-03T09:15:00Z',
    contact: {
      contactPerson: 'Смирнов Виктор Александрович',
      phone: '+7 (916) 987-65-43',
      email: 'info@kidswear-wb.ru'
    },
    requisites: {
      legalType: 'IP',
      shortName: 'ИП Смирнов В.А.',
      fullName: 'Индивидуальный Предприниматель Смирнов Виктор Александрович',
      inn: '503212345678',
      ogrn: '321503200044556',
      legalAddress: 'Московская обл., г. Одинцово, ул. Можайское ш., д. 45, кв. 12',
      checkingAccount: '40802810500000098765',
      bankName: 'АО "Тинькофф Банк"',
      bik: '044525974',
      corrAccount: '30101810145250000974'
    }
  },
  {
    id: 'cl_9923',
    name: 'ОсОО "Азия Трейд Логистик"',
    status: 'active',
    activeShipmentsCount: 2,
    totalActsCount: 5,
    loginUsername: 'asia_trade',
    createdAt: '2026-05-20T08:00:00Z',
    updatedAt: '2026-08-04T16:45:00Z',
    contact: {
      contactPerson: 'Мамытов Бакыт Эркинович',
      phone: '+996 (555) 321-654',
      email: 'logistics@asiatrade.kg'
    },
    requisites: {
      legalType: 'OsOO',
      shortName: 'ОсОО "Азия Трейд"',
      fullName: 'Общество с ограниченной ответственностью "Азия Трейд Логистик"',
      inn: '01205202310123',
      kpp: '012001001',
      legalAddress: 'Кыргызская Республика, г. Бишкек, Октябрьский р-н, мкр 10, д. 15',
      checkingAccount: '1033220005544332',
      bankName: 'ОАО "МБАНК"',
      bik: '103032',
      corrAccount: '30111810400000073672',
      swiftCode: 'KYRSKG22'
    }
  }
];

export class ClientService {
  private static loadStoredClients(): Client[] {
    const data = localStorage.getItem(STORAGE_KEY_CLIENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(INITIAL_MOCK_CLIENTS));
      return INITIAL_MOCK_CLIENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_MOCK_CLIENTS;
    }
  }

  private static saveStoredClients(clients: Client[]): void {
    localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(clients));
  }

  public static async getClients(searchQuery?: string): Promise<Client[]> {
    const config = AuthService.getConfig();

    if (config.useMock) {
      let list = this.loadStoredClients();
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        list = list.filter(
          (c) =>
            c.name.toLowerCase().includes(q) ||
            c.requisites.inn.includes(q) ||
            c.requisites.shortName.toLowerCase().includes(q) ||
            c.contact.contactPerson.toLowerCase().includes(q)
        );
      }
      return list;
    }

    // Real API implementation
    const token = AuthService.getStoredToken();
    const url = new URL(`${config.baseUrl}/clients`);
    if (searchQuery) url.searchParams.append('q', searchQuery);

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Не удалось загрузить список клиентов с сервера');
    const data = await res.json();
    return data.items || data.clients || data;
  }

  public static async createClient(dto: CreateClientDto): Promise<Client> {
    const config = AuthService.getConfig();

    if (config.useMock) {
      const list = this.loadStoredClients();
      const newClient: Client = {
        ...dto,
        id: `cl_${Date.now()}`,
        status: 'active',
        activeShipmentsCount: 0,
        totalActsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.unshift(newClient);
      this.saveStoredClients(list);
      return newClient;
    }

    const token = AuthService.getStoredToken();
    const res = await fetch(`${config.baseUrl}/clients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dto)
    });

    if (!res.ok) throw new Error('Ошибка создания клиента на сервере');
    return await res.json();
  }

  public static async updateClient(id: string, dto: Partial<CreateClientDto>): Promise<Client> {
    const config = AuthService.getConfig();

    if (config.useMock) {
      const list = this.loadStoredClients();
      const idx = list.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('Клиент не найден');

      const updated: Client = {
        ...list[idx],
        ...dto,
        requisites: { ...list[idx].requisites, ...dto.requisites },
        contact: { ...list[idx].contact, ...dto.contact },
        updatedAt: new Date().toISOString()
      };
      list[idx] = updated;
      this.saveStoredClients(list);
      return updated;
    }

    const token = AuthService.getStoredToken();
    const res = await fetch(`${config.baseUrl}/clients/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(dto)
    });

    if (!res.ok) throw new Error('Ошибка обновления данных клиента');
    return await res.json();
  }

  public static async deleteClient(id: string): Promise<void> {
    const config = AuthService.getConfig();

    if (config.useMock) {
      const list = this.loadStoredClients().filter((c) => c.id !== id);
      this.saveStoredClients(list);
      return;
    }

    const token = AuthService.getStoredToken();
    const res = await fetch(`${config.baseUrl}/clients/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error('Ошибка удаления клиента');
  }
}
