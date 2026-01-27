# EMCR Church App

Application mobile pour l'Eglise EMCR - Ecouter des sermons, suivre les annonces et rester connecte avec la communaute.

![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)

---

## Limitation Importante : Videos sur Supabase Storage

> **Supabase Storage n'est PAS optimise pour le streaming video.**

Les videos uploadees sur Supabase Storage peuvent prendre un temps tres long a charger (plusieurs minutes) car :
- Pas de CDN optimise pour la video
- Pas de streaming adaptatif (HLS/DASH)
- Pas de mise en cache efficace pour les gros fichiers

### Solutions Recommandees

| Solution | Avantages | Inconvenients |
|----------|-----------|---------------|
| **YouTube (Recommande)** | Gratuit, rapide, plein ecran natif, streaming adaptatif | Videos publiques ou non-listees |
| **Vimeo** | Plus de controle sur la confidentialite | Payant pour les fonctionnalites avancees |
| **Cloudflare Stream** | CDN global, streaming adaptatif | Payant (~$1/1000 minutes vues) |
| **Bunny.net** | Tres economique, CDN rapide | Configuration technique requise |
| **Mux** | API excellente, analytics | Payant |

### Solution Implementee : Lien YouTube

Apres avoir teste plusieurs approches, la solution retenue est d'utiliser des **liens YouTube** pour les videos. Voici pourquoi et comment :

#### Pourquoi YouTube ?

1. **Streaming optimise** : YouTube utilise un CDN mondial et le streaming adaptatif (qualite auto selon connexion)
2. **Gratuit** : Aucun cout de stockage ou de bande passante
3. **Fiable** : Infrastructure Google, disponibilite 99.9%
4. **Experience native** : L'app YouTube s'ouvre automatiquement sur mobile

#### Comment ajouter une video YouTube

1. **Uploadez votre video sur YouTube** (publique ou non-listee)
2. **Copiez le lien** de la video (ex: `https://www.youtube.com/watch?v=ABC123`)
3. **Dans l'admin**, collez ce lien dans le champ "URL Video YouTube"
4. **Optionnel** : Ajoutez aussi un fichier audio pour l'ecoute hors-ligne

#### Comportement dans l'app

| Champ | Resultat |
|-------|----------|
| `audio_url` seulement | Sermon audio classique |
| `youtube_url` seulement | Badge "Video", ouvre YouTube au clic |
| Les deux | L'utilisateur peut choisir (audio dans l'app OU video sur YouTube) |

#### Formats de lien YouTube acceptes

```
https://www.youtube.com/watch?v=VIDEO_ID
https://youtu.be/VIDEO_ID
https://youtube.com/watch?v=VIDEO_ID
```

### Implementation Technique

L'app gere les sermons avec `youtube_url` de la maniere suivante :
1. Si le sermon a une `youtube_url`, un badge "Video" est affiche
2. Un clic sur le bouton video ouvre YouTube (app native ou navigateur)
3. L'audio reste disponible dans le lecteur integre si `audio_url` est present

Pour une meilleure experience, il est **fortement recommande** d'utiliser YouTube pour les videos et de stocker uniquement les fichiers audio sur Supabase Storage.

---

## Table des Matieres

