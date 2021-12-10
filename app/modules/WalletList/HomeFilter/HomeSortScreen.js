/**
 * @version 0.50
 * @author yura
 */

import React, { PureComponent } from 'react'
import { FlatList } from 'react-native'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'

import { setSortValue } from '@app/appstores/Stores/Main/MainStoreActions'

import { ThemeContext } from '@app/theme/ThemeProvider'

import { strings } from '@app/services/i18n'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import Log from '@app/services/Log/Log'


class HomeSortScreen extends PureComponent {

    state = {
        sortValue: trusteeAsyncStorage.getSortValue() || 'byTrustee'
    }

    sortList = [
        {
            title: strings('homeScreen.sort.custom'),
            icon: 'customSort',
            value: 'custom'
        },
        {
            title: strings('homeScreen.sort.byValue'),
            icon: 'balanceSort',
            value: 'byValue'
        },
        {
            title: strings('homeScreen.sort.byName'),
            icon: 'nameSort',
            value: 'byName'
        },
        {
            title: strings('homeScreen.sort.firstCoin'),
            icon: 'coinFirstSort',
            value: 'coinFirst'
        },
        {
            title: strings('homeScreen.sort.firstToken'),
            icon: 'tokenFirstSort',
            value: 'tokenFirst'
        },
        // {
        //     title: strings('homeScreen.sort.withBalance'),
        //     icon: 'wallet',
        //     value: 'withBalance'
        // }
    ]

    handleBack = () => {
        NavStore.goBack()
    }

    handleSortItem = (value) => {
        setSortValue(value)
        trusteeAsyncStorage.setSortValue(value)
        this.setState({
            sortValue: value
        })

        Log.log('HomeSortScreen.handlerSortItem selected ', value)

        NavStore.goBack()
    }

    renderListItem = ({ item, index }) => {

        const { GRID_SIZE } = this.context

        return (
            <ListItem
                iconType={item.icon}
                title={item.title}
                checked={item.value === this.state.sortValue}
                last={this.sortList.length - 1 === index}
                onPress={() => this.handleSortItem(item.value)}
                containerStyle={{ paddingVertical: GRID_SIZE / 3 }}
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
                    data={this.sortList}
                    renderItem={this.renderListItem}
                    keyExtractor={({index}) => index}
                />

            </ScreenWrapper>
        )
    }
}

HomeSortScreen.contextType = ThemeContext

export default HomeSortScreen