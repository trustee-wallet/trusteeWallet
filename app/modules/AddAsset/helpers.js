/**
 * @version 0.77
 */
import _forEach from 'lodash/forEach'

import NavStore from '@app/components/navigation/NavStore'

import customCurrencyActions from '@app/appstores/Actions/CustomCurrencyActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import currencyActions from '@app/appstores/Stores/Currency/CurrencyActions'

import BlocksoftDict from '@crypto/common/BlocksoftDict'

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'
import config from '@app/config/config'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import Validator from '@app/services/UI/Validator/Validator'


export const ASSESTS_GROUP = {
    ALL: 'ALL',
    COINS: 'COINS',
    TOKENS: 'TOKENS',
    CUSTOM: 'CUSTOM',
}

export const getTabs = () => [
    {
        title: strings('assets.tabAll'),
        index: 0,
        active: true,
        group: ASSESTS_GROUP.ALL
    },
    {
        title: strings('assets.tabCoins'),
        index: 1,
        active: false,
        group: ASSESTS_GROUP.COINS
    },
    {
        title: strings('assets.tabTokens'),
        index: 2,
        active: false,
        group: ASSESTS_GROUP.TOKENS
    },
    {
        title: strings('assets.tabCustom'),
        index: 3,
        active: false,
        group: ASSESTS_GROUP.CUSTOM
    },
]


/**
 * Helpers called from the container with .call (function has context of the container)
 * @param {Array<Object>} assets
 * @param {Object} newTab
 * @param {string} searchQuery
 */
export function prepareDataForDisplaying(assets, newTab, searchQuery) {
    if (typeof searchQuery !== 'string') {
        searchQuery = this.state.searchQuery
    }
    searchQuery = Validator.safeWords(searchQuery)

    const { tabs } = this.state
    const activeTab = newTab || tabs.find(tab => tab.active)
    const newTabs = tabs.map(tab => ({ ...tab, active: tab.index === activeTab.index }))

    const fullData = prepareAssets(assets)

    let data = []
    let tokenBlockchainArray = []

    if (searchQuery) data = filterBySearchQuery(fullData, searchQuery)

    if (activeTab.group === ASSESTS_GROUP.ALL && !searchQuery) data = fullData

    if (activeTab.group === ASSESTS_GROUP.COINS && !searchQuery) data = fullData.filter(as => as.currencyType === 'coin')

    if (activeTab.group === ASSESTS_GROUP.TOKENS && !searchQuery) {
        const dataGrouped = fullData.reduce((grouped, asset) => {
            if (asset.currencyType === 'coin' || asset.currencyType === 'special') return grouped
            if (!grouped[asset.tokenBlockchain]) grouped[asset.tokenBlockchain] = []
            grouped[asset.tokenBlockchain].push(asset)
            return grouped
        }, {})

        _forEach(dataGrouped, (arr, tokenBlockchain) => {
            data.push({
                title: tokenBlockchain === 'BNB' ? 'BINANCE SMART CHAIN (BEP-20)' : tokenBlockchain,
                data: arr
            })
        })

        if (this.state.tokenBlockchain) {
            tokenBlockchainArray = data[this.state.tokenBlockchain !== 0 ? this.state.tokenBlockchain - 1 : 0].data
        }
    }

    if (activeTab.group === ASSESTS_GROUP.CUSTOM && !searchQuery) {
        data = [...fullData.filter(currency => currency.currencyType === 'custom')]
    }

    this.setState(() => ({ data, tabs: newTabs, searchQuery, tokenBlockchainArray }))
}

export function prepareAssets(assets) {
    const notAddedAssets = []
    _forEach(BlocksoftDict.Currencies, (currency, currencyCode) => {
        let tmpCurrency = assets.find(as => as.currencyCode === currencyCode)
        if (typeof tmpCurrency === 'undefined') {
            tmpCurrency = JSON.parse(JSON.stringify(BlocksoftDict.Currencies[currencyCode]))
            tmpCurrency.isHidden = null
            if (tmpCurrency.currencyCode === 'ETH_ONE') {
                return
            }
            notAddedAssets.push(tmpCurrency)
        }
    })

    return [...assets, ...notAddedAssets]
}

