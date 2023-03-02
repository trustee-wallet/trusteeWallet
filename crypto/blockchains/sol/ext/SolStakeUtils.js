/**
 * @version 0.52
 */
import BlocksoftAxios from '@crypto/common/BlocksoftAxios'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'

import config from '@app/config/config'
import BlocksoftCryptoLog from '@crypto/common/BlocksoftCryptoLog'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'
import SolUtils from '@crypto/blockchains/sol/ext/SolUtils'


const CACHE_STAKED = {}
const CACHE_VOTES = {
    data: [],
    time: 0
}
const CACHE_VALID_TIME = 12000000 // 200 minute

const validatorsConstants = require('@crypto/blockchains/sol/ext/validators')

const validators = {
    time: 0,
    data: {}
}
for (const tmp of validatorsConstants) {
    validators.data[tmp.id] = tmp
}


const init = async () => {
    const link = await BlocksoftExternalSettings.get('SOL_VALIDATORS_LIST')
    const res = await BlocksoftAxios.get(link)
    if (!res.data || typeof res.data[0] === 'undefined' || !res.data[0]) {
        return false
    }
    validators.data = {}
    for (const tmp of res.data) {
        if (typeof tmp.id === 'undefined') continue
        validators.data[tmp.id] = tmp
    }
    validators.time = new Date().getTime()
}

