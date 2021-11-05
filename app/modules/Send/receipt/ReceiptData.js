/**
 * @version 0.41
 */
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { strings } from '@app/services/i18n'

import CheckData from '@app/modules/Send/elements/CheckData'
import MinerFee from '@app/modules/Send/elements/MinerFee'

import CustomIcon from '@app/components/elements/CustomIcon'


import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'
import { showModal } from '@app/appstores/Stores/Modal/ModalActions'


class ReceiptData extends React.PureComponent {

    render() {
        const { colors, GRID_SIZE } = this.context
        const { currencyCode, currencySymbol, basicCurrencySymbol, basicCurrencyRate } = this.props.sendScreenStoreDict
        const { blockchainData }= this.props.sendScreenStoreSelectedFee
        const { addressTo, memo, comment, isFioRequest, bse, addressName, tbk, contractCallData } = this.props.sendScreenStoreUi
        const { bseOrderId } = bse
        const { transactionAction, transactionBoost } = tbk

        let memoTitle = strings('send.xrp_memo')
        if (currencyCode === 'XMR' || currencyCode === 'XLM') {
            memoTitle = strings('send.xmr_memo')
        } else if (currencyCode === 'BNB') {
            memoTitle = strings('send.bnb_memo')
        } else if (isFioRequest) {
            memoTitle = strings('send.fio_memo')
        }

        let multiAddress = []
        let multiShow = false
        if (typeof blockchainData !== 'undefined'
            && typeof blockchainData.preparedInputsOutputs !== 'undefined'
            && typeof blockchainData.preparedInputsOutputs.multiAddress !== 'undefined'
        ) {
            multiAddress = blockchainData.preparedInputsOutputs.multiAddress
            if (multiAddress.length > 1) {
                multiShow = true
            }
        }
        return <View>
            {(typeof bseOrderId === 'undefined' || !bseOrderId) && (typeof contractCallData === 'undefined' || !contractCallData) &&
                <CheckData
                    name={strings('send.receiptScreen.rate', { currencyCode: currencySymbol })}
                    value={`${basicCurrencySymbol} ${BlocksoftPrettyNumbers.makeCut(basicCurrencyRate).separated}`}
                />
            }
            {transactionAction === 'transactionReplaceByFee' ?
                <CheckData
                    name={strings('send.receiptScreen.replaceTransactionHash')}
                    value={BlocksoftPrettyStrings.makeCut(transactionBoost.transactionHash, 6)}
                />
                : null}
            {transactionAction === 'transactionRemoveByFee' ?
                <CheckData
                    name={strings('send.receiptScreen.removeTransactionHash')}
                    value={BlocksoftPrettyStrings.makeCut(transactionBoost.transactionHash, 6)}
                />
                : null}
            {transactionAction === 'transactionSpeedUp' ?
                <CheckData
                    name={strings('send.receiptScreen.speedUpTransactionHash')}
                    value={BlocksoftPrettyStrings.makeCut(transactionBoost.transactionHash, 6)}
                />
                : null}
            {typeof addressName !== 'undefined' && addressName && addressName !== '' ?
                <CheckData
                    name={strings('send.receiptScreen.recepient')}
                    value={BlocksoftPrettyStrings.makeCut(addressName, 6)}
                />
                : null}
            {multiShow ?
                multiAddress.map((item, index) => {
                    return (
                        <CheckData
                            key={index}
                            name={`${strings('send.receiptScreen.recepient')} ${index + 1}`}
                            value={BlocksoftPrettyStrings.makeCut(item, 6)}
                        />
                    )
                })
                :
                <CheckData
                    name={strings('send.receiptScreen.destinationAddress')}
                    value={BlocksoftPrettyStrings.makeCut(addressTo, 6)}
                />}
            {memo ?
                <CheckData
                    name={memoTitle}
                    value={memo}
                /> : null
            }

            <MinerFee
                sendScreenStoreDict={this.props.sendScreenStoreDict}
                sendScreenStoreSelectedFee={this.props.sendScreenStoreSelectedFee}
                callback={() => {
                    showModal({
                        type: 'INFO_MODAL',
                        icon: null,
                        title: strings('send.infoModal.title'),
                        description: strings('send.feeModal.description')
                    })
                }}

            />


            {
                typeof comment !== 'undefined' && comment ?
                <>
                    <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                        <View style={{ ...styles.line, borderBottomColor: colors.sendScreen.colorLine }} />
                    </View>

                    <View style={{ marginHorizontal: GRID_SIZE, marginTop: 24 }}>
                        <Text style={{ ...styles.name, color: colors.sendScreen.amount }}>{strings('send.setting.note')}</Text>
                        <Text style={{ ...styles.valueComment, color: colors.sendScreen.amount }}>{comment}</Text>
                    </View>
                </>
                : null
            }

            <View style={{ paddingHorizontal: GRID_SIZE, flexDirection: 'row', marginTop: 44 }}>
                <CustomIcon name='shield' size={28} style={{ color: colors.sendScreen.amount, alignSelf: 'center' }} />
                <Text style={{ ...styles.info, color: colors.sendScreen.amount }}>{strings('send.receiptScreen.trusteeInfo')}</Text>
            </View>
        </View>
    }
}

ReceiptData.contextType = ThemeContext

export default ReceiptData

const styles = StyleSheet.create({
    info: {
        paddingHorizontal: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        textAlign: 'left'
    },
    line: {
        borderBottomWidth: 1,
        height: 24,
        width: '70%'
    },
    name: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 0.5
    },
    valueComment: {
        fontFamily: 'SFUIDisplay-Bold',
        fontSize: 14,
        lineHeight: 14,
        letterSpacing: 1,
        marginTop: 1
    }
})
