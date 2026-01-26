# EMCR Church App

Application mobile pour l'Eglise EMCR - Ecouter des sermons, suivre les annonces et rester connecte avec la communaute.

![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?logo=react)
![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)

## Fonctionnalites

- **Sermons** - Ecouter et telecharger des sermons audio
- **Evenements** - Calendrier des evenements de l'eglise
- **Annonces** - Actualites et communications
- **Orateurs** - Profils des predicateurs
- **Seminaires** - Series de predications thematiques
- **Lecteur Audio** - Lecteur complet avec file d'attente, vitesse de lecture, minuterie de sommeil
- **Telechargements** - Ecoute hors-ligne des sermons
- **Favoris & Historique** - Suivre vos sermons preferes
- **Mode Sombre** - Support automatique du theme systeme
- **Panel Admin** - Gestion du contenu (mobile + web)

## Stack Technique

| Technologie | Description |
|-------------|-------------|
| **React Native** | Framework mobile cross-platform |
| **Expo SDK 54** | Plateforme de developpement |
| **Expo Router** | Navigation basee sur les fichiers |
| **TypeScript** | Typage statique |
| **Zustand** | Gestion d'etat |
| **Supabase** | Backend (Auth, Database, Storage) |
| **expo-av** | Lecture audio |

## Prerequis

Avant de commencer, assurez-vous d'avoir installe :

- **Node.js** >= 18.0.0 ([Telecharger](https://nodejs.org/))
- **npm** >= 9.0.0 (inclus avec Node.js)
- **Git** ([Telecharger](https://git-scm.com/))
- **Expo Go** app sur votre telephone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))

### Optionnel (pour le developpement natif)

- **Xcode** (macOS uniquement, pour iOS)
- **Android Studio** (pour Android)

## Installation

### 1. Cloner le projet

```bash
git clone https://github.com/black-dash77/EMCR-CHURCH.git
cd EMCR-CHURCH
```

### 2. Installer les dependances

```bash
npm install
```

### 3. Configurer les variables d'environnement

Creer un fichier `.env` a la racine du projet :

```env
EXPO_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

> **Note** : Contactez l'administrateur du projet pour obtenir les cles Supabase.

## Lancement de l'Application

### Methode 1 : Avec Expo Go (Recommande pour debuter)

```bash
npm start
```

Cela ouvre le Metro Bundler. Ensuite :

- **iOS** : Scannez le QR code avec l'app Camera
- **Android** : Scannez le QR code avec l'app Expo Go

### Methode 2 : Depuis VS Code

1. Ouvrez le projet dans VS Code :
   ```bash
   code .
   ```

2. Ouvrez le terminal integre (`Ctrl+`` ` ou `Cmd+`` `)

3. Lancez le serveur de developpement :
   ```bash
   npm start
   ```

4. Appuyez sur :
   - `i` pour ouvrir sur iOS Simulator
   - `a` pour ouvrir sur Android Emulator
   - `w` pour ouvrir dans le navigateur web

### Methode 3 : Build de developpement (Dev Client)

Pour acceder aux fonctionnalites natives completes :

```bash
# iOS (necessite macOS + Xcode)
npm run ios

# Android (necessite Android Studio)
npm run android
```

### Methode 4 : Mode Tunnel (Reseau distant)

Si votre telephone et votre ordinateur ne sont pas sur le meme reseau :

```bash
npx expo start --tunnel
```

## Scripts Disponibles

| Commande | Description |
|----------|-------------|
| `npm start` | Demarre le serveur de developpement Expo |
| `npm run ios` | Lance l'app sur iOS Simulator |
| `npm run android` | Lance l'app sur Android Emulator |
| `npm run web` | Lance l'app dans le navigateur |
| `npm run lint` | Verifie le code avec ESLint |
| `npm run lint:fix` | Corrige automatiquement les erreurs de lint |
| `npm run typecheck` | Verifie les types TypeScript |
| `npm run format` | Formate le code avec Prettier |

## Structure du Projet

```
EMCR-CHURCH/
├── app/                    # Pages de l'application (Expo Router)
│   ├── (tabs)/            # Navigation par onglets
│   │   ├── index.tsx      # Page d'accueil
│   │   ├── sermons.tsx    # Liste des sermons
│   │   ├── events.tsx     # Evenements
│   │   ├── announcements.tsx # Annonces
│   │   └── more.tsx       # Menu Plus
│   ├── sermon/[id].tsx    # Detail d'un sermon
│   ├── speaker/[id].tsx   # Profil d'un orateur
│   ├── admin.tsx          # Panel d'administration
│   └── _layout.tsx        # Layout principal
├── src/
│   ├── components/        # Composants React reutilisables
│   │   ├── player/       # Composants du lecteur audio
│   │   └── ui/           # Composants UI generiques
│   ├── services/          # Services (Supabase, Audio, etc.)
│   ├── stores/            # Stores Zustand (etat global)
│   ├── hooks/             # Hooks personnalises
│   ├── types/             # Types TypeScript
│   └── theme/             # Theme et styles
├── assets/                # Images, icones, fonts
├── supabase/              # Fonctions Edge Supabase
├── index-admin.html       # Panel admin web
└── package.json
```

## Panel d'Administration

### Admin Mobile

Accessible depuis l'app via **Plus > Administration**.

Mot de passe requis (configure dans Supabase).

### Admin Web

Ouvrez `index-admin.html` dans un navigateur ou deployez-le sur un serveur web.

```bash
# Ouvrir localement
open index-admin.html
```

## Base de Donnees (Supabase)

### Tables Principales

| Table | Description |
|-------|-------------|
| `sermons` | Sermons audio |
| `speakers` | Orateurs/Predicateurs |
| `seminars` | Series de sermons |
| `events` | Evenements |
| `announcements` | Annonces |
| `members` | Membres de l'eglise |
| `photos` | Galerie photos |
| `admin_settings` | Configuration admin |

### Storage Buckets

- `sermons-audio` - Fichiers audio des sermons
- `sermon-covers` - Images de couverture
- `speakers-photos` - Photos des orateurs
- `events-images` - Images des evenements

## Depannage

### L'app ne se connecte pas a Supabase

1. Verifiez que le fichier `.env` existe et contient les bonnes cles
2. Redemarrez le serveur Metro : `npm start -- --clear`

### Erreur "Unable to resolve module"

```bash
# Nettoyer le cache et reinstaller
rm -rf node_modules
npm install
npm start -- --clear
```

### Expo Go ne trouve pas le serveur

1. Verifiez que votre telephone et PC sont sur le meme reseau Wi-Fi
2. Utilisez le mode tunnel : `npx expo start --tunnel`

### Build Android/iOS echoue

```bash
# Nettoyer les builds natifs
npx expo prebuild --clean
```

## Contribution

1. Forkez le projet
2. Creez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'feat: Ajout de ma fonctionnalite'`)
4. Pushez la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

### Conventions de Commit

- `feat:` Nouvelle fonctionnalite
- `fix:` Correction de bug
- `docs:` Documentation
- `style:` Formatage (pas de changement de code)
- `refactor:` Refactorisation
- `test:` Ajout de tests
- `chore:` Maintenance

## Licence

Ce projet est prive et reserve a l'usage de l'Eglise EMCR.

---

Developpe avec par l'equipe EMCR
