const sharp = require('sharp');
const fs = require('fs');

async function fixIcons() {
  try {
    // 1. Create a SOLID BACKGROUND icon (1024x1024)
    //    Background: #2563eb
    //    Foreground: White logo centered (resized to 600px to fit in safe area)
    const logoBuffer = await sharp('c:/Users/priyanshu/Desktop/dheeyudhha/public/logo-icon.svg')
      .modulate({ brightness: 100 }) // Make white
      .resize(600, 600)
      .toBuffer();

    await sharp({
        create: {
            width: 1024,
            height: 1024,
            channels: 4,
            background: { r: 37, g: 99, b: 235, alpha: 1 } // #2563eb
        }
    })
    .composite([{ input: logoBuffer, gravity: 'center' }])
    .png()
    .toFile('c:/Users/priyanshu/Desktop/dheeyudhha/assets/icon-fixed.png');
    
    // Copy the fixed icon as the base icon.png
    fs.copyFileSync(
        'c:/Users/priyanshu/Desktop/dheeyudhha/assets/icon-fixed.png', 
        'c:/Users/priyanshu/Desktop/dheeyudhha/assets/icon.png'
    );
    console.log('Base icon.png recreated with solid background!');

    // 2. Clear out the residue to avoid conflicts
    //    Sometimes legacy ic_launcher_round.png ruins it
    const mipmapDirs = fs.readdirSync('c:/Users/priyanshu/Desktop/dheeyudhha/android/app/src/main/res')
      .filter(d => d.startsWith('mipmap-') && d !== 'mipmap-anydpi-v26');
    
    for (const dir of mipmapDirs) {
        const fullPath = `c:/Users/priyanshu/Desktop/dheeyudhha/android/app/src/main/res/${dir}`;
        ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png', 'ic_launcher_background.png'].forEach(f => {
            const p = `${fullPath}/${f}`;
            if (fs.existsSync(p)) fs.unlinkSync(p);
        });
    }
    console.log('Old mipmap residue cleared!');

  } catch (err) {
    console.error('Error during icon fix:', err);
  }
}

fixIcons();
