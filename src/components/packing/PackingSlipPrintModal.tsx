import React from 'react';
import { Shipment, PackingBox } from '../../types/shipment';
import { X, Printer, PackageCheck, Truck } from 'lucide-react';

interface Props {
  isOpen: boolean;
  shipment: Shipment;
  onClose: () => void;
}

export const PackingSlipPrintModal: React.FC<Props> = ({ isOpen, shipment, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Group boxes by target WB warehouse
  const boxesByWarehouse: Record<string, PackingBox[]> = {};
  shipment.boxes.forEach((box) => {
    if (!boxesByWarehouse[box.targetWarehouse]) {
      boxesByWarehouse[box.targetWarehouse] = [];
    }
    boxesByWarehouse[box.targetWarehouse].push(box);
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 800, background: '#fff', color: '#000' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }} className="no-print">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#000' }}>
            Печатная форма: Упаковочный лист по коробкам и складам WB
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn-primary" onClick={handlePrint} style={{ width: 'auto' }}>
              <Printer size={16} /> Печать упаковочного листа
            </button>
            <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.4rem', color: '#000', borderColor: '#ccc' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Area */}
        <div className="print-document" style={{ fontFamily: 'sans-serif', padding: '1rem', color: '#000' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #000', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0 }}>
                УПАКОВОЧНЫЙ ЛИСТ ПОСТАВКИ № {shipment.shipmentNumber}
              </h2>
              <div style={{ fontSize: '0.9rem', color: '#333', marginTop: '0.25rem' }}>
                Контрагент (Клиент): <b>{shipment.clientName}</b>
              </div>
            </div>
            <div style={{ textAlign: 'right', fontSize: '0.85rem' }}>
              <div>Дата сборки: <b>{new Date().toLocaleDateString('ru-RU')}</b></div>
              <div>Всего коробок: <b>{shipment.boxes.length} шт.</b></div>
            </div>
          </div>

          {Object.keys(boxesByWarehouse).length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
              Коробки не сформированы
            </div>
          ) : (
            Object.entries(boxesByWarehouse).map(([warehouse, boxes]) => (
              <div key={warehouse} style={{ marginBottom: '1.75rem', pageBreakInside: 'avoid' }}>
                <div 
                  style={{
                    background: '#f1f5f9',
                    padding: '0.5rem 0.75rem',
                    fontWeight: 700,
                    fontSize: '1.05rem',
                    borderLeft: '4px solid #0f172a',
                    marginBottom: '0.75rem',
                    display: 'flex',
                    justifyContent: 'space-between'
                  }}
                >
                  <span>Склад назначения Wildberries: {warehouse}</span>
                  <span>Коробок: {boxes.length} шт.</span>
                </div>

                {boxes.map((box) => (
                  <div key={box.boxNumber} style={{ border: '1px solid #cbd5e1', borderRadius: 6, padding: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '0.95rem', marginBottom: '0.5rem', borderBottom: '1px dashed #cbd5e1', paddingBottom: '0.35rem' }}>
                      <span>КОРОБКА № {box.boxNumber}</span>
                      <span>Предметов в коробке: {box.items.reduce((a, c) => a + c.quantity, 0)} шт.</span>
                    </div>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', color: '#475569', textAlign: 'left' }}>
                          <th style={{ padding: '0.4rem' }}>Штрихкод</th>
                          <th style={{ padding: '0.4rem' }}>Наименование товара</th>
                          <th style={{ padding: '0.4rem', textAlign: 'right' }}>Количество</th>
                        </tr>
                      </thead>
                      <tbody>
                        {box.items.map((item, idx) => (
                          <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                            <td style={{ padding: '0.4rem', fontFamily: 'monospace' }}>{item.barcode}</td>
                            <td style={{ padding: '0.4rem' }}>{item.title}</td>
                            <td style={{ padding: '0.4rem', textAlign: 'right', fontWeight: 700 }}>{item.quantity} шт.</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            ))
          )}

          {/* Footer signature block */}
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #000', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <div>Упаковал (Оператор): ____________________ / {shipment.operatorName || 'Смирнов А.'}</div>
            <div>Проверил (Менеджер): ____________________</div>
          </div>
        </div>
      </div>
    </div>
  );
};
