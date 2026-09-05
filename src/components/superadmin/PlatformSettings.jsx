import { useState } from 'react';
import { Save, Shield, Database, Bell, Clock, AlertTriangle, Check } from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

function SettingField({ label, description, children }) {
  return (
    <div className="sa-setting-field">
      <div className="sa-setting-field-label">
        <span className="sa-setting-label">{label}</span>
        {description && <span className="sa-setting-desc">{description}</span>}
      </div>
      <div className="sa-setting-field-input">{children}</div>
    </div>
  );
}

function ToggleSwitch({ value, onChange }) {
  return (
    <button
      type="button"
      className={`sa-toggle ${value ? 'sa-toggle--on' : ''}`}
      onClick={() => onChange(!value)}
    >
      <div className="sa-toggle-thumb" />
    </button>
  );
}

export default function PlatformSettings() {
  const { platformSettings, updatePlatformSettings } = useSuperAdmin();
  const [form, setForm]   = useState({ ...platformSettings });
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updatePlatformSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const field = (key, val) => setForm(p => ({ ...p, [key]: val }));

  return (
    <div className="sa-page">

      {/* Sécurité */}
      <section className="sa-section sa-card">
        <div className="sa-card-header">
          <h3 className="sa-card-title"><Shield size={16} />Sécurité</h3>
        </div>
        <div className="sa-settings-list">
          <SettingField
            label="Délai d'expiration de session"
            description="Minutes d'inactivité avant déconnexion automatique."
          >
            <div className="sa-number-input">
              <input
                type="number" min={5} max={480}
                value={form.sessionTimeout}
                onChange={e => field('sessionTimeout', Number(e.target.value))}
              />
              <span>min</span>
            </div>
          </SettingField>

          <SettingField
            label="Nombre maximum d'appareils par utilisateur"
            description="0 = illimité."
          >
            <input
              className="sa-input-sm"
              type="number" min={0} max={10}
              value={form.maxDevicesPerUser}
              onChange={e => field('maxDevicesPerUser', Number(e.target.value))}
            />
          </SettingField>

          <SettingField
            label="Longueur minimum du mot de passe"
          >
            <input
              className="sa-input-sm"
              type="number" min={6} max={30}
              value={form.passwordMinLength}
              onChange={e => field('passwordMinLength', Number(e.target.value))}
            />
          </SettingField>

          <SettingField
            label="Double authentification obligatoire (2FA)"
            description="Imposer à tous les utilisateurs."
          >
            <ToggleSwitch
              value={form.twoFactorRequired}
              onChange={v => field('twoFactorRequired', v)}
            />
          </SettingField>

          <SettingField
            label="Blocage automatique des comptes suspects"
            description="Bloquer après plusieurs tentatives de connexion échouées."
          >
            <ToggleSwitch
              value={form.autoLockSuspectedAccounts}
              onChange={v => field('autoLockSuspectedAccounts', v)}
            />
          </SettingField>
        </div>
      </section>

      {/* Documents */}
      <section className="sa-section sa-card">
        <div className="sa-card-header">
          <h3 className="sa-card-title"><Database size={16} />Documents & Fichiers</h3>
        </div>
        <div className="sa-settings-list">
          <SettingField
            label="Taille maximale de fichier"
          >
            <div className="sa-number-input">
              <input
                type="number" min={1} max={500}
                value={form.fileMaxSizeMb}
                onChange={e => field('fileMaxSizeMb', Number(e.target.value))}
              />
              <span>Mo</span>
            </div>
          </SettingField>

          <SettingField
            label="Types de fichiers autorisés"
            description="Séparés par des virgules."
          >
            <input
              className="sa-input-full"
              type="text"
              value={form.allowedFileTypes.join(', ')}
              onChange={e => field('allowedFileTypes', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            />
          </SettingField>

          <SettingField
            label="Rétention des sauvegardes"
          >
            <div className="sa-number-input">
              <input
                type="number" min={7} max={3650}
                value={form.backupRetentionDays}
                onChange={e => field('backupRetentionDays', Number(e.target.value))}
              />
              <span>jours</span>
            </div>
          </SettingField>
        </div>
      </section>

      {/* Maintenance */}
      <section className="sa-section sa-card">
        <div className="sa-card-header">
          <h3 className="sa-card-title"><AlertTriangle size={16} />Maintenance</h3>
        </div>
        <div className="sa-settings-list">
          <SettingField
            label="Mode maintenance"
            description="Bloque l'accès à tous les utilisateurs non-administrateurs."
          >
            <ToggleSwitch
              value={form.maintenanceMode}
              onChange={v => field('maintenanceMode', v)}
            />
          </SettingField>
          <SettingField label="Version de la plateforme">
            <input
              className="sa-input-sm"
              type="text"
              value={form.platformVersion}
              onChange={e => field('platformVersion', e.target.value)}
            />
          </SettingField>
        </div>

        <div className="sa-setting-info-row">
          <Clock size={13} />
          <span>
            Dernière sauvegarde : {format(new Date(platformSettings.lastBackup), 'd MMM yyyy à HH:mm', { locale: fr })}
          </span>
        </div>
      </section>

      {/* ── Escalades ── */}
      <section className="sa-section sa-card">
        <div className="sa-card-header">
          <h3 className="sa-card-title"><Bell size={16} />Seuils de relance et escalade</h3>
        </div>
        <p className="sa-setting-desc" style={{ marginBottom: 8, color: '#94a3b8', fontSize: 13 }}>
          Jours relatifs à l'échéance d'une tâche (valeurs négatives = avant l'échéance, positives = après).
        </p>
        <div className="sa-settings-list">
          <SettingField
            label="Rappels au Responsable"
            description="Ex : -3,-1,0,1 → J-3, J-1, J (jour J), J+1"
          >
            <input
              className="sa-input-full"
              type="text"
              value={form.escaladeSettings?.responsable?.join(', ') || ''}
              onChange={e => field('escaladeSettings', {
                ...form.escaladeSettings,
                responsable: e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
              })}
            />
          </SettingField>
          <SettingField
            label="Escalade vers le Manager"
            description="Nombre de jours après l'échéance"
          >
            <input
              className="sa-input-full"
              type="text"
              value={form.escaladeSettings?.manager?.join(', ') || ''}
              onChange={e => field('escaladeSettings', {
                ...form.escaladeSettings,
                manager: e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
              })}
            />
          </SettingField>
          <SettingField
            label="Escalade vers le Directeur"
            description="Nombre de jours après l'échéance"
          >
            <input
              className="sa-input-full"
              type="text"
              value={form.escaladeSettings?.directeur?.join(', ') || ''}
              onChange={e => field('escaladeSettings', {
                ...form.escaladeSettings,
                directeur: e.target.value.split(',').map(v => parseInt(v.trim())).filter(v => !isNaN(v))
              })}
            />
          </SettingField>
          <SettingField
            label="Escalades activées"
            description="Désactiver pour suspendre toutes les relances automatiques."
          >
            <ToggleSwitch
              value={form.escaladeSettings?.enabled ?? true}
              onChange={v => field('escaladeSettings', { ...form.escaladeSettings, enabled: v })}
            />
          </SettingField>
        </div>
        <div className="sa-escalade-preview">
          <span className="sa-escalade-preview-title">Exemple avec les valeurs actuelles :</span>
          <div className="sa-escalade-timeline">
            {(form.escaladeSettings?.responsable || []).map(d => (
              <div key={`r${d}`} className={`sa-escalade-step sa-escalade-step--resp`}>
                {d >= 0 ? `J+${d}` : `J${d}`}<span>Responsable</span>
              </div>
            ))}
            {(form.escaladeSettings?.manager || []).map(d => (
              <div key={`m${d}`} className="sa-escalade-step sa-escalade-step--mgr">
                J+{d}<span>Manager</span>
              </div>
            ))}
            {(form.escaladeSettings?.directeur || []).map(d => (
              <div key={`dir${d}`} className="sa-escalade-step sa-escalade-step--dir">
                J+{d}<span>Directeur</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bouton save sticky */}
      <div className="sa-settings-save-bar">
        <button className={`sa-btn sa-btn--primary ${saved ? 'sa-btn--saved' : ''}`} onClick={handleSave}>
          {saved ? <><Check size={15} /> Enregistré</> : <><Save size={15} /> Enregistrer les modifications</>}
        </button>
      </div>
    </div>
  );
}
