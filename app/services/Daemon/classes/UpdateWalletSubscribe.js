import Update from './Update'
import Log from '../../Log/Log'
import DBInterface from '../../../appstores/DataSource/DB/DBInterface'
import BlocksoftKeysStorage from '../../../../crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import MarketingEvent from '../../Marketing/MarketingEvent'
import BlocksoftKeysForSubscribe from '../../../../crypto/actions/BlocksoftKeysForSubscribe/BlocksoftKeysForSubscribe'

const CACHE_UPDATING = {}
class UpdateWalletSubscribe extends Update {


    constructor(props) {
        super(props)
        this.updateFunction = this.updateWalletSubscribe
    }

    updateWalletSubscribe = async () => {
        if (typeof MarketingEvent.DATA.LOG_TOKEN === 'undefined' || !MarketingEvent.DATA.LOG_TOKEN) return false

        const dbInterface = new DBInterface()
        let res = await dbInterface.setQueryString(`SELECT wallet_hash FROM wallet WHERE wallet_is_subscribed IS NULL OR wallet_is_subscribed<2 LIMIT 1`).query()
        if (!res.array.length) {
            return false;
        }
        for (let wallet of res.array) {
            if (typeof (CACHE_UPDATING[wallet.wallet_hash]) !== 'undefined') continue
            CACHE_UPDATING[wallet.wallet_hash] = 1
            Log.daemon('UpdateWalletSubscribe wallet ' + wallet.wallet_hash + ' started')
            let mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(wallet.wallet_hash)
            let result = await BlocksoftKeysForSubscribe.discoverAndSend({
                mnemonic,
                coin : 'btc',
                type : MarketingEvent.DATA.LOG_PLATFORM.indexOf('ios') === -1 ? 'android' : 'ios',
                token : MarketingEvent.DATA.LOG_TOKEN
            })
            if (result && typeof result.ok !== 'undefined' && result.ok === 1) {
                Log.daemon('UpdateWalletSubscribe wallet ' + wallet.wallet_hash + ' success ' + JSON.stringify(result))
                await dbInterface.setQueryString(`UPDATE wallet SET wallet_is_subscribed=2, wallet_is_subscribed_json='${dbInterface.escapeString(JSON.stringify(result))}' WHERE wallet_hash='${wallet.wallet_hash}'`).query()
            } else {
                Log.errDaemon('UpdateWalletSubscribe wallet ' + wallet.wallet_hash + ' error ' + JSON.stringify(result))
            }
        }
    }

}

export default new UpdateWalletSubscribe
