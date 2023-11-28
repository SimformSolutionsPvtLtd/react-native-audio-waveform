/**
 * Metro configuration for React Native
 * https://github.com/facebook/react-native
 *
 * @format
 */
const path = require('path');
const rootPackage = require('../package.json');
const blacklist = require('metro-config/src/defaults/exclusionList');
const rootModules = Object.keys({
  ...rootPackage.peerDependencies,
});
const moduleRoot = path.resolve(__dirname, '..');
/**
 * Only load one version for peerDependencies and alias them to the versions in example's node_modules"
 */
module.exports = {
  watchFolders: [moduleRoot],
  resolver: {
    blacklistRE: blacklist([
      ...rootModules.map(
        m =>
          new RegExp(
            `^${escape(path.join(moduleRoot, 'node_modules', m))}\\/.*$`
          )
      ),
      /^((?!example).)+[\/\\]node_modules[/\\]react[/\\].*/,
      /^((?!example).)+[\/\\]node_modules[/\\]react-native[/\\].*/,
    ]),
    extraNodeModules: {
      ...rootModules.reduce((acc, name) => {
        acc[name] = path.join(__dirname, 'node_modules', name);
        return acc;
      }, {}),
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};
