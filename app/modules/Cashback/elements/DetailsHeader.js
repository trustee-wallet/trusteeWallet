/**
 * @version 0.42
 * @author Vadym
 */

import React from 'react'
import {
    Animated,
    StyleSheet,
    Text,
    View
} from 'react-native'

import { ProgressCircle } from 'react-native-svg-charts'
import { ThemeContext } from '@app/theme/ThemeProvider'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import DetailsContent from '@app/modules/Cashback/elements/Details'
import { strings } from '@app/services/i18n'
import UtilsService from '@app/services/UI/PrettyNumber/UtilsService'
import CustomIcon from '@app/components/elements/CustomIcon'
import Accordion from 'react-native-collapsible/Accordion'

class DetailsHeader extends React.Component{


    state = {
        selected: false,
        selectedTitle: null,
        viewHeight: 0,
        height: new Animated.Value(0),
        activeSections: []
    }

    getSections = () => {

        const { cashbackStore } = this.props

        const cashbackTotalBalance = cashbackStore?.dataFromApi.totalCashbackBalance || 0
        const cpaTotalBalance = cashbackStore?.dataFromApi.cpaTotalBalance || 0

        return [
            {
                title: strings('cashback.cashback'),
                value: 'CASHBACK',
                balance: UtilsService.cutNumber(cashbackTotalBalance, 2),
                progress: cashbackTotalBalance / (cashbackTotalBalance + cpaTotalBalance)
            },
            {
                title: strings('cashback.cpa'),
                value: 'CPA',
                balance: UtilsService.cutNumber(cpaTotalBalance, 2),
                progress: cpaTotalBalance / (cashbackTotalBalance + cpaTotalBalance)
            }

        ]
    }

    sections = this.getSections()

    cashbackCurrency = 'USDT'

    _renderHeader = (section, index, isActive) => {

        const {
            colors,
            GRID_SIZE
        } = this.context

        return (
            <View style={styles.switchableTabsLocation}>
                <View style={styles.switchableTabsContainer}>
                    <View style={styles.circle}>
                        <ProgressCircle
                            style={styles.switchableCircle}
                            strokeWidth={3.5}
                            progress={section.progress}
                            backgroundColor={colors.cashback.chartBg}
                            progressColor={colors.cashback.token}
                        />
                    </View>
                    <View style={styles.textContainer}>
                        <Text style={[styles.switchableTabsText, { color: colors.common.text3 }]}>{section.title}</Text>
                        <Text style={[styles.switchableTabsBalance]}>{section.balance + ' ' + this.cashbackCurrency}</Text>
                    </View>
                </View>
                <View style={{ marginTop: 20, marginRight: GRID_SIZE }}>
                    <CustomIcon name={isActive ? 'up' : 'down'} color={colors.common.text1} size={20} />
                </View>
            </View>
        )
    }

    _renderContent = (section) => {

        return (
            <View>
                {this.renderContent(section.value)}
            </View>
        );
    };

    _updateSections = activeSections => {
        this.setState({ activeSections });
        this.props.scrollDetails(activeSections)
    }

    render() {

        return(
            <View>
                <Accordion
                    sections={this.sections}
                    renderHeader={this._renderHeader}
                    renderContent={this._renderContent}
                    onChange={this._updateSections}
                    activeSections={this.state.activeSections}
                    underlayColor="transparent"

                />
            </View>
        )
    }


    renderContent = (value) => {

        const { cashbackStore } = this.props

        // const { selectedTitle } = this.state

        const overalVolume = cashbackStore.dataFromApi.overalVolume || 0
        let overalPrep = 1 * BlocksoftPrettyNumbers.makeCut(overalVolume, 6).justCutted

        let cpaLevel1 = cashbackStore.dataFromApi.cpaLevel1 || 0
        let cpaLevel2 = cashbackStore.dataFromApi.cpaLevel2 || 0
        let cpaLevel3 = cashbackStore.dataFromApi.cpaLevel3 || 0

        let invitedUsers = cashbackStore.dataFromApi.invitedUsers || 0
        let level2Users = cashbackStore.dataFromApi.level2Users || 0

        if (typeof cashbackStore.dataFromApi.cashbackToken === 'undefined' || cashbackStore.dataFromApi.cashbackToken !== cashbackStore.cashbackToken) {
            invitedUsers = '?'
            level2Users = '?'
            overalPrep = '?'
            cpaLevel1 = '?'
            cpaLevel2 = '?'
            cpaLevel3 = '?'
        }

        MarketingEvent.logEvent('taki_cashback_2_render', {
            cashbackLink: cashbackStore.dataFromApi.cashbackLink || cashbackStore.cashbackLink || '',
            invitedUsers,
            level2Users,
            overalPrep,
            cpaLevel1,
            cpaLevel2,
            cpaLevel3
        })

        return (
            <View>
                <DetailsContent
                    selectedTitle={value}
                    overalPrep={overalPrep}
                    invitedUsers={invitedUsers}
                    level2Users={level2Users}
                    cpaLevel1={cpaLevel1}
                    cpaLevel2={cpaLevel2}
                    cpaLevel3={cpaLevel3}
                />
            </View>
        )
    }
}

DetailsHeader.contextType = ThemeContext

export default DetailsHeader

const styles = StyleSheet.create({
    switchableTabsText: {
        fontSize: 20,
        lineHeight: 20,
        fontFamily: 'Montserrat-SemiBold',
        marginBottom: 2
    },
    switchableTabsContainer: {
        flexDirection: 'row'
    },
    switchableTabsBalance: {
        fontSize: 16,
        lineHeight: 16,
        fontFamily: 'SFUIDisplay-Regular',
        color: '#999999',
        letterSpacing: 1
    },
    switchableCircle: {
        padding: 5,
        width: 60,
        height: 50
    },
    textContainer: {

        marginTop: 11
    },
    switchableTabsLocation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 13
    },
    circle: {
        paddingRight: 12,
        paddingBottom: 4,
    }
})
