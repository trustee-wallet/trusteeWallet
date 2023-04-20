/**
 * @version 0.5
 */
import BlocksoftUtils from '../../common/BlocksoftUtils'
import BlocksoftAxios from '../../common/BlocksoftAxios'
import BlocksoftCryptoLog from '../../common/BlocksoftCryptoLog'
import EthBasic from './basic/EthBasic'
import BlocksoftExternalSettings from '../../common/BlocksoftExternalSettings'
import BlocksoftBN from '../../common/BlocksoftBN'

import EthTmpDS from './stores/EthTmpDS'
import EthRawDS from './stores/EthRawDS'
import config from '@app/config/config'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

const CACHE_GET_MAX_BLOCK = {
    ETH: { max_block_number: 0, confirmations: 0 },
    BNB: { max_block_number: 0, confirmations: 0 },
    ETC: { max_block_number: 0, confirmations: 0 },
    AMB: { max_block_number: 0, confirmations: 0 },
    MATIC : { max_block_number: 0, confirmations: 0 },
    FTM : { max_block_number: 0, confirmations: 0 },
    RSK : { max_block_number: 0, confirmations: 0 },
    OPTIMISM : { max_block_number: 0, confirmations: 0 },
    METIS : { max_block_number: 0, confirmations: 0 },
    VLX : { max_block_number: 0, confirmations: 0 },
}
const CACHE_BLOCK_NUMBER_TO_HASH = {
    ETH: {},
    BNB: {},
    ETC : {},
    AMB : {},
    MATIC : {},
    FTM : {},
    RSK : {},
    OPTIMISM : {},
    METIS : {},
    VLX : {}
}

const CACHE_VALID_TIME = 30000 // 30 seconds
const CACHE = {
    ETH: {},
    BNB: {},
    ETC : {},
    AMB : {},
    MATIC : {},
    FTM : {},
    RSK : {},
    OPTIMISM : {},
    METIS : {},
    VLX : {}
}

export default class EthScannerProcessor extends EthBasic {
    /**
     * @type {number}
     * @private
     */
    _blocksToConfirm = 10

    /**
     * @type {boolean}
     * @private
     */
    _useInternal = true

    /**
     * https://eth1.trezor.io/api/v2/address/0x8b661361Be29E688Dda65b323526aD536c8B3997?details=txs
     * @param address
     * @returns {Promise<boolean|*>}
     * @private
     */
    async _get(_address) {
        const address = _address.toLowerCase()

        try {
            this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, 'ETH.Scanner._get')
        } catch (e) {
            throw new Error(e.message + ' while getTrezorServer ' + this._trezorServerCode)
        }

        if (typeof this._trezorServer === 'undefined') {
            BlocksoftCryptoLog.err(this._settings.currencyCode + ' EthScannerProcessor._get empty trezorServer')
            throw new Error(this._settings.currencyCode + ' EthScannerProcessor._get empty trezorServer')
        }

        if (!this._trezorServer) {
            return false
        }

        const now = new Date().getTime()
        if (typeof CACHE[this._mainCurrencyCode] !== 'undefined' && typeof CACHE[this._mainCurrencyCode][address] !== 'undefined' && (now - CACHE[this._mainCurrencyCode][address].time < CACHE_VALID_TIME)) {
            CACHE[this._mainCurrencyCode][address].provider = 'trezor-cache'
            return CACHE[this._mainCurrencyCode][address]
        }

        let link = this._trezorServer + '/api/v2/address/' + address + '?details=txs'
        let res = await BlocksoftAxios.getWithoutBraking(link)

