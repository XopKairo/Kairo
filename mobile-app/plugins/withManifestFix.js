const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withManifestFix(config) {
  return withAndroidManifest(config, config => {
    const application = config.modResults.manifest.application[0];
    if (!application['$']) application['$'] = {};
    application['$']['tools:replace'] = 'android:appComponentFactory';
    application['$']['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';
    return config;
  });
};