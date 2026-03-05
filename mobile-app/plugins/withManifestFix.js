const { withAndroidManifest, withProjectBuildGradle } = require('@expo/config-plugins');

const withManifestFix = (config) => {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application[0];
    if (!application['$']) application['$'] = {};
    application['$']['tools:replace'] = 'android:appComponentFactory';
    application['$']['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';
    return config;
  });
};

const withKotlinLocked = (config) => {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('kotlinVersion =')) {
      // Force kotlinVersion to 1.9.24
      config.modResults.contents = config.modResults.contents.replace(
        /kotlinVersion = .*/g,
        "kotlinVersion = '1.9.24'"
      );
    }
    return config;
  });
};

module.exports = (config) => {
  return withKotlinLocked(withManifestFix(config));
};