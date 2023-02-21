/**
 * @version 0.50
 */
import store from '@app/store'
import config from '@app/config/config'
import BlocksoftTokenNfts from '@crypto/actions/BlocksoftTokenNfts/BlocksoftTokenNfts'
import Nfts from '@app/appstores/DataSource/Nfts/Nfts'
import Log from '@app/services/Log/Log'

const { dispatch } = store

const CODES = ['ETH_RINKEBY', 'MATIC', 'ETH', 'BNB', 'ONE', 'ETH_ROPSTEN']

export namespace NftActions {

    export const init = async (force = false, walletHash = false) => {
        const address = await getDataBySelectedCryptoCurrency(walletHash)
        await getDataByAddress(address, force)
    }

    export const getDataBySelectedCryptoCurrency = async function(walletHash = false) {
        const tmp = store.getState().mainStore
        if (typeof walletHash === 'undefined' || !walletHash) {
            walletHash = tmp.selectedWallet.walletHash
        }
        let { tokenBlockchainCode } = tmp.selectedCryptoCurrency
        if (typeof tokenBlockchainCode === 'undefined') {
            tokenBlockchainCode = 'ETH'
        }
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
            dispatch({
                type: 'SET_NFTS_LOADED',
                address,
                derivationPath,
                loaded: false
            })
            Nfts.getNfts(address)
        }
        return address
    }

    export const getDataByAddress = async function(address: any, force = false) {
        const nfts = {
            assets: [],
            collections: [],
            usdTotal: 0
        }
        try {
            const customAssets = store.getState().nftCustomAssetsStore.customAssets
            const now = new Date().getTime()
            for (const tokenBlockchainCode of CODES) {
                const tmpAssets = typeof customAssets !== 'undefined' && typeof customAssets['NFT_' + tokenBlockchainCode] !== 'undefined' ? customAssets['NFT_' + tokenBlockchainCode] : {}
                const tmpAssetsArray = []
                for (let tmp in tmpAssets) {
                    tmpAssetsArray.push(tmp)
                }
                let tmp
                try {
                    tmp = Nfts.getNftsCache(tokenBlockchainCode, address)
                } catch (e) {
                    Log.log('NftsActions.getDataByAddress ' + tokenBlockchainCode + ' getNftsCache error ' + e.message)
                }
                try {
                    if (force || (!tmp || typeof tmp.loaded === 'undefined' || (now - tmp.loaded > 360000))) {
                        const tmp2 = await BlocksoftTokenNfts.getList({
                            tokenBlockchainCode,
                            address,
                            customAssets: tmpAssetsArray
                        })
                        if (tmp2 && typeof tmp2.assets !== 'undefined') {
                            tmp = tmp2
                            tmp.loaded = now
                            Nfts.saveNfts(tokenBlockchainCode, address, tmp)
                        }
                    }
                } catch (e) {
                    Log.log('NftsActions.getDataByAddress ' + tokenBlockchainCode + ' error ' + e.message)
                }
                if (typeof tmp.assets === 'undefined') continue
                nfts.assets = [...nfts.assets, ...tmp.assets]
                nfts.collections = [...nfts.collections, ...tmp.collections]
                nfts.usdTotal = nfts.usdTotal * 1 + tmp.usdTotal * 1
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' NftsActions getData error ' + e.message)
            }
            Log.log('NftsActions getData error ' + e.message)
        }

        try {
            dispatch({
                type: 'SET_NFTS_LOADED',
                loaded: true,
                nfts,
                address
            })
        } catch (e) {
            if (config.debug.appErrors) {
                console.log(new Date().toISOString() + ' NftsActions getData dispatch error ' + e.message)
            }
            Log.log('NftsActions getData dispatch error ' + e.message)
        }
    }
}
