# Hybrides chinoises

Outil pour repérer des voitures hybrides chinoises (BYD, MG, Lynk & Co, Geely, Jaecoo…) en vente en Europe,
calculer leur prix rendu immatriculé en Suisse et préparer des sélections à envoyer aux clients.

## Ce que fait l'app

- **Annonces** : reçues automatiquement depuis les e-mails d'alerte mobile.de et AutoScout24, ou collées à la main.
- **Prix rendu en Suisse** : prix d'achat, TVA étrangère récupérable, transport, impôt automobile 4 %, TVA 8,1 %, frais.
- **Règle CO2** : signale les voitures comptées comme « neuves » (immatriculées depuis moins de 12 mois, ou moins de 6 mois avec plus de 5'000 km) et la date à partir de laquelle elles ne le sont plus.
- **Marge estimée** face à un prix suisse de référence que tu saisis par modèle.
- **Sélections clients** : un lien public par client, sans tes prix d'achat ni tes sources.

## Lancer en local

```bash
npm install
npm run dev     # http://localhost:3000, en mode démo sans Supabase
npm test        # tests du calcul, de la règle CO2 et de la lecture des e-mails
```

## Mise en ligne

1. Créer un projet sur [Supabase](https://supabase.com) et exécuter `supabase/migrations/0001_init.sql` dans l'éditeur SQL.
2. Déployer sur [Vercel](https://vercel.com) depuis le dépôt GitHub, avec les variables de `.env.example`.
3. Brancher un service d'e-mail entrant (Postmark Inbound, Mailgun Routes ou Cloudflare Email Routing) qui envoie chaque e-mail à `https://<app>/api/inbound-email?secret=<INBOUND_SECRET>`.
4. Sur mobile.de et AutoScout24, créer des recherches sauvegardées avec alerte e-mail et les faire suivre vers cette adresse.

## À savoir

- La lecture des e-mails d'alerte est volontairement tolérante (elle repère les liens vers des annonces et lit le bloc autour). Elle a été testée sur un e-mail **fictif** : il faudra l'ajuster avec de vrais e-mails d'alerte.
- Les montants de frais sont des estimations modifiables dans **Réglages**. Les règles fiscales sont à confirmer auprès de l'OFDF et de l'OFROU avant la première importation.