        if (!res || !res.data) {
            BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
            this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, this._settings.currencyCode + ' ETH.Scanner._get')
            if (typeof this._trezorServer === 'undefined') {
                BlocksoftCryptoLog.err(this._settings.currencyCode + ' EthScannerProcessor._get empty trezorServer2')
                throw new Error(this._settings.currencyCode + ' EthScannerProcessor._get empty trezorServer2')
            }
            link = this._trezorServer + '/api/v2/address/' + address + '?details=txs'
            res = await BlocksoftAxios.getWithoutBraking(link)
            if (!res || !res.data) {
                BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
                return false
            }
        }

        if (typeof res.data.balance === 'undefined') {
            throw new Error(this._settings.currencyCode + ' EthScannerProcessor._get nothing loaded for address ' + link)
        }
        const data = res.data
        data.totalTokens = 0
        data.formattedTokens = {}
        //await  BlocksoftCryptoLog.log('EthScannerProcessor._get ERC20 tokens ' + JSON.stringify(data.tokens))
        if (typeof data.tokens !== 'undefined') {
            let token
            for (token of data.tokens) {
                data.formattedTokens[token.contract.toLowerCase()] = token
            }
        }
        if (typeof CACHE[this._mainCurrencyCode][address] !== 'undefined') {
            if (CACHE[this._mainCurrencyCode][address].data.nonce > res.data.nonce) {
                return false
            }
        }
        CACHE[this._mainCurrencyCode][address] = {
            data,
            provider: 'trezor',
            time: now
        }
        return CACHE[this._mainCurrencyCode][address]
    }

    /**
     * @param {string} address
     * @return {Promise<{balance, unconfirmed, provider}>}
     */
    async getBalanceBlockchain(address) {
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessor.getBalance started ' + address)

        this.checkWeb3CurrentServerUpdated()
        // noinspection JSUnresolvedVariable
        let balance = 0
        let provider = ''
        let time = 0
        try {
            if (this._trezorServerCode && this._trezorServerCode.indexOf('http') === -1) {
                const res = await this._get(address)

                if (res && typeof res.data !== 'undefined' && res.data && typeof res.data.balance !== 'undefined') {
                    balance = res.data.balance
                    provider = res.provider
                    time = res.time
                    return { balance, unconfirmed: 0, provider, time, balanceScanBlock: res.data.nonce }
                }
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthScannerProcessor.getBalance ' + address + ' error ' + e.message)
            }
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessor.getBalance ' + address + ' trezor error ' + e.message)
            return false
        }

        try {
            balance = await this._web3.eth.getBalance(address)
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessor.getBalance ' + address + ' result ' + JSON.stringify(balance))
            provider = 'web3'
            time = 'now()'
            return { balance, unconfirmed: 0, provider, time }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log(this._settings.currencyCode + ' EthScannerProcessor.getBalance ' + address + ' ' + this._web3.LINK + ' rpc error ' + e.message)
            }
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessor.getBalance ' + address + ' ' + this._web3.LINK + ' rpc error ' + e.message)
            return false
        }
    }

    /**
     * @param {string} scanData.account.address
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactionsBlockchain(scanData) {
        const address = scanData.account.address
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessor.getTransactions started ' + address)
        let res = false
        if (this._settings.currencyCode !== 'ETH_ROPSTEN' && this._settings.currencyCode !== 'ETH_RINKEBY' && this._trezorServerCode) {
            try {
                res = await this._get(address)
            } catch (e) {
                throw new Error(e.message + ' in EthScannerProcessor._get')
            }
        }

        let transactions
        if (res && typeof res.data !== 'undefined' && res.data) {
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessor.getBalance loaded from ' + res.provider + ' ' + res.time)
            if (this._tokenAddress && typeof res.data.formattedTokens[this._tokenAddress] === 'undefined') {
                await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessor.getTransactions skipped token ' + this._tokenAddress + ' ' + address)
                return false
            }
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessor.getTransactions trezor unify started ' + address)
            transactions = await this._unifyTransactions(address, res.data.transactions, false, true, {})
            await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessor.getTransactions trezor finished ' + address)
        } else if (this._oklinkAPI) {
            let logTitle = this._settings.currencyCode + ' EthScannerProcessor.getTransactions oklink '
            transactions = await this._getFromOklink(address, this._oklinkAPI, logTitle, {})
        } else {
            if (!this._etherscanApiPath) {
                BlocksoftCryptoLog.err(this._settings.currencyCode + ' EthScannerProcessor.getTransactions no _etherscanApiPath')
            }
            let link = this._etherscanApiPath + '&address=' + address
            let logTitle = this._settings.currencyCode + ' EthScannerProcessor.getTransactions etherscan '
            transactions = await this._getFromEtherscan(address, link, logTitle, false, {})
            if (this._etherscanApiPathDeposits) {
                link = this._etherscanApiPathDeposits + '&address=' + address
                logTitle = this._settings.currencyCode + ' EthScannerProcessor.getTransactions etherscan deposits'
                transactions = await this._getFromEtherscan(address, link, logTitle, false, transactions)
            }

            if (this._useInternal && this._etherscanApiPathInternal) {
                link = this._etherscanApiPathInternal + '&address=' + address
                logTitle = this._settings.currencyCode + ' EthScannerProcessor.getTransactions etherscan forInternal'
                transactions = await this._getFromEtherscan(address, link, logTitle, true, transactions)
            }
        }
        if (!transactions) {
            return []
        }
        const reformatted = []
        for (const key in transactions) {
            reformatted.push(transactions[key])
        }
        return reformatted
    }

    async _getFromOklink(address, key, logTitle, transactions = {}) {
        const link = 'https://www.oklink.com/api/v5/explorer/address/transaction-list?chainShortName=ethw&address=' +  address
        const tmp = await BlocksoftAxios.getWithHeaders(link, {'Ok-Access-Key': key})
        if (typeof tmp?.data?.data === 'undefined' || typeof tmp?.data?.data[0] === 'undefined' || typeof tmp?.data?.data[0]?.transactionLists === 'undefined') {
            return []
        }
        await BlocksoftCryptoLog.log(logTitle + ' started ', link)
        const list = tmp.data.data[0].transactionLists
        for (const tx of list) {
            const transaction = await this._unifyTransactionOklink(address, tx)
            if (transaction) {
                transactions[transaction.transactionHash] = transaction
            }
        }
        await BlocksoftCryptoLog.log(logTitle + ' finished ' + address)
        return transactions
    }


    async _getFromEtherscan(address, link, logTitle, isInternal, transactions = {}) {

        await BlocksoftCryptoLog.log(logTitle + ' started ' + JSON.stringify(isInternal), link)
        const tmp = await BlocksoftAxios.getWithoutBraking(link)
        if (!tmp || typeof tmp.data === 'undefined' || !tmp.data || typeof tmp.data.result === 'undefined') {
            return transactions
        }
        if (typeof tmp.data.result === 'string') {
            if (tmp.data.result.indexOf('API Key') === -1) {
                throw new Error('Undefined txs etherscan ' + link + ' ' + tmp.data.result)
            } else {
                return transactions
            }
        }

        transactions = await this._unifyTransactions(address, tmp.data.result, isInternal, false, transactions)
        await BlocksoftCryptoLog.log(logTitle + ' finished ' + address)
        return transactions
    }


    /**
     * @param {string} txHash
     * @return {Promise<[UnifiedTransaction]>}
     */
    async getTransactionBlockchain(txHash) {
        await BlocksoftCryptoLog.log(this._settings.currencyCode + ' EthScannerProcessor.getTransaction started ' + txHash)


        this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, this._settings.currencyCode + ' ETH.Scanner.getTransaction')

        if (typeof this._trezorServer === 'undefined') {
            BlocksoftCryptoLog.err(this._settings.currencyCode + ' EthScannerProcessor.getTransaction empty trezorServer')
            throw new Error(this._settings.currencyCode + ' EthScannerProcessor.getTransaction empty trezorServer')
        }

        if (!this._trezorServer) {
            return false
        }

        let link = this._trezorServer + '/api/v2/tx-specific/' + txHash
        let res = await BlocksoftAxios.getWithoutBraking(link)

        if (!res || !res.data) {
            BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
            this._trezorServer = await BlocksoftExternalSettings.getTrezorServer(this._trezorServerCode, this._settings.currencyCode + ' ETH.Scanner._get')
            if (typeof this._trezorServer === 'undefined') {
                BlocksoftCryptoLog.err(this._settings.currencyCode + ' EthScannerProcessor._get empty trezorServer2')
                throw new Error(this._settings.currencyCode + ' EthScannerProcessor._get empty trezorServer2')
            }
            link = this._trezorServer + '/api/v2/tx-specific/' + txHash
            res = await BlocksoftAxios.getWithoutBraking(link)
            if (!res || !res.data) {
                BlocksoftExternalSettings.setTrezorServerInvalid(this._trezorServerCode, this._trezorServer)
                return false
            }
        }

        if (typeof res.data.tx === 'undefined') {
            return false
        }

        let tx
        if (typeof res.data.receipt === 'undefined') {
            tx = { ...{ status: 0x0 }, ...res.data.tx }
        } else {
            tx = { ...res.data.receipt, ...res.data.tx }
        }

        tx.nonce = BlocksoftUtils.hexToDecimal(tx.nonce)
        if (tx.nonce * 1 === 0) {
            tx.nonce = 0
        }
        tx.status = BlocksoftUtils.hexToDecimal(tx.status)
        tx.gas = BlocksoftUtils.hexToDecimal(tx.gas)
        tx.gasPrice = BlocksoftUtils.hexToDecimal(tx.gasPrice)
        tx.gasUsed = BlocksoftUtils.hexToDecimal(tx.gasUsed)
        return tx
    }


    /**
     * @param {string} address
     * @param {*} result[]
     * @param {boolean} isInternal
     * @returns {Promise<[{UnifiedTransaction}]>}
     * @private
     */
    async _unifyTransactions(_address, result, isInternal, isTrezor = false, transactions = {}) {
        if (!result) {
            return transactions
        }
        const address = _address.toLowerCase()
        let tx
        let maxNonce = -1
        let maxSuccessNonce = -1

        const notBroadcasted = await EthRawDS.getForAddress({ address, currencyCode: this._settings.currencyCode })
        for (tx of result) {
            try {

                let transaction
                const key = typeof tx.hash !== 'undefined' ? tx.hash : tx.txid
                if (typeof transactions[key] !== 'undefined') {
                    continue
                }
                if (isTrezor) {
                    transaction = await this._unifyTransactionTrezor(address, tx, isInternal)
                } else {
                    transaction = await this._unifyTransaction(address, tx, isInternal)
                }
                if (transaction) {
                    transactions[key] = transaction
                    if (
                        typeof transaction.transactionJson !== 'undefined'
                        && typeof transaction.transactionJson.feeType === 'undefined'
                        && (transaction.transactionDirection === 'outcome' || transaction.transactionDirection === 'self')
                        && typeof transaction.transactionJson.nonce !== 'undefined') {

                        const uniqueFrom = address.toLowerCase() + '_' + transaction.transactionJson.nonce
                        if (notBroadcasted && typeof notBroadcasted[uniqueFrom] !== 'undefined' && transaction.transactionStatus !== 'new') {
                            EthRawDS.cleanRaw({
                                address,
                                transactionUnique: uniqueFrom,
                                currencyCode: this._settings.currencyCode
                            })
                        }
                        if (transaction.transactionJson.nonce * 1 > maxNonce) {
                            maxNonce = transaction.transactionJson.nonce * 1
                        }
                        if ((transaction.transactionStatus === 'success' || transaction.transactionStatus === 'confirming')) {
                            if (transaction.transactionJson.nonce * 1 > maxSuccessNonce) {
                                maxSuccessNonce = transaction.transactionJson.nonce * 1
                            }
                        }
                    }
                }
            } catch (e) {
                BlocksoftCryptoLog.err(this._settings.currencyCode + ' EthScannerProcessor._unifyTransaction error ' + e.message + ' on ' + (isTrezor ? 'Trezor' : 'usual') + ' tx ' + JSON.stringify(tx))
            }
        }

        if (maxNonce > -1) {
            await EthTmpDS.saveNonce(this._mainCurrencyCode, address, 'maxScanned', maxNonce)
        }

        if (maxSuccessNonce > -1) {
            await EthTmpDS.saveNonce(this._mainCurrencyCode, address, 'maxSuccess', maxSuccessNonce)
        }

        return transactions
    }

    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.txid: "0xdbbce8ace9ecfa2bcd2a5ff54590a9f3b9c445c1111f1b9404ec33ef2314a864"
     * @param {string} transaction.vin[].addresses[]
     * @param {string} transaction.vin[].isAddress
     * @param {string} transaction.vout[].addresses[]
     * @param {string} transaction.vout[].isAddress
     * @param {string} transaction.blockHash: "0xf31e629dea39a96da1ff977fc991552c5f131c4b544a87fbea0533e985ce7e69"
     * @param {string} transaction.blockHeight: 9409918
     * @param {string} transaction.confirmations: 78610
     * @param {string} transaction.blockTime: 1580737403
     * @param {string} transaction.value: "12559200000000000"
     * @param {string} transaction.fees: "69854400000000"
     * @param {string} transaction.ethereumSpecific.status 1
     * @param {string} transaction.ethereumSpecific.nonce 42458
     * @param {string} transaction.ethereumSpecific.gasLimit 150000
     * @param {string} transaction.ethereumSpecific.gasUsed 21000
     * @param {string} transaction.ethereumSpecific.gasPrice "3326400000"
     * @param {array} transaction.tokenTransfers
     * @param {string} transaction.tokenTransfers[].type "ERC20"
     * @param {string} transaction.tokenTransfers[].from "0x8b661361be29e688dda65b323526ad536c8b3997"
     * @param {string} transaction.tokenTransfers[].to "0xa00ed7686c380740fe2adb141136c217b90c5ca5"
     * @param {string} transaction.tokenTransfers[].token "0xdac17f958d2ee523a2206206994597c13d831ec7"
     * @param {string} transaction.tokenTransfers[].name "Tether USD"
     * @param {string} transaction.tokenTransfers[].symbol "USDT"
     * @param {string} transaction.tokenTransfers[].decimals 6
     * @param {string} transaction.tokenTransfers[].value "1000000"
     * @private
     */
    async _unifyTransactionTrezor(_address, transaction, isInternal = false) {
        let fromAddress = ''
        const address = _address.toLowerCase()
        if (typeof transaction.vin[0] !== 'undefined' && transaction.vin[0].addresses && typeof transaction.vin[0].addresses[0] !== 'undefined') {
            fromAddress = transaction.vin[0].addresses[0].toLowerCase()
        }
        let toAddress = ''
        if (typeof transaction.vout[0] !== 'undefined' && transaction.vout[0].addresses && typeof transaction.vout[0].addresses[0] !== 'undefined') {
            toAddress = transaction.vout[0].addresses[0].toLowerCase()
        }
        let amount = transaction.value

        let nonce = transaction.ethereumSpecific.nonce
        if (nonce * 1 === 0) {
            nonce = 0
        }
        const additional = {
            nonce,
            gas: transaction.ethereumSpecific.gasLimit || '',
            gasPrice: transaction.ethereumSpecific.gasPrice || '',
            gasUsed: transaction.ethereumSpecific.gasUsed || ''
        }
        let fee = transaction.fees || 0
        let feeCurrencyCode = this._mainCurrencyCode

        if (this._tokenAddress) {
            let failToken = false
            if (typeof transaction.tokenTransfers === 'undefined') {
                if (this._tokenAddress === toAddress) {
                    failToken = true
                } else {
                    return false
                }
            }
            if (!failToken) {
                let tmp
                let found = false
                amount = new BlocksoftBN(0)
                for (tmp of transaction.tokenTransfers) {
                    try {
                        let token = typeof tmp.token !== 'undefined' ? tmp.token : tmp.contract
                        if (token) {
                            token = token.toLowerCase()
                        }
                        if (token !== this._tokenAddress.toLowerCase()) {
                            continue
                        }

                        tmp.from = tmp.from.toLowerCase()
                        tmp.to = tmp.to.toLowerCase()
                        if (tmp.to !== address && tmp.from !== address) {
                            continue
                        }
                        if (tmp.to === address) {
                            fromAddress = tmp.from
                            amount.add(tmp.value)
                        } else if (tmp.from === address) {
                            if (this._delegateAddress && tmp.to.toLowerCase() === this._delegateAddress.toLowerCase()) {
                                fee = tmp.value
                                additional.feeType = 'DELEGATE'
                                feeCurrencyCode = this._settings.currencyCode || 'DELEGATE'
                            } else {
                                toAddress = tmp.to
                                amount.diff(tmp.value)
                            }
                        }
                        found = true

                    } catch (e) {
                        if (config.debug.cryptoErrors) {
                            console.log(this._settings.currencyCode + ' EthScannerProcessor._unifyTransactionTrezor ' + e.message + ' while tokenTransfers ', tmp)
                        }
                        throw new Error(e.message + ' while tokenTransfers check')
                    }
                }
                amount = amount.get()
                if (amount < 0) {
                    amount = -1 * amount
                    fromAddress = address
                } else {
                    toAddress = address
                }
                if (!found) {
                    return false
                }
            }
        }

        if (typeof transaction.blockTime === 'undefined') {
            throw new Error(' no transaction.blockTime error transaction data ' + JSON.stringify(transaction))
        }
        let formattedTime = transaction.blockTime
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.blockTime)
        } catch (e) {
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }

        let blockHash = false
        const confirmations = transaction.confirmations
        try {
            CACHE_BLOCK_NUMBER_TO_HASH[this._mainCurrencyCode][transaction.blockHeight] = transaction.blockHash
            if (typeof transaction.blockHash !== 'undefined') {
                blockHash = transaction.blockHash
            }
            if (confirmations > 0 && transaction.blockHeight > CACHE_GET_MAX_BLOCK[this._mainCurrencyCode].max_block_number) {
                CACHE_GET_MAX_BLOCK[this._mainCurrencyCode].max_block_number = transaction.blockHeight
                CACHE_GET_MAX_BLOCK[this._mainCurrencyCode].confirmations = confirmations
            }
        } catch (e) {
            throw new Error(e.message + ' in  CACHE_GET_MAX_BLOCK ' + this._mainCurrencyCode )
        }
        let transactionStatus = 'new'

        if (blockHash) {
            if (transaction.ethereumSpecific.status === 1) {
                if (confirmations > this._blocksToConfirm) {
                    transactionStatus = 'success'
                } else if (confirmations > 0) {
                    transactionStatus = 'confirming'
                }
            } else {
                transactionStatus = 'fail'
            }
        }

        const tx = {
            transactionHash: transaction.txid.toLowerCase(),
            blockHash: blockHash || '',
            blockNumber: +transaction.blockHeight,
            blockTime: formattedTime,
            blockConfirmations: confirmations,
            transactionDirection: (address.toLowerCase() === fromAddress.toLowerCase()) ? 'outcome' : 'income',
            addressFrom: address.toLowerCase() === fromAddress.toLowerCase() ? '' : fromAddress,
            addressTo: address.toLowerCase() === toAddress.toLowerCase() ? '' : toAddress,
            addressFromBasic: fromAddress.toLowerCase(),
            addressAmount: amount,
            transactionStatus: transactionStatus,
            transactionFee: fee,
            transactionFeeCurrencyCode: feeCurrencyCode,
            contractAddress: '',
            inputValue: ''
        }
        if (tx.addressFrom === '' && tx.addressTo === '') {
            tx.transactionDirection = 'self'
            // self zero will not shown if uncomment! tx.addressAmount = 0
        }
        if (additional) {
            tx.transactionJson = additional
        }
        return tx
    }

    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.amount 0.001852572296633876
     * @param {string} transaction.blockHash 0x3661deb1c783baed6b1917a1f58ad460ad9cbaac5977919cfd75019e6a12363a
     * @param {string} transaction.challengeStatus
     * @param {string} transaction.from 0xf1cff704c6e6ce459e3e1544a9533cccbdad7b99
     * @param {string} transaction.height 5495990
     * @param {string} transaction.isFromContract false
     * @param {string} transaction.isToContract false
     * @param {string} transaction.l1OriginHash ''
     * @param {string} transaction.methodId ''
     * @param {string} transaction.state success
     * @param {string} transaction.to 0xf1cff704c6e6ce459e3e1544a9533cccbdad7b99
     * @param {string} transaction.tokenContractAddress ''
     * @param {string} transaction.tokenId ''
     * @param {string} transaction.transactionSymbol ETHW
     * @param {string} transaction.transactionTime 1662632042000
     * @param {string} transaction.txFee 0.000231
     * @param {string} transaction.txId 0x3cc404044f96f07bee0af9717d49ce72dba645c5bb5af4846be84dafa68127b1
     * @return {UnifiedTransaction}
     * @protected
     */
    async _unifyTransactionOklink(_address, transaction) {
        if (typeof transaction.transactionTime === 'undefined') {
            throw new Error(' no transaction.timeStamp error transaction data ' + JSON.stringify(transaction))
        }

        const address = _address.toLowerCase()
        const formattedTime = transaction.transactionTime

        let transactionStatus = 'new'
        let confirmations = 0
        if (transaction.state === 'success') {
            const diff = new Date().getTime() - transaction.transactionTime
            confirmations = Math.round(diff / 60000)
            if (confirmations > 120) {
                transactionStatus = 'success'
            } else {
                transactionStatus = 'confirming'
            }
        } else if (transaction.state === 'fail') {
            transactionStatus = 'fail'
        } else if (transaction.state === 'pending') {
            transactionStatus = 'confirming'
        }

        const tx = {
            transactionHash: transaction.txId.toLowerCase() + '_1',
            blockHash: transaction.blockHash,
            blockNumber: +transaction.height,
            blockTime: formattedTime,
            blockConfirmations: confirmations,
            transactionDirection: (address.toLowerCase() === transaction.from.toLowerCase()) ? 'outcome' : 'income',
            addressFrom: (address.toLowerCase() === transaction.from.toLowerCase()) ? '' : transaction.from,
            addressFromBasic: transaction.from.toLowerCase(),
            addressTo: (address.toLowerCase() === transaction.to.toLowerCase()) ? '' : transaction.to,
            addressAmount : BlocksoftPrettyNumbers.setCurrencyCode('ETH').makeUnPretty(transaction.amount),
            transactionStatus: transactionStatus,
            contractAddress : '',
            inputValue: '',
            transactionFee: BlocksoftPrettyNumbers.setCurrencyCode('ETH').makeUnPretty(transaction.txFee)
        }
        if (tx.addressFrom === '' && tx.addressTo === '') {
            tx.transactionDirection = 'self'
            tx.addressAmount = 0
        }
        return tx
    }

    /**
     * @param {string} address
     * @param {Object} transaction
     * @param {string} transaction.blockNumber 4673230
     * @param {string} transaction.timeStamp 1512376529
     * @param {string} transaction.hash
     * @param {string} transaction.nonce
     * @param {string} transaction.blockHash
     * @param {string} transaction.transactionIndex
     * @param {string} transaction.from
     * @param {string} transaction.to
     * @param {string} transaction.value
     * @param {string} transaction.gas
     * @param {string} transaction.gasPrice
     * @param {string} transaction.isError
     * @param {string} transaction.txreceipt_status
     * @param {string} transaction.input
     * @param {string} transaction.type
     * @param {string} transaction.contractAddress
     * @param {string} transaction.cumulativeGasUsed
     * @param {string} transaction.gasUsed
     * @param {string} transaction.confirmations
     * @param {boolean} isInternal
     * @return {UnifiedTransaction}
     * @protected
     */
    async _unifyTransaction(_address, transaction, isInternal = false) {
        if (typeof transaction.timeStamp === 'undefined') {
            throw new Error(' no transaction.timeStamp error transaction data ' + JSON.stringify(transaction))
        }

        const address = _address.toLowerCase()
        let formattedTime = transaction.timeStamp
        try {
            formattedTime = BlocksoftUtils.toDate(transaction.timeStamp)
        } catch (e) {
            console.log('no timestamp2')
            e.message += ' timestamp error transaction data ' + JSON.stringify(transaction)
            throw e
        }

        let addressAmount = transaction.value
        if (typeof transaction.L1TxOrigin !== 'undefined') {
            if (transaction.from === '0x0000000000000000000000000000000000000000') {
                transaction.from = 'ETH: ' + transaction.L1TxOrigin
            }
            CACHE_BLOCK_NUMBER_TO_HASH[transaction.blockNumber] = transaction.blockHash
            addressAmount = transaction.tokenValue
            transaction.confirmations = 100
        } else if (isInternal) {
            if (transaction.contractAddress !== '') {
                return false
            }
            if (transaction.type !== 'call') {
                return false
            }

            if (typeof CACHE_BLOCK_NUMBER_TO_HASH[this._mainCurrencyCode][transaction.blockNumber] === 'undefined') {
                const data = await this._web3.eth.getTransaction(transaction.hash)
                CACHE_BLOCK_NUMBER_TO_HASH[this._mainCurrencyCode][transaction.blockNumber] = data?.blockHash
            }
            transaction.blockHash = CACHE_BLOCK_NUMBER_TO_HASH[this._mainCurrencyCode][transaction.blockNumber] || transaction.blockNumber
            // noinspection PointlessArithmeticExpressionJS
            transaction.confirmations = CACHE_GET_MAX_BLOCK[this._mainCurrencyCode].max_block_number - transaction.blockNumber + 1 * CACHE_GET_MAX_BLOCK[this._mainCurrencyCode].confirmations
        } else {
            CACHE_BLOCK_NUMBER_TO_HASH[transaction.blockNumber] = transaction.blockHash
        }

        const confirmations = transaction.confirmations
        if (confirmations > 0 && transaction.blockNumber > CACHE_GET_MAX_BLOCK[this._mainCurrencyCode].max_block_number) {
            CACHE_GET_MAX_BLOCK[this._mainCurrencyCode].max_block_number = transaction.blockNumber
            CACHE_GET_MAX_BLOCK[this._mainCurrencyCode].confirmations = confirmations
        }
        let transactionStatus = 'new'
        if (typeof transaction.txreceipt_status === 'undefined' || transaction.txreceipt_status === '1') {
            if (confirmations > this._blocksToConfirm) {
                transactionStatus = 'success'
            } else if (confirmations > 0) {
                transactionStatus = 'confirming'
            }
        } else if (transaction.isError !== '0') {
            transactionStatus = 'fail'
        }
        // if (isInternal) {
        //    transactionStatus = 'internal_' + transactionStatus
        // }
        let contractAddress = false
        if (typeof transaction.contractAddress !== 'undefined') {
            contractAddress = transaction.contractAddress.toLowerCase()
        }
        const tx = {
            transactionHash: transaction.hash.toLowerCase(),
            blockHash: transaction.blockHash,
            blockNumber: +transaction.blockNumber,
            blockTime: formattedTime,
            blockConfirmations: confirmations,
            transactionDirection: (address.toLowerCase() === transaction.from.toLowerCase()) ? 'outcome' : 'income',
            addressFrom: (address.toLowerCase() === transaction.from.toLowerCase()) ? '' : transaction.from,
            addressFromBasic: transaction.from.toLowerCase(),
            addressTo: (address.toLowerCase() === transaction.to.toLowerCase()) ? '' : transaction.to,
            addressAmount,
            transactionStatus: transactionStatus,
            contractAddress,
            inputValue: transaction.input
        }
        let nonce = transaction.nonce
        if (nonce * 1 === 0) {
            nonce = 0
        }
        if (!isInternal) {
            const additional = {
                nonce,
                gas: transaction.gas,
                gasPrice: transaction.gasPrice,
                cumulativeGasUsed: transaction.cumulativeGasUsed,
                gasUsed: transaction.gasUsed,
                transactionIndex: transaction.transactionIndex
            }
            tx.transactionJson = additional
            tx.transactionFee = BlocksoftUtils.mul(transaction.gasUsed, transaction.gasPrice).toString()
        }
        if (tx.addressFrom === '' && tx.addressTo === '') {
            tx.transactionDirection = 'self'
            tx.addressAmount = 0
        }
        return tx
    }
}
