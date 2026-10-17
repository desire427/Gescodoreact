import { Shield, Users, Check, Info } from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';

const ROLES = [
  {
    id: 'superAdmin', label: 'Super Administrateur', color: '#7c3aed',
    description: 'Accès total à la plateforme. Gestion des sociétés, rôles, sécurité, audit et restauration.',
    permissions: ['*'],
  },
  {
    id: 'adminSociete', label: 'Administrateur Société', color: '#2563eb',
    description: 'Administrateur de sa société : gestion des utilisateurs, groupes, services, décisions, rapports, escalades et validation.',
    permissions: ['users.manage','groups.manage','audit.read.own','sessions.manage.own','decisions.all','reports.read','tasks.manage','meetings.manage'],
  },
  {
    id: 'manager', label: 'Directeur / Manager', color: '#059669',
    description: 'Gestion de son équipe, réunions, décisions, tâches et validations de son périmètre.',
    permissions: ['meetings.create','decisions.create','tasks.manage.team','reports.team'],
  },
  {
    id: 'rh', label: 'Ressources Humaines', color: '#d97706',
    description: 'Gestion des profils collaborateurs, congés et données RH.',
    permissions: ['users.read','users.profile.manage'],
  },
  {
    id: 'chefProjet', label: 'Chef de Projet', color: '#0891b2',
    description: "Création et pilotage de projets, attribution de tâches, suivi d'avancement.",
    permissions: ['projects.manage','tasks.manage.project'],
  },
  {
    id: 'auditeur', label: 'Auditeur', color: '#7c3aed',
    description: "Lecture seule sur les journaux d'audit, rapports et données de conformité.",
    permissions: ['audit.read.own','reports.read'],
  },
  {
    id: 'employe', label: 'Employé', color: '#475569',
    description: 'Accès à ses propres tâches, conversations et informations.',
    permissions: ['tasks.own','messages.own'],
  },
];

const MATRIX = [
  { action: 'Lire ses conversations',             employe: true,  manager: true,  adminSociete: false, superAdmin: false },
  { action: 'Créer une réunion',                  employe: false, manager: true,  adminSociete: true,  superAdmin: true  },
  { action: 'Créer une décision',                 employe: false, manager: true,  adminSociete: true,  superAdmin: true  },
  { action: 'Attribuer une tâche',                employe: false, manager: true,  adminSociete: true,  superAdmin: true  },
  { action: 'Désactiver un compte',               employe: false, manager: false, adminSociete: true,  superAdmin: true  },
  { action: "Voir journal d'audit (global)",      employe: false, manager: false, adminSociete: false, superAdmin: true  },
  { action: "Voir journal d'audit (périmètre)",   employe: false, manager: true,  adminSociete: true,  superAdmin: true  },
  { action: 'Réinitialiser sessions',             employe: false, manager: false, adminSociete: true,  superAdmin: true  },
  { action: 'Gérer les sociétés',                 employe: false, manager: false, adminSociete: false, superAdmin: true  },
  { action: 'Gérer les rôles globaux',            employe: false, manager: false, adminSociete: false, superAdmin: true  },
  { action: 'Accéder aux paramètres plateforme',  employe: false, manager: false, adminSociete: false, superAdmin: true  },
  { action: 'Exporter des données',               employe: false, manager: false, adminSociete: true,  superAdmin: true  },
  { action: "Voir les rapports d'équipe",         employe: false, manager: true,  adminSociete: true,  superAdmin: true  },
  { action: 'Gérer les projets',                  employe: false, manager: true,  adminSociete: false, superAdmin: true  },
];

const MATRIX_COLS = [
  { key: 'employe',      label: 'Employé' },
  { key: 'manager',      label: 'Manager' },
  { key: 'adminSociete', label: 'Admin Société' },
  { key: 'superAdmin',   label: 'Super Admin' },
];

export default function RolesPermissions() {
  const { users } = useSuperAdmin();
  const countByRole = (roleId) => users.filter(u => u.role === roleId).length;

  return (
    <div className="gc-page">
      {/* Fiches rôles */}
      <section className="gc-section">
        <h2 className="gc-section-label">Rôles définis</h2>
        <div className="gc-roles-grid">
          {ROLES.map(role => (
            <div key={role.id} className="gc-role-card">
              <div className="gc-role-card-head">
                <div className="gc-role-card-icon" style={{ background: role.color + '20' }}>
                  <Shield size={17} style={{ color: role.color }} />
                </div>
                <div>
                  <h4 className="gc-role-card-title" style={{ color: role.color }}>{role.label}</h4>
                  <div className="gc-role-card-count">
                    <Users size={11} /> {countByRole(role.id)} utilisateur{countByRole(role.id) > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <p className="gc-role-card-desc">{role.description}</p>
              <div className="gc-role-card-perms">
                {role.permissions.includes('*')
                  ? <span className="gc-perm-chip gc-perm-chip--all">Accès total</span>
                  : role.permissions.map(p => <span key={p} className="gc-perm-chip">{p}</span>)
                }
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Matrice */}
      <section className="gc-section gc-card">
        <div className="gc-card-header">
          <h3 className="gc-card-title"><Shield size={15} />Matrice d'autorisation</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--gc-muted)' }}>
            <Info size={13} /> Vue simplifiée des droits par rôle principal
          </div>
        </div>
        <div className="gc-table-wrap">
          <table className="gc-table">
            <thead>
              <tr>
                <th>Action</th>
                {MATRIX_COLS.map(c => <th key={c.key} style={{ textAlign: 'center' }}>{c.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {MATRIX.map((row, i) => (
                <tr key={i}>
                  <td style={{ fontSize: 13, color: 'var(--gc-ink)' }}>{row.action}</td>
                  {MATRIX_COLS.map(c => (
                    <td key={c.key} style={{ textAlign: 'center' }}>
                      {row[c.key]
                        ? <span className="gc-matrix-yes"><Check size={13} /></span>
                        : <span className="gc-matrix-no">—</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 12, color: 'var(--gc-muted)', lineHeight: 1.6 }}>
          * La matrice combine RBAC (droits par rôle) et contrôle par périmètre (société, direction, service, projet).
          Un rôle seul ne suffit pas : l'accès dépend également du périmètre organisationnel de l'utilisateur.
        </p>
      </section>
    </div>
  );
}
