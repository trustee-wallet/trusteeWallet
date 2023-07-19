/**
 * @version 0.52
 * @author yura
 */

import Log from '@app/services/Log/Log'
import { strings } from '@app/services/i18n'

import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'
import TronUtils from '@crypto/blockchains/trx/ext/TronUtils'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import SolStakeUtils from '@crypto/blockchains/sol/ext/SolStakeUtils'

import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import { SendActionsEnd } from '@app/appstores/Stores/Send/SendActionsEnd'
import { SendActionsStart } from '@app/appstores/Stores/Send/SendActionsStart'

import config from '@app/config/config'

import TransactionFilterTypeDict from '@appV2/dicts/transactionFilterTypeDict'
import TronStakeUtils from '@crypto/blockchains/trx/ext/TronStakeUtils'
import BlocksoftTransactions from '@crypto/actions/BlocksoftTransactions/BlocksoftTransactions'
import TrxTrongridProvider from '@crypto/blockchains/trx/basic/TrxTrongridProvider'

export async function handleTrxScan() {
    const { account } = this.props

    const address = account.address
    Log.log('AccountStaking.helper.handleTrxScan scan started', address)

    const balance = await TronStakeUtils.getPrettyBalance(address)
    try {
        const limits = await (BlocksoftBalances.setCurrencyCode('TRX').setAddress(address).getResources('AccountStakingTrx'))
        const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
        const tmp = await BlocksoftAxios.postWithoutBraking(sendLink + '/wallet/getReward', { address })
        if (typeof tmp.data === 'undefined' || typeof tmp.data.reward === 'undefined') {
            Log.log('AccountStaking.helper.handleTrxScan noReward', tmp)
        } else if (balance) {
            Log.log('AccountStaking.helper.handleTrxScan balance', balance)

            this.setState({
                loading: false
            })

            const reward = tmp.data.reward
            const prettyReward = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(reward)
            this.setState({
                currentLimits: limits,
                currentBalance: balance,
                currentReward: reward,
                prettyReward,
                currentBalanceChecked: true,
                lastScanTime: Date.now()
            })
        } else {
            Log.log('AccountStaking.helper.handleTrxScan noBalance', balance)
        }

        this.setState({
            loading: false
        })

    } catch (e) {
        if (config.debug.appErrors) {
            console.log('AccountStaking.helper.handleTrxScan error ' + e.message)
        }
        Log.log('AccountStaking.helper.handleTrxScan error ' + e.message)

        this.setState({
            loading: false
        })
    }

    return balance
}

// https://developers.tron.network/reference#walletvotewitnessaccount
// https://developers.tron.network/reference#walletfreezebalance-1
// only freeze can have amount actually
export async function handleFreezeV2Trx(isAll, type) {
    const { account } = this.props
    const { currentBalanceChecked, currentBalance } = this.state
    let actualBalance = currentBalance
    if (currentBalanceChecked === false) {
        actualBalance = await handleTrxScan.call(this)
    }
    setLoaderStatus(true)

    const address = account.address
    let freeze = actualBalance.balance

    try {

        if (!isAll) {
            if (typeof this.stakeAmountInput.state === 'undefined' || this.stakeAmountInput.state.value === '' || this.stakeAmountInput.state.value * 1 <= 0) {
                this.setState({
                    addressError: true,
                    addressErrorText: strings('send.notValidAmount')
                })
                setLoaderStatus(false)
                return {
                    status: 'fail'
                }
            }

            const inputValidate = await this.stakeAmountInput.handleValidate()
            if (inputValidate.status !== 'success') {
                throw new Error('invalid custom freeze value')
            }
            freeze = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makeUnPretty(inputValidate.value)
        }

        await _sendTxTrx.call(this, '/wallet/freezebalancev2', {
            owner_address: TronUtils.addressToHex(address),
            frozen_balance: freeze * 1,
            resource: type
        }, 'freeze ' + freeze + ' for ' + type + ' of ' + address, { type: 'freeze', cryptoValue: freeze * 1, version: 2 })

        this.stakeAmountInput.handleInput('', false, true)
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('AccountStaking.helper.handleFreezeV2Trx error ', e)
        }
        Log.log('AccountStaking.helper.handleFreezeV2Trx error ' + e.message)
        _wrapError(e)
    }

    setLoaderStatus(false)

}

