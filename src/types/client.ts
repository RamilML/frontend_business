export type LegalType = 'OOO' | 'IP' | 'OsOO' | 'AO';

export interface ClientRequisites {
  legalType: LegalType;
  fullName: string;          // Полное наименование (например: Общество с ограниченной ответственностью "Модный Гардероб")
  shortName: string;         // Сокращенное название (например: ООО "Модный Гардероб")
  inn: string;               // ИНН (10 или 12 цифр)
  kpp?: string;              // КПП (9 цифр, для юр. лиц)
  ogrn?: string;             // ОГРН / ОГРНИП
  legalAddress: string;      // Юридический адрес
  actualAddress?: string;    // Фактический / Складской адрес
  checkingAccount: string;   // Расчетный счет (20 цифр)
  bankName: string;          // Наименование банка
  bik: string;               // БИК банка
  corrAccount: string;       // Корреспондентский счет
  swiftCode?: string;        // SWIFT Код (для международных расчетов)
}

export interface ClientContact {
  contactPerson: string;     // ФИО контактного лица
  phone: string;             // Телефон
  email: string;             // Email для уведомлений и счетов
}

export interface Client {
  id: string;
  name: string;              // Краткое имя для отображения в списках
  requisites: ClientRequisites;
  contact: ClientContact;
  loginUsername?: string;    // Учетная запись клиента для входа в приложение
  status: 'active' | 'inactive' | 'archived';
  activeShipmentsCount?: number;
  totalActsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateClientDto = Omit<Client, 'id' | 'createdAt' | 'updatedAt' | 'activeShipmentsCount' | 'totalActsCount'>;
