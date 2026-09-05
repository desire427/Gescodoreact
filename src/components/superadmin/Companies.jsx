import { useState } from 'react';
import {
  Plus, Search, Building2, Users, MoreVertical, CheckCircle, XCircle,
  Archive, Edit2, X, Check, Briefcase, Globe, Phone, Mail,
} from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_LABELS = { active: 'Active', suspended: 'Suspendue', archived: 'Archivée' };
const STATUS_COLORS = { active: 'sa-badge--green', suspended: 'sa-badge--red', archived: 'sa-badge--gray' };

function CompanyModal({ company, onClose, onSave }) {
  const [form, setForm] = useState({
    name:    company?.name    || '',
    code:    company?.code    || '',
    sector:  company?.sector  || '',
    country: company?.country || 'Côte d\'Ivoire',
    city:    company?.city    || '',
    address: company?.address || '',
    phone:   company?.phone   || '',
    email:   company?.email   || '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) return;
    onSave(form);
  };

  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>{company ? 'Modifier la société' : 'Nouvelle société'}</h3>
          <button className="sa-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="sa-modal-body" onSubmit={handleSubmit}>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Nom de la société *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="sa-form-field sa-form-field--sm">
              <label>Code *</label>
              <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} maxLength={6} required />
            </div>
          </div>
          <div className="sa-form-field">
            <label>Secteur d'activité</label>
            <input value={form.sector} onChange={e => setForm(p => ({ ...p, sector: e.target.value }))} />
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Pays</label>
              <input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} />
            </div>
            <div className="sa-form-field">
              <label>Ville</label>
              <input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} />
            </div>
          </div>
          <div className="sa-form-field">
            <label>Adresse</label>
            <input value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} />
          </div>
          <div className="sa-form-row">
            <div className="sa-form-field">
              <label>Téléphone</label>
              <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div className="sa-form-field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
          </div>
          <div className="sa-modal-footer">
            <button type="button" className="sa-btn sa-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="sa-btn sa-btn--primary">
              <Check size={15} /> {company ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ message, confirmLabel, confirmClass, onConfirm, onClose }) {
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal sa-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="sa-modal-header">
          <h3>Confirmation</h3>
          <button className="sa-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="sa-modal-body">
          <p className="sa-confirm-message">{message}</p>
        </div>
        <div className="sa-modal-footer">
          <button className="sa-btn sa-btn--ghost" onClick={onClose}>Annuler</button>
          <button className={`sa-btn ${confirmClass || 'sa-btn--danger'}`} onClick={onConfirm}>
            {confirmLabel || 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

export { ConfirmModal };

export default function Companies() {
  const { companies, users, createCompany, updateCompany, toggleCompanyStatus } = useSuperAdmin();

  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [modal, setModal]         = useState(null); // null | { type, data }
  const [openMenu, setOpenMenu]   = useState(null);

  const filtered = companies.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                        c.code.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const getUserCount = (companyId) => users.filter(u => u.companyId === companyId).length;

  const handleSave = (form) => {
    if (modal.data) {
      updateCompany(modal.data.id, form);
    } else {
      createCompany(form);
    }
    setModal(null);
  };

  return (
    <div className="sa-page">
      {/* Toolbar */}
      <div className="sa-toolbar">
        <div className="sa-search-wrap">
          <Search size={15} className="sa-search-icon" />
          <input
            className="sa-search-input"
            placeholder="Rechercher une société…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="sa-filter-tabs">
          {[
            { id: 'all',       label: 'Toutes' },
            { id: 'active',    label: 'Actives' },
            { id: 'suspended', label: 'Suspendues' },
            { id: 'archived',  label: 'Archivées' },
          ].map(f => (
            <button
              key={f.id}
              className={`sa-filter-tab ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button className="sa-btn sa-btn--primary" onClick={() => setModal({ type: 'form', data: null })}>
          <Plus size={15} /> Nouvelle société
        </button>
      </div>

      {/* Grille */}
      <div className="sa-companies-grid">
        {filtered.length === 0 && (
          <p className="sa-empty">Aucune société trouvée.</p>
        )}
        {filtered.map(company => (
          <div key={company.id} className="sa-company-card">
            <div className="sa-company-card-header">
              <div className="sa-company-logo">
                <Building2 size={24} />
              </div>
              <div className="sa-company-main">
                <span className="sa-company-name">{company.name}</span>
                <span className="sa-company-code">{company.code}</span>
              </div>
              <span className={`sa-badge ${STATUS_COLORS[company.status]}`}>
                {STATUS_LABELS[company.status]}
              </span>
              {/* Menu */}
              <div className="sa-menu-wrap">
                <button
                  className="sa-icon-btn"
                  onClick={() => setOpenMenu(openMenu === company.id ? null : company.id)}
                >
                  <MoreVertical size={16} />
                </button>
                {openMenu === company.id && (
                  <>
                    <div className="sa-menu-backdrop" onClick={() => setOpenMenu(null)} />
                    <div className="sa-dropdown">
                      <button className="sa-dropdown-item" onClick={() => { setModal({ type: 'form', data: company }); setOpenMenu(null); }}>
                        <Edit2 size={14} /> Modifier
                      </button>
                      {company.status !== 'active' && (
                        <button className="sa-dropdown-item" onClick={() => { setModal({ type: 'confirm', data: company, action: 'activate' }); setOpenMenu(null); }}>
                          <CheckCircle size={14} /> Activer
                        </button>
                      )}
                      {company.status === 'active' && (
                        <button className="sa-dropdown-item sa-dropdown-item--danger" onClick={() => { setModal({ type: 'confirm', data: company, action: 'suspend' }); setOpenMenu(null); }}>
                          <XCircle size={14} /> Suspendre
                        </button>
                      )}
                      {company.status !== 'archived' && (
                        <button className="sa-dropdown-item sa-dropdown-item--danger" onClick={() => { setModal({ type: 'confirm', data: company, action: 'archive' }); setOpenMenu(null); }}>
                          <Archive size={14} /> Archiver
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="sa-company-details">
              {company.sector && (
                <div className="sa-company-detail">
                  <Briefcase size={13} />
                  <span>{company.sector}</span>
                </div>
              )}
              {company.city && (
                <div className="sa-company-detail">
                  <Globe size={13} />
                  <span>{company.city}, {company.country}</span>
                </div>
              )}
              {company.phone && (
                <div className="sa-company-detail">
                  <Phone size={13} />
                  <span>{company.phone}</span>
                </div>
              )}
              {company.email && (
                <div className="sa-company-detail">
                  <Mail size={13} />
                  <span>{company.email}</span>
                </div>
              )}
            </div>

            <div className="sa-company-footer">
              <div className="sa-company-stat">
                <Users size={14} />
                <span>{getUserCount(company.id)} utilisateurs</span>
              </div>
              <span className="sa-company-date">
                Créée le {format(new Date(company.createdAt), 'd MMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal?.type === 'form' && (
        <CompanyModal
          company={modal.data}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}
      {modal?.type === 'confirm' && (
        <ConfirmModal
          message={
            modal.action === 'suspend'
              ? `Suspendre "${modal.data.name}" ? Tous les accès seront bloqués.`
              : modal.action === 'archive'
              ? `Archiver "${modal.data.name}" ? La société sera inaccessible.`
              : `Activer "${modal.data.name}" ?`
          }
          confirmLabel={
            modal.action === 'suspend' ? 'Suspendre' :
            modal.action === 'archive' ? 'Archiver'  : 'Activer'
          }
          confirmClass={modal.action === 'activate' ? 'sa-btn--primary' : 'sa-btn--danger'}
          onClose={() => setModal(null)}
          onConfirm={() => {
            const statusMap = { suspend: 'suspended', archive: 'archived', activate: 'active' };
            toggleCompanyStatus(modal.data.id, statusMap[modal.action]);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
