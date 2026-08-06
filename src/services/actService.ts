import { Act, ActServiceItem, ActExecutorRequisites, CreateActDto } from '../types/act';
import { AuthService } from './authService';

const STORAGE_KEY_ACTS = 'ff_assistant_acts_data';

export const OFFICIAL_EXECUTOR_REQUISITES: ActExecutorRequisites = {
  companyName: 'ОсОО "КРЕАТИВ ВЕЙВ БИШКЕК"',
  legalAddress: 'Кыргызская Республика, г. Бишкек, Октябрьский р-н, мкр 10, д. 2, кв 59',
  innKpp: '01904202310427 / 019001001',
  checkingAccount: '1033220002348631',
  corrAccount: '30111810400000073672',
  bankName: 'ОАО "МБАНК"',
  bik: '103032',
  corrBank: 'АО ПЕРВОУРАЛЬСК БАНК',
  corrBankBik: '046577402',
  corrBankKs: '0101810565770000402',
  swiftCode: 'KYRSKG22 / PVRBRU4V'
};

export const STANDARD_13_SERVICES: Omit<ActServiceItem, 'id' | 'quantity' | 'amount'>[] = [
  { code: 'srv_1', name: 'Прием товара', defaultPrice: 4, price: 4, enabled: true },
  { code: 'srv_2', name: 'Укладка в короб', defaultPrice: 2, price: 2, enabled: true },
  { code: 'srv_3', name: 'Маркировка ШК', defaultPrice: 8, price: 8, enabled: true },
  { code: 'srv_4', name: 'Маркировка ЧЗ', defaultPrice: 8, price: 8, enabled: false },
  { code: 'srv_5', name: 'ОТК', defaultPrice: 22, price: 22, enabled: false },
  { code: 'srv_6', name: 'Чистка', defaultPrice: 5, price: 5, enabled: false },
  { code: 'srv_7', name: 'Упаковка', defaultPrice: 5, price: 5, enabled: true },
  { code: 'srv_8', name: 'Короб', defaultPrice: 180, price: 180, enabled: true },
  { code: 'srv_9', name: 'Забор товара', defaultPrice: 1000, price: 1000, enabled: false },
  { code: 'srv_10', name: 'Проверка маркировки', defaultPrice: 4, price: 4, enabled: false },
  { code: 'srv_11', name: 'Выезд', defaultPrice: 2000, price: 2000, enabled: false },
  { code: 'srv_12', name: 'Доставка до Москвы', defaultPrice: 5000, price: 5000, enabled: true },
  { code: 'srv_13', name: 'Отгрузка на склад', defaultPrice: 1500, price: 1500, enabled: true }
];

export const INITIAL_MOCK_ACTS: Act[] = [
  {
    id: 'act_7001',
    actNumber: 'АКТ-2026-0805-01',
    shipmentId: 'shp_1001',
    shipmentNumber: 'WB-2026-0805-01',
    date: '2026-08-05',
    operatorName: 'Алексей Смирнов',
    clientId: 'cl_9921',
    clientName: 'ООО "Модный Гардероб"',
    clientRequisitesText: 'Заказчик: ООО "Модный Гардероб", ИНН: 7701234567, КПП: 770101001, Адрес: г. Москва, ул. Тверская, д. 12, р/с: 40702810938000012345 в ПАО Сбербанк, БИК: 044525225',
    executorRequisites: OFFICIAL_EXECUTOR_REQUISITES,
    status: 'signed',
    createdAt: '2026-08-05T15:00:00Z',
    updatedAt: '2026-08-05T15:30:00Z',
    totalSum: 10320,
    items: [
      { id: 'item_act_1', code: 'srv_1', name: 'Прием товара', defaultPrice: 4, price: 4, quantity: 50, amount: 200, enabled: true },
      { id: 'item_act_2', code: 'srv_2', name: 'Укладка в короб', defaultPrice: 2, price: 2, quantity: 50, amount: 100, enabled: true },
      { id: 'item_act_3', code: 'srv_3', name: 'Маркировка ШК', defaultPrice: 8, price: 8, quantity: 50, amount: 400, enabled: true },
      { id: 'item_act_7', code: 'srv_7', name: 'Упаковка', defaultPrice: 5, price: 5, quantity: 50, amount: 250, enabled: true },
      { id: 'item_act_8', code: 'srv_8', name: 'Короб', defaultPrice: 180, price: 180, quantity: 2, amount: 360, enabled: true },
      { id: 'item_act_12', code: 'srv_12', name: 'Доставка до Москвы', defaultPrice: 5000, price: 7500, quantity: 1, amount: 7500, enabled: true },
      { id: 'item_act_13', code: 'srv_13', name: 'Отгрузка на склад', defaultPrice: 1500, price: 1500, quantity: 1, amount: 1500, enabled: true }
    ]
  }
];

export class ActService {
  private static loadStoredActs(): Act[] {
    const data = localStorage.getItem(STORAGE_KEY_ACTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_ACTS, JSON.stringify(INITIAL_MOCK_ACTS));
      return INITIAL_MOCK_ACTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_MOCK_ACTS;
    }
  }

  private static saveStoredActs(acts: Act[]): void {
    localStorage.setItem(STORAGE_KEY_ACTS, JSON.stringify(acts));
  }

  public static getInitialServicesForShipment(totalItems: number = 50, totalBoxes: number = 2): ActServiceItem[] {
    return STANDARD_13_SERVICES.map((srv, idx) => {
      let qty = totalItems;
      if (srv.code === 'srv_8') qty = totalBoxes; // Короба
      if (srv.code === 'srv_9' || srv.code === 'srv_11' || srv.code === 'srv_12' || srv.code === 'srv_13') qty = 1; // Услуги выезда/доставки

      return {
        ...srv,
        id: `act_srv_${Date.now()}_${idx}`,
        quantity: qty,
        amount: srv.price * qty
      };
    });
  }

  public static async getActs(): Promise<Act[]> {
    const config = AuthService.getConfig();
    if (config.useMock) {
      return this.loadStoredActs();
    }

    const token = AuthService.getStoredToken();
    const res = await fetch(`${config.baseUrl}/acts`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Ошибка загрузки актов');
    return await res.json();
  }

  public static async getActById(id: string): Promise<Act | null> {
    const config = AuthService.getConfig();
    if (config.useMock) {
      const list = this.loadStoredActs();
      return list.find((a) => a.id === id) || null;
    }

    const token = AuthService.getStoredToken();
    const res = await fetch(`${config.baseUrl}/acts/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  }

  public static async createAct(dto: CreateActDto): Promise<Act> {
    const config = AuthService.getConfig();

    if (config.useMock) {
      const list = this.loadStoredActs();
      const newAct: Act = {
        ...dto,
        id: `act_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      list.unshift(newAct);
      this.saveStoredActs(list);
      return newAct;
    }

    const token = AuthService.getStoredToken();
    const res = await fetch(`${config.baseUrl}/acts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dto)
    });
    if (!res.ok) throw new Error('Ошибка создания акта на сервере');
    return await res.json();
  }

  public static async updateAct(id: string, dto: Partial<CreateActDto>): Promise<Act> {
    const list = this.loadStoredActs();
    const idx = list.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Акт не найден');

    const updated: Act = {
      ...list[idx],
      ...dto,
      updatedAt: new Date().toISOString()
    };

    list[idx] = updated;
    this.saveStoredActs(list);
    return updated;
  }

  public static async deleteAct(id: string): Promise<void> {
    const list = this.loadStoredActs().filter((a) => a.id !== id);
    this.saveStoredActs(list);
  }
}
