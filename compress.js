const sharp = require('sharp');
const fs = require('fs');

sharp('app/poetry-competition/opengraph-image.png')
  .resize(1200, 630)
  .jpeg({ quality: 60 })
  .toFile('app/poetry-competition/opengraph-image.jpg')
  .then(info => {
    console.log("Success:", info);
    try { fs.unlinkSync('app/poetry-competition/opengraph-image.png'); } catch(e){}
    try { fs.unlinkSync('app/poetry-competition/twitter-image.png'); } catch(e){}
    try { fs.unlinkSync('public/poetry_og_image.png'); } catch(e){}
  })
  .catch(err => {
    console.error("Error:", err);
  });
