import Log from "@app/services/Log/Log"

import BlocksoftAxios from "@crypto/common/BlocksoftAxios"
import BlocksoftExternalSettings from "@crypto/common/BlocksoftExternalSettings"
import BlocksoftPrettyNumbers from "@crypto/common/BlocksoftPrettyNumbers"
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'
import TronUtils from "@crypto/blockchains/trx/ext/TronUtils"

import { setLoaderStatus } from "@app/appstores/Stores/Main/MainStoreActions"

import config from "@app/config/config"
import BlocksoftUtils from "@crypto/common/BlocksoftUtils"
import { BlocksoftTransfer } from "@crypto/actions/BlocksoftTransfer/BlocksoftTransfer"
import { showModal } from "@app/appstores/Stores/Modal/ModalActions"
import { strings } from "@app/services/i18n"
import settingsActions from "@app/appstores/Stores/Settings/SettingsActions"
import SolStakeUtils from "@crypto/blockchains/sol/ext/SolStakeUtils"

export async function handleTrxScan() {
    const { account } = this.props

    const address = account.address
    Log.log('AccountStaking.helper.handleTrxScan scan started', address)

    const balance = await (BlocksoftBalances.setCurrencyCode('TRX').setAddress(address).getBalance('AccountStakingTrx'))

    const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
    const tmp = await BlocksoftAxios.postWithoutBraking(sendLink + '/wallet/getReward', { address })
    if (typeof tmp.data === 'undefined' || typeof tmp.data.reward === 'undefined') {
        Log.log('AccountStaking.helper.handleTrxScan noReward', tmp)
    } else if (balance) {
        Log.log('AccountStaking.helper.handleTrxScan balance', balance)
        const reward = tmp.data.reward
        balance.prettyBalance = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.balance)
        balance.prettyFrozen = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozen)
        balance.prettyFrozenEnergy = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenEnergy)
        balance.prettyVote = (balance.prettyFrozen * 1 + balance.prettyFrozenEnergy * 1).toString().split('.')[0]

        const prettyReward = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(reward)
        this.setState({
            currentBalance: balance,
            currentReward: reward,
            prettyReward,
            currentBalanceChecked: true
        })
    } else {
        Log.log('AccountStaking.helper.handleTrxScan noBalance', balance)
    }

    return balance
}

// https://developers.tron.network/reference#walletvotewitnessaccount
// https://developers.tron.network/reference#walletfreezebalance-1
// only freeze can have amount actually
export async function handleFreezeTrx(isAll, type) {
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
            const inputValidate = await this.stakeAmountInput.handleValidate()
            if (inputValidate.status !== 'success') {
                throw new Error('invalid custom freeze value')
            }
            freeze = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makeUnPretty(inputValidate.value)
        }

        await _sendTxTrx.call(this, '/wallet/freezebalance', {
            owner_address: TronUtils.addressToHex(address),
            frozen_balance: freeze * 1,
            frozen_duration: 3,
            resource: type
        }, 'freeze ' + freeze + ' for ' + type + ' of ' + address)

        this.stakeAmountInput.handleInput('', false)
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('AccountStaking.helper.handleFreezeTrx error ', e)
        }
        _wrapError(e)
    }
    setLoaderStatus(false)
    await handleVoteTrx.call(this)
}

export async function handleUnFreezTrx(isAll, type) {

    const { account } = this.props

    type = type.toUpperCase()

    setLoaderStatus(true)

    const address = account.address

    try {
        await _sendTxTrx.call(this, '/wallet/unfreezebalance', {
            owner_address: TronUtils.addressToHex(address),
            resource: type
        }, 'unfreeze for ' + type + ' of ' + address)
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('AccountStaking.helper.handleUnFreezTrx error ', e)
        }
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

    try {
        const voteAddress = BlocksoftExternalSettings.getStatic('TRX_VOTE_BEST')
        await _sendTxTrx.call(this, '/wallet/votewitnessaccount', {
            owner_address: TronUtils.addressToHex(address),
            votes: [
                {
                    vote_address: TronUtils.addressToHex(voteAddress),
                    vote_count: actualBalance.prettyVote * 1
                }
            ]
        }, 'vote ' + actualBalance.prettyVote + ' for ' + voteAddress)
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('AccountStaking.helper.handleVoteTrx error ', e)
        }
        _wrapError(e)
    }
    setLoaderStatus(false)
}

export function handlePartBalance(newPartBalance) {
    const { balance, currencyCode } = this.props.account

    const transferAllBalance = currencyCode === 'SOL' ? balance - 3 * BlocksoftExternalSettings.getStatic('SOL_PRICE') : balance

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

    setLoaderStatus(true)

    const address = account.address

    try {
        await _sendTxTrx.call(this, '/wallet/withdrawbalance', {
            owner_address: TronUtils.addressToHex(address)
        }, 'withdrawbalance to ' + address)
    } catch (e) {
        if (config.debug.cryptoErrors) {
            console.log('AccountStaking.helper.handleGetRewardTrx error ', e)
        }
        _wrapError(e)
    }
    setLoaderStatus(false)
}

async function _sendTxTrx(shortLink, params, langMsg) {

    const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
    const link = sendLink + shortLink
    const tmp = await BlocksoftAxios.post(link, params)
    let blockchainData
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
        showModal({
            type: 'INFO_MODAL',
            icon: true,
            title: strings('modal.send.success'),
            description: result.transactionHash
        })
        handleTrxScan.call(this)
    } else {
        throw new Error('no transaction')
    }
}

const _wrapError = (e) => {
    let msg = e.toString()
    if (msg.indexOf('less than 24 hours') !== -1) {
        msg = strings('settings.walletList.waitToClaimTRX')
    } else if (msg.indexOf('not time to unfreeze') !== -1) {
        msg = strings('settings.walletList.waitToUnfreezeTRX')
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

export async function handleSolScan(force = false) {
    const { account } = this.props
    const { address, balance } = account
    this.setState({
        stakedAddresses: [],
        voteAddresses: [],
        load: true
    }, async () => {

        const selectedVoteAddress = await settingsActions.getSetting('SOL_validator')
        const voteAddresses = await SolStakeUtils.getVoteAddresses()
        const stakedAddresses = await SolStakeUtils.getAccountStaked(address, force)
        const rewards = await SolStakeUtils.getAccountRewards(address)
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