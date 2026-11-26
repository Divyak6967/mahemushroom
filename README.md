# MaheMushroom website

Static website (HTML, CSS, JavaScript): no build step, no database. Orders go to WhatsApp.

```
index.html        homepage
our-story.html    Our Story
recipes.html      recipe list
recipe.html       single recipe (recipe.html?r=slug)
styles.css        all styles and animations
main.js           interactions: ordering, WhatsApp message, scroll story, showcase, map
recipes-data.js   the recipes (sample)
recipes-page.js   builds the recipe pages from recipes-data.js
assets/           logo, leaf and photos
serve.mjs         local preview server only (not needed online)
CONTENT-NEEDED.md real content still to collect
```

## Preview on this computer

```bash
node serve.mjs
```

Then open http://localhost:5190

## Put it online (Netlify)

Netlify → your site → **Deploys** → drag this `mushroom` folder onto
"Drag and drop your site output folder here".

The old React app and API that used to be in this folder are backed up in
`D:\divya-Frontend\mushroom-old-backup.zip`.
