
const ModuleResolverPlugin = ['module-resolver', {
    alias: {
        '@app': './app',
        '@appV2' : './appV2',
        '@assets' : './assets',
        '@crypto': './crypto'
    },
}];

module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    plugins: [ModuleResolverPlugin],
    overrides: [
        {
            test: /\.ts?$/,
            plugins: [
                ['@babel/plugin-transform-typescript', { allowNamespaces: true }]
            ]
        }
    ]
}
