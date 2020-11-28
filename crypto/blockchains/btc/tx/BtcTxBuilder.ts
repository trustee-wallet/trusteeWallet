/**
 * @version 0.20
 */
import { BlocksoftBlockchainTypes } from '../../BlocksoftBlockchainTypes'
import DogeTxBuilder from '../../doge/tx/DogeTxBuilder'
import BlocksoftPrivateKeysUtils from '../../../common/BlocksoftPrivateKeysUtils'
import { ECPair, payments, TransactionBuilder } from 'bitcoinjs-lib'

export default class BtcTxBuilder extends DogeTxBuilder implements BlocksoftBlockchainTypes.TxBuilder {
    private mnemonic: string = ''
    private walletHash : string = ''
    private keyPairBTC : any = {}
    private p2wpkhBTC: any = {}
    private p2shBTC: any ={}


    _getRawTxValidateKeyPair(privateData: BlocksoftBlockchainTypes.TransferPrivateData, data: BlocksoftBlockchainTypes.TransferData): void {
        if (this.mnemonic === privateData.privateKey) return

        this.mnemonic = privateData.privateKey
        this.walletHash = data.walletHash
        this.keyPairBTC = {}
        this.p2wpkhBTC = {}
        this.p2shBTC = {}
    }

    async _getRawTxAddInput(txb: TransactionBuilder, i: number, input: BlocksoftBlockchainTypes.UnspentTx, nSequence: number): Promise<void> {
        if (typeof input.address === 'undefined') {
            throw new Error('no address in input ' + JSON.stringify(input))
        }

        // @ts-ignore
        if (typeof this.keyPairBTC[input.address] === 'undefined') {
            let currencyCode = 'BTC'
            if (input.address.indexOf('bc1') === 0) {
                currencyCode += '_SEGWIT'
                if (!input.derivationPath || input.derivationPath === "false") {
                    input.derivationPath = `m/89'/0'/0'/0/0`
                }
            } else if (input.address.indexOf('3') === 0) {
                currencyCode += '_SEGWIT_COMPATIBLE'
                if (!input.derivationPath || input.derivationPath === "false") {
                    input.derivationPath = `m/49'/0'/0'/0/1`
                }
            } else if (!input.derivationPath || input.derivationPath === "false") {
                input.derivationPath = `m/44'/0'/0'/0/0`
            }
            const discoverFor = {
                mnemonic: this.mnemonic,
                addressToCheck: input.address,
                walletHash: this.walletHash,
                derivationPath: input.derivationPath,
                currencyCode
            }
            const result = await BlocksoftPrivateKeysUtils.getPrivateKey(discoverFor, 'BtcTxBuilder')

            try {
                this.keyPairBTC[input.address] = ECPair.fromWIF(result.privateKey, this._bitcoinNetwork)
                let address
                if (currencyCode === 'BTC_SEGWIT') {
                    try {
                        this.p2wpkhBTC[input.address] = payments.p2wpkh({
                            pubkey: this.keyPairBTC[input.address].publicKey,
                            network: this._bitcoinNetwork
                        })
                    } catch (e) {
                        e.message += ' in privateKey Segwit signature create'
                        // noinspection ExceptionCaughtLocallyJS
                        throw e
                    }

                    if (typeof this.p2wpkhBTC[input.address].address === 'undefined') {
                        // noinspection ExceptionCaughtLocallyJS
                        throw new Error('not valid segwit p2sh')
                    }
                    address = this.p2wpkhBTC[input.address].address
                } else if (currencyCode === 'BTC_SEGWIT_COMPATIBLE') {
                    try {
                        this.p2wpkhBTC[input.address] = payments.p2wpkh({
                            pubkey: this.keyPairBTC[input.address].publicKey,
                            network: this._bitcoinNetwork
                        })
                        this.p2shBTC[input.address] = payments.p2sh({
                            redeem: this.p2wpkhBTC[input.address],
                            network: this._bitcoinNetwork
                        })
                    } catch (e) {
                        e.message += ' in privateKey SegwitCompatible signature create'
                        // noinspection ExceptionCaughtLocallyJS
                        throw e
                    }
                    if (typeof this.p2shBTC[input.address].address === 'undefined') {
                        // noinspection ExceptionCaughtLocallyJS
                        throw new Error('not valid segwit compatible p2sh')
                    }
                    address = this.p2shBTC[input.address].address
                } else {
                    address = payments.p2pkh({
                        pubkey: this.keyPairBTC[input.address].publicKey,
                        network: this._bitcoinNetwork
                    }).address
                }

                if (address !== input.address) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('not valid signing address ' + input.address + ' != ' + address + ' segwit type = ' + currencyCode)
                }
            } catch (e) {
                e.message += ' in privateKey BTC signature check '
                throw e
            }
        }

        if (typeof this.p2wpkhBTC[input.address] === 'undefined') {
            txb.addInput(input.txid, input.vout, nSequence)
        } else if (typeof this.p2shBTC[input.address] === 'undefined') {
            txb.addInput(input.txid, input.vout, nSequence, this.p2wpkhBTC[input.address].output)
        } else {
            txb.addInput(input.txid, input.vout, nSequence)
        }
    }

    async _getRawTxSign(txb: TransactionBuilder, i: number, input: BlocksoftBlockchainTypes.UnspentTx): Promise<void> {
        if (typeof input.address === 'undefined') {
            throw new Error('no address in input ' + JSON.stringify(input))
        }
        if (typeof this.p2wpkhBTC[input.address] === 'undefined') {
            txb.sign(i, this.keyPairBTC[input.address], null, null, input.value * 1)
        } else if (typeof this.p2shBTC[input.address] === 'undefined') {
            txb.sign(i, this.keyPairBTC[input.address], null, null, input.value * 1)
        } else {
            txb.sign(i, this.keyPairBTC[input.address], this.p2shBTC[input.address].redeem.output, null, input.value * 1)
        }
    }
}