export default {


    // https://docs.solana.com/developing/clients/jsonrpc-api#getvoteaccounts
    async getVoteAddresses() {
        try {
            const now = new Date().getTime()
            if (CACHE_VOTES.time && now - CACHE_VOTES.time < CACHE_VALID_TIME) {
                return CACHE_VOTES.data
            }
            if (!validators.time) {
                await init()
            }

            const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
            const getVote = { 'jsonrpc': '2.0', 'id': 1, 'method': 'getVoteAccounts' }
            const resVote = await BlocksoftAxios._request(apiPath, 'POST', getVote)
            if (!resVote || typeof resVote.data === 'undefined' || typeof resVote.data.result === 'undefined' || !resVote.data.result || typeof resVote.data.result.current === 'undefined') {
                return CACHE_VOTES.data
            }
            CACHE_VOTES.data = []
            for (const tmp of resVote.data.result.current) {
                const address = tmp.votePubkey
                if (typeof validators.data[address] === 'undefined') continue

                const validator = { address, commission: tmp.commission, activatedStake: tmp.activatedStake, name: '', description: '', website: '', index : 100 }
                validator.index = typeof validators.data[validator.address].index !== 'undefined' ? validators.data[validator.address].index : 0
                validator.name = validators.data[validator.address].name
                validator.description = validators.data[validator.address].description
                validator.website = validators.data[validator.address].website

                CACHE_VOTES.data.push(validator)
            }
            CACHE_VOTES.data.sort((a, b) => {
                if (a.index*1 === b.index*1) {
                    const diff = a.commission - b.commission
                    if (diff <= 0.1 && diff >= -0.1) {
                        return b.activatedStake - a.activatedStake
                    }
                    return diff
                } else {
                    return b.index - a.index
                }
            })
            CACHE_VOTES.time = now
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SolStakeUtils.getVoteAddresses error ' + e.message)
            }
            BlocksoftCryptoLog.log('SolStakeUtils.getVoteAddresses  error ' + e.message)
        }
        return CACHE_VOTES.data
    },

    checkAccountStaked(address, subaddress) {
        return typeof CACHE_STAKED[address].all[subaddress] !== 'undefined'
    },

    setAccountStaked(address, subaddress) {
        CACHE_STAKED[address].all[subaddress] = true
    },

    // https://prod-api.solana.surf/v1/account/3siLSmroYvPHPZCrK5VYR3gmFhQFWefVGGpasXdzSPnn/stake-rewards
    async getAccountRewards(address, stakedAddresses) {
        if (typeof CACHE_STAKED[address] === 'undefined') {
            CACHE_STAKED[address] = {
                all: {},
                active: [],
                rewards: []
            }
        }
        const askAddresses = [ address ]
        if (stakedAddresses) {
            for(let tmp of stakedAddresses) {
                askAddresses.push(tmp.stakeAddress)
            }
        }
        try {
            const link =  BlocksoftExternalSettings.getStatic('SOL_SERVER')
            const data = {
                'method': 'getInflationReward',
                'jsonrpc': '2.0',
                'params': [
                    askAddresses,
                    {
                        'commitment': 'confirmed'
                    }
                ],
                'id': '1'
            }

            /*console.log(`


           curl ${link} -X POST -H "Content-Type: application/json" -d '${JSON.stringify(data)}'

            `)
             */

            const res = await BlocksoftAxios.post(link, data)
            if (res.data && typeof res.data.result !== 'undefined' && typeof res.data.result[0] !== 'undefined') {
                CACHE_STAKED[address].rewards = res.data.result[0]
                if (stakedAddresses) {
                    let count = 0
                    if (typeof CACHE_STAKED[address].rewards !== 'undefined') {
                        count = 100;
                    } else {
                        for(let tmp of res.data.result) {
                            if (tmp && typeof tmp.amount !== 'undefined' && tmp.amount * 1 > 0) {
                                CACHE_STAKED[address].rewards = tmp
                                count++
                            }
                        }
                    }
                    if (count > 1) {
                        if (typeof CACHE_STAKED[address].rewards !== 'undefined') {
                            CACHE_STAKED[address].rewards.amount = 0;
                        }
                        for (let tmp of res.data.result) {
                            if (tmp && typeof tmp.amount !== 'undefined' && tmp.amount * 1 > 0) {
                                CACHE_STAKED[address].rewards.amount += tmp.amount * 1
                            }
                        }
                    }
                }
            }
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SolStakeUtils.getAccountRewards ' + address + ' error ' + e.message)
            }
            BlocksoftCryptoLog.log('SolStakeUtils.getAccountRewards ' + address + ' error ' + e.message)
        }
        //{"amount": 96096, "apr": 7.044036109546499, "effectiveSlot": 99360012, "epoch": 229, "percentChange": 0.05205832165890872, "postBalance": 184689062, "timestamp": 1633153114},
        return CACHE_STAKED[address].rewards
    },

    // https://docs.solana.com/developing/clients/jsonrpc-api#getprogramaccounts
    async getAccountStaked(address, isForce = false) {
        let accountInfo = false
        if (typeof CACHE_STAKED[address] === 'undefined' || isForce) {
            CACHE_STAKED[address] = {
                all: {},
                active: [],
                rewards: []
            }
        }
        try {
            const apiPath = BlocksoftExternalSettings.getStatic('SOL_SERVER')
            const currentEpoch = await SolUtils.getEpoch()

            const checkData = {
                'jsonrpc': '2.0',
                'id': 1,
                'method': 'getProgramAccounts',
                'params': [
                    'Stake11111111111111111111111111111111111111',
                    {
                        'encoding': 'jsonParsed',
                        filters:
                            [{
                                memcmp: {
                                    offset: 0xc,
                                    bytes: address
                                }
                            }]
                    }
                ]
            }

            /*
            console.log(`


            curl ${apiPath} -X POST -H "Content-Type: application/json" -d '${JSON.stringify(checkData)}'

            `)
             */
            let res
            accountInfo = []
            try {
                res = await BlocksoftAxios._request(apiPath, 'POST', checkData)

                for (const tmp of res.data.result) {
                    const parsed = tmp.account.data.parsed
                    const item = { amount: tmp.account.lamports, stakeAddress: tmp.pubkey, reserved: 0, active: true, status: '' }
                    if (typeof parsed.info !== 'undefined') {
                        if (typeof parsed.info.meta !== 'undefined') {
                            if (typeof parsed.info.meta.rentExemptReserve !== 'undefined') {
                                item.reserved = parsed.info.meta.rentExemptReserve
                            }
                        }
                        const deactivationEpoch = parsed.info.stake.delegation.deactivationEpoch || 0
                        const activationEpoch = parsed.info.stake.delegation.activationEpoch || 0
                        if (currentEpoch && currentEpoch * 1 >= deactivationEpoch * 1) {
                            item.order = 1
                            item.active = false
                            item.status = 'inactive'
                        } else if (currentEpoch && currentEpoch === activationEpoch) {
                            item.order = 3
                            item.status = 'activating'
                        } else {
                            item.order = 2
                            item.status = 'staked'
                        }
                    }
                    item.diff = BlocksoftUtils.diff(item.amount, item.reserved).toString()
                    accountInfo.push(item)
                    CACHE_STAKED[address].all[item.stakeAddress] = true
                }

            } catch (e) {
                BlocksoftCryptoLog.log('SolStakeUtils getAccountStaked request ' + apiPath + ' error ' + e.message)

                const apiPath2 = 'https://prod-api.solana.surf/v1/account/' + address + '/stakes?limit=10&offset=0'
                const res2 = await BlocksoftAxios.get(apiPath2)

                for (const tmp of res2.data.data) {
                    const item = { amount: tmp.lamports, stakeAddress: tmp.pubkey.address, reserved: 0, active: true, status: '' }

                    if (typeof tmp.data !== 'undefined') {
                        if (typeof tmp.data.meta !== 'undefined') {
                            if (typeof tmp.data.meta.rent_exempt_reserve !== 'undefined') {
                                item.reserved = tmp.data.meta.rent_exempt_reserve
                            }
                        }
                        const deactivationEpoch = tmp.data.stake.delegation.deactivation_epoch || 0
                        const activationEpoch = tmp.data.stake.delegation.activation_epoch|| 0
                        if (currentEpoch && currentEpoch * 1 >= deactivationEpoch * 1) {
                            item.order = 1
                            item.active = false
                            item.status = 'inactive'
                        } else if (currentEpoch && currentEpoch === activationEpoch) {
                            item.order = 3
                            item.status = 'activating'
                        } else {
                            item.order = 2
                            item.status = 'staked'
                        }
                    }
                    item.diff = BlocksoftUtils.diff(item.amount, item.reserved).toString()
                    accountInfo.push(item)
                    CACHE_STAKED[address].all[item.stakeAddress] = true
                }
            }

            accountInfo.sort((a, b) => {
                if (b.order === a.order) {
                    return BlocksoftUtils.diff(b.diff, a.diff) * 1
                } else {
                    return b.order - a.order
                }
            })
            CACHE_STAKED[address].active = accountInfo
        } catch (e) {
            if (config.debug.cryptoErrors) {
                console.log('SolStakeUtils.getAccountStaked ' + address + ' error ' + e.message)
            }
            BlocksoftCryptoLog.log('SolStakeUtils.getAccountStaked ' + address + ' error ' + e.message)
            return CACHE_STAKED[address].active
        }
        return accountInfo
    }
}
