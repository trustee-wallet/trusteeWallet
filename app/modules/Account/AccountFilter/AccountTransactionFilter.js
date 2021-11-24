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
import { strings } from '@app/services/i18n'

import { getFilterData, getSelectedCryptoCurrencyData } from '@app/appstores/Stores/Main/selectors'
import { setFilter } from '@app/appstores/Stores/Main/MainStoreActions'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import DatePickerComponent from './elements/DatePicker'
import AmountInputContainer from './elements/AmountInput'
import { getCurrentDate } from '../helpers'

const CustomLayoutAnimation = {
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
        startAmount: this.props.filterData?.startAmount ? this.getPrettyAmount(this.props.filterData?.startAmount) : '',
        endAmount: this.props.filterData?.endAmount ? this.getPrettyAmount(this.props.filterData?.endAmount) : '',
        filterOriginData: this.props.filterData
    }

    startAmountInput = React.createRef()
    endAmountInput = React.createRef()

    getPrettyAmount = (amount) => {
        return BlocksoftPrettyNumbers.setCurrencyCode(this.props.selectedCryptoCurrencyData.currencyCode).makePretty(amount)
    }

    handleBack = () => {
        setFilter(this.state.filterData)
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
            selectedContent: title === this.state.selectedContent ? null : title
        })
    }

    handleSaveStartDate = startTime => this.setState({ startTime })

    handleSaveEndDate = endTime => this.setState({ endTime })


    handleDiscardDate = () => {
        this.setState({
            startTime: null,
            endTime: null
        })
    }

    handleDiscardAmount = () => {
        this.setState({
            startAmount: '',
            endAmount: ''
        })
    }

    handleSetStartAmount = startAmount => this.setState({ startAmount })

    handleSetEndAmount = endAmount => this.setState({ endAmount })

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

    renderContent = (content) => {

        const { GRID_SIZE } = this.context

        const {
            startTime,
            endTime,
            startAmount,
            endAmount,
            selectedContent
        } = this.state

        const { currencySymbol } = this.props.selectedCryptoCurrencyData

        if (content !== selectedContent) return null

        return (
            <View>
                {content === 'TIME' ?
                    <View style={{ marginBottom: GRID_SIZE * 1.5 }}>
                        <DatePickerComponent
                            value={startTime}
                            onDateChange={this.handleSaveStartDate}
                        />
                        <View style={{ marginTop: GRID_SIZE }}>
                            <DatePickerComponent
                                value={endTime}
                                onDateChange={this.handleSaveEndDate}
                            />
                        </View>
                        <View style={[styles.buttonContainer, { marginTop: GRID_SIZE * 1.5 }]}>
                            <Button
                                title={strings('account.transaction.discard')}
                                containerStyle={[styles.discardButton, { padding: GRID_SIZE / 2 }]}
                                onPress={this.handleDiscardDate}
                            />
                        </View>
                    </View>
                    : content === 'AMOUNT' ?
                        <View>
                            <AmountInputContainer
                                ref={component => this.startAmountInput = component}
                                value={startAmount}
                                onChange={this.handleSetStartAmount}
                                currencyCode={currencySymbol}
                            />
                            <View style={{ marginTop: GRID_SIZE }}>
                                <AmountInputContainer
                                    ref={component => this.endAmountInput = component}
                                    value={endAmount}
                                    onChange={this.handleSetEndAmount}
                                    currencyCode={currencySymbol}
                                />
                            </View>
                            <View style={[styles.buttonContainer, { marginTop: GRID_SIZE * 1.5 }]}>
                                <Button
                                    title={strings('account.transaction.discard')}
                                    containerStyle={[styles.discardButton, { padding: GRID_SIZE / 2 }]}
                                    onPress={this.handleDiscardAmount}
                                />
                            </View>
                        </View>
                        : null}
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

        return (
            <ScreenWrapper
                title={strings('account.transaction.filterTitle')}
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
            >
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.scrollViewContent, { marginTop: GRID_SIZE * 1.5, paddingHorizontal: GRID_SIZE, paddingBottom: GRID_SIZE * 2 }]}
                    keyboardShouldPersistTaps='handled'
                >
                    <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE }]}>{strings('account.transaction.transactionCategories')}</Text>
                    <ListItem
                        title={strings('account.transaction.categoriesTitle')}
                        iconType='categories'
                        rightContent='arrow'
                        onPress={this.handleCategories}
                        last
                    />
                    <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>{strings('account.transaction.dateAmount')}</Text>
                    <View>
                        <ListItem
                            title={strings('account.transaction.timeArray')}
                            subtitle={startTime && endTime ? getCurrentDate(startTime) + ' - ' + getCurrentDate(endTime) : ''}
                            iconType='timeArray'
                            rightContent={selectedContent === 'TIME' ? 'arrow_up' : 'arrow_down'}
                            onPress={() => this.handleOpenContent('TIME')}
                            last
                        />
                        {this.renderContent('TIME')}
                        <ListItem
                            title={strings('account.transaction.amountRange')}
                            subtitle={strings('account.transaction.allAmount')}
                            iconType='amountRange'
                            rightContent={selectedContent === 'AMOUNT' ? 'arrow_up' : 'arrow_down'}
                            onPress={() => this.handleOpenContent('AMOUNT')}
                            last
                        />
                        {this.renderContent('AMOUNT')}
                    </View>
                    <View>
                        <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>{strings('account.transaction.downloadTransactionsHistory')}</Text>
                        <ListItem
                            title={strings('modal.infoUpdateModal.download')}
                            subtitle={strings('account.transaction.saveInCsv')}
                            iconType='downloadDoc'
                            onPress={this.handlePickDate}
                            last
                        />
                    </View>

                </ScrollView>
                <Button
                    title={strings('send.setting.apply')}
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
        minWidth: 120,
        maxWidth: 150
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center'
    }
})