const fs = require('fs');
const path = require('path');

async function copyCesium() {
  const src = path.join(__dirname, '../node_modules/cesium/Build/Cesium');
  const dest = path.join(__dirname, '../public/cesium');

  const folders = ['Workers', 'ThirdParty', 'Assets', 'Widgets'];

  fs.mkdirSync(dest, { recursive: true });

  for (const folder of folders) {
    const from = path.join(src, folder);
    const to = path.join(dest, folder);
    fs.cpSync(from, to, { recursive: true });
    console.log(`Copied ${folder} to public/cesium/`);
  }
}

copyCesium().catch(console.error);
