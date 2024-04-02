const ModuleResolverPlugin = ['module-resolver', {
    alias: {
      '@app': './app',
      '@appV2': './appV2',
      '@assets': './assets',
      '@crypto': './crypto'
    },
  }];
  
  module.exports = {
      presets: ['module:@react-native/babel-preset'],
      plugins: [
          ModuleResolverPlugin,
          ['react-native-reanimated/plugin'],
          ['@babel/plugin-transform-export-namespace-from']
      ],
      overrides: [
          {
              test: /\.ts?$/,
              plugins: [['@babel/plugin-transform-typescript', { allowNamespaces: true }]]
          }
      ]
  }
  