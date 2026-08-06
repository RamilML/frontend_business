import { Shipment, CreateShipmentDto, ShipmentItem, ScanResult, PackingBox, WBWarehouse } from '../types/shipment';
import { AuthService } from './authService';
import { audioSynth } from '../utils/audioSynth';

const STORAGE_KEY_SHIPMENTS = 'ff_assistant_shipments_data';

export const INITIAL_MOCK_SHIPMENTS: Shipment[] = [
  {
    id: 'shp_1001',
    shipmentNumber: 'WB-2026-0805-01',
    clientId: 'cl_9921',
    clientName: 'ООО "Модный Гардероб"',
    targetWarehouses: ['Коледино', 'Тула', 'Электросталь'],
    status: 'receiving',
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-08-05T14:30:00Z',
    operatorId: 'usr_op_01',
    operatorName: 'Алексей Смирнов',
    boxes: [
      {
        boxNumber: 1,
        targetWarehouse: 'Коледино',
        items: [
          { itemId: 'item_1', barcode: '4601234567890', title: 'Футболка базовая оверсайз Черная M', quantity: 20 }
        ]
      },
      {
        boxNumber: 2,
        targetWarehouse: 'Тула',
        items: [
          { itemId: 'item_2', barcode: '4601234567891', title: 'Худи утепленное с капюшоном Серый L', quantity: 15 }
        ]
      }
    ],
    items: [
      {
        id: 'item_1',
        barcode: '4601234567890',
        sku: 'FUT-BLK-M',
        title: 'Футболка базовая оверсайз Черная M',
        category: 'Одежда',
        article: 'WB-FUT-01',
        size: 'M',
        plannedQuantity: 30,
        scannedQuantity: 24,
        lastScannedAt: new Date().toISOString()
      },
      {
        id: 'item_2',
        barcode: '4601234567891',
        sku: 'HOOD-GRY-L',
        title: 'Худи утепленное с капюшоном Серый L',
        category: 'Одежда',
        article: 'WB-HD-02',
        size: 'L',
        plannedQuantity: 20,
        scannedQuantity: 15,
        lastScannedAt: new Date(Date.now() - 300000).toISOString()
      },
      {
        id: 'item_3',
        barcode: '4601234567892',
        sku: 'DNM-BLU-S',
        title: 'Джинсы прямой крой Синие S',
        category: 'Одежда',
        article: 'WB-DNM-03',
        size: 'S',
        plannedQuantity: 15,
        scannedQuantity: 15, // Complete
        lastScannedAt: new Date(Date.now() - 600000).toISOString()
      }
    ]
  },
  {
    id: 'shp_1002',
    shipmentNumber: 'WB-2026-0804-02',
    clientId: 'cl_9922',
    clientName: 'ИП Смирнов В.А. (KidsWear)',
    targetWarehouses: ['Казань'],
    status: 'draft',
    createdAt: '2026-08-04T11:00:00Z',
    updatedAt: '2026-08-04T12:00:00Z',
    boxes: [],
    items: [
      {
        id: 'item_10',
        barcode: '4609999888111',
        sku: 'KID-BODY-RED-68',
        title: 'Боди детское х/б Красное 68 см',
        category: 'Детская одежда',
        plannedQuantity: 50,
        scannedQuantity: 0
      }
    ]
  }
];

