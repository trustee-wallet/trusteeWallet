import settingsActions from "@app/appstores/Stores/Settings/SettingsActions"
import { showModal } from "@app/appstores/Stores/Modal/ModalActions"
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'

import BlocksoftDict from "@crypto/common/BlocksoftDict"
import BlocksoftExternalSettings from "@crypto/common/BlocksoftExternalSettings"

import Netinfo from '@app/services/Netinfo/Netinfo'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import { strings, sublocale } from "@app/services/i18n"
import prettyShare from "@app/services/UI/PrettyShare/PrettyShare"
import Log from "@app/services/Log/Log"
import checkTransferHasError from '@app/services/UI/CheckTransferHasError/CheckTransferHasError'

import NavStore from '@app/components/navigation/NavStore'

const diffTimeScan = (timeScan) => {
    const lastScan = timeScan * 1000
    const timeNow = new Date().getTime()

    const diffTime = (timeNow - lastScan) / 60000

    return Math.abs(Math.round(diffTime))
}

const getExplorerLink = (code, type, value) => {

    const currency = BlocksoftDict.getCurrencyAllSettings(code)

    const currencyCode = currency.tokenBlockchain === 'ETHEREUM' ? 'ETH' : currency.currencyCode

    let customLink = settingsActions.getSettingStatic(`${currencyCode}_explorer`)

    if (type === 'address') {
        if (customLink) {
            customLink = JSON.parse(customLink)
            return customLink.explorerLink + value
        } else {
            return currency.currencyExplorerLink + value
        }
    } else if (type === 'hash') {
        if (customLink) {
            customLink = JSON.parse(customLink)
            return customLink.explorerTxLink + value
        } else {
            return currency.currencyExplorerTxLink + value
        }
    }
}

const getPrettyCurrencyName = (currencyCode, currencyName) => {
    switch (currencyCode) {
        case 'USDT':
            return 'Tether Bitcoin'
        case 'ETH_USDT':
            return 'Tether Ethereum'
        case 'TRX_USDT':
            return 'Tether Tron'
        default:
            return currencyName
    }
}

const handleBuy = async (props) => {
    const { currencyCode } = props.selectedCryptoCurrencyData
    const { basicCurrencyCode } = props.selectedAccountData

    try {
        await Netinfo.isInternetReachable()

        const showMsg = trusteeAsyncStorage.getSmartSwapMsg() === '1'
        if (!showMsg) {
            showModal({
                type: 'MARKET_MODAL',
                icon: 'INFO',
                title: strings('modal.marketModal.title'),
                description: strings('modal.marketModal.description'),
            }, () => {
                NavStore.reset('MarketScreen', {screen: 'MarketScreen', params: {
                    inCurrencyCode: basicCurrencyCode,
                    outCurrencyCode: currencyCode
                }})
            })
        } else {
            NavStore.reset('MarketScreen', {screen: 'MarketScreen', params: {
                inCurrencyCode: basicCurrencyCode,
                outCurrencyCode: currencyCode
            }})
        }

        // }
    } catch (e) {
        if (Log.isNetworkError(e.message)) {
            Log.log('HomeScreen.BottomNavigation handleMainMarket error ' + e.message)
        } else {
            Log.err('HomeScreen.BottomNavigation handleMainMarket error ' + e.message)
        }
    }
}

const handleReceive = (props) => {
    const { walletHash, address } = props.selectedAccountData
    const { currencyCode, currencySymbol } = props.selectedCryptoCurrencyData

    checkTransferHasError({
        walletHash,
        currencyCode,
        currencySymbol,
        addressFrom: address,
        addressTo: address
    })
    NavStore.goNext('AccountReceiveScreen')
}

const handleSend = async (props) => {
    const { isSynchronized } = props.selectedAccountData
    const { currencyCode } = props.selectedCryptoCurrencyData

    if (isSynchronized) {
        await SendActionsStart.startFromAccountScreen(currencyCode)
    } else {
        showModal({
            type: 'INFO_MODAL',
            icon: 'INFO',
            title: strings('modal.cryptocurrencySynchronizing.title'),
            description: strings('modal.cryptocurrencySynchronizing.description')
        })
    }
}

const getCurrentDate = (date) => {
    const newDate = new Date(date)

    return newDate.toString().split(' ')[1] + ' ' + newDate.getDate() + ', ' + newDate.getFullYear()
}

const handleShareInvoice = (address, currencyCode, currencyName) => {
    const lang = sublocale()
    const message = `${BlocksoftExternalSettings.getStatic(`INVOICE_URL_${lang.toUpperCase()}`)}?crypto_name=${currencyName}&crypto_code=${currencyCode}&wallet_address=${address}`

    const shareOptions = {
        title: strings('account.invoiceText'),
        url: message
    }
    prettyShare(shareOptions)
}


export {
    diffTimeScan, 
    getExplorerLink,
    getPrettyCurrencyName,
    handleBuy,
    handleReceive,
    handleSend,
    getCurrentDate,
    handleShareInvoice
}
