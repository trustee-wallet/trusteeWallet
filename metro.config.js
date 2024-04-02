const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config')

const transformer = {
    getTransformOptions: async () => ({
        transform: {
            experimentalImportSupport: false,
            inlineRequires: false
        }
    })
}

const trusteeConfig = {
    resolver: {
        sourceExts: ['cjs', 'jsx', 'js', 'ts', 'tsx', 'json'],
        extraNodeModules: require('node-libs-browser'),
        requireCycleIgnorePatterns: [/(^|\/|\\)node_modules($|\/|\\)/, /@trustee/]
    },
    transformer
}
module.exports = mergeConfig(getDefaultConfig(__dirname), trusteeConfig)
