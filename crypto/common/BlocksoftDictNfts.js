const Nfts = [
    {
        currencyCode: 'NFT_ETH',
        currencyName: 'NFT',
        currencySymbol: 'NFT',
        tokenBlockchain: 'ETHEREUM',
        tokenBlockchainCode: 'ETH',
        currencyType: 'NFT',
        apiType: 'OPENSEA',
        explorerLink: 'https://explorerLink.com/token/',
        showOnHome: true
    },
    {
        currencyCode: 'NFT_BNB',
        currencyName: 'BNB NFT',
        currencySymbol: 'NFT',
        tokenBlockchain: 'BNB',
        tokenBlockchainShortTitle: 'BNB SC',
        tokenBlockchainLongTitle: 'BNB Smart Chain',
        tokenBlockchainCode: 'BNB_SMART',
        currencyType: 'NFT',
        explorerLink: 'https://bscscan.com/token/',
        showOnHome: false
    },

    {
        currencyCode: 'NFT_MATIC',
        currencyName: 'Matic NFT',
        currencySymbol: 'NFT',
        tokenBlockchain: 'MATIC',
        tokenBlockchainCode: 'MATIC',
        currencyType: 'NFT',
        explorerLink: 'https://polygonscan.com/token/',
        showOnHome: false
    },
    {
        currencyCode: 'NFT_ONE',
        currencyName: 'Harmony NFT',
        currencySymbol: 'NFT',
        tokenBlockchain: 'ONE',
        tokenBlockchainCode: 'ONE',
        currencyType: 'NFT',
        explorerLink: 'https://davinci.gallery/view/',
        showOnHome: false
    },
    {
        currencyCode: 'NFT_ROPSTEN',
        currencyName: 'Ropsten NFT',
        currencySymbol: 'NFT',
        tokenBlockchain: 'ROPSTEN',
        tokenBlockchainCode: 'ETH_ROPSTEN',
        currencyType: 'NFT',
        explorerLink: 'https://ropsten.explorerLink.io/token/',
        showOnHome: false
    },
    {
        currencyCode: 'NFT_RINKEBY',
        currencyName: 'Rinkeby NFT',
        currencySymbol: 'NFT',
        tokenBlockchain: 'RINKEBY',
        tokenBlockchainCode: 'ETH_RINKEBY',
        currencyType: 'NFT',
        apiType: 'OPENSEA',
        explorerLink: 'https://rinkeby.explorerLink.io/token/',
        showOnHome: false
    }
    /*
    {
        currencyCode: 'NFT_TRON',
        currencyName: 'Tron NFT',
        currencySymbol: 'NFT',
        tokenBlockchain: 'TRON',
        tokenBlockchainCode: 'TRX',
        currencyType: 'NFT'
    }
    */
]

const NftsIndexed = {}
for (const tmp of Nfts) {
    NftsIndexed[tmp.tokenBlockchainCode] = tmp
    NftsIndexed[tmp.tokenBlockchain] = tmp
}

const getCurrencyCode = (walletCurrency, tokenBlockchainCode) => {
    if (!walletCurrency && !tokenBlockchainCode) {
        return ''
    }

    if (walletCurrency) {
        return walletCurrency
    }

    const tmp = NftsIndexed[tokenBlockchainCode.toUpperCase()]
    if (typeof tmp === 'undefined') {
        return tokenBlockchainCode
    }
    return tmp.tokenBlockchainCode
}

const getCurrencyTitle = (walletCurrency, tokenBlockchainCode) => {
    if (!walletCurrency && !tokenBlockchainCode) {
        return ''
    }

    if (walletCurrency) {
        return walletCurrency
    }

    const tmp = NftsIndexed[tokenBlockchainCode.toUpperCase()]
    if (typeof tmp === 'undefined') {
        return tokenBlockchainCode
    }
    return tmp.tokenBlockchainShortTitle || tmp.tokenBlockchain
}

export default {
    Nfts, NftsIndexed, getCurrencyTitle, getCurrencyCode
}
