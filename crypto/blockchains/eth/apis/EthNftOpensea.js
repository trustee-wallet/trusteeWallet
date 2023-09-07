/**
 * @version 0.50
 */
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'

const API_PATH = 'https://api.opensea.io/v2/chain/ethereum'
const API_MATIC_PATH = 'https://api.opensea.io/v2/chain/matic'
const API_BNB_PATH = 'https://api.opensea.io/v2/chain/bnb'

const PERMALINK_PATH = 'https://opensea.io/assets/ethereum'
const PERMALINK_MATIC_PATH = 'https://opensea.io/assets/matic'
const PERMALINK_BNB_PATH = 'https://opensea.io/assets/bnb'

/**
 * https://docs.opensea.io/reference/retrieve-nfts-by-account
 *
 * curl --url 'https://api.opensea.io/v2/chain/ethereum/account/0x6cdb97bf46d77233cc943264633c2ed56bcf6f1f/nfts?limit=50'
 *      --header 'X-API-KEY: 22b6f5505ebe454cb91f4748bfacd183'
 *
 * @param data.address
 * @param data.tokenBlockchainCode
 */
export default async function(data) {

    let link
    let permalink
    if (data.tokenBlockchainCode === 'BNB') {
        link = API_BNB_PATH
        permalink = PERMALINK_BNB_PATH
    } else if (data.tokenBlockchainCode === 'MATIC') {
        link = API_MATIC_PATH
        permalink = PERMALINK_MATIC_PATH
    } else {
        link = API_PATH
        permalink = PERMALINK_PATH
    }
    if (!data.address) return false
    link += '/account/' + data.address + '/nfts?limit=50'
    let result = false
    BlocksoftCryptoLog.log('EthNftOpensea chain ' + data.tokenBlockchainCode + ' link ' + link + ' started')
    try {
        const response = await fetch(link, {
            method: 'GET',
            headers: {
                'X-API-KEY': '22b6f5505ebe454cb91f4748bfacd183',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        })
        result = await response.json()
    } catch (e) {
        BlocksoftCryptoLog.log('EthNftOpensea fetch chain ' + data.tokenBlockchainCode + ' link ' + link + ' error '  + e.message)
    }

    const formatted = []
    const collections = []
    let usdTotal = 0


    if (result && result.nfts && typeof result.nfts !== 'undefined' && result.nfts && result.nfts.length) {
        for (const tmp of result.nfts) {
            if (tmp.token_standard === 'erc20') continue
            const one = {
                id: tmp.identifier,
                tokenId: tmp.identifier,
                contractAddress: tmp.contract,
                contractSchema: tmp.token_standard === 'erc721' ? 'ERC721 ' : 'ERC1155',
                tokenBlockchainCode: data.tokenBlockchainCode,
                tokenBlockchain: data.tokenBlockchain,
                tokenQty : 1,
                img: tmp.image_url,
                title: tmp?.name || tmp?.title,
                subTitle: '',
                desc: tmp?.description ? tmp.description.substring(0, 1000) : '',
                cryptoCurrencySymbol: '',
                cryptoValue: '',
                usdValue: '',
                permalink: tmp?.permalink || (permalink + tmp.contract + '/' + tmp.identifier)
            }
            try {
                if (!one.title || typeof one.title === 'undefined') {
                    if (typeof tmp.collection !== 'undefined') {
                        one.title = tmp.collection
                    }
                }
                if (one.title.indexOf(tmp.identifier) === -1) {
                    one.subTitle = '#' + tmp.identifier
                } else if (one.desc) {
                    one.subTitle = one.desc.length > 20 ? (one.desc.substring(0, 20) + '...') : one.desc
                }
            } catch (e) {
                BlocksoftCryptoLog.log('EthTokenProcessorNft EthNftOpensea name error ' + e.message)
            }


            let collectionKey = ''
            try {
                if (typeof tmp.collection !== 'undefined') {
                    collectionKey = tmp.collection + '_' + tmp.contract
                    if (typeof collections[collectionKey] === 'undefined') {
                        collections[collectionKey] = {
                            numberAssets: 1,
                            title: tmp.collection,
                            img: tmp.image_url,
                            walletCurrency: data.tokenBlockchainCode,
                            assets: [one]
                        }
                    } else {
                        collections[collectionKey].numberAssets++
                        collections[collectionKey].assets.push(one)
                    }
                }
            } catch (e) {
                BlocksoftCryptoLog.log('EthTokenProcessorNft EthNftOpensea collection error ' + e.message)
            }

            formatted.push(one)
        }
    }

    const formattedCollections = []
    if (collections) {
        for (const key in collections) {
            formattedCollections.push(collections[key])
        }
    }
    return { assets: formatted, collections : formattedCollections, usdTotal}
}
