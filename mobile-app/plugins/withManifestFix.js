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

const withMasterBuildFix = (config) => {
  return withProjectBuildGradle(config, (config) => {
    // Force Kotlin 2.0.21 at the root level
    if (config.modResults.contents.includes('kotlinVersion =')) {
      config.modResults.contents = config.modResults.contents.replace(
        /kotlinVersion = .*/g,
        "kotlinVersion = '2.0.21'"
      );
    }

    // Force resolution strategy for all dependencies to prevent Kotlin 2.1 metadata issues
    const globalFix = `
allprojects {
    configurations.all {
        resolutionStrategy {
            force "org.jetbrains.kotlin:kotlin-stdlib:2.0.21"
            force "org.jetbrains.kotlin:kotlin-stdlib-jdk7:2.0.21"
            force "org.jetbrains.kotlin:kotlin-stdlib-jdk8:2.0.21"
            force "org.jetbrains.kotlin:kotlin-reflect:2.0.21"
        }
    }
}
`;
    if (!config.modResults.contents.includes('force "org.jetbrains.kotlin:kotlin-stdlib:2.0.21"')) {
      config.modResults.contents += globalFix;
    }

    return config;
  });
};

module.exports = (config) => {
  return withMasterBuildFix(withManifestFix(config));
};