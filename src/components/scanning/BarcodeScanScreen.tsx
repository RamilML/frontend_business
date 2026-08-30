import React, { useState, useEffect, useRef } from 'react';
import { Shipment, ScanResult, ShipmentItem } from '../../types/shipment';
import { ShipmentService } from '../../services/shipmentService';
import { CameraScannerModal } from './CameraScannerModal';
import { PackingScreen } from '../packing/PackingScreen';
import { EditShipmentModal } from './EditShipmentModal';
import {
  Barcode,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Minus,
  Box,
  Truck,
  Layers,
  Camera,
  PlusCircle,
  PackagePlus,
  Edit2,
  Trash2,
  X,
  Settings,
  Sparkles,
  Lock
} from 'lucide-react';

interface Props {
  shipmentId: string;
  onBack: () => void;
}

export const BarcodeScanScreen: React.FC<Props> = ({ shipmentId, onBack }) => {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);
  const [flashType, setFlashType] = useState<'success' | 'error' | null>(null);
  const [isPackingView, setIsPackingView] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isEditShipmentOpen, setIsEditShipmentOpen] = useState(false);
  
  // Unlisted Barcode Modal state
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemArticle, setNewItemArticle] = useState('');
  const [newItemSize, setNewItemSize] = useState('');
  const [newItemPlannedQty, setNewItemPlannedQty] = useState<number | string>(1);
  const [isFromCatalog, setIsFromCatalog] = useState<boolean>(false);

  // Edit Item Modal state
  const [editingItem, setEditingItem] = useState<ShipmentItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editArticle, setEditArticle] = useState('');
  const [editSize, setEditSize] = useState('');
  const [editPlannedQty, setEditPlannedQty] = useState<number | string>(1);

  // Delete Item Confirmation Modal state
  const [deletingItem, setDeletingItem] = useState<ShipmentItem | null>(null);

  // TSD Keyboard Buffer Listener
  const keyBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(Date.now());

  const loadShipment = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await ShipmentService.getShipmentById(shipmentId);
      if (data) {
        setShipment(data);
      }
    } catch (e) {
      console.warn('Error loading shipment:', e);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShipment(true);
  }, [shipmentId]);

  // Global Hardware TSD Scanner key listener
  useEffect(() => {
    if (!shipment || shipment.status === 'shipped' || shipment.status === 'completed') {
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 400) {
        keyBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (keyBufferRef.current.trim().length >= 3) {
          executeBarcodeScan(keyBufferRef.current.trim());
          keyBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        keyBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shipmentId, shipment]);

  const triggerFlash = (type: 'success' | 'error') => {
    setFlashType(type);
    setTimeout(() => setFlashType(null), 600);
  };

  const executeBarcodeScan = async (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    // Call service to process scan
    const res = await ShipmentService.processBarcodeScan(shipmentId, cleanCode);
    setLastScanResult(res);

    if (res.success && res.item) {
      triggerFlash('success');
      const updatedItem = res.item;
      // Optimistic update in UI
      setShipment((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          items: prev.items.map((it) =>
            it.barcode === updatedItem.barcode || it.sku.toLowerCase() === cleanCode.toLowerCase()
              ? { ...it, scannedQuantity: updatedItem.scannedQuantity, lastScannedAt: new Date().toISOString() }
              : it
          )
        };
      });
      // Background sync
      loadShipment(false);
    } else {
      triggerFlash('error');
      if (res.isNewItem) {
        setUnknownBarcode(cleanCode);
        if (res.catalogProduct) {
          setNewItemTitle(res.catalogProduct.title);
          setNewItemSku(res.catalogProduct.sku || `SKU-${cleanCode}`);
          setNewItemArticle(res.catalogProduct.article || '');
          setNewItemSize(res.catalogProduct.size || '');
          setIsFromCatalog(true);
        } else {
          setNewItemTitle('');
          setNewItemSku(`SKU-${cleanCode}`);
          setNewItemArticle('');
          setNewItemSize('');
          setIsFromCatalog(false);
        }
        setNewItemPlannedQty(1);
      }
    }
  };

  const handleManualScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      executeBarcodeScan(barcodeInput.trim());
      setBarcodeInput('');
    }
  };

  const handleAddNewUnlistedItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (unknownBarcode && newItemTitle.trim()) {
      const barcodeToAdd = unknownBarcode.trim();
      const titleToAdd = newItemTitle.trim();
      const plannedToAdd = Math.max(1, Number(newItemPlannedQty) || 1);
      const skuToAdd = newItemSku.trim() || `SKU-${barcodeToAdd}`;
      const articleToAdd = newItemArticle.trim() || undefined;
      const sizeToAdd = newItemSize.trim() || undefined;

      setUnknownBarcode(null);
      setNewItemTitle('');
      setNewItemSku('');
      setNewItemArticle('');
      setNewItemSize('');
      setNewItemPlannedQty(1);
      setIsFromCatalog(false);

      try {
        const createdItem = await ShipmentService.addItemToShipment(shipmentId, {
          barcode: barcodeToAdd,
          title: titleToAdd,
          plannedQuantity: plannedToAdd,
          sku: skuToAdd
        });

        // If article or size was set, persist it as well
        if (articleToAdd || sizeToAdd) {
          await ShipmentService.editShipmentItem(shipmentId, createdItem.id, {
            article: articleToAdd,
            size: sizeToAdd
          });
          createdItem.article = articleToAdd;
          createdItem.size = sizeToAdd;
        }

        // Instantly update state in React
        setShipment((prev) => {
          if (!prev) return prev;
          const otherItems = prev.items.filter((it) => it.barcode !== createdItem.barcode && it.id !== createdItem.id);
          return {
            ...prev,
            items: [createdItem, ...otherItems]
          };
        });

        setLastScanResult({
          success: true,
          item: createdItem,
          message: `Новый товар добавлен и принят: ${createdItem.title} (${createdItem.scannedQuantity || 1}/${createdItem.plannedQuantity} шт.)`
        });
        triggerFlash('success');

        // Background sync to ensure fresh state from server
        const fresh = await ShipmentService.getShipmentById(shipmentId);
        if (fresh) {
          setShipment(fresh);
        }
      } catch (err) {
        console.error('Failed to add item:', err);
      }
    }
  };

  // Immediate optimistic + / - quantity adjustment
  const handleUpdateQuantity = async (itemId: string, delta: number) => {
    let targetNewQty = 0;
    setShipment((prev) => {
      if (!prev) return prev;
      const targetItem = prev.items.find((it) => it.id === itemId);
      const current = targetItem ? targetItem.scannedQuantity : 0;
      targetNewQty = Math.max(0, current + delta);
      return {
        ...prev,
        items: prev.items.map((it) =>
          it.id === itemId ? { ...it, scannedQuantity: targetNewQty, lastScannedAt: new Date().toISOString() } : it
        )
      };
    });

    try {
      await ShipmentService.updateItemQuantity(shipmentId, itemId, targetNewQty);
    } catch (e) {
      console.warn('Update quantity error:', e);
    }
  };

  // Open Edit Modal
  const handleOpenEditModal = (item: ShipmentItem) => {
    setEditingItem(item);
    setEditTitle(item.title);
    setEditSku(item.sku);
    setEditArticle(item.article || '');
    setEditSize(item.size || '');
    setEditPlannedQty(item.plannedQuantity);
  };

  // Save Item Edits
  const handleSaveItemEdits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    const itemId = editingItem.id;
    const updates = {
      title: editTitle.trim(),
      sku: editSku.trim() || editingItem.sku,
      article: editArticle.trim() || undefined,
      size: editSize.trim() || undefined,
      plannedQuantity: Math.max(1, Number(editPlannedQty) || 1)
    };

    // Optimistic update in UI
    setShipment((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it) => (it.id === itemId ? { ...it, ...updates } : it))
      };
    });

    setEditingItem(null);

    try {
      await ShipmentService.editShipmentItem(shipmentId, itemId, updates);
      const fresh = await ShipmentService.getShipmentById(shipmentId);
      if (fresh) {
        setShipment(fresh);
      }
    } catch (err) {
      console.error('Failed to edit item:', err);
    }
  };

  // Delete Item
  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    const itemId = deletingItem.id;

    // 1. Optimistic delete in UI immediately
    setShipment((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.filter((it) => it.id !== itemId),
        boxes: prev.boxes.map((b) => ({
          ...b,
          items: b.items.filter((bi) => bi.itemId !== itemId)
        }))
      };
    });

    setDeletingItem(null);

    // 2. Persist deletion on backend
    try {
      await ShipmentService.deleteShipmentItem(shipmentId, itemId);
      const fresh = await ShipmentService.getShipmentById(shipmentId);
      if (fresh) {
        setShipment(fresh);
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
    }
  };

  const handleSaveShipmentEdits = async (updates: Partial<Shipment>) => {
    if (!shipment) return;
    setShipment((prev) => (prev ? { ...prev, ...updates } : null));
    try {
      await ShipmentService.updateShipment(shipmentId, updates);
      loadShipment(false);
    } catch (err) {
      console.error('Update shipment error:', err);
    }
  };

  if (isLoading || !shipment) {
    return (
      <div className="dashboard-container" style={{ textAlign: 'center', padding: '4rem' }}>
        <Barcode size={36} color="var(--primary)" className="animate-spin" />
        <div style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Загрузка поставки и сканера...</div>
      </div>
    );
  }

  if (isPackingView) {
    return (
      <PackingScreen
        shipmentId={shipmentId}
        initialShipment={shipment}
        onBack={() => {
          setIsPackingView(false);
          loadShipment(false);
        }}
      />
    );
  }

  // Calculate totals
  const totalPlanned = shipment.items.reduce((acc, it) => acc + it.plannedQuantity, 0);
  const totalScanned = shipment.items.reduce((acc, it) => acc + it.scannedQuantity, 0);
  const progressPercent = totalPlanned > 0 ? Math.min(100, Math.round((totalScanned / totalPlanned) * 100)) : 0;
  const isReadOnly = shipment.status === 'shipped' || shipment.status === 'completed';

  // Flash background overlay
  const flashBg =
    flashType === 'success'
      ? 'rgba(16, 185, 129, 0.15)'
      : flashType === 'error'
      ? 'rgba(244, 63, 94, 0.2)'
      : 'transparent';

  return (
    <div style={{ background: flashBg, transition: 'background 0.2s ease', minHeight: 'calc(100vh - 64px)' }}>
      <div className="dashboard-container">
        
        {/* Top Navigation & Status Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button className="btn-secondary" onClick={onBack} style={{ padding: '0.4rem 0.75rem' }}>
              <ArrowLeft size={16} /> Назад
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Barcode color="var(--primary)" size={24} /> Поставка {shipment.shipmentNumber}
                </h2>
                {!isReadOnly ? (
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setIsEditShipmentOpen(true)}
                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.4)' }}
                    title="Изменить склады WB, статус или реквизиты поставки"
                  >
                    <Edit2 size={12} /> Изменить
                  </button>
                ) : (
                  <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.4)', fontSize: '0.75rem' }}>
                    {shipment.status === 'completed' ? '🏁 Завершена' : '🚚 Отгружена (Архив)'}
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem', marginTop: '0.1rem' }}>
                <span>Клиент: <b>{shipment.clientName}</b></span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Truck size={13} color="var(--primary)" /> Склады ВБ: {shipment.targetWarehouses.join(', ')}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              className="btn-secondary"
              onClick={() => setIsPackingView(true)}
              style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
            >
              <Box size={16} /> Упаковка в Коробки ({shipment.boxes.length})
            </button>

            {!isReadOnly && (
              <button
                className="btn-secondary"
                onClick={() => setIsCameraOpen(true)}
              >
                <Camera size={16} /> Камера Смартфона
              </button>
            )}
          </div>
        </div>

        {/* Total Progress Bar Card */}
        <div className="card" style={{ marginBottom: '1.25rem', padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={16} color="var(--primary)" /> Прогресс приёмки товара
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' }}>
              {totalScanned} / {totalPlanned} шт. ({progressPercent}%)
            </span>
          </div>
          <div style={{ height: 10, background: 'rgba(15, 23, 42, 0.8)', borderRadius: 999, overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: progressPercent >= 100 ? '#10b981' : 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>

        {/* Primary Barcode Input Controls or ReadOnly Banner */}
        {isReadOnly ? (
          <div className="card" style={{ marginBottom: '1.25rem', padding: '1rem 1.25rem', background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#93c5fd', fontSize: '0.92rem', fontWeight: 600 }}>
              <Lock size={18} color="#38bdf8" />
              <span>Поставка {shipment.status === 'completed' ? 'завершена' : 'отгружена водителю'}. Приёмка и сканирование товаров заблокированы (режим архива / только для чтения).</span>
            </div>
          </div>
        ) : (
          <div className="card" style={{ marginBottom: '1.25rem' }}>
            <form onSubmit={handleManualScanSubmit} style={{ display: 'flex', gap: '0.75rem' }}>
              <div className="input-with-icon" style={{ flex: 1 }}>
                <Barcode className="input-icon" size={20} color="var(--primary)" />
                <input
                  type="text"
                  className="form-input"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Отсканируйте ШК сканером ТСД или введите вручную..."
                  style={{ fontSize: '1.05rem', fontFamily: 'var(--font-mono)' }}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '0 1.5rem' }}>
                <CheckCircle2 size={18} /> Принять ШК
              </button>
            </form>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
              <span>Сканер ТСД активен в фоновом режиме (нажимать на поле не обязательно)</span>
            </div>
          </div>
        )}

        {/* Spotlight Card: Last Scanned Item Feedback */}
        {lastScanResult && (
          <div
            className="card"
            style={{
              borderColor: lastScanResult.success ? '#10b981' : '#f43f5e',
              background: lastScanResult.success ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
              marginBottom: '1.25rem',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)' }}>
                {lastScanResult.success ? (
                  <CheckCircle2 size={32} color="#10b981" />
                ) : (
                  <AlertTriangle size={32} color="#f43f5e" />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', color: lastScanResult.success ? '#10b981' : '#f43f5e' }}>
                  {lastScanResult.message}
                </div>
                {lastScanResult.item && (
                  <div style={{ marginTop: '0.35rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    <span>SKU: <b style={{ fontFamily: 'var(--font-mono)' }}>{lastScanResult.item.sku}</b></span>
                    <span style={{ marginLeft: '1rem', color: 'var(--text-muted)' }}>
                      Отсканировано в этой позиции: <b>{lastScanResult.item.scannedQuantity} / {lastScanResult.item.plannedQuantity} шт.</b>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Table of Shipment Items */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Список товаров в поставке ({shipment.items.length} позиций)</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Наименование товара</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Штрихкод / SKU</th>
                  <th style={{ padding: '0.85rem 1rem' }}>План</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Отсканировано (Факт)</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                    {isReadOnly ? 'Статус позиции' : 'Корректировка & Действия'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {shipment.items.map((item) => {
                  const isComplete = item.scannedQuantity >= item.plannedQuantity;
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: '1px solid rgba(51, 65, 85, 0.4)',
                        background: isComplete ? 'rgba(16, 185, 129, 0.04)' : 'transparent'
                      }}
                    >
                      <td style={{ padding: '0.85rem 1.25rem' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.title}</div>
                        {(item.article || item.size) && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {item.article && `Арт: ${item.article}`} {item.size && `• Размер: ${item.size}`}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>
                        <div
                          style={{
                            cursor: isReadOnly ? 'default' : 'pointer',
                            textDecoration: isReadOnly ? 'none' : 'underline'
                          }}
                          onClick={() => {
                            if (!isReadOnly) executeBarcodeScan(item.barcode);
                          }}
                          title={isReadOnly ? 'Поставка отгружена' : 'Нажмите для быстрой имитации сканирования'}
                        >
                          {item.barcode}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--primary)' }}>{item.sku}</div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                        {item.plannedQuantity} шт.
                      </td>

                      <td style={{ padding: '0.85rem 1rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: isComplete ? '#10b981' : 'var(--primary)'
                          }}
                        >
                          {item.scannedQuantity} шт.
                        </span>
                      </td>

                      <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                        {isReadOnly ? (
                          <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center', color: '#10b981', fontSize: '0.82rem', fontWeight: 600 }}>
                            <CheckCircle2 size={15} /> <span>Зафиксировано</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {/* Minus Button */}
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUpdateQuantity(item.id, -1);
                              }}
                              style={{ padding: '0.35rem 0.55rem', cursor: 'pointer' }}
                              title="Уменьшить количество (-1)"
                            >
                              <Minus size={14} />
                            </button>

                            {/* Plus Button */}
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleUpdateQuantity(item.id, 1);
                              }}
                              style={{ padding: '0.35rem 0.55rem', borderColor: 'var(--primary)', cursor: 'pointer' }}
                              title="Добавить количество (+1)"
                            >
                              <Plus size={14} />
                            </button>

                            {/* Edit Details Button */}
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleOpenEditModal(item);
                              }}
                              style={{ padding: '0.35rem 0.55rem', color: '#38bdf8', borderColor: '#38bdf8' }}
                              title="Редактировать название, артикул или план"
                            >
                              <Edit2 size={13} />
                            </button>

                            {/* Delete Item Button */}
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setDeletingItem(item);
                              }}
                              style={{ padding: '0.35rem 0.55rem', color: '#f43f5e', borderColor: '#f43f5e' }}
                              title="Удалить товар из поставки"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Unlisted Barcode Modal */}
      {unknownBarcode && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', color: '#f59e0b' }}>
              <PackagePlus size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Неизвестный штрихкод в поставке</h3>
            </div>
            
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Штрихкод <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.4rem', borderRadius: 4 }}>{unknownBarcode}</b> не найден в плане этой поставки.
            </p>

            {isFromCatalog && (
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.35)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.65rem 0.85rem',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  fontSize: '0.85rem',
                  color: '#38bdf8'
                }}
              >
                <Sparkles size={18} color="#38bdf8" />
                <span><b>Товар распознан из каталога!</b> Данные заполнены автоматически. Нажмите «Добавить и принять», чтобы внести его в поставку.</span>
              </div>
            )}

            <form onSubmit={handleAddNewUnlistedItem}>
              <div className="form-group">
                <label className="form-label">Наименование товара *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Например: Платье летнее бежевое 42"
                  autoFocus
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Артикул / SKU</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newItemSku}
                    onChange={(e) => setNewItemSku(e.target.value)}
                    placeholder="Например: DRESS-BEG-42"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Артикул WB</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newItemArticle}
                    onChange={(e) => setNewItemArticle(e.target.value)}
                    placeholder="Например: WB-FUT-01"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Размер</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newItemSize}
                    onChange={(e) => setNewItemSize(e.target.value)}
                    placeholder="Например: M / 44 / 164"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">План (шт.) *</label>
                  <div className="number-stepper">
                    <button
                      type="button"
                      className="number-stepper-btn"
                      onClick={() => setNewItemPlannedQty((q) => Math.max(1, (Number(q) || 0) - 1))}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="form-input form-input-number"
                      style={{ textAlign: 'center', padding: '0.4rem 0.5rem', background: 'transparent', border: 'none' }}
                      value={newItemPlannedQty}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setNewItemPlannedQty('');
                        } else {
                          const parsed = parseInt(val, 10);
                          setNewItemPlannedQty(isNaN(parsed) ? '' : Math.max(0, parsed));
                        }
                      }}
                      onBlur={() => {
                        if (!newItemPlannedQty || Number(newItemPlannedQty) < 1) {
                          setNewItemPlannedQty(1);
                        }
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="number-stepper-btn"
                      onClick={() => setNewItemPlannedQty((q) => (Number(q) || 0) + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setUnknownBarcode(null)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  <PlusCircle size={16} /> Добавить и принять {newItemPlannedQty || 1} шт.
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {editingItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 500 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38bdf8' }}>
                <Edit2 size={20} /> Редактирование товара
              </h3>
              <button type="button" className="btn-secondary" onClick={() => setEditingItem(null)} style={{ padding: '0.35rem' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Штрихкод: <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{editingItem.barcode}</b>
            </div>

            <form onSubmit={handleSaveItemEdits}>
              <div className="form-group">
                <label className="form-label">Наименование товара *</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editSku}
                    onChange={(e) => setEditSku(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Артикул WB</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editArticle}
                    onChange={(e) => setEditArticle(e.target.value)}
                    placeholder="Например: WB-FUT-01"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">Размер</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editSize}
                    onChange={(e) => setEditSize(e.target.value)}
                    placeholder="Например: M / 44 / 164"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">План (шт.) *</label>
                  <div className="number-stepper">
                    <button
                      type="button"
                      className="number-stepper-btn"
                      onClick={() => setEditPlannedQty((q) => Math.max(1, (Number(q) || 0) - 1))}
                    >
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      min="1"
                      className="form-input form-input-number"
                      style={{ textAlign: 'center', padding: '0.4rem 0.5rem', background: 'transparent', border: 'none' }}
                      value={editPlannedQty}
                      onFocus={(e) => e.target.select()}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setEditPlannedQty('');
                        } else {
                          const parsed = parseInt(val, 10);
                          setEditPlannedQty(isNaN(parsed) ? '' : Math.max(0, parsed));
                        }
                      }}
                      onBlur={() => {
                        if (!editPlannedQty || Number(editPlannedQty) < 1) {
                          setEditPlannedQty(1);
                        }
                      }}
                      required
                    />
                    <button
                      type="button"
                      className="number-stepper-btn"
                      onClick={() => setEditPlannedQty((q) => (Number(q) || 0) + 1)}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingItem(null)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  Сохранить изменения
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Item Confirmation Modal */}
      {deletingItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', color: '#f43f5e' }}>
              <Trash2 size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Удалить товар из поставки?</h3>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
              Вы действительно хотите удалить <b>«{deletingItem.title}»</b> (ШК: {deletingItem.barcode})?
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Товар будет убран из общего плана приёмки и удален из упакованных коробок.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setDeletingItem(null)}
              >
                Отмена
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleConfirmDelete}
                style={{ background: '#f43f5e', borderColor: '#f43f5e', width: 'auto' }}
              >
                Да, удалить товар
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shipment Modal */}
      <EditShipmentModal
        isOpen={isEditShipmentOpen}
        shipment={shipment}
        onClose={() => setIsEditShipmentOpen(false)}
        onSave={handleSaveShipmentEdits}
      />

      {/* Camera Video Stream Modal for Mobile */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(scannedCode: string) => {
          setIsCameraOpen(false);
          executeBarcodeScan(scannedCode);
        }}
      />
    </div>
  );
};