export async function handleUnFreezeV2Trx(isAll, type) {
    const { account } = this.props
    setLoaderStatus(true)
    const address = account.address
    let freeze = 0

    try {

        if (!isAll) {
            if (typeof this.stakeAmountInput.state === 'undefined' || this.stakeAmountInput.state.value === '' || this.stakeAmountInput.state.value * 1 <= 0) {
                this.setState({
                    addressError: true,
                    addressErrorText: strings('send.notValidAmount')
                })
                setLoaderStatus(false)
                return {
                    status: 'fail'
                }
            }

            const inputValidate = await this.stakeAmountInput.handleValidate()
            if (inputValidate.status !== 'success') {
                throw new Error('invalid custom freeze value')
            }
            freeze = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makeUnPretty(inputValidate.value)
        } else {
            throw new Error('TODO')
        }

        const hexAddress = TronUtils.addressToHex(address)
        await _sendTxTrx.call(this, '/wallet/unfreezebalancev2', {
            owner_address: hexAddress,
            unfreeze_balance: freeze * 1,
            resource: type
        }, 'unfreeze ' + freeze + ' for ' + type + ' of ' + address, { type: 'unfreeze', cryptoValue: freeze * 1, version: 2 })

        this.stakeAmountInput.handleInput('', false, true)
        const tmp = new TrxTrongridProvider()
        tmp.setStaked(hexAddress, type, freeze * 1)
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('AccountStaking.helper.handleUnFreezeV2Trx error ', e)
        }
        Log.log('AccountStaking.helper.handleUnFreezeV2Trx error ' + e.message)
        _wrapError(e)
    }

    setLoaderStatus(false)

}

export async function handleUnFreezeV1Trx(isAll, type) {

    const { account } = this.props
    const { currentBalanceChecked, currentBalance } = this.state
    let actualBalance = currentBalance
    if (currentBalanceChecked === false) {
        actualBalance = await handleTrxScan.call(this)
    }
    setLoaderStatus(true)

    type = type.toUpperCase()
    const address = account.address
    const unFreeze = type === 'ENERGY' ? actualBalance.frozenEnergy : actualBalance.frozen
    try {
        await _sendTxTrx.call(this, '/wallet/unfreezebalance', {
            owner_address: TronUtils.addressToHex(address),
            resource: type
        }, 'unfreeze for ' + type + ' of ' + address, { type: 'unfreeze', cryptoValue: unFreeze })
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('AccountStaking.helper.handleUnFreezeV1Trx error ', e)
        }
        Log.log('AccountStaking.helper.handleUnFreezeV1Trx error ' + e.message)
        _wrapError(e)
    }
    setLoaderStatus(false)
}

export async function handleWithdrawV2Trx(isAll, type) {
    Log.log('AccountStaking.helper.handleWithdrawV2Trx start')

    const { account } = this.props
    setLoaderStatus(true)
    const address = account.address
    try {
        await _sendTxTrx.call(this, '/wallet/withdrawexpireunfreeze', {
            owner_address: TronUtils.addressToHex(address)
        }, 'withdraw of ' + address, { type: 'withdraw', version: 2 })
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('AccountStaking.helper.handleWithdrawV2Trx error ', e)
        }
        Log.log('AccountStaking.helper.handleWithdrawV2Trx error ' + e.message)
        _wrapError(e)
    }
    setLoaderStatus(false)
}

