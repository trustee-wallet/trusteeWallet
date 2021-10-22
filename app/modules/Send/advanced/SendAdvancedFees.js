/**
 * @version 0.41
 */
import React from 'react'
import { View } from 'react-native'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { strings } from '@app/services/i18n'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import BlocksoftUtils from '@crypto/common/BlocksoftUtils'

import SubSetting from '@app/components/elements/new/list/ListItem/SubSetting'
import { feesTitles } from '@app/modules/Send/advanced/helpers'
import { SendActionsUpdateValues } from '@app/appstores/Stores/Send/SendActionsUpdateValues'
import SendCustomFee from '@app/modules/Send/advanced/SendCustomFee'


class SendAdvancedFees extends React.PureComponent {

    getFeeTitle(item) {
        const devMode = MarketingEvent.DATA.LOG_DEV

        let devFee = false
        let needSpeed = item.needSpeed || false
        let devFeeSub = false
        if (typeof item.feeForByte !== 'undefined') {
            devFee = item.feeForByte + ' sat/B '
            if (needSpeed) {
                needSpeed = ' rec. ' + needSpeed + ' sat/B'
            }
        } else if (typeof item.gasPrice !== 'undefined') {
            devFee = BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.toGwei(item.gasPrice), 2).justCutted + ' gwei/gas '
            if (needSpeed && needSpeed !== '?') {
                needSpeed = ' rec. ' + BlocksoftPrettyNumbers.makeCut(BlocksoftUtils.toGwei(needSpeed), 2).justCutted + ' gwei/gas'
            } else {
                needSpeed = ''
            }
        }
        if (typeof item.blockchainData !== 'undefined' && item.blockchainData && typeof item.blockchainData.preparedInputsOutputs !== 'undefined') {
            devFeeSub = 'ins: ' + item.blockchainData.preparedInputsOutputs.inputs.length + ' outs: ' + item.blockchainData.preparedInputsOutputs.outputs.length
        }

        if (!needSpeed) {
            needSpeed = ''
        }

        const { feesPretty, feesCurrencySymbol, fiatFee } = feesTitles(item, this.props.sendScreenStore.dict)

        let subtitle
        subtitle = `${feesPretty} ${feesCurrencySymbol}`
        if (devFee) {
            subtitle += ` ${devFee}`
            if (devMode) {
                if (!needSpeed) {
                    needSpeed = ''
                }
                subtitle += `${needSpeed}`
                if (devFeeSub) {
                    subtitle += `\n${devFeeSub}`
                }
            }
        }
        subtitle += `\n${fiatFee}`

        return subtitle
    }

    setFee(item) {
        SendActionsUpdateValues.setTmpSelectedFee(item)
        this.props.setParentState({
            selectedFee: item
        })
    }

    setCustomFee() {
        const { selectedFee } = this.props.sendScreenStore.fromBlockchain
        const currentSelectedFee = selectedFee
        if (typeof currentSelectedFee.isCustomFee === 'undefined' || currentSelectedFee.isCustomFee === false) {
            setTimeout(() => {
                try {
                    this.props.scrollView.scrollTo({ y: 250 })
                } catch (e) {
                }
            }, 500)
        }
        const item = { ...currentSelectedFee, isCustomFee: true }
        SendActionsUpdateValues.setTmpSelectedFee(item)
        this.props.setParentState({
            selectedFee: item
        })
    }

    onFocus = () => {
        setTimeout(() => {
            try {
                this.props.scrollView.scrollTo({ y: 350 })
            } catch (e) {
            }
        }, 500)
    }

    render() {
        const { countedFees } = this.props.sendScreenStore.fromBlockchain
        const { isTransferAll, bse } = this.props.sendScreenStore.ui
        const { currentSelectedFee } = this.props
        const { bseProviderType } = bse

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


                {(bseProviderType !== 'FIXED' || !isTransferAll) ?
                    <SubSetting
                        title={strings(`send.fee.customFee.title`)}
                        checked={isCustomFee}
                        radioButtonFirst={true}
                        withoutLine={true}
                        onPress={() => this.setCustomFee()}
                        checkedStyle={true}
                        ExtraView={() => <SendCustomFee
                            sendScreenStore={this.props.sendScreenStore}
                            currentSelectedFee={currentSelectedFee}
                            onFocus={() => this.onFocus()}
                        />}
                    />
                    : null
                }

            </View>
        )
    }
}

SendAdvancedFees.contextType = ThemeContext

export default SendAdvancedFees
