const { transform } = require('metro-react-native-babel-transformer')

module.exports.transform = function ({ src, filename, options, }) {
    if (filename === 'app\\modules\\WalletDapp\\ScriptWeb3.js') {
        console.log('filename', filename)
        const src1 = 'export const INJECTEDJAVASCRIPT = `' + src + '`'
        return transform({ src : src1, filename, options });
    }
    return transform({ src, filename, options });
};