export async function handleVoteTrx() {
    const { account } = this.props
    const { currentBalanceChecked, currentBalance } = this.state
    let actualBalance = currentBalance
    if (currentBalanceChecked === false) {
        actualBalance = await handleTrxScan.call(this)
    }
    setLoaderStatus(true)

    const address = account.address
    const prettyVote = actualBalance.prettyVote
    try {
        const voteAddress = BlocksoftExternalSettings.getStatic('TRX_VOTE_BEST')
        await _sendTxTrx.call(this, '/wallet/votewitnessaccount', {
            owner_address: TronUtils.addressToHex(address),
            votes: [
                {
                    vote_address: TronUtils.addressToHex(voteAddress),
                    vote_count: prettyVote * 1
                }
            ]
        }, 'vote ' + prettyVote + ' for ' + voteAddress, { type: 'vote', cryptoValue: BlocksoftPrettyNumbers.setCurrencyCode('TRX').makeUnPretty(prettyVote * 1) })
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('AccountStaking.helper.handleVoteTrx error ', e)
        }
        Log.log('AccountStaking.helper.handleVoteTrx error ' + e.message)
        _wrapError(e)
    }
    setLoaderStatus(false)
}

export function handlePartBalance(newPartBalance, availableBalance=false) {

    const { balance, currencyCode } = this.props.account

    const { currentBalance } = this.state

    const transferAllBalance = availableBalance || (currencyCode === 'SOL' ? balance - 3 * BlocksoftExternalSettings.getStatic('SOL_PRICE') : currentBalance.balanceAvailable)

    Log.log('AccountStaking.helper.Input.handlePartBalance ' + newPartBalance + ' clicked' + ' currencyCode ' + currencyCode)
    this.setState({
        partBalance: newPartBalance
    }, async () => {
        let cryptoValue
        if (this.state.partBalance === 4) {
            cryptoValue = transferAllBalance
        } else {
            cryptoValue = BlocksoftUtils.mul(BlocksoftUtils.div(transferAllBalance, 4), this.state.partBalance)
        }
        const pretty = BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(cryptoValue)
        Log.log('AccountStaking.helper.Input.handlePartBalance ' + newPartBalance + ' end counting ' + cryptoValue + ' => ' + pretty + currencyCode)

        this.stakeAmountInput.handleInput(pretty)
    })
}

export async function handleGetRewardTrx() {
    const { account } = this.props

    const { currentReward } = this.state

    setLoaderStatus(true)

    const address = account.address

    try {
        await _sendTxTrx.call(this, '/wallet/withdrawbalance', {
            owner_address: TronUtils.addressToHex(address)
        }, 'withdrawbalance to ' + address, { type: 'claim', cryptoValue: currentReward })
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('AccountStaking.helper.handleGetRewardTrx error ', e)
        }
        Log.log('AccountStaking.helper.handleGetRewardTrx error ' + e.message)
        _wrapError(e)
    }
    setLoaderStatus(false)
}

