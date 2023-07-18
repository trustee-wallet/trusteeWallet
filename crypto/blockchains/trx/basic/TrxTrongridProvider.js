/**
 * @version 0.5
 * https://github.com/tronscan/tronscan-frontend/wiki/TRONSCAN-API
 */
import BlocksoftCryptoLog from '../../../common/BlocksoftCryptoLog'
import BlocksoftAxios from '../../../common/BlocksoftAxios'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import TronUtils from '@crypto/blockchains/trx/ext/TronUtils'

const BALANCE_MAX_TRY = 10

const CACHE_TRONGRID = {}
const CACHE_VALID_TIME = 3000 // 3 seconds

export default class TrxTrongridProvider {

    async isMultisigTrongrid(address) {
        if (typeof CACHE_TRONGRID[address] !== 'undefined') {
            return CACHE_TRONGRID[address].isMultisig
        }
        const res = await this.get(address, '_', true)
        return res?.isMultisig || false
    }

    setStaked(address, type, minus) {
        if (typeof CACHE_TRONGRID[address] === 'undefined') {
            return false
        }
        if (type === 'ENERGY') {
            CACHE_TRONGRID[address]._frozenEnergy = CACHE_TRONGRID[address]._frozenEnergy - minus
        } else {
            CACHE_TRONGRID[address]._frozen = CACHE_TRONGRID[address]._frozen - minus
        }
    }
    /**
     * https://api.trongrid.io/walletsolidity/getaccount?address=41d4eead2ea047881ce54cae1a765dfe92a8bfdbe9
     * @param {string} address
     * @param {string} tokenName
     * @returns {Promise<boolean|{unconfirmed: number, frozen: *, frozenEnergy:*, voteTotal: *, balance: *, provider: string}>}
     */
    async get(address, tokenName, useCache = true) {
        const now = new Date().getTime()
        if (useCache && typeof CACHE_TRONGRID[address] !== 'undefined' && (now - CACHE_TRONGRID[address].time) < CACHE_VALID_TIME) {
            if (typeof CACHE_TRONGRID[address][tokenName] !== 'undefined') {
                BlocksoftCryptoLog.log('TrxTrongridProvider.get from cache', address + ' => ' + tokenName + ' : ' + CACHE_TRONGRID[address][tokenName])
                const voteTotal = typeof CACHE_TRONGRID[address].voteTotal !== 'undefined' ? CACHE_TRONGRID[address].voteTotal : 0
                const frozen = typeof CACHE_TRONGRID[address][tokenName + 'frozen'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozen'] : 0
                const unfrozen = typeof CACHE_TRONGRID[address][tokenName + 'frozen'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'unfrozen'] : 0
                const frozenExpireTime = typeof CACHE_TRONGRID[address][tokenName + 'frozenExpireTime'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenExpireTime'] : 0
                const frozenOthers = typeof CACHE_TRONGRID[address][tokenName + 'frozenOthers'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenOthers'] : 0
                const frozenEnergy = typeof CACHE_TRONGRID[address][tokenName + 'frozenEnergy'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenEnergy'] : 0
                const unfrozenEnergy = typeof CACHE_TRONGRID[address][tokenName + 'unfrozenEnergy'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'unfrozenEnergy'] : 0
                const frozenEnergyExpireTime = typeof CACHE_TRONGRID[address][tokenName + 'frozenEnergyExpireTime'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenEnergyExpireTime'] : 0
                const frozenEnergyOthers = typeof CACHE_TRONGRID[address][tokenName + 'frozenEnergyOthers'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenEnergyOthers'] : 0
                const frozenOld = typeof CACHE_TRONGRID[address][tokenName + 'frozenOld'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenOld'] : 0
                const frozenOldEnergy = typeof CACHE_TRONGRID[address][tokenName + 'frozenOldEnergy'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenOldEnergy'] : 0
                return {
                    isMultisig: CACHE_TRONGRID[address].isMultisig,
                    balance: CACHE_TRONGRID[address][tokenName],
                    voteTotal,
                    frozen,
                    unfrozen,
                    unfrozenArray: CACHE_TRONGRID[address]._unfrozenArray,
                    frozenExpireTime,
                    frozenOthers,
                    frozenEnergy,
                    unfrozenEnergy,
                    unfrozenEnergyArray: CACHE_TRONGRID[address]._unfrozenEnergyArray,
                    frozenEnergyExpireTime,
                    frozenEnergyOthers,
                    frozenOld,
                    frozenOldEnergy,
                    unconfirmed: 0,
                    provider: 'trongrid-cache',
                    time: CACHE_TRONGRID[address].time,
                    latestOperation: typeof CACHE_TRONGRID[address][tokenName + 'latestOperation'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'latestOperation'] : 0
                }
            } else if (tokenName !== '_') {
                return false
                // return { balance: 0, unconfirmed : 0, provider: 'trongrid-cache' }
            }
        }

        // curl -X POST  http://trx.trusteeglobal.com:8091/walletsolidity/getassetissuebyname -d
        const nodeLink = BlocksoftExternalSettings.getStatic('TRX_SOLIDITY_NODE')
        const link = nodeLink + '/walletsolidity/getaccount'
        const params = { address }
        BlocksoftCryptoLog.log('TrxTrongridProvider.get ' + link + ' ' + JSON.stringify(params))
        const res = await BlocksoftAxios.postWithoutBraking(link, params, BALANCE_MAX_TRY)
        if (!res || !res.data) {
            return false
        }

        let isMultisig = false
        if (res.data.active_permission) {
            for (const perm of res.data.active_permission) {
                if (perm.keys[0].address !== address) {
                    isMultisig = TronUtils.addressHexToStr(perm.keys[0].address)
                }
            }
        }



        CACHE_TRONGRID[address] = {}
        CACHE_TRONGRID[address].time = now
        CACHE_TRONGRID[address]._ = typeof res.data.balance !== 'undefined' ? res.data.balance : 0
        CACHE_TRONGRID[address].isMultisig = isMultisig
        CACHE_TRONGRID[address]._frozen = 0
        CACHE_TRONGRID[address]._frozenExpireTime = 0
        CACHE_TRONGRID[address]._unfrozen = 0
        CACHE_TRONGRID[address]._frozenOthers = typeof res?.data?.delegated_frozen_balance_for_bandwidth !== 'undefined' ? res.data.delegated_frozen_balance_for_bandwidth : 0
        CACHE_TRONGRID[address]._frozenEnergy = 0
        CACHE_TRONGRID[address]._frozenEnergyExpireTime = 0
        CACHE_TRONGRID[address]._unfrozenEnergy = 0
        CACHE_TRONGRID[address]._frozenEnergyOthers = typeof res?.data?.account_resource?.delegated_frozen_balance_for_energy !== 'undefined' ? res.data.account_resource.delegated_frozen_balance_for_energy : 0
        CACHE_TRONGRID[address].voteTotal = typeof res.data.votes !== 'undefined' && typeof res.data.votes[0] !== 'undefined' ? res.data.votes[0].vote_count : 0


        CACHE_TRONGRID[address]._frozenOld = typeof res.data.frozen !== 'undefined' && typeof res.data.frozen[0] !== 'undefined' ? res.data.frozen[0].frozen_balance : 0
        CACHE_TRONGRID[address]._frozenOldEnergy = typeof res.data.account_resource !== 'undefined'
        && typeof res.data.account_resource.frozen_balance_for_energy !== 'undefined'
        && typeof res.data.account_resource.frozen_balance_for_energy.frozen_balance !== 'undefined'
            ? res.data.account_resource.frozen_balance_for_energy.frozen_balance : 0

        CACHE_TRONGRID[address]._unfrozenEnergyArray = []
        CACHE_TRONGRID[address]._unfrozenArray = []
        if (res.data?.unfrozenV2) {
            for (const tmp of res.data.unfrozenV2) {
                if (tmp?.type === 'ENERGY') {
                    if (CACHE_TRONGRID[address]._frozenEnergyExpireTime < tmp.unfreeze_expire_time) {
                        CACHE_TRONGRID[address]._frozenEnergyExpireTime = tmp.unfreeze_expire_time
                    }
                    CACHE_TRONGRID[address]._unfrozenEnergy += tmp.unfreeze_amount * 1
                    CACHE_TRONGRID[address]._unfrozenEnergyArray.push(tmp)
                } else {
                    if (CACHE_TRONGRID[address]._frozenExpireTime < tmp.unfreeze_expire_time) {
                        CACHE_TRONGRID[address]._frozenExpireTime = tmp.unfreeze_expire_time
                    }
                    CACHE_TRONGRID[address]._unfrozen += tmp.unfreeze_amount * 1
                    CACHE_TRONGRID[address]._unfrozenArray.push(tmp)
                }
            }
        }
        const unfrozen = typeof CACHE_TRONGRID[address][tokenName + 'unfrozen'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'unfrozen'] : 0
        const unfrozenEnergy = typeof CACHE_TRONGRID[address][tokenName + 'unfrozenEnergy'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'unfrozenEnergy'] : 0
        if (res.data.frozenV2) {
            BlocksoftCryptoLog.log('TrxTrongridProvider.get ' + address + ' frozenV2 ' + JSON.stringify(res.data.frozenV2))
            let amount = 0
            let amountEnergy = 0
            let hasEnergy = false
            let lastEnergy = false
            for (const tmp of res.data.frozenV2) {
                if (tmp.type === 'ENERGY') {
                    if (typeof tmp.amount !== 'undefined') {
                        amountEnergy = tmp.amount
                    }
                    hasEnergy = true
                    lastEnergy = true
                } else if (tmp.type === 'TRON_POWER') {
                    if (typeof tmp.amount !== 'undefined') {
                        amount = tmp.amount
                    }
                    lastEnergy = false
                } else if (typeof tmp.amount !== 'undefined') {
                    amount = tmp.amount
                }
            }
            if (amountEnergy) {
                CACHE_TRONGRID[address]._frozenEnergy = amountEnergy
                CACHE_TRONGRID[address]._frozen = amount
            } else if (amount) {
                if (hasEnergy && lastEnergy) {
                    CACHE_TRONGRID[address]._frozenEnergy = amount
                } else {
                    CACHE_TRONGRID[address]._frozen = amount
                }
            }
        }
        if (res.data.assetV2) {
            for (const token of res.data.assetV2) {
                CACHE_TRONGRID[address][token.key] = token.value
            }
        }

        const latestOperation = res.data?.latest_opration_time
        CACHE_TRONGRID[address][tokenName + 'latestOperation'] = latestOperation
        if (typeof CACHE_TRONGRID[address][tokenName] === 'undefined') {
            return false
            // return { balance: 0, unconfirmed : 0, provider: 'trongrid' }
        }

        const balance = CACHE_TRONGRID[address][tokenName]
        const frozen = typeof CACHE_TRONGRID[address][tokenName + 'frozen'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozen'] : 0
        const frozenExpireTime = typeof CACHE_TRONGRID[address][tokenName + 'frozenExpireTime'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenExpireTime'] : 0
        const frozenOthers = typeof CACHE_TRONGRID[address][tokenName + 'frozenOthers'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenOthers'] : 0
        const frozenEnergy = typeof CACHE_TRONGRID[address][tokenName + 'frozenEnergy'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenEnergy'] : 0
        const frozenEnergyExpireTime = typeof CACHE_TRONGRID[address][tokenName + 'frozenEnergyExpireTime'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenEnergyExpireTime'] : 0
        const frozenEnergyOthers = typeof CACHE_TRONGRID[address][tokenName + 'frozenEnergy'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenEnergyOthers'] : 0
        const voteTotal = typeof CACHE_TRONGRID[address].voteTotal !== 'undefined' ? CACHE_TRONGRID[address].voteTotal : 0
        const frozenOld = typeof CACHE_TRONGRID[address][tokenName + 'frozenOld'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenOld'] : 0
        const frozenOldEnergy = typeof CACHE_TRONGRID[address][tokenName + 'frozenOldEnergy'] !== 'undefined' ? CACHE_TRONGRID[address][tokenName + 'frozenOldEnergy'] : 0
        return {
            isMultisig: CACHE_TRONGRID[address].isMultisig,
            balance,
            voteTotal,
            frozen,
            unfrozen,
            unfrozenArray: CACHE_TRONGRID[address]._unfrozenArray,
            frozenExpireTime,
            frozenOthers,
            frozenEnergy,
            unfrozenEnergy,
            unfrozenEnergyArray : CACHE_TRONGRID[address]._unfrozenEnergyArray,
            frozenEnergyExpireTime,
            frozenEnergyOthers,
            frozenOld,
            frozenOldEnergy,
            unconfirmed: 0,
            provider: 'trongrid ' + nodeLink,
            latestOperation,
            time: CACHE_TRONGRID[address].time
        }
    }

    async getResources(address) {
        const sendLink = BlocksoftExternalSettings.getStatic('TRX_SEND_LINK')
        const link = sendLink + '/wallet/getaccountresource'
        let leftBand = false
        let totalBand = false
        let leftEnergy = false
        let totalEnergy = false
        try {
            const res = await BlocksoftAxios.post(link, { address })
            const tronData = res.data
            delete tronData.assetNetUsed
            delete tronData.assetNetLimit
            await BlocksoftCryptoLog.log('TrxTrongridProvider.assets result ' + link + ' from ' + address, tronData)
            totalBand = typeof tronData.freeNetLimit !== 'undefined' && tronData.freeNetLimit ? tronData.freeNetLimit : 0
            if (typeof tronData.NetLimit !== 'undefined' && tronData.NetLimit && tronData.NetLimit * 1 > 0) {
                totalBand = totalBand * 1 + tronData.NetLimit * 1
            }

            leftBand = totalBand
            if (typeof tronData.freeNetUsed !== 'undefined' && tronData.freeNetUsed) {
                leftBand = leftBand - tronData.freeNetUsed * 1
            }
            if (typeof tronData.NetUsed !== 'undefined' && tronData.NetUsed) {
                leftBand = leftBand - tronData.NetUsed * 1
            }

            totalEnergy = typeof tronData.EnergyLimit !== 'undefined' && tronData.EnergyLimit ? tronData.EnergyLimit : 0
            leftEnergy = totalEnergy
            if (typeof tronData.EnergyUsed !== 'undefined' && tronData.EnergyUsed) {
                leftEnergy = leftEnergy - tronData.EnergyUsed * 1
            }

        } catch (e) {

        }
        return {
            leftBand,
            totalBand,
            leftEnergy,
            totalEnergy
        }
    }
}
