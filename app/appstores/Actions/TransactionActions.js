/**
 * @version 0.9
 */

import transactionDS from '../DataSource/Transaction/Transaction'

import Log from '@app/services/Log/Log'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftDict from '@crypto/common/BlocksoftDict'
import DaemonCache from '@app/daemons/DaemonCache'
import UpdateTradeOrdersDaemon from '@app/daemons/back/UpdateTradeOrdersDaemon'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import config from '@app/config/config'
import EthTmpDS from '@crypto/blockchains/eth/stores/EthTmpDS'
import store from '@app/store'
import { setSelectedAccount, setSelectedAccountTransactions, setSelectedCryptoCurrency } from '@app/appstores/Stores/Main/MainStoreActions'
import NavStore from '@app/components/navigation/NavStore'
import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'


const transactionActions = {

    /**
     * @param {object} transaction
     * @param {string} transaction.currencyCode
     * @param {string} transaction.walletHash
     * @param {string} transaction.accountId
     * @param {string} transaction.transactionHash
     * @param {string} transaction.transactionStatus
     * @param {string} transaction.transactionDirection
     * @param {string} transaction.addressTo
     * @param {string} transaction.addressToBasic
     * @param {string} transaction.addressFrom
     * @param {string} transaction.addressFromBasic
     * @param {string} transaction.addressAmount
     * @param {string} transaction.transactionFee
     * @param {string} transaction.transactionOfTrusteeWallet
     * @param {string} transaction.transactionsScanLog
     * @param {string} transaction.transactionJson
     * @param {string} transaction.bseOrderId
     * @param {object} transaction.bseOrderData
     * @param {string} transaction.createdAt: new Date().toISOString(),
     * @param {string} transaction.updatedAt: new Date().toISOString()
     * @param {string} transaction.transactionFilterType: swap | walletConnect | fee | usual
     */
    saveTransaction: async (transaction, source = '') => {

        try {

            await transactionDS.saveTransaction(transaction, false,source)

            if (transaction.currencyCode.indexOf('ETH') !== -1) {
                await EthTmpDS.getCache('ETH', transaction.addressFromBasic)
            }

            // account was not opened before or no tx could be done
            const account = store.getState().mainStore.selectedAccount
            if (!account || typeof account.currencyCode === 'undefined' || account.currencyCode !== transaction.currencyCode) {
                const { cryptoCurrencies } = store.getState().currencyStore
                const { selectedCryptoCurrency } = store.getState().mainStore
                if (selectedCryptoCurrency.currencyCode === transaction.currencyCode) {
                    // do nothing
                } else {
                    let cryptoCurrency = { currencyCode: false }
                    // @ts-ignore
                    for (const tmp of cryptoCurrencies) {
                        if (tmp.currencyCode === transaction.currencyCode) {
                            cryptoCurrency = tmp
                        }
                    }
                    if (cryptoCurrency.currencyCode) {
                        setSelectedCryptoCurrency(cryptoCurrency)
                    }
                }
                await setSelectedAccount('TransactionActions.saveTransaction')
            }

            await setSelectedAccountTransactions('TransactionActions.saveTransaction')

            if (typeof transaction.bseOrderId !== 'undefined') {
                UpdateTradeOrdersDaemon.updateTradeOrdersDaemon({ force: true })
            }

            DaemonCache.cleanCacheTxsCount(transaction)

        } catch (e) {

            Log.err('ACT/Transaction saveTransaction ' + e.message)
        }

    },

    /**
     *
     * @param transaction.accountId
     * @param transaction.transactionHash
     * @param transaction.transactionUpdateHash
     * @param transaction.transactionsOtherHashes
     * @param transaction.transactionJson
     * @param transaction.addressAmount
     * @param transaction.transactionDirection
     * @param transaction.addressTo
     * @param transaction.addressToBasic
     * @param {string} transaction.addressFromBasic
     * @param transaction.transactionStatus
     * @param transaction.transactionFee
     * @param transaction.transactionFeeCurrencyCode
     * @returns {Promise<void>}
     */
    updateTransaction: async (transaction) => {
        try {

            await transactionDS.updateTransaction(transaction)

            if (transaction.currencyCode.indexOf('ETH') !== -1) {
                await EthTmpDS.getCache('ETH', transaction.addressFromBasic)
            }
            /*
            const account = JSON.parse(JSON.stringify(store.getState().mainStore.selectedAccount))

            if (transaction.currencyCode === account.currencyCode) {

                // @todo page reload
            }

            dispatch({
                type: 'SET_SELECTED_ACCOUNT',
                selectedAccount: account
            })
            */

        } catch (e) {
            if (config.debug.appErrors) {
                console.log('ACT/Transaction updateTransaction ' + e.message, e)
            }
            Log.err('ACT/Transaction updateTransaction ' + e.message)
        }
    },

    preformatWithBSEforShowInner(transaction) {
        const direction = transaction.transactionDirection
        transaction.addressAmountPrettyPrefix = (direction === 'outcome' || direction === 'self' || direction === 'freeze' || direction === 'swap_outcome') ? '-' : '+'
        if (direction === 'vote') {
            transaction.addressAmountPrettyPrefix = ''
        }
        if (typeof transaction.wayType === 'undefined' || !transaction.wayType) {
            transaction.wayType = transaction.transactionDirection
        }
        // if (transaction?.bseOrderData) {
            // transaction.wayType = TransactionFilterTypeDict.SWAP
        // }
        if (transaction?.addressAmount === 0 || transaction?.transactionFilterType === TransactionFilterTypeDict.FEE) {
            transaction.addressAmountPrettyPrefix = '-'
            transaction.wayType = TransactionFilterTypeDict.FEE
        }
        return transaction
    },

    prepareStatus(status) {
        switch (status.toUpperCase()) {
            case 'DONE_PAYOUT':
            case 'SUCCESS':
                return 'SUCCESS'
            case 'CANCELED_PAYOUT':
            case 'CANCELED_PAYIN':
                return 'CANCELED'
            case 'FAIL':
                return 'FAIL'
            case 'MISSING':
            case 'REPLACED':
                return 'MISSING'
            case 'OUT_OF_ENERGY':
                return 'OUT_OF_ENERGY'
            default:
                return 'PENDING'
        }
    },

    preformatWithBSEforShow(_transaction, exchangeOrder, _currencyCode = false) {
        if (typeof exchangeOrder === 'undefined' || !exchangeOrder || exchangeOrder === null) {
            _transaction.bseOrderData = false // for easy checks
            _transaction.transactionBlockchainStatus = typeof _transaction.transactionStatus  !== 'undefined' ? _transaction.transactionStatus : '?'
            _transaction.transactionOfTrusteeWallet = typeof _transaction.transactionOfTrusteeWallet !== 'undefined' ? _transaction.transactionOfTrusteeWallet : false
            _transaction = this.preformatWithBSEforShowInner(_transaction)
            _transaction.transactionVisibleStatus = this.prepareStatus(_transaction.transactionStatus)
            return _transaction
        }

        const transaction = _transaction ? { ..._transaction } : {
            currencyCode: _currencyCode,
            transactionHash: false,
            transactionDirection : 'outcome',
            transactionOfTrusteeWallet : false,
            transactionStatus : '?',
            transactionVisibleStatus : '?',
            transactionBlockchainStatus : '?',
            addressTo : '?',
            addressFrom : '?',
            addressAmountPretty: '?',
            blockConfirmations : false,
            blockNumber : false,
            createdAt: exchangeOrder.createdAt,
            bseOrderData : exchangeOrder
        }

        if (typeof exchangeOrder !== 'undefined' && exchangeOrder) {
            transaction.transactionFilterType = TransactionFilterTypeDict.SWAP
        }

        transaction.transactionBlockchainStatus = transaction.transactionStatus
        transaction.transactionVisibleStatus = this.prepareStatus(transaction.transactionStatus)

        if (typeof exchangeOrder.requestedOutAmount !== 'undefined' && typeof exchangeOrder.requestedOutAmount.currencyCode !== 'undefined') {
            if (exchangeOrder.requestedOutAmount.currencyCode === transaction.currencyCode) {
                transaction.transactionDirection = 'income'
            } else {
                transaction.transactionDirection = 'outcome'
            }
        }

        if (transaction.transactionDirection === 'income' && typeof exchangeOrder.requestedOutAmount !== 'undefined' && typeof exchangeOrder.requestedOutAmount.amount !== 'undefined') {
            if (!transaction?.addressAmountPretty || transaction?.addressAmountPretty === '?') {
                const res = BlocksoftPrettyNumbers.makeCut(exchangeOrder.requestedOutAmount.amount)
                transaction.addressAmountPretty = res.cutted
            }
            if (!transaction.currencyCode) {
                transaction.currencyCode = exchangeOrder.requestedOutAmount.currencyCode
            }
        }
        if (transaction.transactionDirection === 'outcome' && typeof exchangeOrder.requestedInAmount !== 'undefined' && typeof exchangeOrder.requestedInAmount.amount !== 'undefined') {
            if (!transaction?.addressAmountPretty || transaction?.addressAmountPretty === '?') {
                const res = BlocksoftPrettyNumbers.makeCut(exchangeOrder.requestedInAmount.amount)
                transaction.addressAmountPretty = res.cutted
            }
            if (!transaction.currencyCode) {
                transaction.currencyCode = exchangeOrder.requestedInAmount.currencyCode
            }
        }
        return this.preformatWithBSEforShowInner(transaction)
    },

    /**
     *
     * @param transaction
     * @param params.currencyCode
     * @param params.account
     */
    preformat(transaction, params) {
        if (!transaction) return
        if (transaction.transactionHash === '') return false

        let addressAmountSatoshi = false

        let account
        if (typeof params.account !== 'undefined') {
            account = params.account
        } else {
            throw new Error('something wrong with TransactionActions.preformat params')
        }

        try {
            transaction.addressAmountNorm = BlocksoftPrettyNumbers.setCurrencyCode(account.currencyCode).makePretty(transaction.addressAmount, 'transactionActions.addressAmount')
            const res = BlocksoftPrettyNumbers.makeCut(transaction.addressAmountNorm, account.currencyCode === 'BTC' ? 8 : 5) // @todo settings for better
            if (res.isSatoshi) {
                addressAmountSatoshi = '...' + transaction.addressAmount
                transaction.addressAmountPretty = res.cutted
            } else {
                transaction.addressAmountPretty = res.separated
            }
        } catch (e) {
            e.message += ' on addressAmountPretty account ' + JSON.stringify(account)
            throw e
        }

        transaction.basicCurrencySymbol = account.basicCurrencySymbol
        transaction.basicAmountPretty = 0

        transaction.addressAmountSatoshi = addressAmountSatoshi
        if (!addressAmountSatoshi) {
            try {
                if (account.basicCurrencyRate === 1) {
                    transaction.basicAmountNorm = transaction.addressAmountNorm
                } else {
                    transaction.basicAmountNorm = BlocksoftUtils.mul(transaction.addressAmountNorm, account.basicCurrencyRate)
                }
                transaction.basicAmountPretty = BlocksoftPrettyNumbers.makeCut(transaction.basicAmountNorm, 2).separated
            } catch (e) {
                e.message += ' on basicAmountPretty ' + transaction.addressAmountPretty
                throw e
            }
        }

        transaction.basicFeePretty = 0
        transaction.basicFeeCurrencySymbol = ''

        let feeRates, feeCurrencyCode
        if (transaction.transactionFeeCurrencyCode && transaction.transactionFeeCurrencyCode !== account.feesCurrencyCode) {
            feeCurrencyCode = transaction.transactionFeeCurrencyCode
            const extendedFeesCode = BlocksoftDict.getCurrencyAllSettings(transaction.transactionFeeCurrencyCode)
            transaction.feesCurrencySymbol = extendedFeesCode.currencySymbol || extendedFeesCode.currencyCode
            feeRates = DaemonCache.getCacheRates(transaction.transactionFeeCurrencyCode)
        } else {
            feeCurrencyCode = account.feesCurrencyCode
            transaction.feesCurrencySymbol = account.feesCurrencySymbol
            feeRates = account.feeRates
        }

        let getBasic = true

        if (typeof transaction.transactionFee === 'undefined') {
            Log.log('ACT/Transaction preformat bad transactionFee ' + JSON.stringify(transaction.transactionFee))
            transaction.transactionFee = 0
            transaction.transactionFeePretty = 0
        } else if (!transaction.transactionFee || transaction.transactionFee === 0 || transaction.transactionFee.toString().indexOf('null') === 0) {
            transaction.transactionFee = 0
            transaction.transactionFeePretty = 0
        } else {
            try {
                const tmp = BlocksoftPrettyNumbers.setCurrencyCode(feeCurrencyCode).makePretty(transaction.transactionFee, 'transactionActions.fee')
                const tmp2 = BlocksoftUtils.fromENumber(tmp*1)
                const res = BlocksoftPrettyNumbers.makeCut(tmp2, 7)
                if (res.isSatoshi) {
                    getBasic = false
                    transaction.transactionFeePretty =  '...' + transaction.transactionFee
                    if (transaction.feesCurrencySymbol === 'ETH') {
                        transaction.feesCurrencySymbol = 'wei'
                    } else if (transaction.feesCurrencySymbol === 'BTC' || transaction.feesCurrencySymbol === 'BTC') {
                        transaction.feesCurrencySymbol = 'sat'
                    }
                } else {
                    transaction.transactionFeePretty = res.cutted
                }
            } catch (e) {
                if (config.debug.appErrors) {
                    console.log('TransactionActions transactionFeePretty error ' + e.message)
                }
                e.message += ' on transactionFeePretty with tx ' + JSON.stringify(transaction)
                throw e
            }
        }

        try {
            if (!transaction.transactionFee) {
                transaction.transactionFee = 0
            }
            if (feeRates) {
                transaction.basicFeeCurrencySymbol = feeRates.basicCurrencySymbol
                if (feeRates.basicCurrencyRate === 1) {
                    transaction.basicFeePretty = BlocksoftPrettyNumbers.makeCut(transaction.transactionFeePretty, 2).justCutted
                } else if (getBasic) {
                    transaction.basicFeePretty = BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.mul(transaction.transactionFeePretty, feeRates.basicCurrencyRate), 2).justCutted
                } else {
                    transaction.basicFeePretty = '0'
                }
            }
        } catch (e) {
            e.message += ' on basicFeePretty'
            throw e
        }

        return transaction

    }

}

export default transactionActions
