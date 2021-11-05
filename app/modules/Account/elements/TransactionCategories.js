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
import Button from '@app/components/elements/new/buttons/Button'

class TransactionCategories extends React.PureComponent {

    state = {
        selected: [],
        categoriesData: [
            {
                id: 1,
                title: "SELECT ALL",
                rightContent: "checkbox",
                last: true
            },
            {
                id: 1,
                title: "Income",
                iconType: "inTxHistory",
                rightContent: "checkbox"
            },
            {
                id: 2,
                title: "Outcome",
                iconType: "outTxHistory",
                rightContent: 'checkbox'
            },
            {
                id: 3,
                title: "Fees",
                iconType: "feeTxScreen",
                rightContent: "checkbox"
            },
            {
                id: 4,
                title: "Canceled",
                iconType: "cancelTxHistory",
                rightContent: "checkbox"
            },
            {
                id: 5,
                title: "Swap",
                iconType: "exchange",
                rightContent: "checkbox"
            },
            {
                id: 6,
                title: "Freezing",
                iconType: "OPTIMISM",
                rightContent: "checkbox"
            },
            {
                id: 7,
                title: "Contact income",
                iconType: "notes",
                rightContent: "checkbox"
            },
            {
                id: 8,
                title: "Contact outcome",
                iconType: "notes",
                rightContent: "checkbox",
                last: true
            }
        ]
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleSelectCategory = (id) => {
        
        const { selected } = this.state

        if (selected.includes(id)) {
            selected.filter((item, index) => item[index].id !== id)
        } else {
            this.setState({
                selected: [...selected, {id: id}]
            })
        } 
    }

    handleDiscard = () => {
        this.setState({
            selected: []
        })
    }

    renderCategoriesFlatList = () => {

        const { colors } = this.context

        const { 
            selected,
            categoriesData
        } = this.state

        return(
            categoriesData.map((item, index) => <ListItem 
                                                    title={item.title}
                                                    iconType={item.iconType}
                                                    last={item.last}
                                                    customIconStyle={{backgroundColor: colors.common.listItem.basic.iconBgDark, color: colors.common.listItem.basic.iconColorDark}}
                                                    rightContent={item.rightContent}
                                                    onPress={() => this.handleSelectCategory(categoriesData[index].id)}
                                                    isVisibleDone={false}
                                                    checked={categoriesData[index].id === selected}
                                                />
            )
        )
    }

    render() {

        const { 
            categoriesData,
            selected
        } = this.state

        const { GRID_SIZE } = this.context

        console.log('selected', selected)
 
        return(
            <ScreenWrapper
                title="Categories"
                leftType="back"
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleBack}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { marginTop: GRID_SIZE / 2, marginHorizontal: GRID_SIZE, paddingBottom: GRID_SIZE * 2 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    {this.renderCategoriesFlatList()}
                </ScrollView>
                { selected.length > 0 && <Button
                    containerStyle={{ marginHorizontal: GRID_SIZE }}
                    title="Discard"
                    onPress={this.handleDiscard}
                    type="transparent"
                />}
                <Button
                    containerStyle={{ marginBottom: GRID_SIZE / 2, marginHorizontal: GRID_SIZE }}
                    title="Apply"
                    onPress={this.handleCategories}
                />
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