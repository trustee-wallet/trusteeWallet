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
    Dimensions,
    LayoutAnimation
} from 'react-native'

import { connect } from 'react-redux'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import Button from '@app/components/elements/new/buttons/Button'
import BorderedButton from '@app/components/elements/new/buttons/BorderedButton'
import DatePicker from 'react-native-date-picker'
import TextInput from '@app/components/elements/NewInput'
import { strings } from '@app/services/i18n'

import { getFilterData, getSelectedCryptoCurrencyData } from '@app/appstores/Stores/Main/selectors'
import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'
import { setFilter } from '@app/appstores/Stores/Main/MainStoreActions'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

class TransactionFilter extends React.PureComponent {

    state = {
        selectedContent: '',
        startTime: this.props.filterData?.startTime || null,
        endTime: this.props.filterData?.endTime || null,
        openStartTime: false,
        openEndTime: false,
        openStartAmount: false,
        openEndAmount: false,
        startAmount: this.props.filterData?.startAmount ? this.getPrettyAmount(this.props.filterData?.startAmount) : '',
        endAmount: this.props.filterData?.endAmount ? this.getPrettyAmount(this.props.filterData?.endAmount) : '',
    }

    startAmountInput = React.createRef()
    endAmountInput = React.createRef()

    getPrettyAmount = (amount) => {
        return BlocksoftPrettyNumbers.setCurrencyCode(this.props.selectedCryptoCurrencyData.currencyCode).makePretty(amount)
    }

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
        LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
        this.setState({
            selectedContent: title === this.state.selectedContent ? null : title,
            openEndTime: false,
            openStartTime: false
        })
    }

    handleOpenStartTime = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
        this.setState({
            startTime: this.state.openStartTime ? this.state.startTime : new Date(),
            openStartTime: !this.state.openStartTime
        })
    }

    handleOpenEndTime = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
        this.setState({
            endTime: this.state.openEndTime ? this.state.endTime : new Date(),
            openEndTime: !this.state.openEndTime
        })
    }

    handleSaveStartDate = (startTime) => {
        console.log(startTime)
        this.setState({
            startTime
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
        LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
        this.setState({
            openStartAmount: !this.state.openStartAmount
        })
    }

    handleOpenEndAmount = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
        this.setState({
            openEndAmount: !this.state.openEndAmount
        })
    }

    handleSetStartAmount = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
        const startAmount = this.startAmountInput.getValue()
        this.setState({
            startAmount: startAmount,
            openStartAmount: false
        })
    }

    handleSetEndAmount = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.linear);
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

        const { currencyCode } = this.props.selectedCryptoCurrencyData

        const filter = {
            startTime: startTime ? startTime.toISOString() : null,
            endTime: endTime ? endTime.toISOString() : null,
            startAmount: startAmount ? BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(startAmount) : null,
            endAmount: endAmount ? BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(endAmount) : null
        }

        setFilter(filter)

        NavStore.goBack()
    }

    getCurrentDate = (date) => {
        const newDate = new Date(date)

        return newDate.toString().split(' ')[1] + ' ' + newDate.getDate() + ', ' + newDate.getFullYear()
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

        const { currencySymbol } = this.props.selectedCryptoCurrencyData

        return (
            <View>
                {content === 'TIME' ? <View>
                    <View style={{ marginBottom: GRID_SIZE * 1.5 }}>
                        <View style={styles.inputPosition}>
                            <Text style={[styles.categoriesText, { color: colors.common.text3, marginBottom: GRID_SIZE }]}>Start date</Text>
                            <BorderedButton
                                text={startTime ? this.getCurrentDate(startTime) : 'Pick date'}
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
                                    onDateChange={this.handleSaveStartDate}
                                />
                            </View>}
                        {/* you need to make a separate component */}
                        <View style={[styles.inputPosition, { marginBottom: GRID_SIZE }]}>
                            <Text style={[styles.categoriesText, { color: colors.common.text3 }]}>End date</Text>
                            <BorderedButton
                                text={endTime ? this.getCurrentDate(endTime) : 'Pick date'}
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
                        <View style={styles.buttonContainer}>
                            <Button
                                title="Discard"
                                containerStyle={styles.discardButton}
                                onPress={this.handleDiscardDate}
                            />
                        </View>
                    </View>
                </View> : null}
                {content === 'AMOUNT' ?
                    <>
                        <View style={{ flex: 1, flexDirection: 'column' }}>
                            <View style={styles.inputPosition}>
                                <Text style={[styles.categoriesText, { color: colors.common.text3 }]}>Start amount</Text>
                                <BorderedButton
                                    text={this.state.startAmount === '' ? 'Set amount' : `${this.state.startAmount} ${currencySymbol}`}
                                    containerStyles={[styles.inputButton]}
                                    customTextStyles={styles.btnText}
                                    onPress={this.handleOpenStartAmount}
                                />
                            </View>
                            {/* you need to make a separate component */}
                            {this.state.openStartAmount &&
                                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginLeft: GRID_SIZE * 1.5 }}>
                                    <View style={[styles.amountInput, { marginVertical: GRID_SIZE, width: SCREEN_WIDTH * 0.6, height: 50 }]}>
                                        <TextInput
                                            ref={input => { this.startAmountInput = input }}
                                            name={strings('account.transactionScreen.transactionAmount', { currencyCode: currencySymbol })}
                                            type='TRANSACTION_AMOUNT_START'
                                            id='TRANSACTION_AOUNT_START'
                                            validPlaceholder={true}
                                            // text={currencyCode} // I think this need btn crypto/fiat, not text
                                            keyboardType='numeric' // Vadim, for Iphone this better
                                            containerStyle={{ height: 50 }}
                                            inputStyle={{ marginTop: -6 }}
                                        />
                                    </View>
                                    <TwoButtons
                                        secondaryButton={{
                                            type: 'sendMessage',
                                            onPress: this.handleSetStartAmount,
                                            inverted: true,
                                            additionalSecondaryStyles: {
                                                marginLeft: GRID_SIZE,
                                                marginVertical: GRID_SIZE,
                                                width: 50,
                                                height: 50
                                            }
                                        }}
                                    />
                                </View>}
                            <View style={styles.inputPosition}>
                                <Text style={[styles.categoriesText, { color: colors.common.text3 }]}>End amount</Text>
                                <BorderedButton
                                    text={this.state.endAmount === '' ? 'Set amount' : `${this.state.endAmount} ${currencySymbol}`}
                                    containerStyles={[styles.inputButton, { marginRight: -2 }]}
                                    customTextStyles={styles.btnText}
                                    onPress={this.handleOpenEndAmount}
                                />
                            </View>
                            {this.state.openEndAmount &&
                                <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
                                    <View style={{ marginTop: GRID_SIZE, width: SCREEN_WIDTH * 0.55, marginRight: -GRID_SIZE, marginLeft: GRID_SIZE * 1.5 }}>
                                        <TextInput
                                            ref={input => { this.endAmountInput = input }}
                                            style={styles.textInput}
                                            name={strings('account.transactionScreen.transactionAmount', { currencyCode: currencySymbol })}
                                            type='TRANSACTION_AMOUNT_END'
                                            id='TRANSACTION_AMOUNT_END'
                                            validPlaceholder={true}
                                            text={currencySymbol}
                                            keyboardType='numeric'
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
                            <View style={styles.buttonContainer}>
                                <Button
                                    title="Discard"
                                    containerStyle={styles.discardButton}
                                    onPress={this.handleDiscardAmount}
                                />
                            </View>
                        </View>
                    </> : null}
            </View>
        )
    }

    render() {

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

        return (
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
                    keyboardShouldPersistTaps='handled'
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
                            // subtitle={startTime && endTime ? startTime.toString().split(' ')[1] + ' ' + startTime.getDate() + ', ' + startTime.getFullYear() + ' - ' + endTime.toString().split(' ')[1] + ' ' + endTime.getDate() + ', ' + endTime.getFullYear() : ''}
                            iconType="timeArray"
                            rightContent={selectedContent === 'TIME' ? 'arrow_up' : 'arrow_down'}
                            onPress={() => this.handleOpenContent('TIME')}
                            last
                        />
                        {selectedContent === 'TIME' && this.renderContent('TIME')}
                        <ListItem
                            title="Amount range"
                            subtitle="All amount"
                            iconType="amountRange"
                            rightContent={selectedContent === 'AMOUNT' ? 'arrow_up' : 'arrow_down'}
                            onPress={() => this.handleOpenContent('AMOUNT')}
                            last
                        />
                        {selectedContent === 'AMOUNT' && this.renderContent('AMOUNT')}
                    </View>
                    <View>
                        <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>Download transactions history</Text>
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
                    containerStyle={{ marginHorizontal: GRID_SIZE, marginBottom: GRID_SIZE }}
                    onPress={this.handlePickFilter}
                />
            </ScreenWrapper>
        )
    }
}

TransactionFilter.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedCryptoCurrencyData: getSelectedCryptoCurrencyData(state),
        filterData: getFilterData(state)
    }
}

export default connect(mapStateToProps)(TransactionFilter)

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
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        marginLeft: 10
    },
    inputButton: {
        minWidth: 120,
        maxWidth: 150,
        minHeight: 28,
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
    },
    amountInput: {
        justifyContent: 'center',
        borderRadius: 10,
        elevation: 10,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        },
    }
})