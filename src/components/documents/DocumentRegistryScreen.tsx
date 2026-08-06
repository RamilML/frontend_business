import React, { useState, useEffect } from 'react';
import { Act } from '../../types/act';
import { Shipment } from '../../types/shipment';
import { ActService } from '../../services/actService';
import { ShipmentService } from '../../services/shipmentService';
import { ExportUtils } from '../../utils/exportUtils';
import {
  FileText,
  Search,
  Download,
  Printer,
  FileSpreadsheet,
  FileCode,
  PackageCheck,
  Building2,
  Calendar,
  Layers
} from 'lucide-react';

export const DocumentRegistryScreen: React.FC = () => {
  const [acts, setActs] = useState<Act[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'acts' | 'packing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([ActService.getActs(), ShipmentService.getShipments()]).then(([actsData, shipmentsData]) => {
      setActs(actsData);
      setShipments(shipmentsData);
      setIsLoading(false);
    });
  }, []);

  const filteredActs = acts.filter(
    (a) =>
      a.actNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredShipments = shipments.filter(
    (s) =>
      s.shipmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.clientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText color="var(--primary)" size={24} /> Единый Реестр и Центр Выгрузки Документов
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Хранение, печать и экспорт Актов и упаковочных листов в Excel, Word и PDF
          </p>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn-secondary ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Все документы
          </button>
          <button
            className={`btn-secondary ${activeTab === 'acts' ? 'active' : ''}`}
            onClick={() => setActiveTab('acts')}
          >
            Акты выполненных работ ({acts.length})
          </button>
          <button
            className={`btn-secondary ${activeTab === 'packing' ? 'active' : ''}`}
            onClick={() => setActiveTab('packing')}
          >
            Упаковочные листы ({shipments.length})
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="input-with-icon">
          <Search className="input-icon" size={18} />
          <input
            type="text"
            className="form-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск документа по номеру, названию контрагента или дате..."
          />
        </div>
      </div>

      {/* Acts Registry Section */}
      {(activeTab === 'all' || activeTab === 'acts') && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FileText size={18} color="var(--primary)" /> Акты выполненных работ (п. 11 ТЗ)
            </span>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Доступны форматы Excel, Word, PDF</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Акт / Дата</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Контрагент</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Исполнитель</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Сумма</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Выгрузка & Печать</th>
                </tr>
              </thead>
              <tbody>
                {filteredActs.map((act) => (
                  <tr key={act.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{act.actNumber}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        от {new Date(act.date).toLocaleDateString('ru-RU')}
                      </div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{act.clientName}</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      ОсОО "КРЕАТИВ ВЕЙВ БИШКЕК"
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#10b981' }}>
                      {act.totalSum.toLocaleString()} сом/руб.
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => ExportUtils.exportActToExcel(act)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderColor: '#10b981', color: '#10b981' }}
                          title="Скачать в формате Excel (.csv)"
                        >
                          <FileSpreadsheet size={14} /> Excel
                        </button>

                        <button
                          className="btn-secondary"
                          onClick={() => ExportUtils.exportActToWord(act)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderColor: '#3b82f6', color: '#3b82f6' }}
                          title="Скачать в формате Word (.doc)"
                        >
                          <FileCode size={14} /> Word
                        </button>

                        <button
                          className="btn-primary"
                          onClick={() => window.print()}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', width: 'auto' }}
                          title="Печать или сохранить в PDF"
                        >
                          <Printer size={14} /> PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Packing Slips Registry Section */}
      {(activeTab === 'all' || activeTab === 'packing') && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Layers size={18} color="var(--primary)" /> Списки коробок и складов назначения Wildberries
            </span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'rgba(15, 23, 42, 0.7)', borderBottom: '1px solid var(--border)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.85rem 1.25rem' }}>Поставка</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Контрагент</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Склады WB</th>
                  <th style={{ padding: '0.85rem 1rem' }}>Коробок</th>
                  <th style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>Выгрузка</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.map((shp) => (
                  <tr key={shp.id} style={{ borderBottom: '1px solid rgba(51, 65, 85, 0.4)' }}>
                    <td style={{ padding: '0.85rem 1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{shp.shipmentNumber}</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <div style={{ fontWeight: 600 }}>{shp.clientName}</div>
                    </td>

                    <td style={{ padding: '0.85rem 1rem', fontSize: '0.82rem', color: '#93c5fd' }}>
                      {shp.targetWarehouses.join(', ')}
                    </td>

                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className="badge badge-operator">{shp.boxes.length} коробок</span>
                    </td>

                    <td style={{ padding: '0.85rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          className="btn-secondary"
                          onClick={() => ExportUtils.exportPackingToExcel(shp)}
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.78rem', borderColor: '#10b981', color: '#10b981' }}
                          title="Выгрузить состав коробок в Excel"
                        >
                          <FileSpreadsheet size={14} /> Excel коробок
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
