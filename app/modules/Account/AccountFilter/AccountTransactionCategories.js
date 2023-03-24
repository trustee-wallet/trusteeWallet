/**
 * @version 0.52
 * @author Vadym
 */

import React from 'react'
import { StyleSheet, FlatList } from 'react-native'

import { connect } from 'react-redux'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import Button from '@app/components/elements/new/buttons/Button'

import { getFilterData, getSelectedCryptoCurrencyData } from '@app/appstores/Stores/Main/selectors'
import { strings } from '@app/services/i18n'
import { setFilter } from '@app/appstores/Stores/Main/MainStoreActions'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'

const CACHE_CLICK = {
    title : '',
    ts : 0
}
class TransactionCategories extends React.PureComponent {

    state = {
        categoriesData: [
            {
                notActive: this.props.filterData?.filterDirectionHideIncome || false,
                title: strings('account.transaction.income'),
                iconType: 'inTxHistory',
                value: 'filterDirectionHideIncome'
            },
            {
                notActive: this.props.filterData?.filterDirectionHideOutcome || false,
                title: strings('account.transaction.outcome'),
                iconType: 'outTxHistory',
                value: 'filterDirectionHideOutcome'
            },
            {
                notActive: this.props.filterData?.filterStatusHideCancel || false,
                title: strings('account.transaction.cancel'),
                iconType: 'cancelTxHistory',
                value: 'filterStatusHideCancel'
            },
            {
                notActive: this.props.filterData?.filterTypeHideFee || false,
                title: strings('account.transaction.fee'),
                iconType: 'feeTxScreen',
                value: 'filterTypeHideFee'
            },
            {
                notActive: this.props.filterData?.filterTypeShowSpam || false,
                title: strings('account.transaction.spam'),
                iconType: 'feeTxScreen',
                value: 'filterTypeShowSpam'
            },
            {
                notActive: this.props.filterData?.filterTypeHideSwap || false,
                title: strings('account.transaction.swap'),
                iconType: 'exchange',
                value: 'filterTypeHideSwap'
            },
            // {
            //     notActive: this.props.filterData?.filterTypeHideWalletConnect || false,
            //     title: strings('account.transaction.wallet_connect'),
            //     iconType: 'walletConnect',
            //     value: 'filterTypeHideWalletConnect'
            // }
        ],
        isAllActive: true
    }

    componentDidMount() {

        if (this.props.cryptoCurrency.currencyCode === 'TRX' || this.props.cryptoCurrency.currencyCode === 'SOL') {
            this.setState({
                categoriesData: [
                    ...this.state.categoriesData,
                    {
                        notActive: this.props.filterData?.filterTypeHideStake || false,
                        title: strings('account.transaction.stake'),
                        iconType: 'freezing',
                        value: 'filterTypeHideStake'
                    }
                ]
            })
        }

        const isAllActive = Array.from(new Set(this.state.categoriesData.map(item => item.notActive)))

        this.setState({
            isAllActive: isAllActive.length === 1 ? !isAllActive[0] : false
        })
    }

    handleApply = () => {

        const filter = {
            ...this.props.filterData,
            activeCategories: true,
            active: true
        }

        if (this.state.isAllActive) {
            filter.active = !!(filter.startTime || filter.endTime || filter.startAmount || filter.endAmount)
            filter.activeCategories = false
        }

        this.state.categoriesData.map(item => filter[item.value] = item.notActive)
        setFilter(filter, 'AccountTransactionCategories.handleApply')
        trusteeAsyncStorage.setAccountFilterData(filter)

        NavStore.goBack()
        NavStore.goBack()
        // go direct to transactions
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('HomeScreen')
    }

    handleSelectCategory = (title) => {
        if (CACHE_CLICK.title === title && (new Date().getTime() - CACHE_CLICK.ts < 600)) {
            return false
        }
        CACHE_CLICK.title = title
        CACHE_CLICK.ts = new Date().getTime()

        const { categoriesData } = this.state

        const data = categoriesData.map(el => el.title === title ? ({ ...el, notActive: !el.notActive }) : el)
        const isAllActive = data.every(el => el.notActive !== true)

        this.setState({
            categoriesData: data,
            isAllActive
        })
    }

    handleSelectAll = () => {
        this.setState(state => ({
            categoriesData: state.categoriesData.map(all => ({ ...all, notActive: this.state.isAllActive })),
            isAllActive: !this.state.isAllActive
        }))
    }

    renderHeaderComponent = () => {

        const { colors } = this.context

        return (
            <ListItem
                title={strings('account.transaction.selectAll')}
                customIconStyle={{
                    backgroundColor: colors.common.listItem.basic.iconBgDark,
                    color: colors.common.listItem.basic.iconColorDark
                }}
                rightContent='checkbox'
                onPress={this.handleSelectAll}
                isVisibleDone={false}
                checked={this.state.isAllActive}
            />
        )
    }

    renderItem = ({ item, index }) => {

        const { colors } = this.context

        return (
            <ListItem
                key={index}
                title={item.title}
                iconType={item.iconType}
                last={index === this.state.categoriesData.length - 1}
                customIconStyle={{
                    backgroundColor: colors.common.listItem.basic.iconBgDark,
                    color: colors.common.listItem.basic.iconColorDark
                }}
                rightContent='checkbox'
                onPress={() => this.handleSelectCategory(item.title)}
                isVisibleDone={false}
                checked={!item.notActive}
                customTextStyle={{
                    fontFamily: 'Montserrat-SemiBold'
                }}
            />
        )
    }

    render() {

        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                title={strings('account.transaction.categoriesTitle')}
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
            >
                <FlatList
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, {
                        marginTop: GRID_SIZE / 2,
                        marginHorizontal: GRID_SIZE,
                        paddingBottom: GRID_SIZE * 2
                    }]}
                    keyboardShouldPersistTaps='handled'
                    data={this.state.categoriesData}
                    renderItem={this.renderItem}
                    ListHeaderComponent={this.renderHeaderComponent}
                    keyExtractor={({ index }) => index}
                />
                <Button
                    title={strings('send.setting.apply')}
                    containerStyle={{ marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE }}
                    onPress={this.handleApply}
                />
            </ScreenWrapper>
        )
    }
}

TransactionCategories.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        filterData: getFilterData(state),
        cryptoCurrency: getSelectedCryptoCurrencyData(state)
    }
}

export default connect(mapStateToProps)(TransactionCategories)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1
    }
})
