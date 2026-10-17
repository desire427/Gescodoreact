import { useEffect, useState } from 'react';
import { Save, Shield, Database, Bell, Clock, AlertTriangle, Check } from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function SettingRow({ label, description, children }) {
  return (
    <div className="gc-setting-row">
      <div className="gc-setting-label-wrap">
        <span className="gc-setting-label">{label}</span>
        {description && <span className="gc-setting-desc">{description}</span>}
      </div>
      <div className="gc-setting-control">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }) {
  return (
    <button
      type="button"
      className={`gc-toggle ${value ? 'gc-toggle--on' : ''}`}
      onClick={() => onChange(!value)}
      aria-pressed={value}
    >
      <span className="gc-toggle-thumb" />
    </button>
  );
}

function NumberInput({ value, onChange, min, max, unit }) {
  return (
    <div className="gc-number-input">
      <input type="number" min={min} max={max} value={value} onChange={e => onChange(Number(e.target.value))} />
      {unit && <span className="gc-number-unit">{unit}</span>}
    </div>
  );
}

const DEFAULT_ESCALADE_SETTINGS = {
  enabled: true,
  responsable: [-3, -1, 0, 1],
  manager: [3],
  directeur: [5],
};

function formatEscalationDraft(settings = {}) {
  return {
    responsable: (Array.isArray(settings.responsable) ? settings.responsable : DEFAULT_ESCALADE_SETTINGS.responsable).join(', '),
    manager: (Array.isArray(settings.manager) ? settings.manager : DEFAULT_ESCALADE_SETTINGS.manager).join(', '),
    directeur: (Array.isArray(settings.directeur) ? settings.directeur : DEFAULT_ESCALADE_SETTINGS.directeur).join(', '),
  };
}

function parseThresholds(value) {
  const entries = value.split(',').map(item => item.trim());
  if (!entries.length || entries.some(item => !/^-?\d+$/.test(item))) return null;
  return entries.map(Number);
}

