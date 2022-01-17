/**
 * @version 0.53
 * @author yura
 */

import React, { PureComponent } from 'react'
import { FlatList } from 'react-native'

import _isEqual from 'lodash/isEqual'

import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'

import { setSortValue } from '@app/appstores/Stores/Main/MainStoreActions'

import { ThemeContext } from '@app/theme/ThemeProvider'

import { strings } from '@app/services/i18n'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import Log from '@app/services/Log/Log'

import NavStore from '@app/components/navigation/NavStore'


class SortList extends PureComponent {

    state = {
        sortValue: trusteeAsyncStorage.getSortValue() || this.props.sortValue || 'byTrustee'
    }

    componentDidUpdate(prevProps, nextProps) {
        if (!_isEqual(prevProps.sortValue, nextProps.sortValue)) {
            this.setState({
                sortValue: this.props.sortValue
            })
        }
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

    handleSortItem = (value) => {
        setSortValue(value)
        trusteeAsyncStorage.setSortValue(value)
        this.setState({
            sortValue: value
        })

        Log.log('HomeSortScreen.handlerSortItem selected ', value)

        if (value === 'custom') {
            const res = trusteeAsyncStorage.getIsTraining()
            if (typeof res === 'undefined' || res === '0') {
                NavStore.goNext('GuideScreen')
            } else {
                NavStore.goNext('HomeDragScreen')
            }
        }

        this.props.handleClose()
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
            <FlatList
                contentContainerStyle={{ flex: 1, padding: GRID_SIZE }}
                scrollEnabled={false}
                data={this.sortList}
                renderItem={this.renderListItem}
                keyExtractor={({ index }) => index}
            />
        )
    }
}

SortList.contextType = ThemeContext

export default SortList