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

## Comptes et accès

La connexion est authentifiée par le backend Django. Les identifiants affichés
dans les anciennes maquettes ou données de démonstration (`mockData`) ne sont
pas des comptes valides dans la base de données et ne permettent pas de se
connecter.

Il n'y a pas d'inscription publique :

1. Créez le premier compte **Super Administrateur** avec `createsuperuser`
   après avoir configuré la base locale.
2. Le Super Administrateur crée la société, puis les comptes et leur rôle.
   Chaque compte doit avoir un mot de passe initial. Lorsqu'il crée un compte,
   le Super Administrateur déclenche l'envoi de l'adresse email et du mot de
   passe initial au destinataire.
3. Les comptes créés avec une invitation Super Administrateur sont actifs dès
   la création et peuvent se connecter immédiatement avec les identifiants
   reçus par email. Les comptes déjà au statut **Invité** doivent être activés
   depuis la gestion des utilisateurs.
4. L'**Administrateur Société** peut ensuite gérer les comptes ordinaires de
   sa propre société. Il ne peut ni créer un Super Administrateur ni attribuer
   le rôle Administrateur Société.

Les anciens mots de passe d'exemple ne doivent pas être réutilisés.

En développement (`DEBUG=True`), les emails sont écrits dans la console.
Pour envoyer réellement les invitations, configurer côté backend `EMAIL_HOST`,
`EMAIL_PORT`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `EMAIL_USE_TLS`,
`EMAIL_USE_SSL` et `DEFAULT_FROM_EMAIL` dans l'environnement de déploiement.
En production (`DEBUG=False`), Django utilise SMTP par défaut. Une erreur
d'envoi annule la création du compte et est signalée dans l'interface.

---

## Navigation

```
Page de connexion
    │
    ├── Super Admin        → Dashboard administration complète
    │       └── Bouton "Discussions" → Messagerie → "Retour au tableau de bord"
    │
    ├── Administrateur Société → Tableau de bord de pilotage de sa société
    │       └── Bouton "Discussions" → Messagerie → "Retour au tableau de bord"
    │
    └── Autres rôles       → Tableau de bord opérationnel et données autorisées
            └── Bouton "Discussions" → Messagerie
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

### Administrateur Société
- Rôle unique réunissant les fonctions précédemment nommées Administrateur Société et Direction Générale
- Tableau de bord : taux d'exécution décisions, retards critiques, charge équipe
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
| Persistance messagerie | API REST Django, PostgreSQL/SQLite et WebSocket Django Channels |
| Appels 1 à 1 | WebRTC audio/vidéo, signalisation Channels |

---

## Démarrer la messagerie avec le backend

Dans un premier terminal, démarrer le backend depuis `backend/`. Pour éviter
toute connexion accidentelle à une base distante, le démarrage local ci-dessous
force explicitement SQLite. Avec `daphne` dans `INSTALLED_APPS`, `runserver`
prend également en charge les WebSockets en développement ; la commande Daphne
ci-dessous reste recommandée pour reproduire le déploiement ASGI :

```bash
python -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
DB_ENGINE=django.db.backends.sqlite3 DB_NAME=local.sqlite3 python manage.py migrate
DB_ENGINE=django.db.backends.sqlite3 DB_NAME=local.sqlite3 python manage.py createsuperuser
DB_ENGINE=django.db.backends.sqlite3 DB_NAME=local.sqlite3 daphne -b 127.0.0.1 -p 8000 Gescodo.asgi:application
```

Dans un second terminal, depuis `frontend/` :

```bash
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

L’URL du frontend doit être autorisée dans `CORS_ALLOWED_ORIGINS` côté backend.
Pour le développement local, `http://localhost:5173` et
`http://127.0.0.1:5173` sont autorisés par défaut. Les comptes de démonstration
ci-dessus ne sont disponibles que si les données de démonstration ont été
chargées ; sinon, créer des utilisateurs actifs via l’administration Django
ou `createsuperuser`.

Sans `REDIS_URL`, Channels utilise sa couche mémoire, qui convient uniquement
à un processus local unique. En production ou avec plusieurs processus ASGI,
configurer Redis via `REDIS_URL` avant de lancer Daphne. Servir l’application
en HTTPS et configurer `VITE_WEBRTC_ICE_SERVERS` avec vos serveurs ICE STUN/TURN
pour les appels depuis des réseaux restrictifs. L’accès au micro et à la caméra
nécessite l’autorisation du navigateur.

La messagerie accepte les pièces jointes de 20 Mo maximum, dans les formats
image/audio/vidéo et document pris en charge par l’API. Les statuts expirent
après 24 heures. Les appels de cette version sont limités aux conversations
individuelles ; les appels de groupe ne sont pas inclus.

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

> **Note** : Les données de messagerie sont désormais persistées dans le backend
> Django. Certaines fonctions des modules Réunions, Tâches et Décisions restent
> gérées par leurs contextes frontend existants et ne font pas partie de la
> persistance de messagerie documentée ici.
