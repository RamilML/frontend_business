import React, { useState, useEffect, useRef } from 'react';
import { Shipment, ShipmentItem, ScanResult } from '../../types/shipment';
import { ShipmentService } from '../../services/shipmentService';
import { CameraScannerModal } from './CameraScannerModal';
import { PackingScreen } from '../packing/PackingScreen';
import {
  Barcode,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  ArrowLeft,
  Volume2,
  Sparkles,
  Search,
  Package,
  Layers,
  Truck,
  Box,
  X
} from 'lucide-react';

interface Props {
  shipmentId: string;
  onBack: () => void;
}

export const BarcodeScanScreen: React.FC<Props> = ({ shipmentId, onBack }) => {
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isPackingView, setIsPackingView] = useState(false);
  
  // Flash feedback animation state ('success' | 'error' | null)
  const [flashType, setFlashType] = useState<'success' | 'error' | null>(null);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);

  // Modals
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [unknownBarcode, setUnknownBarcode] = useState<string | null>(null);
  const [newItemTitle, setNewItemTitle] = useState('');

  // TSD Keyboard Buffer Listener
  const keyBufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(Date.now());

  const loadShipment = async () => {
    setIsLoading(true);
    try {
      const data = await ShipmentService.getShipmentById(shipmentId);
      setShipment(data);
    } catch {
      // Ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShipment();
  }, [shipmentId]);

  // Global Hardware TSD Scanner key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in a modal input or text input explicitly
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const now = Date.now();
      // If gap between keys > 100ms, reset buffer (human typing vs barcode scanner)
      if (now - lastKeyTimeRef.current > 100) {
        keyBufferRef.current = '';
      }
      lastKeyTimeRef.current = now;

      if (e.key === 'Enter') {
        if (keyBufferRef.current.trim().length > 3) {
          executeBarcodeScan(keyBufferRef.current.trim());
          keyBufferRef.current = '';
        }
      } else if (e.key.length === 1) {
        keyBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shipmentId]);

  const triggerFlash = (type: 'success' | 'error') => {
    setFlashType(type);
    setTimeout(() => setFlashType(null), 600);
  };

  const executeBarcodeScan = async (code: string) => {
    if (!code) return;
    const res = await ShipmentService.processBarcodeScan(shipmentId, code);
    setLastScanResult(res);

    if (res.success) {
      triggerFlash('success');
      loadShipment();
    } else {
      triggerFlash('error');
      if (res.isNewItem) {
        setUnknownBarcode(code);
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
      await ShipmentService.addItemToShipment(shipmentId, {
        barcode: unknownBarcode,
        title: newItemTitle.trim(),
        plannedQuantity: 10
      });
      setUnknownBarcode(null);
      setNewItemTitle('');
      loadShipment();
    }
  };

  const handleUpdateQuantity = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty < 0) return;
    await ShipmentService.updateItemQuantity(shipmentId, itemId, newQty);
    loadShipment();
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
          loadShipment();
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
                        <div>{item.barcode}</div>
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
                            className="btn-secondary"
                            onClick={() => handleUpdateQuantity(item.id, item.scannedQuantity, -1)}
                            style={{ padding: '0.25rem 0.5rem' }}
                            title="Уменьшить количество (-1)"
                          >
                            <Minus size={14} />
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => handleUpdateQuantity(item.id, item.scannedQuantity, 1)}
                            style={{ padding: '0.25rem 0.5rem', borderColor: 'var(--primary)' }}
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

      {/* Modal for Unregistered Barcode */}
      {unknownBarcode && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 480 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e' }}>
                <AlertTriangle size={20} /> Неизвестный штрихкод
              </h3>
              <button type="button" className="btn-secondary" onClick={() => setUnknownBarcode(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ marginBottom: '1rem', fontSize: '0.9rem' }}>
              Штрихкод <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{unknownBarcode}</b> не найден в плановом списке этой поставки.
            </div>

            <form onSubmit={handleAddNewUnlistedItem}>
              <div className="form-group">
                <label className="form-label">Наименование нового товара *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder="Например: Платье летнее белое L"
                  style={{ paddingLeft: '0.75rem' }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
                <button type="button" className="btn-secondary" onClick={() => setUnknownBarcode(null)}>
                  Отмена
                </button>
                <button type="submit" className="btn-primary" style={{ width: 'auto' }}>
                  <Plus size={16} /> Добавить в приёмку
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Camera Modal */}
      <CameraScannerModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(code) => {
          setIsCameraOpen(false);
          executeBarcodeScan(code);
        }}
      />
    </div>
  );
};
