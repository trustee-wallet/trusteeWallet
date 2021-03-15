/**
 * @version 0.41
 */
import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { connect } from 'react-redux'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import { strings } from '@app/services/i18n'

import CheckData from '@app/modules/Send/elements/CheckData'
import MinerFee from '@app/modules/Send/elements/MinerFee'

import CustomIcon from '@app/components/elements/CustomIcon'


import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'


class ReceiptData extends React.PureComponent {

    render() {
        const { colors, GRID_SIZE } = this.context
        const { currencyCode, currencySymbol, basicCurrencySymbol, basicCurrencyRate } = this.props.sendScreenStoreDict
        const { addressTo, memo, comment, isFioRequest, bse, addressName } = this.props.sendScreenStoreUi
        const { bseOrderId } = bse

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
        return <View>
            {typeof bseOrderId === 'undefined' || !bseOrderId ?
                <CheckData
                    name={strings('send.receiptScreen.rate', { currencyCode: currencySymbol })}
                    value={`${basicCurrencySymbol} ${BlocksoftPrettyNumbers.makeCut(basicCurrencyRate).separated}`}
                />
                : null
            }
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
                <CustomIcon name='shield' size={28} style={{ color: colors.sendScreen.amount }} />
                <Text style={{ ...styles.info, color: colors.sendScreen.amount }}>{strings('send.receiptScreen.trusteeInfo')}</Text>
            </View>
        </View>
    }
}

ReceiptData.contextType = ThemeContext

export default connect(null, {})(ReceiptData)

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