- [Limitation Videos Supabase](#limitation-importante--videos-sur-supabase-storage)
- [Fonctionnalites](#fonctionnalites)
- [Stack Technique](#stack-technique)
- [Prerequis](#prerequis)
- [Installation](#installation)
- [Lancement de l'Application](#lancement-de-lapplication)
- [Scripts Disponibles](#scripts-disponibles)
- [Architecture du Projet](#architecture-du-projet)
- [Documentation du Code](#documentation-du-code)
- [Base de Donnees](#base-de-donnees-supabase)
- [Panel d'Administration](#panel-dadministration)
- [Depannage](#depannage)
- [Contribution](#contribution)

---

## Fonctionnalites

| Fonctionnalite | Description |
|----------------|-------------|
| **Sermons Audio** | Ecouter et telecharger des sermons audio |
| **Sermons Video** | Regarder les predications video (ouvre YouTube) |
| **Notre Eglise** | Page dediee avec infos, mission, vision, contact |
| **Orateurs** | Profils des predicateurs avec leurs sermons |
| **Seminaires** | Series de predications thematiques |
| **Lecteur Audio** | Lecteur style Spotify avec vitesse, minuterie, partage |
| **Telechargements** | Ecoute hors-ligne des sermons |
| **Favoris & Historique** | Suivre vos sermons preferes |
| **Mode Sombre** | Theme sombre uniquement (optimise) |
| **Notifications Push** | Alertes pour nouveaux contenus |
| **Panel Admin** | Gestion complete du contenu avec session persistante |

---

## Stack Technique

### Frontend Mobile
| Technologie | Version | Description |
|-------------|---------|-------------|
| React Native | 0.81.5 | Framework mobile cross-platform |
| Expo SDK | 54 | Plateforme de developpement |
| Expo Router | 6.0 | Navigation basee sur les fichiers |
| TypeScript | 5.9 | Typage statique |
| Zustand | 5.0 | Gestion d'etat legere et performante |
| React Native Reanimated | 4.1 | Animations fluides |

### Backend
| Technologie | Description |
|-------------|-------------|
| Supabase | Backend-as-a-Service (PostgreSQL) |
| Supabase Auth | Authentification |
| Supabase Storage | Stockage fichiers (audio, images) |
| Supabase Edge Functions | Fonctions serverless (notifications) |

### Outils de Developpement
| Outil | Description |
|-------|-------------|
| ESLint | Linting du code |
| Prettier | Formatage du code |
| Husky | Git hooks (pre-commit) |
| TypeScript | Verification des types |

---

## Prerequis

### Obligatoires

| Logiciel | Version Minimum | Lien |
|----------|-----------------|------|
| Node.js | >= 18.0.0 | [nodejs.org](https://nodejs.org/) |
| npm | >= 9.0.0 | Inclus avec Node.js |
| Git | >= 2.0 | [git-scm.com](https://git-scm.com/) |
| Expo Go | Derniere version | [iOS](https://apps.apple.com/app/expo-go/id982107779) / [Android](https://play.google.com/store/apps/details?id=host.exp.exponent) |

### Optionnels (Developpement Natif)

| Logiciel | Plateforme | Description |
|----------|------------|-------------|
| Xcode | macOS | Pour builds iOS natifs |
| Android Studio | Tous | Pour builds Android natifs |
| Watchman | macOS/Linux | Surveillance des fichiers (recommande) |

---

## Installation

### 1. Cloner le Projet

```bash
git clone https://github.com/black-dash77/EMCR-CHURCH.git
cd EMCR-CHURCH
```

### 2. Installer les Dependances

```bash
npm install
```

### 3. Configurer les Variables d'Environnement

```bash
# Copier le fichier exemple
cp .env.example .env

# Editer avec vos cles Supabase
nano .env  # ou ouvrez avec votre editeur
```

Contenu du fichier `.env` :
```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

> **Important** : Ne jamais commiter le fichier `.env` (il est dans `.gitignore`).

### 4. Verifier l'Installation

```bash
# Verifier les types TypeScript
npm run typecheck

# Verifier le linting
npm run lint
```

---

## Lancement de l'Application

### Methode 1 : Expo Go (Recommande pour Debuter)

```bash
npm start
```

Cela ouvre le Metro Bundler avec un QR code :

- **iOS** : Scannez le QR code avec l'app Camera, puis ouvrez dans Expo Go
- **Android** : Ouvrez Expo Go et scannez le QR code

### Methode 2 : VS Code

1. Ouvrez le projet :
   ```bash
   code .
   ```

2. Ouvrez le terminal integre : `Ctrl+`` ` (ou `Cmd+`` ` sur Mac)

3. Lancez le serveur :
   ```bash
   npm start
   ```

4. Utilisez les raccourcis dans le terminal :
   - `i` - Ouvrir sur iOS Simulator
   - `a` - Ouvrir sur Android Emulator
   - `w` - Ouvrir dans le navigateur
   - `r` - Recharger l'app
   - `m` - Ouvrir le menu dev

### Methode 3 : WebStorm / IntelliJ

1. Ouvrez le projet dans WebStorm
2. Ouvrez le terminal (`Alt+F12`)
3. Executez `npm start`
4. Utilisez les memes raccourcis que VS Code

### Methode 4 : Build Natif (Dev Client)

Pour acceder aux fonctionnalites natives completes :

```bash
# iOS (necessite macOS + Xcode)
npm run ios

# Android (necessite Android Studio)
npm run android
```

### Methode 5 : Mode Tunnel (Reseau Distant)

Si votre telephone et ordinateur ne sont pas sur le meme Wi-Fi :

```bash
npx expo start --tunnel
```

---

## Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Demarre le serveur Expo |
| `npm run ios` | Lance sur iOS Simulator |
| `npm run android` | Lance sur Android Emulator |
| `npm run web` | Lance dans le navigateur |
| `npm run lint` | Verifie le code (ESLint) |
| `npm run lint:fix` | Corrige automatiquement les erreurs |
| `npm run typecheck` | Verifie les types TypeScript |
| `npm run format` | Formate le code (Prettier) |

---

## Architecture du Projet

```
EMCR-CHURCH/
├── app/                          # Pages (Expo Router - file-based routing)
│   ├── (tabs)/                   # Navigation par onglets
│   │   ├── _layout.tsx          # Configuration des tabs
│   │   ├── index.tsx            # Accueil
│   │   ├── sermons.tsx          # Liste des sermons
│   │   ├── events.tsx           # Evenements
│   │   ├── announcements.tsx    # Annonces
│   │   └── more.tsx             # Menu Plus
│   ├── sermon/[id].tsx          # Detail sermon (route dynamique)
│   ├── speaker/[id].tsx         # Profil orateur
│   ├── seminar/[id].tsx         # Detail seminaire
│   ├── admin.tsx                # Panel admin mobile
│   ├── downloads.tsx            # Sermons telecharges
│   ├── favorites.tsx            # Favoris
│   ├── history.tsx              # Historique d'ecoute
│   ├── player.tsx               # Lecteur plein ecran
│   ├── queue.tsx                # File d'attente
│   ├── settings.tsx             # Parametres
│   └── _layout.tsx              # Layout principal
│
├── src/
│   ├── components/              # Composants reutilisables
│   │   ├── player/             # Lecteur audio
│   │   │   ├── MiniPlayer.tsx  # Mini lecteur (bas de l'ecran)
│   │   │   └── ExpandedPlayer.tsx # Lecteur plein ecran
│   │   ├── AddToPlaylistModal.tsx
│   │   ├── FilterModal.tsx
│   │   └── ...
│   │
│   ├── services/                # Services et API
│   │   ├── supabase.ts         # Client Supabase
│   │   ├── audioService.ts     # Gestion audio (expo-av)
│   │   ├── downloadService.ts  # Telechargements hors-ligne
│   │   ├── notificationService.ts # Push notifications
│   │   └── api/                # Requetes API par entite
│   │       ├── sermons.ts
│   │       ├── speakers.ts
│   │       ├── events.ts
│   │       └── seminars.ts
│   │
│   ├── stores/                  # Etat global (Zustand)
│   │   ├── useAudioStore.ts    # Etat du lecteur audio
│   │   ├── useDownloadStore.ts # Etat des telechargements
│   │   ├── useUserStore.ts     # Preferences utilisateur
│   │   └── usePlayerStore.ts   # UI du lecteur
│   │
│   ├── hooks/                   # Hooks personnalises
│   │   ├── useColorScheme.ts   # Theme clair/sombre
│   │   └── useDebounce.ts      # Debounce pour recherche
│   │
│   ├── types/                   # Types TypeScript
│   │   └── index.ts            # Toutes les interfaces
│   │
│   ├── theme/                   # Theming
│   │   ├── colors.ts           # Palette de couleurs
│   │   ├── typography.ts       # Styles de texte
│   │   └── spacing.ts          # Espacements
│   │
│   └── utils/                   # Utilitaires
│       ├── formatters.ts       # Formatage dates/durees
│       └── strings.ts          # Manipulation de strings
│
├── assets/                      # Ressources statiques
│   ├── icon.png                # Icone de l'app
│   ├── splash-icon.png         # Ecran de chargement
│   └── fonts/                  # Polices personnalisees
│
├── supabase/                    # Backend Supabase
│   └── functions/              # Edge Functions
│       ├── send-push-notification/
│       └── sunday-notification-cron/
│
├── index-admin.html            # Panel admin web
├── app.json                    # Configuration Expo
├── package.json                # Dependances
├── tsconfig.json               # Configuration TypeScript
└── .env.example                # Template variables d'env
```

---

## Documentation du Code

### Stores (Zustand)

#### `useAudioStore.ts` - Gestion du Lecteur Audio

```typescript
// Etat
interface AudioState {
  currentSermon: Sermon | null;    // Sermon en cours
  isPlaying: boolean;              // Lecture en cours
  isLoading: boolean;              // Chargement audio
  currentTime: number;             // Position (secondes)
  duration: number;                // Duree totale
  playbackRate: PlaybackRate;      // Vitesse (0.5x - 2x)
  volume: number;                  // Volume (0-1)
  repeatMode: RepeatMode;          // off | all | one
  queue: Sermon[];                 // File d'attente
  sleepTimerEndTime: number | null; // Minuterie sommeil
}

// Actions principales
playSermon(sermon)      // Jouer un sermon
togglePlayPause()       // Play/Pause
seek(seconds)          // Aller a une position
skipForward(30)        // Avancer de 30s
skipBackward(15)       // Reculer de 15s
playNext()             // Sermon suivant
playPrevious()         // Sermon precedent
setPlaybackRate(1.5)   // Changer la vitesse
setSleepTimer(30)      // Minuterie 30 min
```

#### `useDownloadStore.ts` - Telechargements Hors-ligne

```typescript
// Etat
interface DownloadState {
  downloads: Record<string, DownloadedSermon>;
  downloadProgress: Record<string, number>;
  isDownloading: Record<string, boolean>;
}

// Actions
startDownload(sermon)   // Demarrer telechargement
pauseDownload(id)       // Mettre en pause
resumeDownload(id)      // Reprendre
removeDownload(id)      // Supprimer
getLocalUri(id)         // Obtenir le chemin local
```

#### `useUserStore.ts` - Preferences Utilisateur

```typescript
// Etat persiste (AsyncStorage)
interface UserState {
  favoriteSermons: string[];       // IDs des favoris
  history: HistoryEntry[];         // Historique d'ecoute
  playlists: Playlist[];           // Playlists personnelles
  notificationPreferences: {...};  // Prefs notifications
}
```

### Services

#### `supabase.ts` - Client Supabase

```typescript
import { supabase } from '@/services/supabase';

// Exemple: Recuperer les sermons
const { data, error } = await supabase
  .from('sermons')
  .select('*, speaker:speakers(*)')
  .order('date', { ascending: false });
```

#### `audioService.ts` - Lecture Audio

```typescript
import { audioService } from '@/services/audioService';

// Charger et jouer
await audioService.loadAudio(url, startPosition);
await audioService.play();
await audioService.pause();
await audioService.seekTo(position);
await audioService.setPlaybackRate(1.5);
```

#### `downloadService.ts` - Telechargements

```typescript
import { downloadService } from '@/services/downloadService';

// Telecharger un sermon
const result = await downloadService.downloadSermon(sermon, (progress) => {
  console.log(`${progress}%`);
});

// Verifier si telecharge
const isDownloaded = await downloadService.isDownloaded(sermonId);

// Obtenir l'espace utilise
const bytes = await downloadService.getTotalDownloadSize();
```

### Types TypeScript

```typescript
// Sermon
interface Sermon {
  id: string;
  title: string;
  speaker: string;
  speaker_id: string | null;
  description: string | null;
  audio_url: string | null;  // Nullable - peut etre video-only
  video_url: string | null;  // URL de la video
  cover_image: string | null;
  date: string;
  duration_seconds: number | null;
  seminar_id: string | null;
  tags: string[] | null;
}

// Speaker (Orateur)
interface Speaker {
  id: string;
  name: string;
  bio: string | null;
  photo_url: string | null;
  ministry: string | null;
}

// Event
interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  time: string | null;
  location: string | null;
  image: string | null;
}

// Announcement
interface Announcement {
  id: string;
  title: string;
  content: string | null;
  urgent: boolean;
  date: string;
  image: string | null;
}
```

### Navigation (Expo Router)

```typescript
// Navigation vers une page
import { useRouter } from 'expo-router';

const router = useRouter();

// Navigation simple
router.push('/sermons');

// Navigation avec parametres
router.push(`/sermon/${sermon.id}`);

// Retour arriere
router.back();

// Remplacement (pas d'historique)
router.replace('/');
```

### Theme et Styles

```typescript
import { colors, typography, spacing } from '@/theme';

// Couleurs avec support dark mode
const themeColors = isDark ? colors.dark : colors.light;

// Utilisation
<View style={{ backgroundColor: themeColors.background }}>
  <Text style={[typography.h1, { color: themeColors.text }]}>
    Titre
  </Text>
</View>
```

---

## Base de Donnees (Supabase)

### Schema des Tables

#### `sermons`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| title | text | Titre du sermon |
| speaker | text | Nom de l'orateur |
| speaker_id | uuid | Reference vers speakers |
| description | text | Description |
| audio_url | text | URL du fichier audio (nullable) |
| video_url | text | URL de la video (nullable) |
| cover_image | text | URL de l'image |
| date | date | Date du sermon |
| duration_seconds | integer | Duree en secondes |
| seminar_id | uuid | Reference vers seminars |
| tags | text[] | Tags/categories |

> **Note**: Un sermon peut avoir `audio_url`, `video_url`, ou les deux. Si seul `video_url` est present, le sermon est affiche comme "Video".

#### `speakers`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| name | text | Nom complet |
| bio | text | Biographie |
| photo_url | text | URL de la photo |
| ministry | text | Ministere/Role |

#### `events`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| title | text | Titre |
| description | text | Description |
| date | date | Date de l'evenement |
| time | time | Heure |
| location | text | Lieu |
| image | text | URL de l'image |

#### `announcements`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| title | text | Titre |
| content | text | Contenu |
| urgent | boolean | Annonce urgente |
| date | date | Date de publication |
| image | text | URL de l'image |

#### `church_info`
| Colonne | Type | Description |
|---------|------|-------------|
| id | uuid | Identifiant unique |
| name | text | Nom de l'eglise |
| slogan | text | Slogan |
| description | text | Description |
| mission | text | Mission |
| vision | text | Vision |
| values | text[] | Valeurs (tableau) |
| history | text | Histoire |
| pastor_name | text | Nom du pasteur |
| pastor_photo | text | Photo du pasteur |
| pastor_message | text | Message du pasteur |
| address | text | Adresse |
| phone | text | Telephone |
| email | text | Email |
| website | text | Site web |
| facebook | text | Lien Facebook |
| instagram | text | Lien Instagram |
| youtube | text | Lien YouTube |
| service_times | text | Horaires des cultes |
| logo_url | text | Logo |
| cover_image | text | Image de couverture |

### Storage Buckets

| Bucket | Contenu |
|--------|---------|
| `sermons-audio` | Fichiers audio MP3 |
| `sermons-video` | Fichiers video (non recommande - voir limitation ci-dessus) |
| `sermon-covers` | Images de couverture sermons |
| `speakers-photos` | Photos des orateurs |
| `events-images` | Images des evenements |
| `announcements-images` | Images des annonces |

---

## Panel d'Administration

### Admin Mobile

Accessible depuis : **Plus > Administration**

**Fonctionnalites :**

- Gestion des sermons (CRUD) avec upload audio/video
- Gestion des orateurs
- Gestion des seminaires
- Gestion des informations de l'eglise (Notre Eglise)
- Envoi de notifications push
- Upload avec progression en pourcentage

**Securite :**
- Authentification par mot de passe hashe (SHA-256)
- Session persistante (reste connecte jusqu'a deconnexion manuelle)

### Admin Web

Ouvrez `index-admin.html` dans un navigateur.

```bash
# Ouvrir localement
open index-admin.html

# Ou servir avec un serveur local
npx serve .
```

---

## Depannage

### L'app ne se connecte pas a Supabase

1. Verifiez le fichier `.env` :
   ```bash
   cat .env
   ```
2. Redemarrez avec cache vide :
   ```bash
   npm start -- --clear
   ```

### Erreur "Unable to resolve module"

```bash
rm -rf node_modules
rm -rf .expo
npm install
npm start -- --clear
```

### Expo Go ne trouve pas le serveur

1. Verifiez que les deux appareils sont sur le meme Wi-Fi
2. Utilisez le mode tunnel :
   ```bash
   npx expo start --tunnel
   ```

### Erreur de build iOS/Android

```bash
npx expo prebuild --clean
npm run ios  # ou android
```

### Audio ne joue pas

1. Verifiez les permissions dans `app.json`
2. Sur iOS Simulator, le son peut etre mute
3. Verifiez que l'URL audio est accessible

### Telechargements echouent

1. Verifiez la connexion internet
2. Verifiez l'espace disque disponible
3. L'URL audio doit etre HTTPS

---

## Contribution

### Workflow Git

1. Forkez le projet
2. Creez une branche :
   ```bash
   git checkout -b feature/ma-fonctionnalite
   ```
3. Commitez vos changements :
   ```bash
   git commit -m 'feat: Ajout de ma fonctionnalite'
   ```
4. Pushez la branche :
   ```bash
   git push origin feature/ma-fonctionnalite
   ```
5. Ouvrez une Pull Request

### Conventions de Commit

| Prefix | Description |
|--------|-------------|
| `feat:` | Nouvelle fonctionnalite |
| `fix:` | Correction de bug |
| `docs:` | Documentation |
| `style:` | Formatage (pas de changement de code) |
| `refactor:` | Refactorisation |
| `test:` | Ajout de tests |
| `chore:` | Maintenance |

### Standards de Code

- TypeScript strict mode
- ESLint + Prettier (auto-fix au commit)
- Pas de `any` dans le code
- Nommage en camelCase (variables, fonctions)
- Nommage en PascalCase (composants, types)

---

## Licence

Ce projet est prive et reserve a l'usage de l'Eglise EMCR.

---

Developpe par **Kiye Mateus** et **Claude**
