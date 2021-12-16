import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftBalances from '@crypto/actions/BlocksoftBalances/BlocksoftBalances'
import TronUtils from '@crypto/blockchains/trx/ext/TronUtils'

import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import Log from '@app/services/Log/Log'
import { BlocksoftTransfer } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransfer'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'

const TronStakeUtils = {

    async getVoteAddresses() {
        return BlocksoftExternalSettings.getStatic('TRX_VOTE_BEST')
    },

    async getPrettyBalance(address) {
        const balance = await (BlocksoftBalances.setCurrencyCode('TRX').setAddress(address).getBalance('TronStakeUtils'))
        if (!balance) {
            return false
        }
        balance.prettyBalanceAvailable = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.balanceAvailable)
        balance.prettyFrozen = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozen)
        balance.prettyFrozenOthers = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenOthers)
        balance.prettyFrozenEnergy = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenEnergy)
        balance.prettyFrozenEnergyOthers = BlocksoftPrettyNumbers.setCurrencyCode('TRX').makePretty(balance.frozenEnergyOthers)
        balance.prettyVote = (balance.prettyFrozen * 1 + balance.prettyFrozenOthers * 1 + balance.prettyFrozenEnergy * 1 + balance.prettyFrozenEnergyOthers * 1).toString().split('.')[0]



        console.log(`expire time ${balance.frozenEnergyExpireTime} ${balance.frozenExpireTime}`)
        const maxExpire = balance.frozenEnergyExpireTime && balance.frozenEnergyExpireTime > balance.frozenExpireTime ?
            balance.frozenEnergyExpireTime : balance.frozenExpireTime
        if (maxExpire > 0) {
            balance.diffLastStakeMinutes = 24 * 3 * 60 - (maxExpire - new Date().getTime()) / 60000 // default time = 3 days, so thats how many minutes from last stake
        } else {
            balance.diffLastStakeMinutes = -1
        }
        return balance
    },

    async sendVoteAll(address, derivationPath, walletHash, specialActionNeeded) {

        const { prettyVote, diffLastStakeMinutes, voteTotal } = await TronStakeUtils.getPrettyBalance(address)
        if (diffLastStakeMinutes === -1 && specialActionNeeded === 'vote_after_unfreeze') {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' TronStake.sendVoteAll ' + address + ' continue ' + diffLastStakeMinutes)
        } else if (!diffLastStakeMinutes || diffLastStakeMinutes < 3) {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' TronStake.sendVoteAll ' + address + ' skipped vote1 by ' + diffLastStakeMinutes)
            return false
        }
        if (!prettyVote || typeof prettyVote === 'undefined') {
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' TronStake.sendVoteAll ' + address + ' skipped vote2')
            return false
        } else if (voteTotal * 1 === prettyVote * 1) {
            if (diffLastStakeMinutes > 100) {
                BlocksoftCryptoLog.log(this._settings.currencyCode + ' TronStake.sendVoteAll ' + address + ' skipped vote3 ' + voteTotal + ' by ' + diffLastStakeMinutes)
                return true // all done
            }
            BlocksoftCryptoLog.log(this._settings.currencyCode + ' TronStake.sendVoteAll ' + address + ' skipped vote4 ' + voteTotal)
            return false
        }

        BlocksoftCryptoLog.log(this._settings.currencyCode + ' TronStake.sendVoteAll ' + address + ' started vote ' + prettyVote + ' by ' + diffLastStakeMinutes)

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
