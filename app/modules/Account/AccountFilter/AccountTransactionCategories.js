/**
 * @version 0.31
 * @author Vadym
 */

import React from 'react'
import {
    StyleSheet,
    ScrollView
} from 'react-native'

import { connect } from 'react-redux'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'

import { getFilterData } from '@app/appstores/Stores/Main/selectors'
import { strings } from '@app/services/i18n'

class TransactionCategories extends React.PureComponent {

    state = {
        categoriesData: [
            {
                active: true,
                title: strings('account.transaction.selectAll'),
                rightContent: "checkbox",
                last: true
            },
            {
                active: this.props.filterData?.income || null,
                title: strings('account.transaction.income'),
                iconType: "inTxHistory",
                rightContent: "checkbox"
            },
            {
                active: this.props.filterData?.outcome || null,
                title: strings('account.transaction.outcome'),
                iconType: "outTxHistory",
                rightContent: 'checkbox'
            },
            {
                active: this.props.filterData?.fee || null,
                title: strings('account.transaction.fee'),
                iconType: "feeTxScreen",
                rightContent: "checkbox"
            },
            {
                active: this.props.filterData?.canceled || null,
                title: strings('account.transaction.cancel'),
                iconType: "cancelTxHistory",
                rightContent: "checkbox"
            },
            {
                active: this.props.filterData?.swap || null,
                title: strings('account.transaction.swap'),
                iconType: "exchange",
                rightContent: "checkbox"
            },
            {
                active: this.props.filterData?.freezing,
                title: strings('account.transaction.freeze'),
                iconType: "freezing",
                rightContent: "checkbox"
            },
            {
                active: this.props.filterData?.reward,
                title: strings('account.transaction.reward'),
                iconType: "reward",
                rightContent: "checkbox"
            },
            {
                active: this.props.filterData?.contractIncome,
                title: strings('account.transaction.swap_income'),
                iconType: "contractIncome",
                rightContent: "checkbox"
            },
            {
                active: this.props.filterData?.contractOutcome,
                title: strings('account.transaction.swap_outcome'),
                iconType: "contractOutcome",
                rightContent: "checkbox",
                last: true
            }
        ],
        isAllActive: true
    }

    toggleAll = () => {
        state.categoriesData.map(el => el.active = true)
    } 

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('HomeScreen')
    }

    handleSelectCategory = (title) => {
        const { categoriesData } = this.state
        this.setState({
            categoriesData: categoriesData.map(el => el.title === title ? ({ ...el, active: !el.active }) : el)
        })
    }

    handleSelectAll = () => {
        this.setState(state => ({
            categoriesData: state.categoriesData.map(all => ({ ...all, active: !this.state.isAllActive })),
            isAllActive: !this.state.isAllActive
        }))

    }

    renderCategoriesFlatList = () => {

        const { colors } = this.context

        const {
            categoriesData
        } = this.state

        return (
            categoriesData.map((item, index) => (
                <ListItem
                    key={index}
                    title={item.title}
                    iconType={item.iconType}
                    last={item.last}
                    customIconStyle={{ backgroundColor: colors.common.listItem.basic.iconBgDark, color: colors.common.listItem.basic.iconColorDark }}
                    rightContent={item.rightContent}
                    onPress={index === 0 ? this.handleSelectAll : () => this.handleSelectCategory(item.title)}
                    isVisibleDone={false}
                    checked={item.active}
                />)
            )
        )
    }

    render() {

        const { GRID_SIZE } = this.context

        return (
            <ScreenWrapper
                title={strings('account.transaction.categoriesTitle')}
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { marginTop: GRID_SIZE / 2, marginHorizontal: GRID_SIZE, paddingBottom: GRID_SIZE * 2 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    {this.renderCategoriesFlatList()}
                </ScrollView>
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