async function _sendTxTrx(shortLink, params, langMsg, uiParams) {

    const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
    const link = sendLink + shortLink
    const tmp = await BlocksoftAxios.post(link, params)
    let blockchainData

    const hiddenModalRes = uiParams?.hiddenModal || false

    if (typeof tmp.data !== 'undefined') {
        if (typeof tmp.data.raw_data_hex !== 'undefined') {
            blockchainData = tmp.data
        } else {
            Log.log('AccountStaking.helper._sendTxTrx no rawHex ' + link, params, tmp.data)
            throw new Error(JSON.stringify(tmp.data))
        }
    } else {
        Log.log('AccountStaking.helper._sendTxTrx no rawHex empty data ' + link, params)
        throw new Error('Empty data')
    }

    const { account, selectedWallet } = this.props

    // @todo => TrxStakeUtils._send

    const txData = {
        currencyCode: 'TRX',
        walletHash: selectedWallet.walletHash,
        derivationPath: account.derivationPath,
        addressFrom: account.address,
        addressTo: '',
        blockchainData
    }

    const result = await BlocksoftTransfer.sendTx(txData, { selectedFee: { langMsg } })
    if (result) {
        if (!hiddenModalRes) {
            _wrapSuccess(uiParams.type, uiParams?.version)
        }
        handleTrxScan.call(this)

        if (!(uiParams.type === 'freeze' || uiParams.type === 'unfreeze' || uiParams.type === 'vote' || uiParams.type === 'claim')) {
            // actual here is all but for any case
            if (config.debug.appErrors) {
                console.log('AccountStaking.helper._sendTxTrx unknown uiParams.type ' + uiParams.type + ' val ' + uiParams.cryptoValue)
            }
            return false
        }
        await (BlocksoftTransactions.resetTransactionsPending({
            account: { currencyCode: 'TRX', address : account.address},
            specialActionNeeded: uiParams.type
        }, 'AccountStaking.helper._sendTxTrx'))


        // here is some added to data from sender as tx is preformatted
        result.transactionDirection = uiParams.type

        const data = await SendActionsStart.getAccountFormatData({ currencyCode: txData.currencyCode })

        data.ui = {
            addressTo: '',
            cryptoValue: uiParams.cryptoValue,
            bse: false,
            tbk: false,
            contractCallData: false,
            transactionFilterType: TransactionFilterTypeDict.STAKE
        }
        if (uiParams.type === 'freeze') {
            data.ui.specialActionNeeded = 'vote'
        } else if (uiParams.type === 'unfreeze') {
            data.ui.specialActionNeeded = 'vote_after_unfreeze'
        }

        data.fromBlockchain = {
            countedFees: {},
            selectedFee: {},
            neverCounted: false
        }

        if (uiParams.type !== 'vote') {
            await SendActionsEnd.saveTx(result, data)
        }

    } else {
        throw new Error('no transaction')
    }
}

const _wrapError = (e) => {
    let msg = e.toString()
    Log.log('AccountStaking.helper._wrapError ' + msg)
    if (msg.indexOf('SERVER_RESPONSE_') !== -1) {
        msg = strings('send.errors.' + e.message)
    } else if (msg.indexOf('less than 24 hours') !== -1) {
        msg = strings('settings.walletList.waitToClaimTRX')
    } else if (msg.indexOf('not time to unfreeze') !== -1 || msg.indexOf('no unFreeze balance to withdraw') !== -1) {
        msg = strings('settings.walletList.waitToUnfreezeTRX', {'TRX_STAKE_DAYS' : BlocksoftExternalSettings.getStatic('TRX_STAKE_DAYS')})
    } else if (msg.indexOf('frozenBalance must be more') !== -1) {
        msg = strings('settings.walletList.minimalFreezeBalanceTRX')
    }
    showModal({
        type: 'INFO_MODAL',
        icon: null,
        title: strings('modal.exchange.sorry'),
        description: msg
    })
    handleTrxScan.call(this)
}

const _wrapSuccess = (type, version) => {
    let msg = 'success'
    if (type === 'unfreeze') {
        if (version === 2) {
            msg = strings('settings.walletList.successUnfreezeV2', {'TRX_STAKE_DAYS' : BlocksoftExternalSettings.getStatic('TRX_STAKE_DAYS')})
        } else {
            msg = strings('settings.walletList.successUnfreeze')
        }        
    } else if (type === 'freeze') {
        msg = strings('settings.walletList.successFreeze')
    } else if (type === 'claim') {
        msg = strings('settings.walletList.successReward')
    } else if (type === 'vote') {
        msg = strings('settings.walletList.successVote')
    } else if (type === 'withdraw') {
        msg = strings('settings.walletList.successWithdraw')
    }

    showModal({
        type: 'INFO_MODAL',
        icon: true,
        title: strings('modal.send.success'),
        description: msg
    })
}

