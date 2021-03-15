/**
 * @version 0.41
 */
import React from 'react'
import { View } from 'react-native'
import { connect } from 'react-redux'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import { strings } from '@app/services/i18n'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

import SubSetting from '@app/components/elements/new/list/ListItem/SubSetting'
import { feesTitles } from '@app/modules/Send/advanced/helpers'
import { SendActionsUpdateValues } from '@app/appstores/Stores/Send/SendActionsUpdateValues'
import SendCustomFee from '@app/modules/Send/advanced/SendCustomFee'


class SendAdvancedFees extends React.PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            currentSelectedFee : false
        }
    }

    getFeeTitle(item) {
        const devMode = MarketingEvent.DATA.LOG_DEV

        let devFee = false
        let needSpeed = item.needSpeed || false
        if (typeof item.feeForByte !== 'undefined') {
            devFee = item.feeForByte + ' sat/B '
            if (needSpeed) {
                needSpeed = ' rec. ' + needSpeed + ' sat/B'
            }
        } else if (typeof item.gasPrice !== 'undefined') {
            devFee = BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.toGwei(item.gasPrice), 2).justCutted + ' gwei/gas '
            if (needSpeed) {
                needSpeed = ' rec. ' + BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.toGwei(needSpeed), 2).justCutted + ' gwei/gas'
            }
        }

        if (!needSpeed) {
            needSpeed = ''
        }

        const { feesPretty, feesCurrencySymbol, fiatFee } = feesTitles(item, this.props.ExtraViewParams.dict)

        let subtitle
        subtitle = `${feesPretty} ${feesCurrencySymbol}`
        if (devFee) {
            subtitle += ` ${devFee}`
            if (devMode) {
                if (!needSpeed) {
                    needSpeed = ''
                }
                subtitle += `${needSpeed}`
            }
        }
        subtitle += `\n${fiatFee}`

        return subtitle
    }

    setFee(item) {
        SendActionsUpdateValues.setTmpSelectedFee(item)
        this.setState({
            currentSelectedFee : item
        })
    }

    setCustomFee() {
        const { selectedFee } = this.props.ExtraViewParams.fromBlockchain
        const currentSelectedFee = this.state.currentSelectedFee ? this.state.currentSelectedFee : selectedFee
        const item = {...currentSelectedFee, isCustomFee : true}
        SendActionsUpdateValues.setTmpSelectedFee(item)
        this.setState({
            currentSelectedFee : item
        })
    }

    render() {
        const { selectedFee, countedFees } = this.props.ExtraViewParams.fromBlockchain
        const { isTransferAll, bse } = this.props.ExtraViewParams.ui
        const { bseProviderType } = bse

        const currentSelectedFee = this.state.currentSelectedFee ? this.state.currentSelectedFee : selectedFee
        const isCustomFee = typeof currentSelectedFee.isCustomFee !== 'undefined' ? currentSelectedFee.isCustomFee : false
        return (
            <View style={{ paddingLeft: 40 }}>
                {
                    countedFees && countedFees.fees ? countedFees.fees.map((item, index) => {
                        const subtitle = this.getFeeTitle(item)
                        return (
                            // eslint-disable-next-line react/jsx-key
                            <View style={{ marginBottom: -10 }}>
                                <SubSetting
                                    title={strings(`send.fee.text.${item.langMsg}`)}
                                    subtitle={subtitle}
                                    checked={!isCustomFee && item.langMsg === currentSelectedFee.langMsg}
                                    radioButtonFirst={true}
                                    withoutLine={true}
                                    onPress={() => this.setFee(item)}
                                    checkedStyle={true}
                                />
                            </View>
                        )
                    }).reverse() : <View></View>
                }


                { (bseProviderType !== 'FIXED' || !isTransferAll) ?
                    <SubSetting
                        title={strings(`send.fee.customFee.title`)}
                        checked={isCustomFee}
                        radioButtonFirst={true}
                        withoutLine={true}
                        onPress={() => this.setCustomFee()}
                        checkedStyle={true}
                        ExtraView={SendCustomFee}
                        ExtraViewParams={{...this.props.ExtraViewParams, currentSelectedFee}}
                    />
                    : null
                }

            </View>
        )
    }
}

SendAdvancedFees.contextType = ThemeContext

export default SendAdvancedFees
