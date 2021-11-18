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
    LayoutAnimation
} from 'react-native'

import { connect } from 'react-redux'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { ThemeContext } from '@app/theme/ThemeProvider'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import Button from '@app/components/elements/new/buttons/Button'
import DatePicker from 'react-native-date-picker'
import { strings } from '@app/services/i18n'

import { getFilterData, getSelectedCryptoCurrencyData } from '@app/appstores/Stores/Main/selectors'
import { setFilter } from '@app/appstores/Stores/Main/MainStoreActions'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import TextAndButton from '@app/components/elements/new/TextAndButton'
import InputAndButton from '@app/components/elements/new/InputAndButton'

var CustomLayoutAnimation = {
    duration: 800,
    create: {
        type: LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
    },
    update: {
        type: LayoutAnimation.Types.spring,
        springDamping: 1.2
    },
    delate: {
        type: LayoutAnimation.Types.linear,
        property: LayoutAnimation.Properties.opacity,
    }
  };

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
        LayoutAnimation.configureNext(CustomLayoutAnimation);
        this.setState({
            selectedContent: title === this.state.selectedContent ? null : title,
            openEndTime: false,
            openStartTime: false
        })
    }

    handleOpenStartTime = () => {
        LayoutAnimation.configureNext(CustomLayoutAnimation);
        this.setState({
            startTime: this.state.openStartTime ? this.state.startTime : new Date(),
            openStartTime: !this.state.openStartTime
        })
    }

    handleOpenEndTime = () => {
        LayoutAnimation.configureNext(CustomLayoutAnimation);
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
        LayoutAnimation.configureNext(CustomLayoutAnimation);
        this.setState({
            openStartAmount: !this.state.openStartAmount
        })
    }

    handleOpenEndAmount = () => {
        LayoutAnimation.configureNext(CustomLayoutAnimation);
        this.setState({
            openEndAmount: !this.state.openEndAmount
        })
    }

    handleSetStartAmount = () => {
        LayoutAnimation.configureNext(CustomLayoutAnimation);
        const startAmount = this.startAmountInput.getValue()
        this.setState({
            startAmount: startAmount,
            openStartAmount: false
        })
    }

    handleSetEndAmount = () => {
        LayoutAnimation.configureNext(CustomLayoutAnimation);
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
                        <TextAndButton
                            title={strings('account.transaction.startDate')}
                            buttonText={startTime ? this.getCurrentDate(startTime) : strings('account.transaction.pickDate')}
                            onPress={this.handleOpenStartTime}
                        />  
                        {this.state.openStartTime &&
                            <View style={{ backgroundColor: '#F5F5F5', marginTop: GRID_SIZE, borderRadius: 14 }}>
                                <DatePicker
                                    date={startTime}
                                    mode='date'
                                    style={{ marginLeft: GRID_SIZE * 1.5 }}
                                    onDateChange={this.handleSaveStartDate}
                                />
                            </View>}
                        <View style={{ marginTop: GRID_SIZE }}>
                            <TextAndButton
                                title={strings('account.transaction.endDate')}
                                buttonText={endTime ? this.getCurrentDate(endTime) : strings('account.transaction.pickDate')}
                                onPress={this.handleOpenEndTime}
                            />  
                        </View>
                        {this.state.openEndTime &&
                            <View style={{ backgroundColor: '#F5F5F5', marginTop: GRID_SIZE, borderRadius: 14 }}>
                                <DatePicker
                                    date={endTime}
                                    mode='date'
                                    style={{ marginLeft: GRID_SIZE * 1.5 }}
                                    onDateChange={e => this.handleSaveEndDate(e)}
                                />
                            </View>}
                        <View style={[styles.buttonContainer, { marginTop: GRID_SIZE * 1.5 }]}>
                            <Button
                                title={strings('account.transaction.discard')}
                                containerStyle={styles.discardButton}
                                onPress={this.handleDiscardDate}
                            />
                        </View>
                    </View>
                </View> : null}
                {content === 'AMOUNT' ?
                    <>
                        <View style={{ flex: 1, flexDirection: 'column' }}>
                            <TextAndButton
                                title={strings('account.transaction.startAmount')}
                                buttonText={this.state.startAmount === '' ? strings('account.transaction.setAmount') : `${this.state.startAmount} ${currencySymbol}`}
                                onPress={this.handleOpenStartAmount}
                            />    
                            {this.state.openStartAmount &&    
                                <InputAndButton
                                    ref={this.startAmountInput} 
                                    placeholder={strings('account.transactionScreen.transactionAmount', { currencyCode: currencySymbol })}
                                    onPress={this.handleSetStartAmount}
                                />}
                            <View style={{ marginTop: GRID_SIZE }}>
                                 <TextAndButton
                                    title={strings('account.transaction.endAmount')}
                                    buttonText={this.state.endAmount === '' ? strings('account.transaction.setAmount') : `${this.state.endAmount} ${currencySymbol}`}
                                    onPress={this.handleOpenEndAmount}
                                />    
                            </View>
                            {this.state.openEndAmount &&
                                <InputAndButton
                                    ref={this.endAmountInput} 
                                    placeholder={strings('account.transactionScreen.transactionAmount', { currencyCode: currencySymbol })}
                                    onPress={this.handleSetEndAmount}
                                />} 
                            <View style={[styles.buttonContainer, { marginTop: GRID_SIZE * 1.5 }]}>
                                <Button
                                    title={strings('account.transaction.discard')}
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
                title={strings('account.transaction.filterTitle')}
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
                    <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>{strings('account.transaction.transactionCategories')}</Text>
                    <View>
                        <ListItem
                            title={strings('account.transaction.categoriesTitle')}
                            subtitle="4 selected"
                            iconType="categories"
                            rightContent="arrow"
                            onPress={this.handleCategories}
                            last
                        />
                    </View>
                    <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>{strings('account.transaction.dateAmount')}</Text>
                    <View>
                        <ListItem
                            title={strings('account.transaction.timeArray')}
                            // subtitle={startTime && endTime ? startTime.toString().split(' ')[1] + ' ' + startTime.getDate() + ', ' + startTime.getFullYear() + ' - ' + endTime.toString().split(' ')[1] + ' ' + endTime.getDate() + ', ' + endTime.getFullYear() : ''}
                            iconType="timeArray"
                            rightContent={selectedContent === 'TIME' ? 'arrow_up' : 'arrow_down'}
                            onPress={() => this.handleOpenContent('TIME')}
                            last
                        />
                        {selectedContent === 'TIME' && this.renderContent('TIME')}
                        <ListItem
                            title={strings('account.transaction.amountRange')}
                            subtitle={strings('account.transaction.allAmount')}
                            iconType="amountRange"
                            rightContent={selectedContent === 'AMOUNT' ? 'arrow_up' : 'arrow_down'}
                            onPress={() => this.handleOpenContent('AMOUNT')}
                            last
                        />
                        {selectedContent === 'AMOUNT' && this.renderContent('AMOUNT')}
                    </View>
                    <View>
                        <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>{strings('account.transaction.downloadTransactionsHistory')}</Text>
                        <ListItem
                            title={strings('modal.infoUpdateModal.download')}
                            subtitle={strings('account.transaction.saveInCsv')}
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
    discardButton: {
        height: 32,
        minWidth: 120,
        maxWidth: 150
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center'
    }
})