export async function handleSolScan(force = false) {
    const { account } = this.props
    const { address, balance } = account
    this.setState({
        stakedAddresses: [],
        voteAddresses: [],
        load: true
    }, async () => {

        const selectedVoteAddress = await settingsActions.getSetting('SOL_validator')

        let voteAddresses = []
        let stakedAddresses = []
        let rewards = false
        try {
            voteAddresses = await SolStakeUtils.getVoteAddresses()
        } catch (e) {
            Log.log('SolStakeUtils.getVoteAddresses error ' + e.message)
        }


        try {
            stakedAddresses = await SolStakeUtils.getAccountStaked(address, force)
        } catch (e) {
            Log.og('SolStakeUtils.getAccountStaked error ' + e.message)
        }

        try {
            rewards = await SolStakeUtils.getAccountRewards(address, stakedAddresses)
        } catch (e) {
            Log.log('SolStakeUtils.getAccountRewards error ' + e.message)
        }

        const newData = {
            stakedAddresses,
            voteAddresses,
            rewards,
            load: false
        }

        /*
        try {
            const transferAllBalance = await BlocksoftTransfer.getTransferAllBalance({amount : balance, currencyCode: 'SOL', addressFrom: address })
            newData.transferAllBalance = transferAllBalance
        } catch (e) {
            Log.err('SettingsSOL.handleScan getTransferAllBalance error ' + e.message)
            // nothing
        }
        */

        if (selectedVoteAddress) {
            newData.selectedVoteAddress = JSON.parse(selectedVoteAddress)
        } else if (voteAddresses && voteAddresses.length > 0) {
            newData.selectedVoteAddress = voteAddresses[0]
        } else {
            newData.selectedVoteAddress = {
                address: BlocksoftExternalSettings.getStatic('SOL_VOTE_BEST'),
                commission: false,
                activatedStake: false,
                name: false,
                description: '',
                website: ''
            }
        }

        this.setState(newData)
    })
}

export async function handleSolStake() {
    setLoaderStatus(true)

    const { account, solValidator } = this.props

    try {

        const inputValidate = await this.stakeAmountInput.handleValidate()
        if (inputValidate.status !== 'success') {
            throw new Error('invalid custom stake value')
        }
        const prettyStake = inputValidate.value
        const stake = BlocksoftPrettyNumbers.setCurrencyCode('SOL').makeUnPretty(prettyStake)

        let voteAddress = solValidator?.address ? solValidator.address : this.state.selectedVoteAddress.address

        if (!voteAddress) {
            voteAddress = await settingsActions.getSetting('SOL_validator')
        }
        if (!voteAddress) {
            voteAddress = BlocksoftExternalSettings.getStatic('SOL_VOTE_BEST')
        }


        const txData = {
            currencyCode: 'SOL',
            amount: stake,
            walletHash: account.walletHash,
            derivationPath: account.derivationPath,
            addressFrom: account.address,
            addressTo: 'STAKE',
            blockchainData: {
                voteAddress
            }
        }
        const result = await BlocksoftTransfer.sendTx(txData, { uiErrorConfirmed: true })
        if (result) {
            showModal({
                type: 'INFO_MODAL',
                icon: true,
                title: strings('modal.send.success'),
                description: result.transactionHash
            })
            const lastTransactions = this.state.lastTransactions
            lastTransactions.push({ transactionHash: result.transactionHash, type: 'STAKE', amount: prettyStake })
            this.setState({ lastTransactions })
            this.stakeAmountInput.handleInput('', false)
        }
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('AccountStaking.helper.handleSolStake error ', e)
        }
        const msg = e.message.indexOf('SERVER_RESPONSE_') === -1 ? e.message : strings('send.errors.' + e.message)
        showModal({
            type: 'INFO_MODAL',
            icon: null,
            title: strings('modal.exchange.sorry'),
            description: msg
        })
    }
    setLoaderStatus(false)
}
