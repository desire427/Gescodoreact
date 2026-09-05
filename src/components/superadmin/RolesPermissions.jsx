import { Shield, Users, Check, Info } from 'lucide-react';
import { roles } from '../../data/mockData';
import { useSuperAdmin } from '../../context/SuperAdminContext';

const PERMISSIONS_MATRIX = [
  { action: 'Lire ses conversations',          employe: true,  manager: true,  adminSociete: false, superAdmin: false },
  { action: 'Créer une réunion',               employe: false, manager: true,  adminSociete: true,  superAdmin: true  },
  { action: 'Créer une décision',              employe: false, manager: true,  adminSociete: true,  superAdmin: true  },
  { action: 'Attribuer une tâche',             employe: false, manager: true,  adminSociete: true,  superAdmin: true  },
  { action: 'Désactiver un compte',            employe: false, manager: false, adminSociete: true,  superAdmin: true  },
  { action: 'Voir journal d\'audit (global)',  employe: false, manager: false, adminSociete: false, superAdmin: true  },
  { action: 'Voir journal d\'audit (périmètre)', employe: false, manager: true, adminSociete: true, superAdmin: true  },
  { action: 'Réinitialiser sessions',          employe: false, manager: false, adminSociete: true,  superAdmin: true  },
  { action: 'Gérer les sociétés',             employe: false, manager: false, adminSociete: false, superAdmin: true  },
  { action: 'Gérer les rôles globaux',         employe: false, manager: false, adminSociete: false, superAdmin: true  },
  { action: 'Accéder aux paramètres plateforme', employe: false, manager: false, adminSociete: false, superAdmin: true  },
  { action: 'Exporter des données',            employe: false, manager: false, adminSociete: true,  superAdmin: true  },
  { action: 'Voir les rapports équipe',        employe: false, manager: true,  adminSociete: true,  superAdmin: true  },
  { action: 'Gérer les projets',               employe: false, manager: true,  adminSociete: false, superAdmin: true  },
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
    <div className="sa-page">

      {/* Fiches rôles */}
      <section className="sa-section">
        <h2 className="sa-section-title">Rôles définis</h2>
        <div className="sa-roles-grid">
          {roles.map(role => (
            <div key={role.id} className="sa-role-card" style={{ '--role-color': role.color }}>
              <div className="sa-role-card-header">
                <div className="sa-role-card-icon" style={{ background: role.color + '22' }}>
                  <Shield size={18} style={{ color: role.color }} />
                </div>
                <div>
                  <h4 className="sa-role-card-title" style={{ color: role.color }}>{role.label}</h4>
                  <div className="sa-role-card-count">
                    <Users size={12} />
                    {countByRole(role.id)} utilisateur{countByRole(role.id) > 1 ? 's' : ''}
                  </div>
                </div>
              </div>
              <p className="sa-role-card-desc">{role.description}</p>
              <div className="sa-role-card-perms">
                {role.permissions.includes('*') ? (
                  <span className="sa-perm-chip sa-perm-chip--all">Accès total</span>
                ) : (
                  role.permissions.map(p => (
                    <span key={p} className="sa-perm-chip">{p}</span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Matrice d'autorisation */}
      <section className="sa-section sa-card">
        <div className="sa-card-header">
          <h3 className="sa-card-title"><Shield size={16} />Matrice d'autorisation</h3>
          <div className="sa-card-info">
            <Info size={14} />
            <span>Vue simplifiée des droits par rôle principal</span>
          </div>
        </div>
        <div className="sa-table-wrap">
          <table className="sa-table sa-matrix-table">
            <thead>
              <tr>
                <th className="sa-matrix-action-col">Action</th>
                {MATRIX_COLS.map(c => (
                  <th key={c.key} className="sa-matrix-role-col">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS_MATRIX.map((row, i) => (
                <tr key={i}>
                  <td className="sa-matrix-action">{row.action}</td>
                  {MATRIX_COLS.map(c => (
                    <td key={c.key} className="sa-matrix-cell">
                      {row[c.key] ? (
                        <span className="sa-matrix-yes"><Check size={14} /></span>
                      ) : (
                        <span className="sa-matrix-no">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="sa-matrix-note">
          * La matrice combine RBAC (droits par rôle) et contrôle par périmètre (société, direction, service, projet).
          Un rôle seul ne suffit pas : l'accès dépend également du périmètre organisationnel de l'utilisateur.
        </p>
      </section>
    </div>
  );
}
