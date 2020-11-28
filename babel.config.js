module.exports = {
    presets: ['module:metro-react-native-babel-preset'],
    overrides: [
        {
            test: /\.ts?$/,
            plugins: [
                ['@babel/plugin-transform-typescript', { allowNamespaces: true }]
            ]
        }
    ]
}
