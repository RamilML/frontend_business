import React, { useState } from 'react';
import { X, Camera, Flashlight, Barcode, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export const CameraScannerModal: React.FC<Props> = ({ isOpen, onClose, onScan }) => {
  const [torch, setTorch] = useState(false);
  const [manualCode, setManualCode] = useState('');

  if (!isOpen) return null;

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
      setManualCode('');
    }
  };

  const simulatedBarcodes = ['4601234567890', '4601234567891', '4601234567892', '4609999888111'];

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 480, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Camera color="var(--primary)" size={20} /> Камера сканера ШК
          </h3>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Viewfinder box */}
        <div
          style={{
            height: 240,
            background: '#000',
            borderRadius: 'var(--radius-lg)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed var(--primary)',
            overflow: 'hidden',
            marginBottom: '1rem'
          }}
        >
          {/* Scanning laser line animation */}
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '10%',
              right: '10%',
              height: 2,
              background: '#f43f5e',
              boxShadow: '0 0 10px #f43f5e, 0 0 20px #f43f5e',
              animation: 'pulse 1.5s infinite'
            }}
          />

          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', zIndex: 2 }}>
            <Barcode size={48} color="var(--primary)" style={{ opacity: 0.8, marginBottom: '0.5rem' }} />
            <div>Наведите камеру на штрихкод товара</div>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => setTorch(!torch)}
            style={{
              position: 'absolute',
              bottom: 12,
              right: 12,
              background: torch ? 'var(--primary)' : 'rgba(0,0,0,0.6)',
              color: torch ? '#000' : '#fff'
            }}
          >
            <Flashlight size={16} /> {torch ? 'Вспышка Вкл' : 'Подсветка'}
          </button>
        </div>

        {/* Quick simulation buttons for testing in browser */}
        <div style={{ marginBottom: '1rem', background: 'rgba(15, 23, 42, 0.6)', padding: '0.75rem', borderRadius: 'var(--radius-md)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
            Симуляция считывания камеры (нажмите ШК):
          </span>
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            {simulatedBarcodes.map((code) => (
              <button
                key={code}
                type="button"
                className="btn-secondary"
                onClick={() => {
                  onScan(code);
                }}
                style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Manual fallback form */}
        <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="form-input"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="Ввести ШК вручную..."
            style={{ paddingLeft: '0.75rem' }}
          />
          <button type="submit" className="btn-primary" style={{ width: 'auto', whiteSpace: 'nowrap' }}>
            <CheckCircle2 size={16} /> Ввод
          </button>
        </form>
      </div>
    </div>
  );
};
