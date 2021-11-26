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
                notActive: this.props.filterData?.income || false,
                title: strings('account.transaction.income'),
                iconType: "inTxHistory",
                value: 'income'
            },
            {
                notActive: this.props.filterData?.outcome || false,
                title: strings('account.transaction.outcome'),
                iconType: "outTxHistory",
                value: 'outcome'
            },
            {
                notActive: this.props.filterData?.fee || false,
                title: strings('account.transaction.fee'),
                iconType: "feeTxScreen",
                value: 'fee'
            },
            {
                notActive: this.props.filterData?.cancel || false,
                title: strings('account.transaction.cancel'),
                iconType: "cancelTxHistory",
                value: 'cancel'
            },
            // {
            //     notActive: this.props.filterData?.swap || false,
            //     title: strings('account.transaction.swap'),
            //     iconType: "exchange",
            //     value: 'swap'
            // },
            {
                notActive: this.props.filterData?.freezing || false,
                title: strings('account.transaction.freeze'),
                iconType: "freezing",
                value: 'freezing'
            },
            {
                notActive: this.props.filterData?.unfreezing || false,
                title: strings('account.transaction.unfreeze'),
                iconType: "freezing",
                value: 'unfreezing'
            },
            // {
            //     notActive: this.props.filterData?.reward || false,
            //     title: strings('account.transaction.reward'),
            //     iconType: "reward",
            //     value: 'reward'
            // },
            {
                notActive: this.props.filterData?.contractIncome || false,
                title: strings('account.transaction.swap_income'),
                iconType: "contractIncome",
                value: 'contractIncome'
            },
            {
                notActive: this.props.filterData?.contractOutcome || false,
                title: strings('account.transaction.swap_outcome'),
                iconType: "contractOutcome",
                value: 'contractOutcome'
            }
        ],
        isAllActive: true
    }

    componentDidMount() {
        const isAllActive = Array.from(new Set(this.state.categoriesData.map(item => item.notActive)))

        this.setState({
            isAllActive: isAllActive.length === 1 ? !isAllActive[0] : false
        })
    }

    handleBack = () => {

        const filter = {
            ...this.props.filter,
        }

        this.state.categoriesData.filter(item => item.notActive).map(item => filter[item.value] = item.notActive)

        setFilter(filter)

        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('HomeScreen')
    }

    handleSelectCategory = (title) => {
        const { categoriesData } = this.state
        this.setState({
            categoriesData: categoriesData.map(el => el.title === title ? ({ ...el, notActive: !el.notActive }) : el),
            isAllActive: false
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
                checked={!item.notActive}
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