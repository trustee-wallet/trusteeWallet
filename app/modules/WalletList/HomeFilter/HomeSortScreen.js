/**
 * @version 0.50
 * @author yura
 */

import React, { PureComponent } from 'react'
import { FlatList } from 'react-native'
import { connect } from 'react-redux'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'

import { ThemeContext } from '@app/theme/ThemeProvider'

import { strings } from '@app/services/i18n'

import { getSortValue } from '@app/appstores/Stores/Main/selectors'
import { setSortValue } from '@app/appstores/Stores/Main/MainStoreActions'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'


class HomeSortScreen extends PureComponent {

    state = {
        sortList: [
            {
                id: 1,
                title: strings('homeScreen.sort.byTrustee'),
                icon: 'wallet',
                value: 'byTrustee' 
            },
            {
                id: 2,
                title: strings('homeScreen.sort.custom'),
                icon: 'customSort',
                value: 'custom'
            },
            {
                id: 3,
                title: strings('homeScreen.sort.byValue'),
                icon: 'balanceSort',
                value: 'byValue'
            },
            {
                id: 4,
                title: strings('homeScreen.sort.byName'),
                icon: 'nameSort',
                value: 'byName'
            },
            {
                id: 5,
                title: strings('homeScreen.sort.firstCoin'),
                icon: 'coinFirstSort',
                value: 'coinFirst'
            },
            {
                id: 6,
                title: strings('homeScreen.sort.firstToken'),
                icon: 'tokenFirstSort',
                value: 'tokenFirst'
            }
        ]
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleSortItem = (value) => {
        setSortValue(value)
        trusteeAsyncStorage.setSortValue(value)
        NavStore.goBack()
    }

    renderListItem = ({ item, index }) => {
        return (
            <ListItem
                iconType={item.icon}
                title={item.title}
                checked={item.value === this.props.sortValue}
                last={this.state.sortList.length - 1 === index}
                onPress={() => this.handleSortItem(item.value)}
            />
        )
    }

    render() {

        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                title={strings('homeScreen.sorting')}
            >
                <FlatList
                    contentContainerStyle={{ flex: 1, padding: GRID_SIZE }}
                    data={this.state.sortList}
                    renderItem={this.renderListItem}
                    keyExtractor={item => item.id.toString()}
                />

            </ScreenWrapper>
        )
    }
}

HomeSortScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        sortValue: getSortValue(state)
    }
}

export default connect(mapStateToProps)(HomeSortScreen)