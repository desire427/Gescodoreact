import { useState } from 'react';
import {
  Plus, Search, Building2, Users, MoreVertical, CheckCircle, XCircle,
  Archive, Edit2, X, Check, Briefcase, Globe, Phone, Mail,
} from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const STATUS_LABELS = { active: 'Active', suspended: 'Suspendue', archived: 'Archivée' };
const STATUS_CLASS  = { active: 'gc-badge--success', suspended: 'gc-badge--danger', archived: 'gc-badge--muted' };

/* ── Modal création/édition ── */
function CompanyModal({ company, onClose, onSave }) {
  const [form, setForm] = useState({
    name:    company?.name    || '',
    code:    company?.code    || '',
    sector:  company?.sector  || '',
    country: company?.country || "Côte d'Ivoire",
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

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="gc-modal-overlay" onClick={onClose}>
      <div className="gc-modal" onClick={e => e.stopPropagation()}>
        <div className="gc-modal-header">
          <h3>{company ? 'Modifier la société' : 'Nouvelle société'}</h3>
          <button className="gc-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="gc-modal-body">
            <div className="gc-form-row">
              <div className="gc-form-field">
                <label>Nom de la société *</label>
                <input value={form.name} onChange={e => f('name', e.target.value)} required />
              </div>
              <div className="gc-form-field gc-form-field--sm">
                <label>Code *</label>
                <input value={form.code} onChange={e => f('code', e.target.value.toUpperCase())} maxLength={6} required />
              </div>
            </div>
            <div className="gc-form-field">
              <label>Secteur d'activité</label>
              <input value={form.sector} onChange={e => f('sector', e.target.value)} />
            </div>
            <div className="gc-form-row">
              <div className="gc-form-field">
                <label>Pays</label>
                <input value={form.country} onChange={e => f('country', e.target.value)} />
              </div>
              <div className="gc-form-field">
                <label>Ville</label>
                <input value={form.city} onChange={e => f('city', e.target.value)} />
              </div>
            </div>
            <div className="gc-form-field">
              <label>Adresse</label>
              <input value={form.address} onChange={e => f('address', e.target.value)} />
            </div>
            <div className="gc-form-row">
              <div className="gc-form-field">
                <label>Téléphone</label>
                <input type="tel" value={form.phone} onChange={e => f('phone', e.target.value)} />
              </div>
              <div className="gc-form-field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={e => f('email', e.target.value)} />
              </div>
            </div>
          </div>
          <div className="gc-modal-footer">
            <button type="button" className="gc-btn gc-btn--ghost" onClick={onClose}>Annuler</button>
            <button type="submit" className="gc-btn gc-btn--primary">
              <Check size={14} /> {company ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Confirm Modal ── */
export function ConfirmModal({ message, confirmLabel, confirmClass, onConfirm, onClose }) {
  return (
    <div className="gc-modal-overlay" onClick={onClose}>
      <div className="gc-modal gc-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="gc-modal-header">
          <h3>Confirmation</h3>
          <button className="gc-icon-btn" onClick={onClose}><X size={18} /></button>
        </div>
        <div className="gc-modal-body">
          <p className="gc-confirm-msg">{message}</p>
        </div>
        <div className="gc-modal-footer">
          <button className="gc-btn gc-btn--ghost" onClick={onClose}>Annuler</button>
          <button className={`gc-btn ${confirmClass || 'gc-btn--danger'}`} onClick={onConfirm}>
            {confirmLabel || 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main ── */
export default function Companies() {
  const { companies, users, createCompany, updateCompany, toggleCompanyStatus } = useSuperAdmin();
  const [search, setSearch]     = useState('');
  const [filter, setFilter]     = useState('all');
  const [modal, setModal]       = useState(null);
  const [openMenu, setOpenMenu] = useState(null);

  const filtered = companies.filter(c => {
    const match = c.name.toLowerCase().includes(search.toLowerCase()) || c.code.toLowerCase().includes(search.toLowerCase());
    return match && (filter === 'all' || c.status === filter);
  });

  const getUserCount = (id) => users.filter(u => u.companyId === id).length;

  const handleSave = (form) => {
    if (modal.data) updateCompany(modal.data.id, form);
    else createCompany(form);
    setModal(null);
  };

  const FILTERS = [
    { id: 'all', label: 'Toutes' }, { id: 'active', label: 'Actives' },
    { id: 'suspended', label: 'Suspendues' }, { id: 'archived', label: 'Archivées' },
  ];

  return (
    <div className="gc-page">
      {/* Toolbar */}
      <div className="gc-toolbar">
        <div className="gc-search-wrap">
          <Search size={14} className="gc-search-icon" />
          <input
            className="gc-search-input"
            placeholder="Rechercher une société…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="gc-filter-pills">
          {FILTERS.map(f => (
            <button
              key={f.id}
              className={`gc-filter-pill ${filter === f.id ? 'gc-filter-pill--active' : ''}`}
              onClick={() => setFilter(f.id)}
            >{f.label}</button>
          ))}
        </div>
        <button className="gc-btn gc-btn--primary" onClick={() => setModal({ type: 'form', data: null })}>
          <Plus size={14} /> Nouvelle société
        </button>
      </div>

      {/* Count */}
      <p className="gc-count">{filtered.length} société{filtered.length > 1 ? 's' : ''}</p>

      {/* Grid */}
      <div className="gc-companies-grid">
        {filtered.length === 0 && <p className="gc-empty">Aucune société trouvée.</p>}
        {filtered.map(company => (
          <div key={company.id} className="gc-company-card">
            <div className="gc-company-card-head">
              <div className="gc-company-logo"><Building2 size={22} /></div>
              <div className="gc-company-info">
                <span className="gc-company-name">{company.name}</span>
                <span className="gc-company-code">{company.code}</span>
              </div>
              <span className={`gc-badge ${STATUS_CLASS[company.status]}`}>{STATUS_LABELS[company.status]}</span>
              {/* Menu */}
              <div className="gc-menu-wrap">
                <button className="gc-icon-btn" onClick={() => setOpenMenu(openMenu === company.id ? null : company.id)}>
                  <MoreVertical size={15} />
                </button>
                {openMenu === company.id && (
                  <>
                    <div className="gc-menu-backdrop" onClick={() => setOpenMenu(null)} />
                    <div className="gc-dropdown">
                      <button className="gc-dropdown-item" onClick={() => { setModal({ type: 'form', data: company }); setOpenMenu(null); }}>
                        <Edit2 size={13} /> Modifier
                      </button>
                      {company.status !== 'active' && (
                        <button className="gc-dropdown-item" onClick={() => { setModal({ type: 'confirm', data: company, action: 'activate' }); setOpenMenu(null); }}>
                          <CheckCircle size={13} /> Activer
                        </button>
                      )}
                      {company.status === 'active' && (
                        <button className="gc-dropdown-item gc-dropdown-item--danger" onClick={() => { setModal({ type: 'confirm', data: company, action: 'suspend' }); setOpenMenu(null); }}>
                          <XCircle size={13} /> Suspendre
                        </button>
                      )}
                      {company.status !== 'archived' && (
                        <button className="gc-dropdown-item gc-dropdown-item--danger" onClick={() => { setModal({ type: 'confirm', data: company, action: 'archive' }); setOpenMenu(null); }}>
                          <Archive size={13} /> Archiver
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="gc-company-details">
              {company.sector && <span className="gc-company-detail"><Briefcase size={12} />{company.sector}</span>}
              {company.city && <span className="gc-company-detail"><Globe size={12} />{company.city}, {company.country}</span>}
              {company.phone && <span className="gc-company-detail"><Phone size={12} />{company.phone}</span>}
              {company.email && <span className="gc-company-detail"><Mail size={12} />{company.email}</span>}
            </div>

            <div className="gc-company-card-foot">
              <span className="gc-company-stat"><Users size={13} />{getUserCount(company.id)} utilisateurs</span>
              <span className="gc-company-date">
                {format(new Date(company.createdAt), 'd MMM yyyy', { locale: fr })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {modal?.type === 'form' && (
        <CompanyModal company={modal.data} onClose={() => setModal(null)} onSave={handleSave} />
      )}
      {modal?.type === 'confirm' && (
        <ConfirmModal
          message={
            modal.action === 'suspend'  ? `Suspendre "${modal.data.name}" ? Tous les accès seront bloqués.` :
            modal.action === 'archive'  ? `Archiver "${modal.data.name}" ? La société sera inaccessible.` :
            `Activer "${modal.data.name}" ?`
          }
          confirmLabel={modal.action === 'suspend' ? 'Suspendre' : modal.action === 'archive' ? 'Archiver' : 'Activer'}
          confirmClass={modal.action === 'activate' ? 'gc-btn--primary' : 'gc-btn--danger'}
          onClose={() => setModal(null)}
          onConfirm={() => {
            const map = { suspend: 'suspended', archive: 'archived', activate: 'active' };
            toggleCompanyStatus(modal.data.id, map[modal.action]);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