function filterBySearchQuery(assets, value) {
    value = value.toLowerCase()
    return assets.filter(as => (
        as.currencySymbol.toLowerCase().includes(value)
        || as.currencyName.toLowerCase().includes(value)
        || (
            typeof as.tokenAddress !== 'undefined' && as.tokenAddress && as.tokenAddress.toLowerCase() === value
        )
        || (
            typeof as.tokenName !== 'undefined' && as.tokenName && as.tokenName.toLowerCase() === value
        )
    )).sort((a, b) => {
        if (typeof a.tokenBlockchain === 'undefined' && typeof b.tokenBlockchain !== 'undefined') {
            return -1
        } else if (typeof b.tokenBlockchain === 'undefined' && typeof a.tokenBlockchain !== 'undefined') {
            return 1
        }
        const nameA = a.currencyName.toLowerCase()
        const nameB = b.currencyName.toLowerCase()
        if (nameA.indexOf(value) === 0 && nameB.indexOf(value) !== 0) {
            return -1
        } else if (nameB.indexOf(value) === 0 && nameA.indexOf(value) !== 0) {
            return 1
        }
        if (nameA < nameB)
            return -1
        if (nameA > nameB)
            return 1
        return 0
    })
}


export async function addCustomToken(tokenAddress, tokenType ) {
    Log.log('AddCustomTokenScreen.addToken start adding ' + tokenAddress + ' ' + tokenType)

    setLoaderStatus(true)

    let checked = false
    let todoArray = []
    try {
        for (const dict in BlocksoftDict.Currencies) {
            if (
                (
                    typeof BlocksoftDict.Currencies[dict].tokenAddress !== 'undefined'
                    && BlocksoftDict.Currencies[dict].tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
                ) || (
                    typeof BlocksoftDict.Currencies[dict].tokenName !== 'undefined'
                    && BlocksoftDict.Currencies[dict].tokenName.toLowerCase() === tokenAddress.toLowerCase()
                )
            ) {
                showModal({
                    type: 'INFO_MODAL',
                    icon: 'INFO',
                    title: strings('modal.infoAddCustomAssetModal.attention.title'),
                    description: strings('modal.infoAddCustomAssetModal.attention.description')
                })
                setLoaderStatus(false)
                return { searchQuery: tokenAddress }
            }
            // tokenName
        }

        checked = await customCurrencyActions.checkCustomCurrency({
            tokenType,
            tokenAddress
        })
        Log.log('AddCustomTokenScreen.addToken checked ' + tokenAddress + ' ' + tokenType + ' result ' + JSON.stringify(checked))
        if (checked) {
           todoArray.push({ tokenType, checked })
        }

        if (tokenType === 'ETH_ERC_20') {
            const checked2 = await customCurrencyActions.checkCustomCurrency({
                tokenType: 'BNB_SMART_20',
                tokenAddress
            })
            Log.log('AddCustomTokenScreen.addToken checked2 ' + tokenAddress + ' ' + tokenType + ' result ' + JSON.stringify(checked2))
            if (checked2) {
                todoArray.push({ tokenType : 'BNB_SMART_20', checked: checked2})
            }

            const checked3 = await customCurrencyActions.checkCustomCurrency({
                tokenType: 'MATIC_ERC_20',
                tokenAddress
            })
            Log.log('AddCustomTokenScreen.addToken checked3 ' + tokenAddress + ' ' + tokenType + ' result ' + JSON.stringify(checked3))
            if (checked3) {
                todoArray.push({ tokenType : 'MATIC_ERC_20', checked : checked3})
            }

            const checked4 = await customCurrencyActions.checkCustomCurrency({
                tokenType: 'FTM_ERC_20',
                tokenAddress
            })
            Log.log('AddCustomTokenScreen.addToken checked4 ' + tokenAddress + ' ' + tokenType + ' result ' + JSON.stringify(checked4))
            if (checked4) {
                todoArray.push({ tokenType : 'FTM_ERC_20', checked : checked4})
            }

            const checked5 = await customCurrencyActions.checkCustomCurrency({
                tokenType: 'METIS_ERC_20',
                tokenAddress
            })
            Log.log('AddCustomTokenScreen.addToken checked5 ' + tokenAddress + ' ' + tokenType + ' result ' + JSON.stringify(checked5))
            if (checked5) {
                todoArray.push({ tokenType : 'METIS_ERC_20', checked : checked4})
            }

            const checked6 = await customCurrencyActions.checkCustomCurrency({
                tokenType: 'VLX_ERC_20',
                tokenAddress
            })
            Log.log('AddCustomTokenScreen.addToken checked6 ' + tokenAddress + ' ' + tokenType + ' result ' + JSON.stringify(checked6))
            if (checked6) {
                todoArray.push({ tokenType : 'VLX_ERC_20', checked : checked6})
            }
        }

        if (tokenType === 'ETH_ERC_20' || tokenType === 'ONE_ERC_20') {
            const checked7 = await customCurrencyActions.checkCustomCurrency({
                tokenType: 'ONE_ERC_20',
                tokenAddress
            })
            Log.log('AddCustomTokenScreen.addToken checked7 ' + tokenAddress + ' ' + tokenType + ' result ' + JSON.stringify(checked7))
            if (checked7) {
                todoArray.push({ tokenType : 'ONE_ERC_20', checked : checked7})
            }
        }


        const ic = todoArray.length
        if (ic === 0) {
            showModal({
                type: 'INFO_MODAL',
                icon: 'INFO',
                title: strings('modal.infoAddCustomAssetModal.error.title'),
                description: strings('modal.infoAddCustomAssetModal.error.description')
            })
            setLoaderStatus(false)
            return { searchQuery: false }
        }

        for (let i = 0; i<ic - 1; i++) {
            await _actualAdd(todoArray[i].checked, todoArray[i].tokenType, false)
        }
        return _actualAdd(todoArray[ic - 1].checked, todoArray[ic - 1].tokenType, true)

    } catch (e) {

        if (config.debug.appErrors) {
            console.log('AddCustomTokenScreen.addToken checked' + tokenAddress + ' ' + tokenType + ' error ' + e.message)
        }
        Log.log('AddCustomTokenScreen.addToken checked' + tokenAddress + ' ' + tokenType + ' error ' + e.message)

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

async function _actualAdd(checked, tokenType, isFinal = true) {

    currencyActions.addOrShowMainCurrency(checked.currencyCode, tokenType)

    if (BlocksoftDict.Currencies[checked.currencyCodePrefix + checked.currencyCode]) {

        const oldContact = BlocksoftDict.Currencies[checked.currencyCodePrefix + checked.currencyCode].tokenAddress || BlocksoftDict.Currencies[checked.currencyCodePrefix + checked.currencyCode].tokenName
        showModal({
            type: 'YES_NO_MODAL',
            title: strings('modal.infoAddCustomAssetModal.askReplace.title', { tokenName: checked.currencyCode }),
            icon: 'WARNING',
            description: strings('modal.infoAddCustomAssetModal.askReplace.description', { oldContact, newContract: checked.tokenAddress })
        }, async () => {
            await customCurrencyActions.replaceCustomCurrencyFromDict(oldContact, checked)
            await customCurrencyActions.importCustomCurrenciesToDict()
            await currencyActions.setCryptoCurrencies()
            NavStore.reset('HomeScreen')
        })

        setLoaderStatus(false)

        return { searchQuery: false }
    }

    try {
        MarketingEvent.logEvent('gx_currency_add', {
            currencyCode: checked.currencyCode,
            currencyName: checked.currencyName,
            tokenType: checked.tokenType,
            tokenAddress: checked.tokenAddress,
        }, 'GX')
        await customCurrencyActions.addCustomCurrency({
            currencyCode: checked.currencyCode,
            currencyName: checked.currencyName,
            tokenType: checked.tokenType,
            tokenAddress: checked.tokenAddress,
            tokenDecimals: checked.tokenDecimals
        })
    } catch (e) {
        if (config.debug.appErrors) {
            console.log('AddCustomTokenScreen.addToken firstStep error ' + e.message)
        }
        Log.log('AddCustomTokenScreen.addToken firstStep error ' + e.message)

        showModal({
            type: 'INFO_MODAL',
            icon: 'INFO',
            title: strings('settings.error.title'),
            description: strings('settings.error.text')
        })

        setLoaderStatus(false)
        return { searchQuery: false }
    }

    await customCurrencyActions.importCustomCurrenciesToDict()

    try {
        await currencyActions.addCurrency({ currencyCode: checked.currencyCodePrefix + checked.currencyCode })
    } catch (e) {
        if (config.debug.appErrors) {
            console.log('AddCustomTokenScreen.addToken secondStep error ' + e.message)
        }
        Log.log('AddCustomTokenScreen.addToken secondStep error ' + e.message)
    }

    if (isFinal) {
        await currencyActions.setCryptoCurrencies()
        setLoaderStatus(false)
        showModal({
            type: 'INFO_MODAL',
            icon: true,
            title: strings('modal.infoAddCustomAssetModal.success.title'),
            description: strings('modal.infoAddCustomAssetModal.success.description')
        }, () => {
            NavStore.reset('HomeScreen')
        })
    }
    return { searchQuery: false }
}
