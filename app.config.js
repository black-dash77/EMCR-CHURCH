const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getAppName = () => {
  if (IS_DEV) return 'EMCR Dev';
  if (IS_PREVIEW) return 'EMCR Preview';
  return 'EMCR Church';
};

const getBundleId = () => {
  if (IS_DEV || IS_PREVIEW) return 'com.emcr.church.dev';
  return 'com.emcr.church';
};

export default {
  expo: {
    name: getAppName(),
    slug: 'emcr-church',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'emcr',
    userInterfaceStyle: 'dark',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#1A4BFF',
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: getBundleId(),
      associatedDomains: ['applinks:emcr-church.netlify.app'],
      infoPlist: {
        UIBackgroundModes: ['audio'],
        ITSAppUsesNonExemptEncryption: false,
        NSAppTransportSecurity: {
          NSAllowsArbitraryLoads: false,
          NSAllowsLocalNetworking: true,
          NSExceptionDomains: {
            'supabase.co': {
              NSIncludesSubdomains: true,
              NSExceptionAllowsInsecureHTTPLoads: false,
              NSExceptionRequiresForwardSecrecy: true,
            },
          },
        },
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#1A4BFF',
      },
      package: getBundleId(),
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'https',
              host: 'emcr-church.netlify.app',
              pathPrefix: '/sermon',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      permissions: [
        'android.permission.RECORD_AUDIO',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.MODIFY_AUDIO_SETTINGS',
        'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
        'android.permission.ACCESS_MEDIA_LOCATION',
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
        'android.permission.READ_MEDIA_AUDIO',
        'android.permission.READ_CALENDAR',
        'android.permission.WRITE_CALENDAR',
      ],
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/favicon.png',
    },
    plugins: [
      'expo-router',
      'expo-font',
      [
        'expo-av',
        {
          microphonePermission: false,
        },
      ],
      [
        'expo-image-picker',
        {
          photosPermission: "L'app a besoin d'accéder à vos photos pour les partager.",
          cameraPermission: "L'app a besoin d'accéder à votre caméra.",
        },
      ],
      [
        'expo-media-library',
        {
          photosPermission: "L'app a besoin d'accéder à vos photos.",
          savePhotosPermission: "L'app a besoin de sauvegarder des photos.",
          isAccessMediaLocationEnabled: true,
        },
      ],
      [
        'expo-calendar',
        {
          calendarPermission:
            "L'app a besoin d'accéder à votre calendrier pour ajouter des événements.",
        },
      ],
      [
        'expo-notifications',
        {
          icon: './assets/notification-icon.png',
          color: '#1A4BFF',
        },
      ],
    ],
    updates: {
      url: 'https://u.expo.dev/cde2e672-0ad9-4a52-a128-727b47502bd5',
    },
    runtimeVersion: {
      policy: 'appVersion',
    },
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: 'cde2e672-0ad9-4a52-a128-727b47502bd5',
      },
    },
  },
};
