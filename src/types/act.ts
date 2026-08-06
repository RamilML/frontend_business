export interface ActServiceItem {
  id: string;
  code: string;
  name: string;               // Наименование услуги
  defaultPrice: number;       // Дефолтная цена из ТЗ
  price: number;              // Фактическая цена (редактируемая)
  quantity: number;           // Количество (редактируемое)
  amount: number;             // Сумма = price * quantity
  enabled: boolean;           // Включена ли позиция в текущий акт (чекбокс)
  isCustom?: boolean;         // Кастомная добавленная услуга
}

export interface ActExecutorRequisites {
  companyName: string;
  legalAddress: string;
  innKpp: string;
  checkingAccount: string;
  corrAccount: string;
  bankName: string;
  bik: string;
  corrBank: string;
  corrBankBik: string;
  corrBankKs: string;
  swiftCode: string;
}

export interface Act {
  id: string;
  actNumber: string;          // Номер акта (например: АКТ-2026-0805-01)
  shipmentId?: string;
  shipmentNumber?: string;
  date: string;               // Дата акта (YYYY-MM-DD)
  operatorName: string;       // ФИО оператора
  clientId: string;
  clientName: string;
  clientRequisitesText: string; // Реквизиты контрагента
  executorRequisites: ActExecutorRequisites;
  items: ActServiceItem[];
  totalSum: number;           // Итоговая сумма акта
  status: 'draft' | 'signed' | 'paid';
  createdAt: string;
  updatedAt: string;
}

export type CreateActDto = Omit<Act, 'id' | 'createdAt' | 'updatedAt'>;
