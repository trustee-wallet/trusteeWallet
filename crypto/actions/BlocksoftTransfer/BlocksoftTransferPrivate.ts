/**
 * @author Ksu
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../../blockchains/BlocksoftBlockchainTypes'
import BlocksoftPrivateKeysUtils from '../../common/BlocksoftPrivateKeysUtils'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import BlocksoftKeysStorage from '../BlocksoftKeysStorage/BlocksoftKeysStorage'

export namespace BlocksoftTransferPrivate {

    const CACHE_PRIVATE: any = {}

    const initTransferPrivateBTC = async function(data: BlocksoftBlockchainTypes.TransferData, mnemonic : string): Promise<BlocksoftBlockchainTypes.TransferPrivateData> {
        const privateData = {
            privateKey : mnemonic
        } as BlocksoftBlockchainTypes.TransferPrivateData
        return privateData
    }
    export const initTransferPrivate = async function(data: BlocksoftBlockchainTypes.TransferData, additionalData: BlocksoftBlockchainTypes.TransferAdditionalData): Promise<BlocksoftBlockchainTypes.TransferPrivateData> {
        const privateData = {} as BlocksoftBlockchainTypes.TransferPrivateData
        let mnemonic = (typeof additionalData !== 'undefined' && typeof additionalData.mnemonic !== 'undefined') ? additionalData.mnemonic : CACHE_PRIVATE[data.walletHash]
        if (!mnemonic) {
            mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(data.walletHash, 'initTransferPrivate')
            CACHE_PRIVATE[data.walletHash] = mnemonic
        }
        if (!mnemonic) {
            throw new Error('no mnemonic for hash ' + data.walletHash)
        }
        if (data.currencyCode === 'BTC' || data.currencyCode === 'LTC' || data.currencyCode === 'USDT') {
            return initTransferPrivateBTC(data, mnemonic)
        }
        const discoverFor = {
            mnemonic,
            addressToCheck: data.addressFrom,
            walletHash: data.walletHash,
            derivationPath: data.derivationPath,
            currencyCode: data.currencyCode
        }
        const result = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'initTransferPrivate')
        // @ts-ignore
        privateData.privateKey = result.privateKey
        // @ts-ignore
        privateData.addedData = result.addedData
        BlocksoftCryptoLog.log(`${data.currencyCode} BlocksoftTransferPrivate.initTransferPrivate finished for ${data.addressFrom}`)
        return privateData
    }
}
