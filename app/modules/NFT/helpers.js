/**
 * @version 0.53
 * @author ksu
 */
import Log from '@app/services/Log/Log'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { strings } from '@app/services/i18n'
import config from '@app/config/config'
import store from '@app/store'
import { NftCustomAssetsActions } from '@app/appstores/Stores/NftCustomAssets/NftCustomAssetsActions'
import NavStore from '@app/components/navigation/NavStore'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'


export async function addCustomToken(nftAddress, nftType) {
    Log.log('NftAddAssetScreen.addCustomToken start adding ' + nftAddress + ' ' + nftType)

    setLoaderStatus(true)
    let checked
    try {
        if (typeof store.getState().nftCustomAssetsStore.customAssets[nftType] !== 'undefined'
            && typeof store.getState().nftCustomAssetsStore.customAssets[nftType][nftAddress] !== 'undefined'
        ) {
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.infoAddCustomAssetModal.attention.title'),
                description: strings('modal.infoAddCustomAssetModal.attention.description')
            })
            setLoaderStatus(false)
            return { searchQuery: nftAddress }
        }

        checked = await NftCustomAssetsActions.checkCustomAsset({
            nftType,
            nftAddress
        })

        Log.log('NftAddAssetScreen.addCustomToken checked ' + nftAddress + ' ' + nftType + ' result ' + JSON.stringify(checked))

        if (checked) {
            return _actualAdd(checked, nftType)
        } else {
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.infoAddCustomAssetModal.error.title'),
                description: strings('modal.infoAddCustomAssetModal.error.description')
            })
            setLoaderStatus(false)
            return { searchQuery: false }
        }

    } catch (e) {

        if (config.debug.appErrors) {
            console.log('NftAddAssetScreen.addCustomToken checked' + nftAddress + ' ' + nftType + ' error ' + e.message)
        }
        Log.log('NftAddAssetScreen.addCustomToken checked' + nftAddress + ' ' + nftType + ' error ' + e.message)

        showModal({
            type: 'INFO_MODAL',
            icon: 'INFO',
            title: strings('modal.infoAddCustomAssetModal.catch.title'),
            description: e.message.indexOf('SERVER_RESPONSE_') === -1 ? strings('modal.infoAddCustomAssetModal.catch.description') : strings('send.errors.' + e.message)
        })

        setLoaderStatus(false)

        return { searchQuery: false }
    }

}


async function _actualAdd(checked, nftType, isFinal = true) {

    try {
        MarketingEvent.logEvent('gx_nft_add', {
            nftSymbol: checked.nftSymbol,
            nftCode: checked.nftCode,
            nftName: checked.nftName,
            nftType: checked.nftType,
            nftAddress: checked.nftAddress
        }, 'GX')
        await NftCustomAssetsActions.addCustomAsset({
            nftSymbol: checked.nftSymbol,
            nftCode: checked.nftCode,
            nftName: checked.nftName,
            nftType: checked.nftType,
            nftAddress: checked.nftAddress
        })
    } catch (e) {
        if (config.debug.appErrors) {
            console.log('NftAddAssetScreen.addCustomToken firstStep error ' + e.message)
        }
        Log.log('NftAddAssetScreen.addCustomToken firstStep error ' + e.message)

        showModal({
            type: 'INFO_MODAL',
            icon: 'INFO',
            title: strings('settings.error.title'),
            description: strings('settings.error.text')
        })

        setLoaderStatus(false)
        return { searchQuery: false }
    }

    setLoaderStatus(false)
    showModal({
        type: 'INFO_MODAL',
        icon: true,
        title: strings('modal.infoAddCustomAssetModal.success.title'),
        description: strings('modal.infoAddCustomAssetModal.success.description')
    }, () => {
        NavStore.reset('NftMainScreen')
    })

    return { searchQuery: false }
}
