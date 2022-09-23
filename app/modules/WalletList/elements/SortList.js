/**
 * @version 0.53
 * @author yura
 */

import React, { PureComponent } from 'react'
import { FlatList, StyleSheet, View } from 'react-native'

import _isEqual from 'lodash/isEqual'

import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import MainItem from '@app/components/elements/new/list/ListItem/Setting'

import { setHomeFilterWithBalance, setSortValue } from '@app/appstores/Stores/Main/MainStoreActions'

import { ThemeContext } from '@app/theme/ThemeProvider'

import { strings } from '@app/services/i18n'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import Log from '@app/services/Log/Log'

import NavStore from '@app/components/navigation/NavStore'
import Button from '@app/components/elements/new/buttons/Button'


class SortList extends PureComponent {

    state = {
        sortValue: this.props.sortValue || 'byValue',
        homeFilterWithBalance: this.props.homeFilterWithBalance || false
    }

    componentDidUpdate(prevProps, nextProps) {
        if (!_isEqual(prevProps.sortValue, nextProps.sortValue)) {
            this.setState({
                sortValue: this.props.sortValue
            })
        }

        if (!_isEqual(prevProps.homeFilterWithBalance, nextProps.homeFilterWithBalance)) {
            this.setState({
                homeFilterWithBalance: this.props.homeFilterWithBalance
            })
        }
    }

    sortList = [
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
        }
    ]

    handleSortItem = (value) => {
        setSortValue(value)
        trusteeAsyncStorage.setSortValue(value)
        this.setState({
            sortValue: value
        })

        Log.log('HomeSortScreen.handlerSortItem selected ', value)

        this.props.handleClose()
    }

    renderListItem = ({ item, index }) => {

        const { colors } = this.context

        return (
            <ListItem
                iconType={item.icon}
                iconWithoutBackground
                title={item.title}
                checked={item.value === this.props.sortValue}
                last={this.sortList.length - 1 === index}
                onPress={() => this.handleSortItem(item.value)}
                radioButtonFirst
                radioStyles={{ backgroundColor: colors.common.radioButton.border }}
            />
        )
    }

    handleCustomSort = () => {
        const res = trusteeAsyncStorage.getIsTraining()
        if (typeof res === 'undefined' || res === '0') {
            NavStore.goNext('GuideScreen')
        } else {
            NavStore.goNext('HomeDragScreen')
        }
        this.props.handleClose()
    }

    handleSwitchFilter = () => {

        const homeFilterWithBalance = !this.state.homeFilterWithBalance
        this.setState({
            homeFilterWithBalance
        })
        setHomeFilterWithBalance(homeFilterWithBalance)
        trusteeAsyncStorage.setHomeFilterWithBalance(homeFilterWithBalance)
        this.props.handleClose()
    }

    render() {

        const { GRID_SIZE, colors } = this.context

        return (
            <View style={[styles.container, { margin: GRID_SIZE }]}>
                <MainItem
                    title={strings('homeScreen.sort.custom')}
                    checked={this.state.sortValue === 'custom'}
                    onPress={this.handleCustomSort}
                    rightContent='arrow'
                    last
                    containerStyle={[styles.content, { backgroundColor: colors.backDropModal.buttonBg, paddingRight: GRID_SIZE * 1.5, marginBottom: GRID_SIZE, }]}
                    contentStyle={{ paddingVertical: 17 }}
                    customTextStyle={{ fontFamily: 'Montserrat-SemiBold' }}
                />
                <FlatList
                    contentContainerStyle={[styles.content, { backgroundColor: colors.backDropModal.buttonBg, paddingHorizontal: GRID_SIZE / 2 }]}
                    scrollEnabled={false}
                    data={this.sortList}
                    renderItem={this.renderListItem}
                    keyExtractor={({ index }) => index}
                />
                <MainItem
                    title={strings('homeScreen.sort.withBalance')}
                    checked={this.state.homeFilterWithBalance}
                    onPress={this.handleSwitchFilter}
                    rightContent='switch'
                    switchParams={{ value: this.state.homeFilterWithBalance, onPress: this.handleSwitchFilter }}
                    last
                    containerStyle={[styles.content, { backgroundColor: colors.backDropModal.buttonBg, paddingRight: GRID_SIZE, marginTop: GRID_SIZE }]}
                    contentStyle={{ paddingVertical: 17 }}
                    customTextStyle={{ fontFamily: 'Montserrat-SemiBold' }}
                />
                <Button
                    title={strings('assets.hideAsset')}
                    type='withoutShadow'
                    onPress={this.props.handleClose}
                    containerStyle={{ marginVertical: GRID_SIZE, backgroundColor: colors.backDropModal.buttonBg }}
                    textStyle={{ color: colors.backDropModal.buttonText }}
                    bottomSheet
                />
            </View>
        )
    }
}

SortList.contextType = ThemeContext

export default SortList

const styles = StyleSheet.create({
    container: {
        flexDirection: 'column'
    },
    content: {
        overflow: 'hidden',
        borderRadius: 16
    },
})