export type WBWarehouse = 'Коледино' | 'Электросталь' | 'Тула' | 'Казань' | 'Невинномысск' | 'Екатеринбург' | 'Новосибирск' | 'СПб Уткина Заводь';

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
  items: {
    itemId: string;
    barcode: string;
    title: string;
    quantity: number;
  }[];
}

export type ShipmentStatus = 'draft' | 'receiving' | 'packing' | 'completed' | 'shipped';

export interface Shipment {
  id: string;
  shipmentNumber: string; // Название / Номер поставки (например: WB-2026-0805-01)
  clientId: string;
  clientName: string;
  targetWarehouses: WBWarehouse[];
  status: ShipmentStatus;
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
  initialItems?: Omit<ShipmentItem, 'id' | 'scannedQuantity'>[];
}

export interface ScanResult {
  success: boolean;
  item?: ShipmentItem;
  message: string;
  isNewItem?: boolean;
}
