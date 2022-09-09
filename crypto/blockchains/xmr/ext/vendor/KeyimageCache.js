'use strict'

const Lazy_KeyImage = async function (
    mutable_keyImagesByCacheKey, // pass a mutable JS dictionary
    tx_pub_key,
    out_index,
    public_address,
    view_key__private,
    spend_key__public,
    spend_key__private,
    coreBridge_instance // must pass this so this fn can remain synchronous
) {
    var cache_index = tx_pub_key + ':' + public_address + ':' + out_index
    const cached__key_image = mutable_keyImagesByCacheKey[cache_index]
    if (
        typeof cached__key_image !== 'undefined' &&
        cached__key_image !== null
    ) {
        return cached__key_image
    }
    var key_image = await coreBridge_instance.generate_key_image(
        tx_pub_key,
        view_key__private,
        spend_key__public,
        spend_key__private,
        out_index
    )
    // cache:
    mutable_keyImagesByCacheKey[cache_index] = key_image
    //
    return key_image
}
exports.Lazy_KeyImage = Lazy_KeyImage
//
//
// Managed caches - Can be used by apps which can't send a mutable_keyImagesByCacheKey
const __global_managed_keyImageCaches_by_walletId = {}
function _managedKeyImageCacheWalletIdForWalletWith (public_address) {
    // NOTE: making the assumption that public_address is unique enough to identify a wallet for caching....
    // FIXME: with subaddresses, is that still the case? would we need to split them up by subaddr anyway?
    if (
        public_address == '' ||
        !public_address ||
        typeof public_address === 'undefined'
    ) {
        throw 'managedKeyImageCacheIdentifierForWalletWith: Illegal public_address'
    }
    return '' + public_address
}

const Lazy_KeyImageCacheForWalletWith = function (public_address) {
    var cacheId = _managedKeyImageCacheWalletIdForWalletWith(public_address)
    var cache = __global_managed_keyImageCaches_by_walletId[cacheId]
    if (typeof cache === 'undefined' || !cache) {
        cache = {}
        __global_managed_keyImageCaches_by_walletId[cacheId] = cache
    }
    return cache
}
exports.Lazy_KeyImageCacheForWalletWith = Lazy_KeyImageCacheForWalletWith

const DeleteManagedKeyImagesForWalletWith = function (public_address) {
    // IMPORTANT: Ensure you call this method when you want to clear your wallet from
    // memory or delete it, or else you could leak key images and public addresses.
    const cacheId = _managedKeyImageCacheWalletIdForWalletWith(public_address)
    delete __global_managed_keyImageCaches_by_walletId[cacheId]
    //
    const cache = __global_managed_keyImageCaches_by_walletId[cacheId]
    if (typeof cache !== 'undefined') {
        throw 'Key image cache still exists after deletion'
    }
}
exports.DeleteManagedKeyImagesForWalletWith = DeleteManagedKeyImagesForWalletWith
