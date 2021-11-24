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

import { getFilterData } from '@app/appstores/Stores/Main/selectors'
import { strings } from '@app/services/i18n'
import { setFilter } from '@app/appstores/Stores/Main/MainStoreActions'

class TransactionCategories extends React.PureComponent {

    state = {
        categoriesData: [
            {
                active: this.props.filterData?.income || true,
                title: strings('account.transaction.income'),
                iconType: "inTxHistory"
            },
            {
                active: this.props.filterData?.outcome || true,
                title: strings('account.transaction.outcome'),
                iconType: "outTxHistory"
            },
            {
                active: this.props.filterData?.fee || true,
                title: strings('account.transaction.fee'),
                iconType: "feeTxScreen"
            },
            {
                active: this.props.filterData?.canceled || true,
                title: strings('account.transaction.cancel'),
                iconType: "cancelTxHistory"
            },
            {
                active: this.props.filterData?.swap || true,
                title: strings('account.transaction.swap'),
                iconType: "exchange"
            },
            {
                active: this.props.filterData?.freezing || true,
                title: strings('account.transaction.freeze'),
                iconType: "freezing"
            },
            // {
            //     active: this.props.filterData?.reward || true,
            //     title: strings('account.transaction.reward'),
            //     iconType: "reward"
            // },
            {
                active: this.props.filterData?.contractIncome || true,
                title: strings('account.transaction.swap_income'),
                iconType: "contractIncome"
            },
            {
                active: this.props.filterData?.contractOutcome || true,
                title: strings('account.transaction.swap_outcome'),
                iconType: "contractOutcome"
            }
        ],
        isAllActive: true
    }

    handleBack = () => {
        const filter = {
            ...this.props.filter
        }

        setFilter(filter)
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('HomeScreen')
    }

    handleSelectCategory = (title) => {
        const { categoriesData } = this.state
        this.setState({
            categoriesData: categoriesData.map(el => el.title === title ? ({ ...el, active: !el.active }) : el),
            isAllActive: false
        })
    }

    handleSelectAll = () => {
        this.setState(state => ({
            categoriesData: state.categoriesData.map(all => ({ ...all, active: !this.state.isAllActive })),
            isAllActive: !this.state.isAllActive
        }))
    }

    renderHeaderComponent = () => {

        const { colors } = this.context

        return (
            <ListItem
                title={strings('account.transaction.selectAll')}
                customIconStyle={{ backgroundColor: colors.common.listItem.basic.iconBgDark, color: colors.common.listItem.basic.iconColorDark }}
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
                customIconStyle={{ backgroundColor: colors.common.listItem.basic.iconBgDark, color: colors.common.listItem.basic.iconColorDark }}
                rightContent='checkbox'
                onPress={() => this.handleSelectCategory(item.title)}
                isVisibleDone={false}
                checked={item.active}
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
                    contentContainerStyle={[styles.scrollViewContent, { marginTop: GRID_SIZE / 2, marginHorizontal: GRID_SIZE, paddingBottom: GRID_SIZE * 2 }]}
                    keyboardShouldPersistTaps='handled'
                    data={this.state.categoriesData}
                    renderItem={this.renderItem}
                    ListHeaderComponent={this.renderHeaderComponent}
                />
            </ScreenWrapper>
        )
    }
}

TransactionCategories.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        filterData: getFilterData(state)
    }
}

export default connect(mapStateToProps)(TransactionCategories)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1
    }
})