export default function PlatformSettings() {
  const { platformSettings, updatePlatformSettings } = useSuperAdmin();
  const [form, setForm] = useState({ ...platformSettings });
  const [escaladeDraft, setEscaladeDraft] = useState(() => formatEscalationDraft(platformSettings.escaladeSettings));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    setForm({ ...platformSettings });
    setEscaladeDraft(formatEscalationDraft(platformSettings.escaladeSettings));
  }, [platformSettings]);

  const handleSave = async () => {
    const thresholds = {
      responsable: parseThresholds(escaladeDraft.responsable),
      manager: parseThresholds(escaladeDraft.manager),
      directeur: parseThresholds(escaladeDraft.directeur),
    };
    if (
      Object.values(thresholds).some(value => value === null) ||
      thresholds.manager?.some(day => day < 0) ||
      thresholds.directeur?.some(day => day < 0)
    ) {
      setSaveError('Saisissez des jours entiers séparés par des virgules. Les escalades manager et directeur doivent être à J ou après.');
      setSaved(false);
      return;
    }

    const updatedForm = {
      ...form,
      escaladeSettings: {
        ...form.escaladeSettings,
        ...thresholds,
      },
    };
    setSaving(true);
    setSaveError('');
    try {
      await updatePlatformSettings(updatedForm);
      setForm(updatedForm);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (error) {
      setSaved(false);
      setSaveError('Impossible d’enregistrer les paramètres. Vérifiez votre connexion puis réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const f = (key, val) => setForm(p => ({ ...p, [key]: val }));
  const setEscaladeDraftValue = (key, value) => {
    setEscaladeDraft(current => ({ ...current, [key]: value }));
    setSaveError('');
  };
  const previewThresholds = {
    responsable: parseThresholds(escaladeDraft.responsable) || [],
    manager: parseThresholds(escaladeDraft.manager) || [],
    directeur: parseThresholds(escaladeDraft.directeur) || [],
  };

  return (
    <div className="gc-page">

      {/* Sécurité */}
      <section className="gc-section gc-card">
        <div className="gc-card-header">
          <h3 className="gc-card-title"><Shield size={15} />Sécurité</h3>
        </div>
        <div className="gc-settings-list">
          <SettingRow label="Délai d'expiration de session" description="Minutes d'inactivité avant déconnexion automatique.">
            <NumberInput value={form.sessionTimeout} onChange={v => f('sessionTimeout', v)} min={5} max={480} unit="min" />
          </SettingRow>
          <SettingRow label="Maximum d'appareils par utilisateur" description="0 = illimité.">
            <NumberInput value={form.maxDevicesPerUser} onChange={v => f('maxDevicesPerUser', v)} min={0} max={10} />
          </SettingRow>
          <SettingRow label="Longueur minimum du mot de passe">
            <NumberInput value={form.passwordMinLength} onChange={v => f('passwordMinLength', v)} min={6} max={30} />
          </SettingRow>
          <SettingRow label="Double authentification (2FA)" description="Imposer à tous les utilisateurs.">
            <Toggle value={form.twoFactorRequired} onChange={v => f('twoFactorRequired', v)} />
          </SettingRow>
          <SettingRow label="Blocage automatique des comptes suspects" description="Bloquer après plusieurs tentatives échouées.">
            <Toggle value={form.autoLockSuspectedAccounts} onChange={v => f('autoLockSuspectedAccounts', v)} />
          </SettingRow>
        </div>
      </section>

      {/* Documents */}
      <section className="gc-section gc-card">
        <div className="gc-card-header">
          <h3 className="gc-card-title"><Database size={15} />Documents & Fichiers</h3>
        </div>
        <div className="gc-settings-list">
          <SettingRow label="Taille maximale de fichier">
            <NumberInput value={form.fileMaxSizeMb} onChange={v => f('fileMaxSizeMb', v)} min={1} max={500} unit="Mo" />
          </SettingRow>
          <SettingRow label="Types de fichiers autorisés" description="Séparés par des virgules.">
            <input
              className="gc-input-full"
              type="text"
              value={form.allowedFileTypes.join(', ')}
              onChange={e => f('allowedFileTypes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            />
          </SettingRow>
          <SettingRow label="Rétention des sauvegardes">
            <NumberInput value={form.backupRetentionDays} onChange={v => f('backupRetentionDays', v)} min={7} max={3650} unit="jours" />
          </SettingRow>
        </div>
      </section>

      {/* Maintenance */}
      <section className="gc-section gc-card">
        <div className="gc-card-header">
          <h3 className="gc-card-title"><AlertTriangle size={15} />Maintenance</h3>
        </div>
        <div className="gc-settings-list">
          <SettingRow label="Mode maintenance" description="Bloque l'accès aux utilisateurs non-administrateurs.">
            <Toggle value={form.maintenanceMode} onChange={v => f('maintenanceMode', v)} />
          </SettingRow>
          <SettingRow label="Version de la plateforme">
            <input
              className="gc-input-sm"
              type="text"
              value={form.platformVersion}
              onChange={e => f('platformVersion', e.target.value)}
            />
          </SettingRow>
        </div>
        <div className="gc-setting-info">
          <Clock size={13} />
          <span>Dernière sauvegarde : {format(new Date(platformSettings.lastBackup), 'd MMM yyyy à HH:mm', { locale: fr })}</span>
        </div>
      </section>

      {/* Escalades */}
      <section className="gc-section gc-card">
        <div className="gc-card-header">
          <h3 className="gc-card-title"><Bell size={15} />Seuils de relance et escalade</h3>
        </div>
        <p className="gc-setting-desc" style={{ marginBottom: 14 }}>
          Jours relatifs à l'échéance d'une tâche (valeurs négatives = avant l'échéance, positives = après).
        </p>
        <div className="gc-settings-list">
          <SettingRow label="Rappels au Responsable" description="Ex : -3,-1,0,1 → J-3, J-1, J (jour J), J+1">
            <input
              className="gc-input-full"
              type="text"
              value={escaladeDraft.responsable}
              onChange={e => setEscaladeDraftValue('responsable', e.target.value)}
            />
          </SettingRow>
          <SettingRow label="Escalade vers le Manager" description="Nombre de jours après l'échéance">
            <input
              className="gc-input-full"
              type="text"
              value={escaladeDraft.manager}
              onChange={e => setEscaladeDraftValue('manager', e.target.value)}
            />
          </SettingRow>
          <SettingRow label="Escalade vers le Directeur" description="Nombre de jours après l'échéance">
            <input
              className="gc-input-full"
              type="text"
              value={escaladeDraft.directeur}
              onChange={e => setEscaladeDraftValue('directeur', e.target.value)}
            />
          </SettingRow>
          <SettingRow label="Escalades activées" description="Désactiver pour suspendre toutes les relances automatiques.">
            <Toggle
              value={form.escaladeSettings?.enabled ?? true}
              onChange={v => f('escaladeSettings', { ...form.escaladeSettings, enabled: v })}
            />
          </SettingRow>
        </div>

        {/* Timeline preview */}
        <div className="gc-escalade-timeline">
          <span className="gc-escalade-title">Aperçu :</span>
          {previewThresholds.responsable.map((d, index) => (
            <div key={`r${d}-${index}`} className="gc-escalade-step gc-escalade-step--resp">
              <span>{d >= 0 ? `J+${d}` : `J${d}`}</span>
              <small>Responsable</small>
            </div>
          ))}
          {previewThresholds.manager.map((d, index) => (
            <div key={`m${d}-${index}`} className="gc-escalade-step gc-escalade-step--mgr">
              <span>J+{d}</span>
              <small>Manager</small>
            </div>
          ))}
          {previewThresholds.directeur.map((d, index) => (
            <div key={`dir${d}-${index}`} className="gc-escalade-step gc-escalade-step--dir">
              <span>J+{d}</span>
              <small>Directeur</small>
            </div>
          ))}
        </div>
      </section>

      {/* Save bar */}
      <div className="gc-save-bar">
        {saveError && <span className="gc-setting-desc" role="alert">{saveError}</span>}
        <button className={`gc-btn gc-btn--primary ${saved ? 'gc-btn--saved' : ''}`} onClick={handleSave} disabled={saving}>
          {saved
            ? <><Check size={15} /> Enregistré avec succès</>
            : <><Save size={15} /> {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}</>
          }
        </button>
      </div>
    </div>
  );
}
