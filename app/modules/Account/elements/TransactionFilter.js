/**
 * @version 0.31
 * @author Vadym
 */

import React from 'react'
import {
    View,
    Text,
    ScrollView,
    StyleSheet
} from 'react-native'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
// import TransactionTimeArray from './TransactionTimeArray'
import Button from '@app/components/elements/new/buttons/Button'

class TransactionFilter extends React.PureComponent {

    handleBack = () => {
        NavStore.goBack()
    }

    handleCategories = () => {
        NavStore.goNext('TransactionCategories')
    }

    handleAmountRange = () => {
        NavStore.goNext('')
    }

    // renderTimeFilther = () => {

        

    //     return(
    //         <View style={{ flex: 1 }}>
    //             <TransactionTimeArray sections={sections} />
    //         </View>
    //     )
    // }

    render () {

        const {
            colors,
            GRID_SIZE
        } = this.context

        return(
            <ScreenWrapper
                title="Filter"
                leftType='back'
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleBack}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { marginTop: GRID_SIZE * 1.5, marginHorizontal: GRID_SIZE }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>transaction Categories</Text>
                    <View>
                        <ListItem
                            title="Categories"
                            subtitle="4 selected"
                            iconType="wallet"
                            rightContent="arrow"
                            onPress={this.handleCategories}
                            last
                        />
                    </View>
                    <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>date & data</Text>
                    <View>
                    
                        <ListItem
                            title="Time array"
                            subtitle="Mar 2 - Mar 8"
                            iconType="timeForRate"
                        />
                        <ListItem
                            title="Amount range"
                            subtitle="All amount"
                            iconType="balance"
                            last
                        />
        
                    </View>
                    <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>Download transactions history</Text>
                    <View>
                        <ListItem
                                title="Download all"
                                subtitle="Save all time transactions in CSV"
                                iconType="downloadDoc"
                                onPress={this.handleCategories}
                        />
                        <ListItem
                            title="Download filtred"
                            subtitle="Save selected transactions in CSV"
                            iconType="downloadDoc"
                            onPress={this.handleCategories}
                            last
                        />
                    </View>
                </ScrollView>
                <Button
                    containerStyle={{ marginBottom: GRID_SIZE / 2, marginHorizontal: GRID_SIZE }}
                    title="Apply"
                    onPress={this.handleCategories}
                />
            </ScreenWrapper> 
        )
    }
}

TransactionFilter.contextType = ThemeContext

export default TransactionFilter

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
    },
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    }
})