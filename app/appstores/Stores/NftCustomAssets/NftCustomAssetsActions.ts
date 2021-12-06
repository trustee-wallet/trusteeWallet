/**
 * @version 0.50
 */
import store from '@app/store'
import NftCustomAssets from '@app/appstores/DataSource/NftCustomAssets/NftCustomAssets'
import Log from '@app/services/Log/Log'
import BlocksoftTokenChecks from '@crypto/actions/BlocksoftTokenChecks/BlocksoftTokenChecks'
import config from '@app/config/config'

const { dispatch } = store


export namespace NftCustomAssetsActions {

    export const addCustomAsset = async function(nftToSave : any) {

        if (!(await NftCustomAssets.saveCustomAsset(nftToSave))) {
            return false
        }

        const customAssets = await NftCustomAssets.getCustomAssets()

        dispatch({
            type: 'SET_NFT_CUSTOM_ASSETS_LOADED',
            customAssets,
            loaded: true
        })

    }

    export const loadCustomAssets = async function() {

        if (store.getState().nftCustomAssetsStore.loaded !== false) {
            return false
        }

        const customAssets = await NftCustomAssets.getCustomAssets()

        dispatch({
            type: 'SET_NFT_CUSTOM_ASSETS_LOADED',
            customAssets,
            loaded: true
        })

    }

    /**
     * @param {Object} nftToAdd
     * @param {string} nftToAdd.nftType
     * @param {string} nftToAdd.nftAddress
     */
    export const checkCustomAsset = async (nftToAdd : any) => {
        if (typeof (nftToAdd.nftType) === 'undefined') {
            throw new Error('set nftType')
        }
        if (typeof nftToAdd.nftAddress === 'undefined') {
            throw new Error('set ndtAddress')
        }
        Log.log('ACT/NftCustomAssets checkCustomAsset started ' + nftToAdd.nftType + ' ' + nftToAdd.nftAddress)
        let res = false
        try {
            res = await BlocksoftTokenChecks.getNftDetails(nftToAdd)
            Log.log('ACT/NftCustomAssets checkCustomAsset finished ', JSON.stringify(res))
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('ACT/NftCustomAssets checkCustomAsset error ' + e.message)
            }
            Log.log('ACT/NftCustomAssets checkCustomAsset error ' + e.message)
            if (e.message.indexOf('SSL') !== -1) {
                throw new Error('SERVER_RESPONSE_NO_SSL')
            }
        }
        return res
    }
}
