# Momo Tech · Site vitrine 3D

Site one-page pour **Momo Tech** (maintenance, réparation et installation informatique).
Scène 3D réelle en Three.js (ordinateur portable holographique), animations au défilement, formulaire qui prépare un message WhatsApp.

## Structure

```
momo-tech/
├── index.html              Page unique (6 sections)
├── package.json            Dépendances : gsap, three, vite
├── vite.config.js          Configuration de build
├── render.yaml             Configuration Render (optionnel, Blueprint)
├── public/
│   ├── favicon.svg
│   └── fonts/              Sora et JetBrains Mono (licence SIL OFL)
└── src/
    ├── main.js             Point d'entrée
    ├── style.css           Styles (thème noir / bleu électrique / cyan)
    ├── scenes/
    │   └── laptop-scene.js Scène Three.js (ordinateur, anneaux, particules, sol)
    ├── animations/
    │   └── scroll-animations.js  Apparitions, titres, progression, synchro 3D
    └── components/
        ├── navigation.js   Menu, menu mobile, lien actif, boutons flottants
        ├── services.js     Boutons « Demander une intervention »
        └── contact.js      Formulaire, confirmation, ouverture de WhatsApp
```

## Installation locale

Prérequis : Node.js 18.18 ou plus récent.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # génère le dossier dist/
npm run preview    # teste le build sur http://localhost:4173
```

## Publication sur GitHub (interface web)

1. Sur github.com, cliquez sur **New repository**, nommez-le `momo-tech`, puis **Create repository**.
2. Cliquez sur **uploading an existing file**, glissez tous les fichiers du dossier (sans `node_modules/` ni `dist/`), puis **Commit changes**.

## Déploiement sur Render (interface web)

1. Sur render.com, cliquez sur **New +** puis **Static Site**.
2. Connectez votre dépôt GitHub `momo-tech`.
3. Renseignez exactement :
   - **Build Command** : `npm install && npm run build`
   - **Publish Directory** : `dist`
   - **Node version** (variable d'environnement facultative) : `NODE_VERSION` = `22`
4. Dans **Redirects/Rewrites**, ajoutez : Source `/*`, Destination `/index.html`, Action `Rewrite`.
5. Cliquez sur **Create Static Site**. Le premier déploiement prend 1 à 3 minutes.

Si vous utilisez `render.yaml`, Render peut créer le service directement depuis le dépôt (**New +** → **Blueprint**).

## Vérifications après publication

- [ ] La page s'ouvre et le titre « La technologie, maîtrisée. » apparaît.
- [ ] L'ordinateur 3D s'affiche à droite sur ordinateur, et bouge à la souris.
- [ ] En faisant défiler, l'ordinateur change de position selon la section.
- [ ] Le menu mobile s'ouvre et se ferme sur téléphone.
- [ ] Un clic sur « Demander une intervention » remplit le type de problème.
- [ ] Le formulaire refuse les champs vides, puis affiche l'aperçu du message.
- [ ] « Ouvrir WhatsApp » ouvre bien `wa.me/2290197650741` avec le message prérempli.
- [ ] Le bouton de retour en haut fonctionne.
- [ ] Avec « Réduire les animations » activé dans le système, le site reste lisible et calme.

## Personnalisation

- **Numéro WhatsApp** : `WHATSAPP_NUMBER` dans `src/components/contact.js`, et les liens `wa.me/...` dans `index.html`.
- **Positions de l'ordinateur** : objet `POSES` en haut de `src/scenes/laptop-scene.js`.
- **Couleurs** : variables CSS dans `:root` de `src/style.css`.

## Notes techniques

- La 3D est construite par code : aucun modèle externe, aucune clé API, aucun service payant.
- Sur les appareils modestes (téléphones, peu de cœurs), la résolution et le nombre de particules sont réduits.
- Sans WebGL, un fond lumineux de remplacement s'affiche à la place de la scène.
- GSAP et ScrollTrigger pilotent l'expérience épinglée, la ligne de la méthode, la progression et le changement de scène 3D.
