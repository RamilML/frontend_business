export type WBWarehouse =
  | 'Коледино'
  | 'Электросталь'
  | 'Тула'
  | 'Казань'
  | 'Невинномысск'
  | 'Екатеринбург'
  | 'Новосибирск'
  | 'СПб Уткина Заводь';

export const WB_WAREHOUSES: WBWarehouse[] = [
  'Коледино',
  'Электросталь',
  'Тула',
  'Казань',
  'Невинномысск',
  'Екатеринбург',
  'Новосибирск',
  'СПб Уткина Заводь'
];

export interface ShipmentItem {
  id: string;
  barcode: string;
  sku: string;
  title: string;
  category?: string;
  plannedQuantity: number;
  scannedQuantity: number;
  article?: string;
  size?: string;
  brand?: string;
  lastScannedAt?: string;
}

export interface PackingBox {
  boxNumber: number; // 1, 2, 3...
  targetWarehouse: WBWarehouse;
  isPacked?: boolean; // запечатана/заклеена ли коробка
  sealedAt?: string;
  items: {
    itemId: string;
    barcode: string;
    title: string;
    quantity: number;
  }[];
}

export type ShipmentStatus = 'draft' | 'approved' | 'receiving' | 'packing' | 'ready_to_ship' | 'completed' | 'shipped';

export interface Shipment {
  id: string;
  shipmentNumber: string; // Название / Номер поставки (например: WB-2026-0805-01)
  clientId: string;
  clientName: string;
  targetWarehouses: WBWarehouse[];
  status: ShipmentStatus;
  plannedDeliveryDate?: string;
  driverInfo?: string;
  gateNumber?: string;
  managerComment?: string;
  items: ShipmentItem[];
  boxes: PackingBox[];
  createdAt: string;
  updatedAt: string;
  operatorId?: string;
  operatorName?: string;
}

export interface CreateShipmentDto {
  shipmentNumber: string;
  clientId: string;
  targetWarehouses: WBWarehouse[];
  status?: ShipmentStatus;
  plannedDeliveryDate?: string;
  driverInfo?: string;
  gateNumber?: string;
  managerComment?: string;
  initialItems?: Omit<ShipmentItem, 'id' | 'scannedQuantity'>[];
}

export interface ScanResult {
  success: boolean;
  item?: ShipmentItem;
  message: string;
  isNewItem?: boolean;
  catalogProduct?: {
    barcode: string;
    title: string;
    sku?: string;
    article?: string;
    size?: string;
    brand?: string;
    category?: string;
  };
}
