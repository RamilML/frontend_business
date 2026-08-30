import React, { useState, useEffect, useRef } from 'react';
import { Shipment, ScanResult, ShipmentItem } from '../../types/shipment';
import { ShipmentService } from '../../services/shipmentService';
import { CameraScannerModal } from './CameraScannerModal';
import { PackingScreen } from '../packing/PackingScreen';
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
  HelpCircle,
  PackagePlus
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
  
  // Unlisted Barcode Modal state
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [newItemSku, setNewItemSku] = useState('');
  const [newItemPlannedQty, setNewItemPlannedQty] = useState<number>(10);

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
        setNewItemTitle('');
        setNewItemSku(`SKU-${cleanCode}`);
        setNewItemPlannedQty(10);
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
      const barcodeToAdd = unknownBarcode;
      const titleToAdd = newItemTitle.trim();
      const plannedToAdd = Number(newItemPlannedQty) || 10;
      const skuToAdd = newItemSku.trim() || `SKU-${barcodeToAdd}`;

      setUnknownBarcode(null);
      setNewItemTitle('');
      setNewItemSku('');

      try {
        const createdItem = await ShipmentService.addItemToShipment(shipmentId, {
          barcode: barcodeToAdd,
          title: titleToAdd,
          plannedQuantity: plannedToAdd,
          sku: skuToAdd
        });

        // Optimistically insert new item into state immediately
        setShipment((prev) => {
          if (!prev) return prev;
          if (prev.items.some((it) => it.barcode === createdItem.barcode)) {
            return prev;
          }
          return {
            ...prev,
            items: [createdItem, ...prev.items]
          };
        });

        setLastScanResult({
          success: true,
          item: createdItem,
          message: `Новый товар добавлен и принят: ${createdItem.title} (1/${createdItem.plannedQuantity} шт.)`
        });
        triggerFlash('success');

        loadShipment(false);
      } catch (err) {
        console.error('Failed to add item:', err);
      }
    }
  };

  // Immediate optimistic + / - quantity adjustment
  const handleUpdateQuantity = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = Math.max(0, currentQty + delta);
    
    // 1. Instantly update React state so the UI reflects the click with 0 ms lag
    setShipment((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        items: prev.items.map((it) =>
          it.id === itemId ? { ...it, scannedQuantity: newQty, lastScannedAt: new Date().toISOString() } : it
        )
      };
    });

    // 2. Persist to storage / server
    try {
      await ShipmentService.updateItemQuantity(shipmentId, itemId, newQty);
    } catch (e) {
      console.warn('Update quantity error:', e);
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
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Barcode color="var(--primary)" size={24} /> Поставка {shipment.shipmentNumber}
              </h2>
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

            <button
              className="btn-secondary"
              onClick={() => setIsCameraOpen(true)}
            >
              <Camera size={16} /> Камера Смартфона
            </button>
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

        {/* Primary Barcode Input Controls */}
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
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Корректировка</th>
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
                        {item.article && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Арт: {item.article} {item.size && `• Размер: ${item.size}`}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'var(--font-mono)' }}>
                        <div style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={() => executeBarcodeScan(item.barcode)} title="Нажмите для быстрой имитации сканирования">
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
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUpdateQuantity(item.id, item.scannedQuantity, -1);
                            }}
                            style={{ padding: '0.35rem 0.6rem', cursor: 'pointer' }}
                            title="Уменьшить количество (-1)"
                          >
                            <Minus size={14} />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleUpdateQuantity(item.id, item.scannedQuantity, 1);
                            }}
                            style={{ padding: '0.35rem 0.6rem', borderColor: 'var(--primary)', cursor: 'pointer' }}
                            title="Добавить количество (+1)"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Unlisted Barcode Modal: When an unexpected item is scanned */}
      {unknownBarcode && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem', color: '#f59e0b' }}>
              <PackagePlus size={24} />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Неизвестный штрихкод в поставке</h3>
            </div>
            
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Штрихкод <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)', background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.4rem', borderRadius: 4 }}>{unknownBarcode}</b> не найден в плане этой поставки. Введите название, чтобы принять его:
            </p>

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
                  <label className="form-label">План (шт.)</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={newItemPlannedQty}
                    onChange={(e) => setNewItemPlannedQty(Number(e.target.value))}
                    required
                  />
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
                  <PlusCircle size={16} /> Добавить и принять 1 шт.
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
