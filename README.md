# KAB Platform

Plateforme professionnelle de communication, réunions, décisions, tâches et pilotage.

---

## Démarrage rapide

```bash
npm install
npm run dev
```

L'application sera disponible sur **http://localhost:5173**

---

## Comptes de démonstration

### 🟣 Super Administrateur

| Champ | Valeur |
|-------|--------|
| **URL** | http://localhost:5173 |
| **Email** | k.kouame@kab-group.ci |
| **Mot de passe** | `superadmin123` |
| **Nom** | Konan Kouamé |
| **Accès** | Dashboard global · Sociétés · Utilisateurs · Projets · Réunions · Rôles & Accès · Journal d'audit · Sessions & Appareils · Paramètres plateforme |

---

### 🔵 Administrateur Société / Directeur Général — KAB Industries

| Champ | Valeur |
|-------|--------|
| **URL** | http://localhost:5173 |
| **Email** | a.bamba@kab-industries.ci |
| **Mot de passe** | `admin123` |
| **Nom** | Adjoua Bamba |
| **Société** | KAB Industries |
| **Accès** | Dashboard DG · Utilisateurs de sa société · Projets · Réunions · Décisions · Tâches · Journal d'audit (périmètre société) |

---

### 🔵 Administrateur Société / Directeur Général — KAB Industries (2ème compte)

| Champ | Valeur |
|-------|--------|
| **URL** | http://localhost:5173 |
| **Email** | a.coulibaly@kab-industries.ci |
| **Mot de passe** | `admin123` |
| **Nom** | Amara Coulibaly |
| **Société** | KAB Industries |
| **Accès** | Même accès qu'Admin Société / DG |

---

### 🔵 Administrateur Société — KAB Logistique

| Champ | Valeur |
|-------|--------|
| **URL** | http://localhost:5173 |
| **Email** | y.koffi@kab-logistique.ci |
| **Mot de passe** | `admin123` |
| **Nom** | Yao Koffi |
| **Société** | KAB Logistique |

---

### 🟢 Manager / Directeur

| Champ | Valeur |
|-------|--------|
| **URL** | http://localhost:5173 |
| **Email** | f.diallo@kab-industries.ci |
| **Mot de passe** | `manager123` |
| **Nom** | Fatou Diallo |
| **Rôle** | Directrice des Opérations |
| **Accès** | Interface messagerie |

---

### 🟡 Ressources Humaines

| Champ | Valeur |
|-------|--------|
| **URL** | http://localhost:5173 |
| **Email** | i.yeboua@kab-industries.ci |
| **Mot de passe** | `rh123` |
| **Nom** | Inès Yeboua |
| **Accès** | Interface messagerie |

---

### ⚫ Auditeur

| Champ | Valeur |
|-------|--------|
| **URL** | http://localhost:5173 |
| **Email** | jp.bakayoko@kab-group.ci |
| **Mot de passe** | `audit123` |
| **Nom** | Jean-Pierre Bakayoko |
| **Accès** | Interface messagerie |

---

## Navigation

```
Page de connexion
    │
    ├── Super Admin        → Dashboard administration complète
    │       └── Bouton "Discussions" → Messagerie → "Retour au tableau de bord"
    │
    ├── Admin Société/DG   → Dashboard DG (KPIs, décisions, tâches, équipe)
    │       └── Bouton "Discussions" → Messagerie → "Retour au tableau de bord"
    │
    └── Autres rôles       → Messagerie directement
```

---

## Fonctionnalités implémentées

### Super Administrateur
- Gestion des sociétés (créer, modifier, suspendre, archiver)
- Gestion des utilisateurs (inviter, modifier, cycle de vie complet)
- Blocage immédiat avec révocation de sessions
- Départ collaborateur : transfert en masse des tâches
- Gestion des appareils (approbation/révocation individuelle)
- Gestion des rôles et matrice d'autorisation
- Journal d'audit global filtrable + export CSV
- Sessions et appareils actifs en temps réel
- Paramètres plateforme (sécurité, escalades, documents)
- Gestion de projets avec Kanban drag & drop
- Module Réunions complet avec PV
- Dashboard reporting consolidé (CDC 13.3)

### Administrateur Société / Directeur Général
- Dashboard DG : taux d'exécution décisions, retards critiques, charge équipe
- Gestion des utilisateurs de sa société uniquement
- Module Décisions complet (workflow, historique, force clôture justifiée)
- Module Tâches (vue tableau + Kanban, soumission preuve, validation/rejet)
- Projets avec Kanban et édition tâches
- Réunions avec conduite, PV et transformation en projet
- Journal d'audit périmètre société

### Messagerie (tous les rôles)
- Discussions individuelles et groupes
- Types de canaux : Service, Direction, Projet, Canal Annonce
- Réactions emoji, @mentions, menu "Transformer en…"
- Réunions intégrées (Option C) : discussion + ordre du jour + décisions → projet
- Brouillons locaux, épinglage, étoilage

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | React 19 + Vite 8 |
| UI Icons | Lucide React |
| Dates | date-fns |
| Style | CSS pur avec variables (thème clair/sombre) |
| État | Context API (AppContext, SuperAdminContext, AdminSocieteContext) |
| Routage | État React (pas de react-router-dom) |
| Persistance | LocalStorage (thème, profil) |
| Backend | Aucun — données mockées (frontend only) |

---

## Structure du projet

```
src/
├── components/
│   ├── superadmin/          # Interface Super Admin
│   │   ├── SuperAdminLayout.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Companies.jsx
│   │   ├── UsersManagement.jsx
│   │   ├── Projects.jsx       ← Kanban drag & drop
│   │   ├── Meetings.jsx
│   │   ├── AuditLog.jsx
│   │   ├── SessionsDevices.jsx
│   │   ├── RolesPermissions.jsx
│   │   └── PlatformSettings.jsx
│   ├── adminsociete/         # Interface Admin Société / DG
│   │   ├── AdminSocieteLayout.jsx
│   │   ├── DashboardDG.jsx
│   │   ├── DecisionsModule.jsx
│   │   ├── TasksModule.jsx
│   │   └── UsersManagementAS.jsx
│   ├── ChatWindow.jsx         # Messagerie enrichie
│   ├── MessageBubble.jsx      # Réactions, @mentions, Transformer en…
│   ├── MeetingsView.jsx       # Onglet Réunions (sidebar)
│   ├── MeetingRoom.jsx        # Vue réunion Option C
│   ├── MeetingCreateModal.jsx
│   └── LoginPage.jsx
├── context/
│   ├── AppContext.jsx          # État messagerie global
│   ├── AuthContext.jsx         # Authentification + navigation
│   ├── SuperAdminContext.jsx
│   ├── AdminSocieteContext.jsx
│   └── WorkspaceContext.jsx    # Contexte proxy partagé
└── data/
    └── mockData.js             # Toutes les données de démonstration
```

---

> **Note** : Cette version est un prototype frontend. Toutes les données sont simulées en mémoire et remises à zéro à chaque rechargement de page. Pour une mise en production, un backend (Node.js/NestJS + PostgreSQL + WebSocket) est nécessaire conformément à l'architecture décrite dans le CDC section 17.
