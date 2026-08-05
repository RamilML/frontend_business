import React, { useState, useEffect } from 'react';
import { Client, CreateClientDto, LegalType } from '../../types/client';
import { X, Building2, CreditCard, UserCheck, CheckCircle2, ShieldAlert } from 'lucide-react';

interface Props {
  isOpen: boolean;
  clientToEdit?: Client | null;
  onClose: () => void;
  onSave: (clientData: CreateClientDto) => Promise<void>;
}

export const ClientCardModal: React.FC<Props> = ({ isOpen, clientToEdit, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'main' | 'reqs' | 'contact'>('main');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [legalType, setLegalType] = useState<LegalType>('OOO');
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [fullName, setFullName] = useState('');
  const [inn, setInn] = useState('');
  const [kpp, setKpp] = useState('');
  const [ogrn, setOgrn] = useState('');
  const [legalAddress, setLegalAddress] = useState('');
  const [actualAddress, setActualAddress] = useState('');
  const [checkingAccount, setCheckingAccount] = useState('');
  const [bankName, setBankName] = useState('');
  const [bik, setBik] = useState('');
  const [corrAccount, setCorrAccount] = useState('');
  const [swiftCode, setSwiftCode] = useState('');

  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loginUsername, setLoginUsername] = useState('');

  useEffect(() => {
    if (clientToEdit) {
      setName(clientToEdit.name);
      setLegalType(clientToEdit.requisites.legalType || 'OOO');
      setShortName(clientToEdit.requisites.shortName);
      setFullName(clientToEdit.requisites.fullName);
      setInn(clientToEdit.requisites.inn);
      setKpp(clientToEdit.requisites.kpp || '');
      setOgrn(clientToEdit.requisites.ogrn || '');
      setLegalAddress(clientToEdit.requisites.legalAddress);
      setActualAddress(clientToEdit.requisites.actualAddress || '');
      setCheckingAccount(clientToEdit.requisites.checkingAccount);
      setBankName(clientToEdit.requisites.bankName);
      setBik(clientToEdit.requisites.bik);
      setCorrAccount(clientToEdit.requisites.corrAccount);
      setSwiftCode(clientToEdit.requisites.swiftCode || '');

      setContactPerson(clientToEdit.contact.contactPerson);
      setPhone(clientToEdit.contact.phone);
      setEmail(clientToEdit.contact.email);
      setLoginUsername(clientToEdit.loginUsername || '');
    } else {
      // Reset defaults for new client
      setName('');
      setLegalType('OOO');
      setShortName('');
      setFullName('');
      setInn('');
      setKpp('');
      setOgrn('');
      setLegalAddress('');
      setActualAddress('');
      setCheckingAccount('');
      setBankName('');
      setBik('');
      setCorrAccount('');
      setSwiftCode('');
      setContactPerson('');
      setPhone('');
      setEmail('');
      setLoginUsername('');
    }
    setError(null);
  }, [clientToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !inn.trim() || !legalAddress.trim()) {
      setError('Пожалуйста, заполните наименование, ИНН и юридический адрес.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const dto: CreateClientDto = {
        name: name.trim(),
        status: clientToEdit ? clientToEdit.status : 'active',
        loginUsername: loginUsername.trim() || undefined,
        requisites: {
          legalType,
          shortName: shortName.trim() || name.trim(),
          fullName: fullName.trim() || name.trim(),
          inn: inn.trim(),
          kpp: kpp.trim() || undefined,
          ogrn: ogrn.trim() || undefined,
          legalAddress: legalAddress.trim(),
          actualAddress: actualAddress.trim() || undefined,
          checkingAccount: checkingAccount.trim(),
          bankName: bankName.trim(),
          bik: bik.trim(),
          corrAccount: corrAccount.trim(),
          swiftCode: swiftCode.trim() || undefined
        },
        contact: {
          contactPerson: contactPerson.trim(),
          phone: phone.trim(),
          email: email.trim()
        }
      };

      await onSave(dto);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ошибка сохранения контрагента');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: 720 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building2 color="var(--primary)" size={22} />
              {clientToEdit ? 'Редактирование карточки клиента' : 'Новый Клиент (Контрагент)'}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Реквизиты используются для формирования Актов выполненных работ и доступа в систему
            </p>
          </div>
          <button type="button" className="btn-secondary" onClick={onClose} style={{ padding: '0.4rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
          <button
            type="button"
            className={`btn-secondary ${activeTab === 'main' ? 'active' : ''}`}
            onClick={() => setActiveTab('main')}
            style={{
              borderColor: activeTab === 'main' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'main' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <Building2 size={15} /> Основное
          </button>
          <button
            type="button"
            className={`btn-secondary ${activeTab === 'reqs' ? 'active' : ''}`}
            onClick={() => setActiveTab('reqs')}
            style={{
              borderColor: activeTab === 'reqs' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'reqs' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <CreditCard size={15} /> Банковские реквизиты
          </button>
          <button
            type="button"
            className={`btn-secondary ${activeTab === 'contact' ? 'active' : ''}`}
            onClick={() => setActiveTab('contact')}
            style={{
              borderColor: activeTab === 'contact' ? 'var(--primary)' : 'transparent',
              color: activeTab === 'contact' ? 'var(--primary)' : 'var(--text-muted)'
            }}
          >
            <UserCheck size={15} /> Контакты & Доступ
          </button>
        </div>

        {error && (
          <div className="alert-error" style={{ marginBottom: '1rem' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* TAB 1: Main Info */}
          {activeTab === 'main' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Форма собственности</label>
                  <select
                    className="form-input"
                    value={legalType}
                    onChange={(e) => setLegalType(e.target.value as LegalType)}
                    style={{ paddingLeft: '0.75rem' }}
                  >
                    <option value="OOO">ООО (Юр. лицо РФ)</option>
                    <option value="IP">ИП (Физ. лицо РФ)</option>
                    <option value="OsOO">ОсОО (Кыргызстан)</option>
                    <option value="AO">АО (Акционерное общество)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Отображаемое наименование *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!shortName) setShortName(e.target.value);
                    }}
                    placeholder="Например: ООО Модный Гардероб"
                    style={{ paddingLeft: '0.75rem' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Полное наименование (для Акта и договоров)</label>
                <input
                  type="text"
                  className="form-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Общество с ограниченной ответственностью 'Модный Гардероб'"
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">ИНН *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={inn}
                    onChange={(e) => setInn(e.target.value)}
                    placeholder="10 или 12 цифр"
                    style={{ paddingLeft: '0.75rem' }}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">КПП</label>
                  <input
                    type="text"
                    className="form-input"
                    value={kpp}
                    onChange={(e) => setKpp(e.target.value)}
                    placeholder="770101001"
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">ОГРН / ОГРНИП</label>
                  <input
                    type="text"
                    className="form-input"
                    value={ogrn}
                    onChange={(e) => setOgrn(e.target.value)}
                    placeholder="Код регистратора"
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Юридический адрес *</label>
                <textarea
                  className="form-input"
                  value={legalAddress}
                  onChange={(e) => setLegalAddress(e.target.value)}
                  placeholder="Индекс, страна, город, улица, дом, офис"
                  rows={2}
                  style={{ paddingLeft: '0.75rem', height: 'auto' }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Фактический / Складской адрес</label>
                <textarea
                  className="form-input"
                  value={actualAddress}
                  onChange={(e) => setActualAddress(e.target.value)}
                  placeholder="Адрес для сбора товаров"
                  rows={2}
                  style={{ paddingLeft: '0.75rem', height: 'auto' }}
                />
              </div>
            </div>
          )}

          {/* TAB 2: Banking Details */}
          {activeTab === 'reqs' && (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Расчетный счет (20 цифр)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={checkingAccount}
                    onChange={(e) => setCheckingAccount(e.target.value)}
                    placeholder="40702810938000012345"
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Наименование банка</label>
                  <input
                    type="text"
                    className="form-input"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="ПАО Сбербанк / ОАО МБАНК"
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">БИК</label>
                  <input
                    type="text"
                    className="form-input"
                    value={bik}
                    onChange={(e) => setBik(e.target.value)}
                    placeholder="044525225"
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Корр. счет</label>
                  <input
                    type="text"
                    className="form-input"
                    value={corrAccount}
                    onChange={(e) => setCorrAccount(e.target.value)}
                    placeholder="30101810400000000225"
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">SWIFT Код (для Кыргызстана/СНГ)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    placeholder="KYRSKG22"
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Contacts & Access */}
          {activeTab === 'contact' && (
            <div>
              <div className="form-group">
                <label className="form-label">ФИО контактного лица</label>
                <input
                  type="text"
                  className="form-input"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Смирнова Анна Сергеевна"
                  style={{ paddingLeft: '0.75rem' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Телефон для связи</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (999) 123-45-67"
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email для Актов и счетов</label>
                  <input
                    type="email"
                    className="form-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seller@fashion-store.ru"
                    style={{ paddingLeft: '0.75rem' }}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '1rem' }}>
                <label className="form-label">Логин для входа клиента в систему</label>
                <input
                  type="text"
                  className="form-input"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="client"
                  style={{ paddingLeft: '0.75rem' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', display: 'block' }}>
                  Клиент под этим логином сможет заходить в личный кабинет и видеть только свои поставки
                </span>
              </div>
            </div>
          )}

          {/* Modal Actions */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: 'auto' }}>
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Сохранение...' : clientToEdit ? 'Сохранить изменения' : 'Создать контрагента'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
