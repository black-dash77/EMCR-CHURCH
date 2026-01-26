# Déploiement des notifications push

## 1. Exécuter la migration SQL

Dans Supabase Dashboard > SQL Editor, exécutez le contenu de :
```
supabase/migrations/add_push_notifications.sql
```

Cela créera :
- Table `notification_logs` : historique des notifications envoyées
- Table `sunday_notification_settings` : paramètres de la notification dominicale

## 2. Déployer les Edge Functions

### Prérequis
```bash
npm install -g supabase
supabase login
```

### Lier au projet
```bash
cd /Users/obedmateus/Desktop/EMCR-CHURCH
supabase link --project-ref zeurbmqrdoncjdmuzthl
```

### Déployer les fonctions
```bash
# Fonction d'envoi de notifications
supabase functions deploy send-push-notification --no-verify-jwt

# Fonction cron pour le dimanche
supabase functions deploy sunday-notification-cron --no-verify-jwt
```

## 3. Configurer le Cron Job (Notification Dimanche)

Dans Supabase Dashboard :
1. Aller dans **Database** > **Extensions**
2. Activer l'extension `pg_cron`

3. Dans **SQL Editor**, créer le cron job :
```sql
SELECT cron.schedule(
  'sunday-notification',
  '0 9 * * 0',  -- Chaque dimanche à 9h UTC (ajuster selon fuseau)
  $$
  SELECT
    net.http_post(
      url:='https://zeurbmqrdoncjdmuzthl.supabase.co/functions/v1/sunday-notification-cron',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldXJibXFyZG9uY2pkbXV6dGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjA1NzksImV4cCI6MjA4NDM5NjU3OX0.uXoH7m8eXnpSvQRn1xc5pBRjcDK84H_hAHl9ulbDSlU"}'::jsonb,
      body:='{}'::jsonb
    ) AS request_id;
  $$
);
```

**Note sur le fuseau horaire :**
- Le cron utilise UTC par défaut
- Pour la France (UTC+1 ou UTC+2 selon l'heure d'été), `0 9 * * 0` envoie à 10h ou 11h heure locale
- Ajustez à `0 7 * * 0` pour envoyer à 9h heure française

### Vérifier les cron jobs actifs
```sql
SELECT * FROM cron.job;
```

### Supprimer un cron job
```sql
SELECT cron.unschedule('sunday-notification');
```

## 4. Tester

### Tester l'envoi manuel
Depuis l'admin panel : Notifications > Envoyer

### Tester la fonction cron manuellement
```bash
curl -X POST 'https://zeurbmqrdoncjdmuzthl.supabase.co/functions/v1/sunday-notification-cron' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpldXJibXFyZG9uY2pkbXV6dGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4MjA1NzksImV4cCI6MjA4NDM5NjU3OX0.uXoH7m8eXnpSvQRn1xc5pBRjcDK84H_hAHl9ulbDSlU' \
  -H 'Content-Type: application/json'
```

## Résumé des fonctionnalités

| Fonctionnalité | Description |
|----------------|-------------|
| Envoi manuel | Depuis l'admin : Prédications, Événements, Annonces, Séminaires, Personnalisé |
| Notification Dimanche | Automatique chaque dimanche, heure configurable |
| Historique | Logs de toutes les notifications avec compteurs envoyés/échecs |
| Préférences utilisateur | Les utilisateurs peuvent désactiver certains types de notifications dans l'app |
