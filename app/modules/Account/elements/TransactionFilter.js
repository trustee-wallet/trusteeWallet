/**
 * @version 0.31
 * @author Vadym
 */

import React from 'react'
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    Dimensions
} from 'react-native'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import Button from '@app/components/elements/new/buttons/Button'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import DatePicker from 'react-native-date-picker'
import TextInput from '@app/components/elements/NewInput'
import { strings } from '@app/services/i18n'
import { connect } from 'react-redux'
import { getSelectedCryptoCurrencyData } from '@app/appstores/Stores/Main/selectors'
import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'
import { setFilter } from '@app/appstores/Stores/Main/MainStoreActions'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

class TransactionFilter extends React.PureComponent {

    state = {
        selectedContent: '',
        startTime: null,
        endTime: null,
        openStartTime: false,
        openEndTime: false,
        openStartAmount: false,
        openEndAmount: false,
        startAmount: '',
        endAmount: '',
        filter: {}
    }

    startAmountInput = React.createRef()
    endAmountInput = React.createRef()

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('HomeScreen')
    }

    handleCategories = () => {
        NavStore.goNext('TransactionCategories')
    }

    handleOpenContent = (title) => {
        this.setState({
            selectedContent: title === this.state.selectedContent ? null : title,
            openEndTime: false,
            openStartTime: false
        })
    }

    handleOpenStartTime = () => {
        this.setState({
            startTime: this.state.openStartTime ? this.state.startTime : new Date(),
            openStartTime: !this.state.openStartTime
        })
    }

    handleOpenEndTime = () => {
        this.setState({
            endTime: this.state.openEndTime ? this.state.endTime : new Date(),
            openEndTime: !this.state.openEndTime
        })
    }

    handleSaveStartDate = (e) => {
        this.setState({
            startTime: e
        })
    }

    handleSaveEndDate = (e) => {
        this.setState({
            endTime: e
        })
    }

    handleDiscardDate = () => {
        this.setState({
            openStartTime: false,
            openEndTime: false,
            startTime: null,
            endTime: null
        })
    }

    handleDiscardAmount = () => {
        this.setState({
            openStartAmount: false,
            openEndAmount: false,
            startAmount: '',
            endAmount: ''
        })
    }

    handleOpenStartAmount = () => {
        this.setState({
            openStartAmount: !this.state.openStartAmount
        })
    }

    handleOpenEndAmount = () => {
        this.setState({
            openEndAmount: !this.state.openEndAmount
        })
    }

    handleSetStartAmount = () => {
        const startAmount = this.startAmountInput.getValue()
        this.setState({
            startAmount: startAmount,
            openStartAmount: false
        })
    }

    handleSetEndAmount = () => {
        const endAmount = this.endAmountInput.getValue()
        this.setState({
            endAmount: endAmount,
            openEndAmount: false
        })
    }

    handlePickFilter = () => {

        const { 
            startTime,
            endTime,
            startAmount,
            endAmount
        } = this.state

        const {currencyCode} = this.props.selectedCryptoCurrencyData

        this.setState({
            filter: {
                // startTime: startTime,
                // endTime: endTime,
                startAmount: BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(startAmount),
                endAmount: BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(endAmount)
            }
        })
        console.log(this.state.filter)
        setFilter(this.state.filter)
    }

    renderContent = (content) => {

        const { 
            GRID_SIZE,
            colors 
        } = this.context

        const {
            startTime,
            endTime
        } = this.state

        const {currencyCode} = this.props.selectedCryptoCurrencyData

        return(
            <View>
                {content === 'TIME' ? <View>
                    <View style={{ marginBottom: GRID_SIZE * 1.5 }}>
                        <View style={styles.inputPosition}>
                            <Text style={[styles.categoriesText, { color: colors.common.text3, marginBottom: GRID_SIZE }]}>Start date</Text>
                            <BorderedButton 
                                text={startTime ? startTime.toString().split(' ')[1] + ' ' + startTime.getDate() + ', ' + startTime.getFullYear() : 'Pick date'}
                                containerStyles={[styles.inputButton, { marginBottom: GRID_SIZE }]}
                                customTextStyles={styles.btnText}
                                onPress={this.handleOpenStartTime}
                            />
                        </View>
                        {this.state.openStartTime &&
                            <View style={{ backgroundColor: '#F5F5F5', marginBottom: GRID_SIZE * 1.2, borderRadius: 14 }}> 
                            <DatePicker
                                date={startTime}
                                mode='date'
                                style={{ marginLeft: GRID_SIZE * 1.5 }}
                                onDateChange={e => this.handleSaveStartDate(e)}
                            />
                        </View>}
                        <View style={[styles.inputPosition, { marginBottom: GRID_SIZE }]}>
                            <Text style={[styles.categoriesText, { color: colors.common.text3 }]}>End date</Text>
                            <BorderedButton 
                                text={endTime ? endTime.toString().split(' ')[1] + ' ' + endTime.getDate() + ', ' + endTime.getFullYear() : 'Pick date'}
                                containerStyles={[styles.inputButton, { marginRight: -2 }]}
                                customTextStyles={styles.btnText}
                                onPress={this.handleOpenEndTime}
                            />
                        </View>
                        {this.state.openEndTime && 
                            <View style={{ backgroundColor: '#F5F5F5', borderRadius: 14 }}>
                            <DatePicker
                                date={endTime}
                                mode='date'
                                style={{ marginLeft: GRID_SIZE * 1.5 }}
                                onDateChange={e => this.handleSaveEndDate(e)}
                            />
                        </View>}
                        
                    </View>
                    <View style={styles.buttonContainer}>
                        <Button
                            title="Discard"
                            containerStyle={styles.discardButton}
                            onPress={this.handleDiscardDate}
                        />
                    </View>
                </View> : null}
                {content === 'AMOUNT' ? <View>
                    <View style={{ marginBottom: GRID_SIZE * 1.5 }}>
                        <View style={styles.inputPosition}>
                            <Text style={[styles.categoriesText, { color: colors.common.text3, marginBottom: GRID_SIZE }]}>Start amount</Text>
                            <BorderedButton 
                                text={this.state.startAmount === '' ? 'Set amount' : `${this.state.startAmount} ${currencyCode}`}
                                containerStyles={[styles.inputButton, { marginBottom: GRID_SIZE }]}
                                customTextStyles={styles.btnText}
                                onPress={this.handleOpenStartAmount}
                            />
                        </View>
                        {this.state.openStartAmount && 
                        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginLeft: GRID_SIZE * 1.5 }}>
                            <View style={{ marginBottom: GRID_SIZE * 1.5, width: SCREEN_WIDTH * 0.55, marginRight: -GRID_SIZE }}>
                                <TextInput
                                    ref={input => {this.startAmountInput = input}}
                                    style={styles.textInput}
                                    name={strings('account.transactionScreen.transactionAmount', {currencyCode: currencyCode})}
                                    type='TRANSACTION_AMOUNT_START'
                                    id='TRANSACTION_AOUNT_START'
                                    validPlaceholder={true}
                                    text={currencyCode}
                                    keyboardType='number-pad'
                                />
                            </View>
                            <TwoButtons
                                secondaryButton={{
                                    type: 'sendMessage',
                                    onPress: this.handleSetStartAmount,
                                    inverted: true,
                                    additionalSecondaryStyles: {
                                        marginLeft: GRID_SIZE,
                                        width: 50,
                                        height: 50
                                    }
                                }}
                            />
                        </View>}
                        <View style={styles.inputPosition}>
                            <Text style={[styles.categoriesText, { color: colors.common.text3 }]}>End amount</Text>
                            <BorderedButton 
                                text={this.state.endAmount === '' ? 'Set amount' : `${this.state.endAmount} ${currencyCode}`}
                                containerStyles={[styles.inputButton, { marginRight: -2 }]}
                                customTextStyles={styles.btnText}
                                onPress={this.handleOpenEndAmount}
                            />
                        </View>
                        {this.state.openEndAmount && 
                        <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
                            <View style={{ marginTop: GRID_SIZE, width: SCREEN_WIDTH * 0.55, marginRight: -GRID_SIZE, marginLeft: GRID_SIZE * 1.5 }}>
                                <TextInput
                                    ref={input => {this.endAmountInput = input}}
                                    style={styles.textInput}
                                    name={strings('account.transactionScreen.transactionAmount', {currencyCode: currencyCode})}
                                    type='TRANSACTION_AMOUNT_END'
                                    id='TRANSACTION_AMOUNT_END'
                                    validPlaceholder={true}
                                    text={currencyCode}
                                    keyboardType='number-pad'
                                />
                            </View>
                            <TwoButtons
                                secondaryButton={{
                                    type: 'sendMessage',
                                    onPress: this.handleSetEndAmount,
                                    inverted: true,
                                    additionalSecondaryStyles: {
                                        marginTop: GRID_SIZE,
                                        marginLeft: GRID_SIZE,
                                        width: 50,
                                        height: 50
                                    }
                                }}
                            />
                        </View>}
                    </View>
                    <View style={styles.buttonContainer}>
                        <Button
                            title="Discard"
                            containerStyle={styles.discardButton}
                            onPress={this.handleDiscardAmount}
                        />
                    </View>
                </View> : null}
            </View>
        )
    }

    render () {
        
        const {
            colors,
            GRID_SIZE
        } = this.context

        const { 
            selectedContent,
            startTime,
            endTime
         } = this.state
        
        if (endTime && startTime) {
            this.handlePickDate
        }
        
        return(
            <ScreenWrapper
                title="Filter"
                leftType='back'
                leftAction={this.handleBack}
                rightType="close"
                rightAction={this.handleClose}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { marginTop: GRID_SIZE * 1.5, paddingHorizontal: GRID_SIZE, paddingBottom: GRID_SIZE * 2 }]}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>transaction Categories</Text>
                    <View>
                        <ListItem
                            title="Categories"
                            subtitle="4 selected"
                            iconType="categories"
                            rightContent="arrow"
                            onPress={this.handleCategories}
                            last
                        />
                    </View>
                    <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>date & data</Text>
                    <View>
                        <ListItem
                            title="Time array"
                            subtitle={startTime && endTime ? startTime.toString().split(' ')[1] + ' ' + startTime.getDate() + ', ' + startTime.getFullYear() + ' - ' + endTime.toString().split(' ')[1] + ' ' + endTime.getDate() + ', ' + endTime.getFullYear() : ''}
                            iconType="timeArray"
                            rightContent={selectedContent === 'TIME' ? 'arrow_up' : 'arrow_down'}
                            onPress={() => this.handleOpenContent('TIME')}
                            last
                        />
                        {selectedContent === 'TIME' ? this.renderContent('TIME') : null}
                        <ListItem
                            title="Amount range"
                            subtitle="All amount"
                            iconType="amountRange"
                            rightContent={selectedContent === 'AMOUNT' ? 'arrow_up' : 'arrow_down'}
                            onPress={() => this.handleOpenContent('AMOUNT')}
                            last
                        />
                        {selectedContent === 'AMOUNT' ? this.renderContent('AMOUNT') : null}
                    </View>
                    <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>Download transactions history</Text>
                    <View>
                        <ListItem
                                title="Download"
                                subtitle="Save all time transactions in CSV"
                                iconType="downloadDoc"
                                onPress={this.handlePickDate}
                                last
                        />
                    </View>
                    
                </ScrollView>
                <Button
                    title="Apply"
                    containerStyle={{ marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE / 2}}
                    onPress={this.handlePickFilter}
                />
            </ScreenWrapper> 
        )
    }
}

TransactionFilter.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedCryptoCurrencyData: getSelectedCryptoCurrencyData(state)    
    }
}

export default connect(mapStateToProps )(TransactionFilter)

const styles = StyleSheet.create({
    scrollViewContent: {
        flexGrow: 1,
    },
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    },
    categoriesText: {
        fontFamily: 'Montserrat-SemiBold',
        fontSize: 14,
        lineHeight: 17,
    },
    inputPosition: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginLeft: 10
    },
    inputButton: {
        minWidth: 120,
        maxWidth : 150,
        minHeight: 28,
        marginTop: -6
    },
    discardButton: {
        height: 32,
        width: 120 
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center'
    },
    textInput: {
        height: 50,
        shadowColor: "#000",
        shadowOffset: {
        	width: 0,
        	height: 1,
        },
        shadowOpacity: 0.20,
        shadowRadius: 1.41,

        elevation: 2,
    },
    btnText: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        lineHeight: 18,
        textTransform: 'none',
    }
})