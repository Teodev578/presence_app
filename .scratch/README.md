# Gestionnaire Local des Spécifications & Anomalies

Ce répertoire héberge les spécifications et tickets de travail locaux pour PresenceApp, conformément au protocole consigné dans `docs/agents/issue-tracker.md`.

## Structure d'un Chantier Fonctionnel

Chaque fonctionnalité ou refactoring dispose de son sous-dossier dédié :

```
.scratch/<feature-slug>/
├── spec.md                      # Spécification fonctionnelle et technique du chantier
└── issues/                      # Découpage séquentiel des tickets d'implémentation
    ├── 01-schema-dexie.md       # Premier ticket
    ├── 02-composant-vue.md      # Second ticket
    └── 03-outbox-sync.md        # Troisième ticket
```

## Étiquettes de Triage Autorisées

Chaque fichier de ticket comporte en en-tête une ligne `Status:` valorisée avec l'un des rôles canoniques de `docs/agents/triage-labels.md` :
- `Status: needs-triage` : Ticket nouvellement créé en attente d'arbitrage.
- `Status: needs-info` : Ticket incomplet nécessitant des éclaircissements humains.
- `Status: ready-for-agent` : Ticket qualifié, prêt pour implémentation autonome par un agent.
- `Status: ready-for-human` : Ticket exigeant une décision ou une validation humaine.
- `Status: wontfix` : Ticket abandonné ou hors-périmètre.
