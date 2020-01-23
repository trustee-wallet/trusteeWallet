import DogeTxInputsOutputs from '../../doge/tx/DogeTxInputsOutputs'

export default class XvgTxInputsOutputs extends DogeTxInputsOutputs {
    /**
     * @type {number}
     * @private
     */
    _minFee = 100000

    /**
     * @type {number}
     * @private
     */
    _minOutputToBeDusted = 1000000 // 1 xvg as xvg is actually 6 digits!!!!!

    /**
     * @type {number}
     * @private
     */
    _minChangeToUseAsFeePlus = 5000 // 0.005 xvg

    /**
     * @type {number}
     * @private
     */
    _minChangeThreshold = 5000 // 0.005 xvg
}
