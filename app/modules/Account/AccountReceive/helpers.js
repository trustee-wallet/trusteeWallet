import { strings } from '@app/services/i18n'

import Log from '@app/services/Log/Log'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import walletHDActions from '@app/appstores/Actions/WalletHDActions'

import BtcCashUtils from '@crypto/blockchains/bch/ext/BtcCashUtils'

import DaemonCache from '@app/daemons/DaemonCache'
import RateEquivalent from '@app/services/UI/RateEquivalent/RateEquivalent'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import OneUtils from '@crypto/blockchains/one/ext/OneUtils'

export async function changeAddress() {

    setLoaderStatus(true)

    try {
        const address = getAddress.call(this)
        const res = await walletHDActions.setSelectedAccountAsUsed(address)
        if (res) {
            if (res.code === 'error.near.too.much.gap') {
                showModal({
                    type: 'YES_NO_MODAL',
                    icon: 'WARNING',
                    title: strings('modal.useAgainAddressesGap.title'),
                    description: strings('modal.useAgainAddressesGap.description')
                }, () => {
                    walletHDActions.backUnusedAccounts(res)
                })
            } else {
                showModal({
                    type: 'YES_NO_MODAL',
                    icon: 'WARNING',
                    title: strings('modal.useAgainAddresses.title'),
                    description: strings('modal.useAgainAddresses.description')
                }, () => {
                    walletHDActions.backUnusedAccounts(res)
                })
            }
        }
    } catch (e) {
        // noinspection ES6MissingAwait
        Log.err('AccountReceiveScreen changeAddress error ' + e.message)
    }

    setLoaderStatus(false)

}

export function getAddress() {
    const { settingAddressType, settingAddressTypeTriggered } = this.state
    const { isSegwit } = this.props
    let { address, legacyAddress, segwitAddress,  } = this.props.selectedAccountData
    const { currencyCode } = this.props.selectedCryptoCurrencyData

    const actualIsSegwit = settingAddressTypeTriggered ? (settingAddressType !== 'legacy') : isSegwit
    if (currencyCode === 'ONE') {
        legacyAddress = OneUtils.toOneAddress(address)
    }
    if (!actualIsSegwit && legacyAddress) {
        address = legacyAddress
    } else {
        if (currencyCode === 'BSV' || currencyCode === 'BCH') {
            address = 'bitcoincash:' + BtcCashUtils.fromLegacyAddress(address)
        } else if (segwitAddress) {
            address = segwitAddress
        }
    }
    Log.log('AccountReceiveScreen.getAddress ' + address, { address, legacyAddress, segwitAddress, settingAddressType, actualIsSegwit })
    
    if(address.match(':')){
        address = address.split(':')[1]
    }
    return address
}

export function getBalanceData(props) {

    const { balance } = props

    const { localCurrencySymbol } = props.walletsGeneralData

    const currencySymbol = localCurrencySymbol

    const accountRates = DaemonCache.getCacheRates('BTC')
    const value = balance
    const basicCurrencyBalanceNorm = RateEquivalent.mul({
        value,
        currencyCode: 'BTC',
        basicCurrencyRate: accountRates.basicCurrencyRate
    })

    const tmp = basicCurrencyBalanceNorm.toString()
    const beforeDecimal = BlocksoftPrettyNumbers.setCurrencyCode('BTC').makeCut(tmp, 2).separated
    return { currencySymbol, beforeDecimal }
}