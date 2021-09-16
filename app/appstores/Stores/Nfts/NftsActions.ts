/**
 * @version 0.50
 */
import store from '@app/store'
import config from '@app/config/config'
import BlocksoftTokenNfts from '@crypto/actions/BlocksoftTokenNfts/BlocksoftTokenNfts'
import Nfts from '@app/appstores/DataSource/Nfts/Nfts'
import Log from '@app/services/Log/Log'

const { dispatch } = store

const CODES = ['ETH_RINKEBY', 'MATIC', 'ETH', 'ETH_ROPSTEN']

export namespace NftActions {

    export const getDataBySelectedCryptoCurrency = async function() {
        const tmp = store.getState().mainStore
        const { walletHash } = tmp.selectedWallet
        const { tokenBlockchainCode } = tmp.selectedCryptoCurrency
        const basicAccounts = store.getState().accountStore.accountList
        let address = ''
        let derivationPath = ''
        if (typeof basicAccounts[walletHash] !== 'undefined') {
            if (typeof basicAccounts[walletHash][tokenBlockchainCode] !== 'undefined') {
                address = basicAccounts[walletHash][tokenBlockchainCode].address
                derivationPath = basicAccounts[walletHash][tokenBlockchainCode].derivationPath
            } else if (tokenBlockchainCode !== 'TRX') {
                address = basicAccounts[walletHash]['ETH'].address
                derivationPath = basicAccounts[walletHash]['ETH'].derivationPath
            }
        }
        if (store.getState().nftsStore.address !== address) {
            Nfts.getNfts(address)
            dispatch({
                type: 'SET_NFTS_LOADED',
                address,
                derivationPath,
                loaded: false
            })
        }
    }

    export const getDataByAddress = async function(address: any, force = false) {
        try {

            const nfts = {
                assets: [],
                collections: [],
                usdTotal: 0
            }


            const customAssets = store.getState().nftCustomAssetsStore.customAssets
            for (const tokenBlockchainCode of CODES) {
                const tmpAssets = typeof customAssets !== 'undefined' && typeof customAssets['NFT_' + tokenBlockchainCode] !== 'undefined' ? customAssets['NFT_' + tokenBlockchainCode] : {}

                const tmpAssetsArray = []
                for (let tmp in tmpAssets) {
                    tmpAssetsArray.push(tmp)
                }

                let tmp = Nfts.getNftsCache(tokenBlockchainCode, address)
                try {
                    if (force || !tmp) {
                        tmp = await BlocksoftTokenNfts.getList({
                            tokenBlockchainCode,
                            address,
                            customAssets: tmpAssetsArray
                        })
                        if (tmp) {
                            Nfts.saveNfts(tokenBlockchainCode, address, tmp)
                        }
                    }
                } catch (e) {
                    if (config.debug.appErrors) {
                        console.log('NftsActions.getDataByAddress ' + tokenBlockchainCode + ' error ' + e.message, e)
                    }
                    Log.log('NftsActions.getDataByAddress ' + tokenBlockchainCode + ' error ' + e.message)
                }
                if (typeof tmp.assets === 'undefined') continue
                nfts.assets = [...nfts.assets, ...tmp.assets]
                nfts.collections = [...nfts.collections, ...tmp.collections]
                nfts.usdTotal = nfts.usdTotal * 1 + tmp.usdTotal * 1
            }

            dispatch({
                type: 'SET_NFTS_LOADED',
                loaded: true,
                nfts,
                address
            })
        } catch (e) {
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' NftsActions getData error ' + e.message)
            }
        }
    }
}
