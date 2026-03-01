const { Jimp } = require('jimp');

async function generateBranding() {
  console.log('Generating App Icon (1024x1024)...');
  
  const icon = new Jimp({ width: 1024, height: 1024, color: 0x050505FF });
  
  // Neon gradient colors
  const pink = 0xFF007FFF;
  const violet = 0x9400D3FF;

  // Draw a simple glowing square/circle for branding
  for(let y=400; y<600; y++) {
    for(let x=300; x<700; x++) {
      icon.setPixelColor(pink, x, y);
    }
  }

  await icon.write('assets/icon.png');
  console.log('Icon saved to assets/icon.png');

  console.log('Generating Splash Screen (2048x2732)...');
  const splash = new Jimp({ width: 2048, height: 2732, color: 0x050505FF });
  
  for(let y=1200; y<1400; y++) {
    for(let x=800; x<1200; x++) {
      splash.setPixelColor(violet, x, y);
    }
  }

  await splash.write('assets/splash.png');
  console.log('Splash saved to assets/splash.png');
}

generateBranding().catch(err => {
  console.error(err);
  process.exit(1);
});
