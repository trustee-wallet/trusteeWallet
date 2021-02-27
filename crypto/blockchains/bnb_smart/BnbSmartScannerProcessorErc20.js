/**
 * @version 0.20
 */
import EthScannerProcessorErc20 from '../eth/EthScannerProcessorErc20'

export default class BnbSmartScannerProcessorErc20 extends EthScannerProcessorErc20 {
    constructor(settings) {
        super(settings)
        this._etherscanApiPath = `https://api.bscscan.com/api?module=account&action=tokentx&sort=desc&contractaddress=${settings.tokenAddress}&apikey=YourApiKeyToken`
    }
}
