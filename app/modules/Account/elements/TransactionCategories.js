/**
 * @version 0.31
 * @author Vadym
 */

import React from 'react'
import {
    StyleSheet,
    ScrollView
} from 'react-native'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'

class TransactionCategories extends React.PureComponent {

    state = {
        categoriesData: [
            {
                active: true,
                title: "SELECT ALL",
                rightContent: "checkbox",
                last: true

            },
            {
                active: true,
                title: "Income",
                iconType: "inTxHistory",
                rightContent: "checkbox"
            },
            {
                active: true,
                title: "Outcome",
                iconType: "outTxHistory",
                rightContent: 'checkbox'
            },
            {
                active: true,
                title: "Fees",
                iconType: "feeTxScreen",
                rightContent: "checkbox"
            },
            {
                active: true,
                title: "Canceled",
                iconType: "cancelTxHistory",
                rightContent: "checkbox"
            },
            {
                active: true,
                title: "Swap",
                iconType: "exchange",
                rightContent: "checkbox"
            },
            {
                active: true,
                title: "Freezing",
                iconType: "freezing",
                rightContent: "checkbox"
            },
            {
                active: true,
                title: "Reward",
                iconType: "reward",
                rightContent: "checkbox"
            },
            {
                active: true, 
                title: "Contract income",
                iconType: "contractIncome",
                rightContent: "checkbox"
            },
            {
                active: true, 
                title: "Contract outcome",
                iconType: "contractOutcome",
                rightContent: "checkbox",
                last: true
            }
        ],
        isAllActive: true
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('HomeScreen')
    }

    handleSelectAllTrue = () => {
        this.setState(state => ({
            categoriesData: state.categoriesData.map(all => ({...all, active: true})),
            isAllActive: true
        }))
    }

    handleSelectAllFalse = () => {
        this.setState(state => ({
            categoriesData: state.categoriesData.map(all => ({...all, active: false}))
        }))
    }

    handleSelectCategory = (title) => {
        const { categoriesData } = this.state
        this.setState({
            categoriesData: categoriesData.map(el => el.title === title ? ({...el, active: !el.active}) : el)
        })
    }

    handleCheckForActive = () => {
        this.state.categoriesData.map(el => !el.active && this.setState({
            isAllActive: false
        }))
    }

    renderCategoriesFlatList = () => {

        const { colors } = this.context

        const { 
            categoriesData
        } = this.state

        return(
            categoriesData.map((item, index) => <ListItem 
                                                    title={item.title}
                                                    iconType={item.iconType}
                                                    last={item.last}
                                                    customIconStyle={{backgroundColor: colors.common.listItem.basic.iconBgDark, color: colors.common.listItem.basic.iconColorDark}}
                                                    rightContent={item.rightContent}
                                                    onPress={index === 0 ? item.active ? this.handleSelectAllFalse : this.handleSelectAllTrue : () => this.handleSelectCategory(item.title)}
                                                    onPressCheckBox={index === 0 ? item.active ? this.handleSelectAllFalse : this.handleSelectAllTrue : () => this.handleSelectCategory(item.title)}
                                                    isVisibleDone={false}
                                                    checked={item.active}
                                                />
            )
        )
    }

    render() {

        this.handleCheckForActive()

        const { GRID_SIZE } = this.context
 
        return(
            <ScreenWrapper
                title="Categories"
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

export default TransactionCategories

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1
    }
})