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
    // 1. Force Kotlin Version to 1.9.24
    if (config.modResults.contents.includes('kotlinVersion =')) {
      config.modResults.contents = config.modResults.contents.replace(
        /kotlinVersion = .*/g,
        "kotlinVersion = '1.9.24'"
      );
    }

    // 2. Global Resolution Strategy to force Kotlin stdlib and Metadata skip
    const forceStrategy = `
allprojects {
    configurations.all {
        resolutionStrategy {
            force "org.jetbrains.kotlin:kotlin-stdlib:1.9.24"
            force "org.jetbrains.kotlin:kotlin-stdlib-jdk7:1.9.24"
            force "org.jetbrains.kotlin:kotlin-stdlib-jdk8:1.9.24"
        }
    }
    tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
        kotlinOptions {
            freeCompilerArgs += ["-Xskip-metadata-version-check"]
        }
    }
}
`;
    if (!config.modResults.contents.includes('force "org.jetbrains.kotlin:kotlin-stdlib:1.9.24"')) {
      config.modResults.contents += forceStrategy;
    }

    return config;
  });
};

module.exports = (config) => {
  return withMasterBuildFix(withManifestFix(config));
};