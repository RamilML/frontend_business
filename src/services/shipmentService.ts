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
        scannedQuantity: 15,
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
      this.saveStoredShipments(INITIAL_MOCK_SHIPMENTS);
      return INITIAL_MOCK_SHIPMENTS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return INITIAL_MOCK_SHIPMENTS;
    }
  }

  private static saveStoredShipments(list: Shipment[]): void {
    localStorage.setItem(STORAGE_KEY_SHIPMENTS, JSON.stringify(list));
  }

  public static async getShipments(): Promise<Shipment[]> {
    const config = AuthService.getConfig();
    if (config.useMock) {
      return this.loadStoredShipments();
    }

    try {
      const token = AuthService.getStoredToken();
      const res = await fetch(`${config.baseUrl}/shipments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Ошибка загрузки с сервера');
      return await res.json();
    } catch (e) {
      console.warn('Fallback to local shipments data:', e);
      return this.loadStoredShipments();
    }
  }

  public static async getShipmentById(id: string): Promise<Shipment | null> {
    const config = AuthService.getConfig();
    if (config.useMock) {
      const list = this.loadStoredShipments();
      return list.find((s) => s.id === id) || null;
    }

    try {
      const token = AuthService.getStoredToken();
      const res = await fetch(`${config.baseUrl}/shipments/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const list = this.loadStoredShipments();
        return list.find((s) => s.id === id) || null;
      }
      return await res.json();
    } catch (e) {
      const list = this.loadStoredShipments();
      return list.find((s) => s.id === id) || null;
    }
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
        clientName: dto.clientId,
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

    try {
      const token = AuthService.getStoredToken();
      const res = await fetch(`${config.baseUrl}/shipments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dto)
      });
      if (!res.ok) throw new Error('Не удалось создать поставку на сервере');
      const created = await res.json();
      // Keep local store in sync
      const list = this.loadStoredShipments();
      list.unshift(created);
      this.saveStoredShipments(list);
      return created;
    } catch (e) {
      // Fallback
      return this.createShipment({ ...dto });
    }
  }

  public static async updateShipment(
    id: string,
    updates: Partial<Shipment>
  ): Promise<Shipment | null> {
    const config = AuthService.getConfig();

    if (!config.useMock) {
      try {
        const token = AuthService.getStoredToken();
        const res = await fetch(`${config.baseUrl}/shipments/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            shipmentNumber: updates.shipmentNumber,
            clientId: updates.clientId,
            clientName: updates.clientName,
            targetWarehouses: updates.targetWarehouses,
            status: updates.status,
            operatorId: updates.operatorId,
            operatorName: updates.operatorName
          })
        });
        if (res.ok) {
          const updated = await res.json();
          const list = this.loadStoredShipments();
          const idx = list.findIndex((s) => s.id === id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...updated };
            this.saveStoredShipments(list);
          }
          return updated;
        }
      } catch (e) {
        console.warn('Update shipment server call failed, using local:', e);
      }
    }

    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === id);
    if (!shipment) return null;

    if (updates.shipmentNumber) shipment.shipmentNumber = updates.shipmentNumber;
    if (updates.clientId) shipment.clientId = updates.clientId;
    if (updates.clientName) shipment.clientName = updates.clientName;
    if (updates.targetWarehouses) shipment.targetWarehouses = updates.targetWarehouses;
    if (updates.status) shipment.status = updates.status;
    if (updates.operatorName) shipment.operatorName = updates.operatorName;
    shipment.updatedAt = new Date().toISOString();

    this.saveStoredShipments(list);
    return shipment;
  }

  public static async deleteShipment(id: string): Promise<boolean> {
    const config = AuthService.getConfig();

    if (!config.useMock) {
      try {
        const token = AuthService.getStoredToken();
        await fetch(`${config.baseUrl}/shipments/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.warn('Delete shipment server call failed:', e);
      }
    }

    const list = this.loadStoredShipments();
    const filtered = list.filter((s) => s.id !== id);
    this.saveStoredShipments(filtered);
    return true;
  }
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

      // Поиск товара в поставке по ШК или SKU (без учета регистра и пробелов)
      let item = shipment.items.find(
        (it) =>
          it.barcode.trim().toLowerCase() === cleanBarcode.toLowerCase() ||
          it.sku.trim().toLowerCase() === cleanBarcode.toLowerCase()
      );

      if (item) {
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
        // Поиск товара в каталоге среди всех когда-либо добавленных поставок
        let catalogItem: ShipmentItem | undefined;
        for (const s of list) {
          const found = s.items.find(
            (it) =>
              it.barcode.trim().toLowerCase() === cleanBarcode.toLowerCase() ||
              it.sku.trim().toLowerCase() === cleanBarcode.toLowerCase()
          );
          if (found) {
            catalogItem = found;
            break;
          }
        }

        audioSynth.playErrorBeep();
        return {
          success: false,
          message: catalogItem
            ? `Товар распознан из каталога: ${catalogItem.title}`
            : `Штрихкод ${cleanBarcode} не найден в плановом списке этой поставки.`,
          isNewItem: true,
          catalogProduct: catalogItem
            ? {
                barcode: catalogItem.barcode,
                title: catalogItem.title,
                sku: catalogItem.sku,
                article: catalogItem.article,
                size: catalogItem.size,
                brand: catalogItem.brand,
                category: catalogItem.category
              }
            : undefined
        };
      }
    }

    // Real API mode
    try {
      const token = AuthService.getStoredToken();
      const res = await fetch(`${config.baseUrl}/shipments/${shipmentId}/scan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ barcode: cleanBarcode })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        audioSynth.playErrorBeep();
        return {
          success: false,
          message: data.message || `Штрихкод ${cleanBarcode} не найден`,
          isNewItem: true,
          catalogProduct: data.catalogProduct
        };
      }

      // Also update local store if present
      const list = this.loadStoredShipments();
      const shipment = list.find((s) => s.id === shipmentId);
      if (shipment && data.item) {
        const localItem = shipment.items.find((it) => it.id === data.item.id || it.barcode === data.item.barcode);
        if (localItem) {
          localItem.scannedQuantity = data.item.scannedQuantity;
          localItem.lastScannedAt = data.item.lastScannedAt;
          this.saveStoredShipments(list);
        }
      }

      audioSynth.playSuccessBeep();
      audioSynth.triggerHapticSuccess();
      return {
        success: true,
        item: data.item,
        message: data.message || `Отсканировано: ${data.item?.title || cleanBarcode}`
      };
    } catch (e) {
      // Fallback to local
      console.warn('Scan server call failed, falling back to local catalog lookup:', e);
      const list = this.loadStoredShipments();
      const shipment = list.find((s) => s.id === shipmentId);
      if (shipment) {
        const item = shipment.items.find(
          (it) => it.barcode.trim().toLowerCase() === cleanBarcode.toLowerCase() || it.sku.trim().toLowerCase() === cleanBarcode.toLowerCase()
        );
        if (item) {
          item.scannedQuantity += 1;
          item.lastScannedAt = new Date().toISOString();
          this.saveStoredShipments(list);
          audioSynth.playSuccessBeep();
          return { success: true, item, message: `Отсканировано: ${item.title} (${item.scannedQuantity}/${item.plannedQuantity} шт.)` };
        }
      }

      // Поиск информации о товаре в других локальных поставках
      let catalogItem: ShipmentItem | undefined;
      for (const s of list) {
        const found = s.items.find(
          (it) =>
            it.barcode.trim().toLowerCase() === cleanBarcode.toLowerCase() ||
            it.sku.trim().toLowerCase() === cleanBarcode.toLowerCase()
        );
        if (found) {
          catalogItem = found;
          break;
        }
      }

      audioSynth.playErrorBeep();
      return {
        success: false,
        message: catalogItem
          ? `Товар распознан из каталога: ${catalogItem.title}`
          : `Штрихкод ${cleanBarcode} не найден`,
        isNewItem: true,
        catalogProduct: catalogItem
          ? {
              barcode: catalogItem.barcode,
              title: catalogItem.title,
              sku: catalogItem.sku,
              article: catalogItem.article,
              size: catalogItem.size,
              brand: catalogItem.brand,
              category: catalogItem.category
            }
          : undefined
      };
    }
  }

  /**
   * Добавление нового незапланированного товара в поставку по ШК
   */
  public static async addItemToShipment(
    shipmentId: string,
    newItem: { barcode: string; title: string; plannedQuantity: number; sku?: string }
  ): Promise<ShipmentItem> {
    const config = AuthService.getConfig();

    if (!config.useMock) {
      try {
        const token = AuthService.getStoredToken();
        const res = await fetch(`${config.baseUrl}/shipments/${shipmentId}/items`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            barcode: newItem.barcode,
            sku: newItem.sku || `SKU-${newItem.barcode}`,
            title: newItem.title,
            plannedQuantity: newItem.plannedQuantity || 1
          })
        });
        if (res.ok) {
          const item = await res.json();
          audioSynth.playSuccessBeep();
          const list = this.loadStoredShipments();
          const shipment = list.find((s) => s.id === shipmentId);
          if (shipment) {
            shipment.items.unshift(item);
            this.saveStoredShipments(list);
          }
          return item;
        }
      } catch (e) {
        console.warn('Add item server call failed, using local:', e);
      }
    }

    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('Поставка не найдена');

    const createdItem: ShipmentItem = {
      id: `item_${Date.now()}`,
      barcode: newItem.barcode,
      sku: newItem.sku || `SKU-${newItem.barcode}`,
      title: newItem.title,
      plannedQuantity: newItem.plannedQuantity || 1,
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
    return this.editShipmentItem(shipmentId, itemId, { scannedQuantity });
  }

  /**
   * Редактирование параметров товара (наименование, артикул, размер, план)
   */
  public static async editShipmentItem(
    shipmentId: string,
    itemId: string,
    updates: Partial<ShipmentItem>
  ): Promise<ShipmentItem> {
    const config = AuthService.getConfig();

    if (!config.useMock) {
      try {
        const token = AuthService.getStoredToken();
        const res = await fetch(`${config.baseUrl}/shipments/${shipmentId}/items/${itemId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title: updates.title,
            sku: updates.sku,
            article: updates.article,
            size: updates.size,
            plannedQuantity: updates.plannedQuantity,
            scannedQuantity: updates.scannedQuantity
          })
        });
        if (res.ok) {
          const updated = await res.json();
          // Update local cache
          const list = this.loadStoredShipments();
          const shipment = list.find((s) => s.id === shipmentId);
          if (shipment) {
            const idx = shipment.items.findIndex((it) => it.id === itemId);
            if (idx !== -1) {
              shipment.items[idx] = { ...shipment.items[idx], ...updated };
              this.saveStoredShipments(list);
            }
          }
          return updated;
        }
      } catch (e) {
        console.warn('Edit item server call failed, using local:', e);
      }
    }

    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === shipmentId);
    if (shipment) {
      const item = shipment.items.find((it) => it.id === itemId);
      if (item) {
        if (updates.title !== undefined) item.title = updates.title;
        if (updates.sku !== undefined) item.sku = updates.sku;
        if (updates.article !== undefined) item.article = updates.article;
        if (updates.size !== undefined) item.size = updates.size;
        if (updates.plannedQuantity !== undefined) item.plannedQuantity = Math.max(1, updates.plannedQuantity);
        if (updates.scannedQuantity !== undefined) {
          item.scannedQuantity = Math.max(0, updates.scannedQuantity);
          item.lastScannedAt = new Date().toISOString();
        }
        shipment.updatedAt = new Date().toISOString();
        this.saveStoredShipments(list);
        return item;
      }
    }

    return {
      id: itemId,
      barcode: '',
      sku: updates.sku || '',
      title: updates.title || '',
      plannedQuantity: updates.plannedQuantity || 1,
      scannedQuantity: updates.scannedQuantity || 0
    };
  }

  /**
   * Удаление товара из поставки
   */
  public static async deleteShipmentItem(
    shipmentId: string,
    itemId: string
  ): Promise<boolean> {
    const config = AuthService.getConfig();

    if (!config.useMock) {
      try {
        const token = AuthService.getStoredToken();
        await fetch(`${config.baseUrl}/shipments/${shipmentId}/items/${itemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        console.warn('Delete item server call failed:', e);
      }
    }

    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === shipmentId);
    if (shipment) {
      shipment.items = shipment.items.filter((it) => it.id !== itemId);
      // Remove item from boxes
      shipment.boxes.forEach((box) => {
        box.items = box.items.filter((bi) => bi.itemId !== itemId);
      });
      shipment.updatedAt = new Date().toISOString();
      this.saveStoredShipments(list);
      return true;
    }

    return true;
  }

  /**
   * Добавление новой упаковчной коробки
   */
  public static async createBox(
    shipmentId: string,
    targetWarehouse: WBWarehouse
  ): Promise<PackingBox> {
    const config = AuthService.getConfig();

    if (!config.useMock) {
      try {
        const token = AuthService.getStoredToken();
        const res = await fetch(`${config.baseUrl}/shipments/${shipmentId}/boxes`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ targetWarehouse })
        });
        if (res.ok) {
          const updatedShp = await res.json();
          return updatedShp.boxes[updatedShp.boxes.length - 1];
        }
      } catch (e) {
        console.warn('Create box server call failed:', e);
      }
    }

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
    const config = AuthService.getConfig();

    if (!config.useMock) {
      try {
        const token = AuthService.getStoredToken();
        await fetch(`${config.baseUrl}/shipments/${shipmentId}/boxes/${boxNumber}/warehouse`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ targetWarehouse })
        });
      } catch (e) {
        console.warn('Update warehouse server call failed:', e);
      }
    }

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
    const config = AuthService.getConfig();

    if (!config.useMock) {
      try {
        const token = AuthService.getStoredToken();
        const res = await fetch(`${config.baseUrl}/shipments/${shipmentId}/boxes/${boxNumber}/pack`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ itemId, quantity })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn('Pack item server call failed:', e);
      }
    }

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
    const config = AuthService.getConfig();

    if (!config.useMock) {
      try {
        const token = AuthService.getStoredToken();
        const res = await fetch(`${config.baseUrl}/shipments/${shipmentId}/boxes/move`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            fromBoxNumber,
            toBoxNumber,
            itemId,
            quantity: moveQuantity
          })
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn('Move item server call failed:', e);
      }
    }

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
    const config = AuthService.getConfig();

    if (!config.useMock) {
      try {
        const token = AuthService.getStoredToken();
        const res = await fetch(`${config.baseUrl}/shipments/${shipmentId}/boxes/${boxNumber}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          return await res.json();
        }
      } catch (e) {
        console.warn('Delete box server call failed:', e);
      }
    }

    const list = this.loadStoredShipments();
    const shipment = list.find((s) => s.id === shipmentId);
    if (!shipment) throw new Error('Поставка не найдена');

    shipment.boxes = shipment.boxes.filter((b) => b.boxNumber !== boxNumber);
    shipment.updatedAt = new Date().toISOString();
    this.saveStoredShipments(list);
    return shipment;
  }
}
