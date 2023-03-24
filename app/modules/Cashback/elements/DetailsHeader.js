/**
 * @version 0.77
 * @author Vadym
 */

import React from 'react'
import { Animated, View } from 'react-native'

import { ThemeContext } from '@app/theme/ThemeProvider'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'
import DetailsContent from '@app/modules/Cashback/elements/Details'
import Accordion from 'react-native-collapsible/Accordion'

import ListItem from '@app/components/elements/new/list/ListItem/Setting'

class DetailsHeader extends React.Component{

    state = {
        selected: false,
        selectedTitle: null,
        viewHeight: 0,
        height: new Animated.Value(0),
        activeSections: []
    }

    cashbackCurrency = 'USDT'

    _renderHeader = (section, index, isActive) => {

        const {
            colors,
            GRID_SIZE
        } = this.context

        return (
            <View style={{ marginHorizontal: GRID_SIZE }}>
                <ListItem
                    iconType={section.iconType}
                    title={section.title}
                    subtitle={section.balance}
                    rightContent={isActive ? 'arrow_up' : 'arrow_down'}
                    color={colors.common.text1}
                    onPress={() => null}
                    disabled
                    opacityWithDisabled
                    last
                />
                {index === 0 && !isActive && <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 3 }}/>}
            </View>
        )
    }

    _renderContent = (section, index) => {

        const {
            colors,
            GRID_SIZE
        } = this.context

        return (
            <View>
                {this.renderContent(section.value)}
                {index === 0 && <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 3 }}/>}
            </View>
        );
    };

    _updateSections = activeSections => {
        this.setState({ activeSections });
        this.props.scrollDetails(activeSections)
    }

    render() {

        return(
            <Accordion
                sections={this.props.sections}
                renderHeader={this._renderHeader}
                renderContent={this._renderContent}
                onChange={this._updateSections}
                activeSections={this.state.activeSections}
                underlayColor="transparent"
            />
        )
    }


    renderContent = (value) => {

        const { cashbackStore } = this.props

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
            <DetailsContent
                selectedTitle={value}
                overalPrep={overalPrep}
                invitedUsers={invitedUsers}
                level2Users={level2Users}
                cpaLevel1={cpaLevel1}
                cpaLevel2={cpaLevel2}
                cpaLevel3={cpaLevel3}
            />
        )
    }
}

DetailsHeader.contextType = ThemeContext

export default DetailsHeader
