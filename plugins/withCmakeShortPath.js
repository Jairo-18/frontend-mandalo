const { withAppBuildGradle } = require('expo/config-plugins');

/**
 * Windows: la ruta real del proyecto + los subdirectorios que arma CMake/
 * Ninja para cada build type/ABI (p. ej. react-native-gesture-handler en
 * RelWithDebInfo/arm64-v8a) supera el límite de 260 caracteres de Windows, y
 * el `ninja.exe` que trae el Android SDK no soporta rutas largas ahí — el
 * build de release truena con "Filename longer than 260 characters".
 *
 * Mover el staging del build nativo (`.cxx`) a una ruta corta fuera del
 * proyecto lo evita. Como config plugin (no una edición a mano de
 * `android/app/build.gradle`) para que sobreviva a cada `expo prebuild`,
 * que regenera ese archivo desde cero.
 */
const INJECTED = `    externalNativeBuild {
        cmake {
            buildStagingDirectory "C:/rncxx/mandalo"
        }
    }

`;

module.exports = function withCmakeShortPath(config) {
  return withAppBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('buildStagingDirectory "C:/rncxx/mandalo"')) {
      return config;
    }
    config.modResults.contents = config.modResults.contents.replace(
      "    namespace 'com.mandalo.app'",
      `${INJECTED}    namespace 'com.mandalo.app'`,
    );
    return config;
  });
};
