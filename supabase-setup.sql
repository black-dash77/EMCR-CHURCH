-- EMCR Church - Mise à jour Supabase pour l'app mobile
-- Exécutez ces commandes dans l'éditeur SQL de Supabase

-- 1. Ajouter la colonne cover_image à la table sermons
ALTER TABLE sermons
ADD COLUMN IF NOT EXISTS cover_image TEXT;

-- 2. Ajouter la colonne duration_seconds pour le lecteur audio
ALTER TABLE sermons
ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;

-- 3. Ajouter la colonne tags pour les filtres (tableau de texte)
ALTER TABLE sermons
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- 4. Ajouter la colonne description pour les détails
ALTER TABLE sermons
ADD COLUMN IF NOT EXISTS description TEXT;

-- 5. Créer le bucket Storage pour les images de couverture
-- Allez dans Storage > Create new bucket
-- Nom: sermon-covers
-- Public: Oui (pour que les images soient accessibles publiquement)

-- 6. Politique RLS pour le bucket sermon-covers (optionnel, si RLS activé)
-- INSERT INTO storage.policies (name, bucket_id, operation, definition)
-- VALUES ('Public Access', 'sermon-covers', 'SELECT', 'true');

-- Vérifier que les changements sont appliqués
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sermons';
