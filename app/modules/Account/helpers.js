import settingsActions from "@app/appstores/Stores/Settings/SettingsActions"
import BlocksoftDict from "@crypto/common/BlocksoftDict"

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

export {
    diffTimeScan, getExplorerLink
}
