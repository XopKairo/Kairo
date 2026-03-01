const fs = require('fs');
const path = require('path');

try {
  const appJsonPath = path.join(process.cwd(), 'app.json');
  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));
  
  const config = {
    ...appJson,
    ...appJson.expo,
    _internal: {
      isDebug: false,
      projectRoot: process.cwd(),
      dynamicConfigPath: null,
      staticConfigPath: appJsonPath,
      packageJsonPath: path.join(process.cwd(), 'package.json')
    },
    sdkVersion: "52.0.0",
    platforms: ["ios", "android"]
  };
  
  console.log(JSON.stringify(config));
} catch (e) {
  process.exit(1);
}
