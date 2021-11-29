/**
 * @version 0.50
 */
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'

const API_PATH = 'https://microscanners.trustee.deals/getAllNfts/'

/**
 * https://microscanners.trustee.deals/getMaticNfts/0xf1Cff704c6E6ce459e3E1544a9533cCcBDAD7B99
 * https://microscanners.trustee.deals/getAllNfts/0xf1Cff704c6E6ce459e3E1544a9533cCcBDAD7B99?
 * @param data.address
 * @param data.tokenBlockchainCode
 * @param data.customAssets
 */
export default async function(data) {
    if (!data.address) return false

    const link = API_PATH + data.address + '?tokenBlockchainCode=' + data.tokenBlockchainCode + '&tokens=' + data.customAssets.join(',')
    const result = await BlocksoftAxios.get(link)

    /**
     * @var tmp.animation_url
     * @var tmp.image
     * @var tmp.name
     * @var tmp.description
     * @var tmp.token_index
     * @var tmp.contract_address
     */
    const formatted = []
    const collections = []
    let usdTotal = 0


    if (result && result.data && typeof result.data !== 'undefined' && result.data && result.data.length) {
        for (const tmp of result.data) {
            const one = {
                id: tmp.id,
                tokenId: tmp.token_index,
                contractAddress: tmp.contract_address,
                contractSchema: tmp.contract_schema || 'ERC721',
                tokenBlockchainCode: tmp.token_blockchain_code || data.tokenBlockchainCode,
                tokenBlockchain:  tmp.token_blockchain || data.tokenBlockchain,
                tokenQty : tmp.qty || 1,
                img: tmp.image,
                title: tmp.name || tmp.title,
                subTitle: tmp.subtitle || '',
                desc: tmp.description || '',
                cryptoCurrencySymbol: tmp.crypto_currency_symbol || '',
                cryptoValue: tmp.crypto_value || '',
                usdValue: tmp.usd_value || '',
                permalink: tmp.permalink || false
            }
            try {
                if (one.desc && !one.subTitle) {
                    one.subTitle = one.desc.length > 20 ? (one.desc.substring(0, 20) + '...') : one.desc
                }
            } catch (e) {
                BlocksoftCryptoLog.log('EthTokenProcessorNft EthNftMatic name error ' + e.message)
            }

            if (one.usdValue && one.usdValue * 1 > 0) {
                usdTotal = usdTotal + one.usdValue * 1
            }


            let collectionKey = ''
            try {
                if (typeof tmp.collection !== 'undefined') {
                    collectionKey = tmp.collection.name + one.contractAddress
                    if (typeof collections[collectionKey] === 'undefined') {
                        collections[collectionKey] = {
                            numberAssets: 1,
                            title: tmp.collection.name,
                            img: tmp.collection.image,
                            walletCurrency: one.tokenBlockchainCode,
                            assets: [one]
                        }
                    } else {
                        collections[collectionKey].numberAssets++
                        collections[collectionKey].assets.push(one)
                    }
                }
            } catch (e) {
                console.log('EthTokenProcessorNft EthNftMatic collection error ' + e.message)
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
