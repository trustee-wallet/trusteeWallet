import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'
import TronUtils from '@crypto/blockchains/trx/ext/TronUtils'

import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import Log from '@app/services/Log/Log'
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import config from '@app/config/config'

const TronStakeUtils = {

    async getVoteAddresses() {
        return BlocksoftExternalSettings.getStatic('TRX_VOTE_BEST')
    },

    async getPrettyBalance(address) {
        let balance = false
        try {
            balance = await (BlocksoftBalances.setCurrencyCode('TRX').setAddress(address).getBalance('TronStakeUtils'))
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('TronStakeUtils.getPrettyBalance getBalance ' + address + ' ' + e.message)
            }
            BlocksoftCryptoLog.log('TronStakeUtils.getPrettyBalance getBalance ' + address + ' ' + e.message)
            throw e
        }
        if (!balance) {
            return false
        }

        try {
            balance.prettyBalanceAvailable = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.balanceAvailable)
            balance.prettyFrozen = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozen)
            balance.prettyFrozenOthers = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenOthers)
            balance.prettyFrozenEnergy = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenEnergy)
            balance.prettyFrozenEnergyOthers = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenEnergyOthers)
            balance.prettyFrozenOld = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenOld)
            balance.prettyFrozenOldEnergy = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenOldEnergy)
            balance.prettyVote = ( balance.prettyFrozenOld * 1 + balance.prettyFrozenOldEnergy * 1 + balance.prettyFrozen * 1 + balance.prettyFrozenOthers * 1 + balance.prettyFrozenEnergy * 1 + balance.prettyFrozenEnergyOthers * 1).toString().split('.')[0]
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('TronStakeUtils.getPrettyBalance makePretty1 ' + address + ' ' + e.message)
            }
            BlocksoftCryptoLog.log('TronStakeUtils.getPrettyBalance makePretty1 ' + address + ' ' + e.message)
            throw e
        }

        try {
            balance.prettyUnFrozen = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance?.unfrozen)
            balance.prettyUnFrozenEnergy = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance?.unfrozenEnergy)
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('TronStakeUtils.getPrettyBalance makePretty2 ' + address + ' ' + e.message)
            }
            BlocksoftCryptoLog.log('TronStakeUtils.getPrettyBalance makePretty2 ' + address + ' ' + e.message)
            throw e
        }

        const latestOperation = balance.latestOperation
        const now = new Date().getTime()
        balance.diffLastStakeMinutes = (now - latestOperation) / 60000
        return balance
    },

    async sendVoteAll(address, derivationPath, walletHash, specialActionNeeded, confirmations) {

        const { prettyVote, diffLastStakeMinutes, voteTotal } = await TronStakeUtils.getPrettyBalance(address)
        if (confirmations < 100) {
            if (diffLastStakeMinutes === -1 && specialActionNeeded === 'vote_after_unfreeze') {
                BlocksoftCryptoLog.log('TronStake.sendVoteAll ' + address + ' continue confirmations ' + confirmations + ' by ' + diffLastStakeMinutes)
            } else if (!diffLastStakeMinutes || diffLastStakeMinutes < 3) {
                BlocksoftCryptoLog.log('TronStake.sendVoteAll ' + address + ' skipped vote1 confirmations ' + confirmations + ' by ' + diffLastStakeMinutes)
                return false
            }
        }
        if (!prettyVote || typeof prettyVote === 'undefined') {
            BlocksoftCryptoLog.log('TronStake.sendVoteAll ' + address + ' skipped vote2 confirmations ' + confirmations)
            return false
        } else if (voteTotal * 1 === prettyVote * 1) {
            if (diffLastStakeMinutes > 100) {
                BlocksoftCryptoLog.log('TronStake.sendVoteAll ' + address + ' skipped vote3 confirmations ' + confirmations + ' votes ' + voteTotal + ' by ' + diffLastStakeMinutes)
                return true // all done
            }
            BlocksoftCryptoLog.log('TronStake.sendVoteAll ' + address + ' skipped vote4 confirmations ' + confirmations + ' votes ' + voteTotal)
            return false
        }

        BlocksoftCryptoLog.log('TronStake.sendVoteAll ' + address + ' started vote confirmations ' + confirmations + '  votes ' + prettyVote + ' by ' + diffLastStakeMinutes)

        const voteAddress = await TronStakeUtils.getVoteAddresses()
        return TronStakeUtils._send('/wallet/votewitnessaccount', {
            owner_address: TronUtils.addressToHex(address),
            votes: [
                {
                    vote_address: TronUtils.addressToHex(voteAddress),
                    vote_count: prettyVote * 1
                }
            ]
        }, 'vote ' + prettyVote + ' for ' + voteAddress, {
            walletHash,
            address,
            derivationPath,
            type: 'vote',
            cryptoValue: BlocksoftPrettyNumbers.setCurrencyCode('TRX').makeUnPretty(prettyVote * 1),
            callback: () => {
            }
        })
    },

    async _send(shortLink, params, langMsg, uiParams) {

        const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
        const link = sendLink + shortLink
        const tmp = await BlocksoftAxios.post(link, params)
        let blockchainData

        if (typeof tmp.data !== 'undefined') {
            if (typeof tmp.data.raw_data_hex !== 'undefined') {
                blockchainData = tmp.data
            } else {
                Log.log('TronStakeUtils._send no rawHex ' + link, params, tmp.data)
                throw new Error(JSON.stringify(tmp.data))
            }
        } else {
            Log.log('TronStakeUtils rawHex empty data ' + link, params)
            throw new Error('Empty data')
        }

        const txData = {
            currencyCode: 'TRX',
            walletHash: uiParams.walletHash,
            derivationPath: uiParams.derivationPath,
            addressFrom: uiParams.address,
            addressTo: '',
            blockchainData
        }

        const result = await BlocksoftTransfer.sendTx(txData, { selectedFee: { langMsg } })
        return result

    }
}

export default TronStakeUtils
