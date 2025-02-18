const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');
const escape = require('escape-string-regexp');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const rootPackage = require('../package.json');
const rootModules = Object.keys({
  ...rootPackage.peerDependencies,
});

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const root = path.resolve(__dirname, '..');

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  projectRoot: __dirname,
  watchFolders: [root],

  // We need to make sure that only one version is loaded for peerDependencies
  // So we block them at the root, and alias them to the versions in example project's node_modules
  resolver: {
    blacklistRE: exclusionList(
      rootModules.map(
        m => new RegExp(`^${escape(path.join(root, 'node_modules', m))}\\/.*$`)
      )
    ),

    extraNodeModules: {
      ...rootModules.reduce((acc, name) => {
        acc[name] = path.join(__dirname, 'node_modules', name);
        return acc;
      }, {}),
      '@simform_solutions/react-native-audio-waveform': path.resolve(
        __dirname,
        '..'
      ),
    },
  },
});
