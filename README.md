# React-FX-editor

Un éditeur d'effets pour WordPress.

## Idées d’amélioration

1. **Exposer l’épaisseur et la douceur des ondes** – Étendre le shader pour piloter l’épaisseur, la douceur et la décroissance de l’amplitude via des uniformes, puis les exposer dans l’UI Gutenberg et l’éditeur de presets.
2. **Ajouter une orientation réglable pour le dégradé de fond** – ✅ Fait : uniforme d’angle, attributs et sliders dans l’UI permettent désormais de pivoter le dégradé.
3. **Prévoir un fallback sans WebGL** – En cas d’absence de WebGL, générer un dégradé CSS (ou autre rendu simplifié) plutôt que de laisser l’espace vide.
4. **Permettre l’import/export de presets** – Ajouter des actions d’import/export JSON (et éventuellement une galerie miniature) pour partager les presets personnalisés.
5. **Contrôles shader plus avancés** – Étendre les attributs exposés (épaisseur de ligne, douceur, facteur de bokeh, orientation du gradient) pour s’approcher d’un rendu façon Figma Make depuis l’UI React.
6. **Bloc conteneur pour du contenu overlay** – Autoriser `InnerBlocks` et ajouter un layout flex/grid pour déposer des titres, CTA ou icônes par-dessus l’effet visuel.
7. **Gestion enrichie des presets** – Compléter l’API REST et l’interface pour offrir duplication, tags, import/export partagé entre sites et autres actions autour des presets.
8. **Centraliser les préréglages natifs** – Éviter la duplication des presets “calm”, “vibrant”, etc. en centralisant leur définition (JSON partagé ou injection PHP) pour faciliter leur évolution.