export class ShipmentService {
  private static loadStoredShipments(): Shipment[] {
    const data = localStorage.getItem(STORAGE_KEY_SHIPMENTS);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(INITIAL_MOCK_SHIPMENTS));
      return INITIAL_MOCK_SHIPMENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_MOCK_SHIPMENTS;
    }
  }

  private static saveStoredShipments(shipments: Shipment[]): void {
    localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(shipments));
  }

  public static async getShipments(): Promise<Shipment[]> {
    const config = AuthService.getConfig();
    if (config.useMock) {
      return this.loadStoredShipments();
    }

    const token = AuthService.getStoredToken();
    const res = await fetch(`${config.baseUrl}/shipments`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Ошибка загрузки поставки с сервера');
    return await res.json();
  }

  public static async getShipmentById(id: string): Promise<Shipment | null> {
    const config = AuthService.getConfig();
    if (config.useMock) {
      const list = this.loadStoredShipments();
      return list.find((s) => s.id === id) || null;
    }

    const token = AuthService.getStoredToken();
    const res = await fetch(`${config.baseUrl}/shipments/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return null;
    return await res.json();
  }

  public static async createShipment(dto: CreateShipmentDto): Promise<Shipment> {
    const config = AuthService.getConfig();
    const user = AuthService.getStoredUser();

    if (config.useMock) {
      const list = this.loadStoredShipments();
      const newShipment: Shipment = {
        id: `shp_${Date.now()}`,
        shipmentNumber: dto.shipmentNumber,
        clientId: dto.clientId,
        clientName: dto.clientId, // Will be filled from client lookup
        targetWarehouses: dto.targetWarehouses,
        status: 'receiving',
        operatorId: user?.id,
        operatorName: user?.name,
        boxes: [],
        items: (dto.initialItems || []).map((it, idx) => ({
          ...it,
          id: `item_${Date.now()}_${idx}`,
          scannedQuantity: 0
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      list.unshift(newShipment);
      this.saveStoredShipments(list);
      return newShipment;
    }

    const token = AuthService.getStoredToken();
    const res = await fetch(`${config.baseUrl}/shipments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(dto)
    });
    if (!res.ok) throw new Error('Не удалось создать поставку');
    return await res.json();
  }

  /**
   * Ключевой метод обработки сканирования ШК
   */
  public static async processBarcodeScan(shipmentId: string, barcode: string): Promise<ScanResult> {
    const cleanBarcode = barcode.trim();
    if (!cleanBarcode) {
      audioSynth.playErrorBeep();
      return { success: false, message: 'Пустой штрихкод' };
    }

    const config = AuthService.getConfig();

    if (config.useMock) {
      const list = this.loadStoredShipments();
      const shipment = list.find((s) => s.id === shipmentId);
      if (!shipment) {
        audioSynth.playErrorBeep();
        return { success: false, message: 'Поставка не найдена' };
      }

      // Поиск товара в поставке по ШК или SKU
      let item = shipment.items.find(
        (it) => it.barcode === cleanBarcode || it.sku.toLowerCase() === cleanBarcode.toLowerCase()
      );

      if (item) {
        // Успешное сканирование
        item.scannedQuantity += 1;
        item.lastScannedAt = new Date().toISOString();
        shipment.updatedAt = new Date().toISOString();
        this.saveStoredShipments(list);

        audioSynth.playSuccessBeep();
        audioSynth.triggerHapticSuccess();

        return {
          success: true,
          item,
          message: `Отсканировано: ${item.title} (${item.scannedQuantity}/${item.plannedQuantity} шт.)`
        };
      } else {
        // Товар не найден в плановом списке
        audioSynth.playErrorBeep();
        return {
          success: false,
          message: `Штрихкод ${cleanBarcode} не найден в плановом списке этой поставки.`,
          isNewItem: true
        };
      }
    }

    // Real API integration
    const token = AuthService.getStoredToken();
    const res = await fetch(`${config.baseUrl}/shipments/${shipmentId}/scan`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ barcode: cleanBarcode })
    });

    if (!res.ok) {
      audioSynth.playErrorBeep();
      const err = await res.json().catch(() => ({}));
      return { success: false, message: err.message || 'Ошибка сканирования на сервере' };
    }

    const data = await res.json();
    audioSynth.playSuccessBeep();
    return { success: true, item: data.item, message: 'Товар принят' };
  }

  /**
   * Добавление нового незапланированного товара в поставку по ШК
   */
  public static async addItemToShipment(
    shipmentId: string,
    newItem: { barcode: string; title: string; plannedQuantity: number; sku?: string }
  ): Promise<ShipmentItem> {
    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('Поставка не найдена');

    const createdItem: ShipmentItem = {
      id: `item_${Date.now()}`,
      barcode: newItem.barcode,
      sku: newItem.sku || `SKU-${newItem.barcode}`,
      title: newItem.title,
      plannedQuantity: newItem.plannedQuantity,
      scannedQuantity: 1,
      lastScannedAt: new Date().toISOString()
    };

    shipment.items.unshift(createdItem);
    shipment.updatedAt = new Date().toISOString();
    this.saveStoredShipments(list);

    audioSynth.playSuccessBeep();
    return createdItem;
  }

  /**
   * Корректировка количества товара вручную (+1, -1, ввод числа)
   */
  public static async updateItemQuantity(
    shipmentId: string,
    itemId: string,
    scannedQuantity: number
  ): Promise<ShipmentItem> {
    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('Поставка не найдена');

    const item = shipment.items.find((it) => it.id === itemId);
    if (!item) throw new Error('Товар не найден');

    item.scannedQuantity = Math.max(0, scannedQuantity);
    item.lastScannedAt = new Date().toISOString();
    shipment.updatedAt = new Date().toISOString();

    this.saveStoredShipments(list);
    return item;
  }

  /**
   * Добавление новой упаковчной коробки
   */
  public static async createBox(
    shipmentId: string,
    targetWarehouse: WBWarehouse
  ): Promise<PackingBox> {
    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('Поставка не найдена');

    const nextBoxNumber = (shipment.boxes.length > 0 ? Math.max(...shipment.boxes.map((b) => b.boxNumber)) : 0) + 1;

    const newBox: PackingBox = {
      boxNumber: nextBoxNumber,
      targetWarehouse,
      items: []
    };

    shipment.boxes.push(newBox);
    shipment.updatedAt = new Date().toISOString();
    this.saveStoredShipments(list);
    return newBox;
  }

  /**
   * Изменение целевого склада Wildberries для коробки
   */
  public static async updateBoxWarehouse(
    shipmentId: string,
    boxNumber: number,
    targetWarehouse: WBWarehouse
  ): Promise<PackingBox> {
    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('Поставка не найдена');

    const box = shipment.boxes.find((b) => b.boxNumber === boxNumber);
    if (!box) throw new Error('Коробка не найдена');

    box.targetWarehouse = targetWarehouse;
    shipment.updatedAt = new Date().toISOString();
    this.saveStoredShipments(list);
    return box;
  }

  /**
   * Упаковка товара в выбранную коробку
   */
  public static async packItemToBox(
    shipmentId: string,
    boxNumber: number,
    itemId: string,
    quantity: number
  ): Promise<Shipment> {
    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('Поставка не найдена');

    const box = shipment.boxes.find((b) => b.boxNumber === boxNumber);
    if (!box) throw new Error('Коробка не найдена');

    const item = shipment.items.find((it) => it.id === itemId);
    if (!item) throw new Error('Товар не найден');

    const existingInBox = box.items.find((bi) => bi.itemId === itemId);
    if (existingInBox) {
      existingInBox.quantity += quantity;
    } else {
      box.items.push({
        itemId: item.id,
        barcode: item.barcode,
        title: item.title,
        quantity
      });
    }

    shipment.updatedAt = new Date().toISOString();
    this.saveStoredShipments(list);
    return shipment;
  }

  /**
   * Перемещение товара из одной коробки в другую
   */
  public static async moveItemBetweenBoxes(
    shipmentId: string,
    fromBoxNumber: number,
    toBoxNumber: number,
    itemId: string,
    moveQuantity: number
  ): Promise<Shipment> {
    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('Поставка не найдена');

    const fromBox = shipment.boxes.find((b) => b.boxNumber === fromBoxNumber);
    const toBox = shipment.boxes.find((b) => b.boxNumber === toBoxNumber);
    if (!fromBox || !toBox) throw new Error('Исходная или целевая коробка не найдена');

    const itemInFrom = fromBox.items.find((bi) => bi.itemId === itemId);
    if (!itemInFrom || itemInFrom.quantity < moveQuantity) {
      throw new Error('Недостаточно товара в исходной коробке');
    }

    // Deduct from source box
    itemInFrom.quantity -= moveQuantity;
    if (itemInFrom.quantity <= 0) {
      fromBox.items = fromBox.items.filter((bi) => bi.itemId !== itemId);
    }

    // Add to target box
    const itemInTo = toBox.items.find((bi) => bi.itemId === itemId);
    if (itemInTo) {
      itemInTo.quantity += moveQuantity;
    } else {
      toBox.items.push({
        itemId: itemInFrom.itemId,
        barcode: itemInFrom.barcode,
        title: itemInFrom.title,
        quantity: moveQuantity
      });
    }

    shipment.updatedAt = new Date().toISOString();
    this.saveStoredShipments(list);
    return shipment;
  }

  /**
   * Удаление пустой коробки
   */
  public static async deleteBox(shipmentId: string, boxNumber: number): Promise<Shipment> {
    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('Поставка не найдена');

    shipment.boxes = shipment.boxes.filter((b) => b.boxNumber !== boxNumber);
    shipment.updatedAt = new Date().toISOString();
    this.saveStoredShipments(list);
    return shipment;
  }
}
