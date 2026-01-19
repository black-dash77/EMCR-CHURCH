# EMCR Church - Application Mobile

Application mobile React Native (Expo) pour l'Église Missionnaire Christ est Roi.

## Fonctionnalités

- **Lecteur Audio Complet** : Lecture des prédications avec reprise de position, vitesse de lecture, minuterie de sommeil, file d'attente
- **Prédications** : Liste, recherche, filtres par tags et année, images de couverture
- **Événements** : Calendrier interactif, ajout au calendrier du téléphone
- **Annonces** : Bannières urgentes, liste catégorisée
- **Membres & Ministères** : Annuaire de l'église
- **Galerie Médias** : Photos et vidéos
- **Contact** : Formulaire de contact
- **Favoris & Historique** : Gestion locale des préférences
- **Mode Sombre/Clair** : Support complet du thème système

## Installation

### 1. Cloner et installer les dépendances

```bash
cd EMCR-CHURCH
npm install
```

### 2. Configuration Supabase

Le fichier `.env` contient déjà les clés Supabase. Si vous devez les modifier:

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre-clé-anon
```

### 3. Mise à jour de la base de données

Exécutez le script SQL dans l'éditeur Supabase:

```bash
# Ouvrir supabase-setup.sql et exécuter dans Supabase > SQL Editor
```

### 4. Créer le bucket Storage pour les images de couverture

1. Aller dans Supabase > Storage
2. Créer un nouveau bucket : `sermon-covers`
3. Rendre le bucket public (pour l'accès aux images)

### 5. Ajouter les assets

Remplacez les fichiers dans `/assets/` par vos propres images:

- `icon.png` (1024x1024) - Icône de l'app
- `adaptive-icon.png` (1024x1024) - Icône Android adaptive
- `splash-icon.png` (512x512) - Écran de démarrage
- `notification-icon.png` (96x96) - Icône notifications
- `favicon.png` (48x48) - Favicon web

### 6. Lancer l'application

```bash
# Démarrer le serveur de développement
npx expo start

# iOS Simulator
npx expo run:ios

# Android Emulator
npx expo run:android

# Sur téléphone (scanner le QR code avec Expo Go)
```

## Structure du Projet

```
EMCR-CHURCH/
├── app/                      # Expo Router - Navigation
│   ├── _layout.tsx          # Layout racine
│   ├── (tabs)/              # Onglets principaux
│   │   ├── index.tsx        # Accueil
│   │   ├── sermons.tsx      # Prédications
│   │   ├── events.tsx       # Événements
│   │   ├── announcements.tsx # Annonces
│   │   └── more.tsx         # Menu Plus
│   ├── sermon/[id].tsx      # Détail prédication
│   ├── event/[id].tsx       # Détail événement
│   ├── player.tsx           # Lecteur plein écran
│   └── ...                  # Autres écrans
├── src/
│   ├── components/          # Composants React
│   │   └── player/          # MiniPlayer, ExpandedPlayer
│   ├── services/            # API et services
│   │   ├── supabase.ts      # Client Supabase
│   │   ├── audioService.ts  # Service audio expo-av
│   │   └── api/             # APIs par entité
│   ├── stores/              # Zustand state management
│   │   ├── useAudioStore.ts # État du lecteur
│   │   └── useUserStore.ts  # Préférences utilisateur
│   ├── theme/               # Système de design
│   └── types/               # Types TypeScript
├── assets/                  # Images, icônes
├── app.json                 # Config Expo
└── .env                     # Variables d'environnement
```

## Admin Web

L'interface d'administration reste sur le web (`index-admin.html`):

- Gestion des prédications (avec upload d'image de couverture)
- Gestion des événements
- Gestion des annonces
- Gestion des membres
- Gestion des médias
- Consultation des messages

### Nouvelle fonctionnalité: Image de couverture

L'admin permet maintenant d'uploader une image de couverture pour chaque prédication. Cette image s'affiche dans le lecteur audio de l'app mobile.

## Technologies Utilisées

- **Expo SDK 54** + **React Native 0.81**
- **Expo Router 6** - Navigation fichiers
- **Zustand 5** - State management
- **Supabase** - Backend & Storage
- **expo-av** - Lecture audio
- **react-native-reanimated** - Animations
- **lucide-react-native** - Icônes
- **react-native-calendars** - Calendrier

## Couleur Primaire

```
#1A4BFF (Bleu EMCR)
```

## Support

Pour toute question, contacter l'équipe technique de l'église.
