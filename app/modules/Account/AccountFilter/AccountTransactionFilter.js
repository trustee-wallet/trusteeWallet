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

import { getFilterData, getSelectedCryptoCurrencyData, getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'
import { setFilter } from '@app/appstores/Stores/Main/MainStoreActions'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'

import DatePickerComponent from './elements/DatePicker'
import AmountInputContainer from './elements/AmountInput'
import { getCurrentDate } from '../helpers'

import transactionDS from '@app/appstores/DataSource/Transaction/Transaction'

import { Parser } from "json2csv"
import RNFS from 'react-native-fs'
import { FileSystem } from '@app/services/FileSystem/FileSystem'
import Log from '@app/services/Log/Log'
import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import UtilsService from '@app/services/UI/PrettyNumber/UtilsService'
import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'


const CustomLayoutAnimation = {
    duration: 400,
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
        startTime: this.props.filterData?.startTime ?  new Date(this.props.filterData?.startTime) : null,
        endTime: this.props.filterData?.endTime ? new Date(this.props.filterData?.endTime) : null,
        startAmount: null,
        endAmount: null,
        filterOriginData: this.props.filterData
    }

    startAmountInput = React.createRef()
    endAmountInput = React.createRef()

    componentDidMount() {
        this.setState({
            startAmount: this.props?.filterData?.startAmount && this.props?.filterData?.startAmount ? this.getPrettyAmount(this.props?.filterData?.startAmount || '') : '',
            endAmount: this.props?.filterData?.endAmount && this.props?.filterData?.endAmount ? this.getPrettyAmount(this.props?.filterData?.endAmount || '') : '',
        })
    }

    getPrettyAmount = (amount) => {
        return BlocksoftPrettyNumbers.setCurrencyCode(this.props.selectedCryptoCurrencyData.currencyCode).makePretty(amount)
    }

    handleBack = () => {
        setFilter(this.state.filterOriginData, 'AccountTransactionFilter.handleBack')
        NavStore.goBack()
    }

    handleClose = () => {
        setFilter(Object.keys(this.props.filterData).map(key => this.props.filterData[key] = false), 'AccountTransactionFilter.handleClose')
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
            ...this.props.filterData,
            active: true,
            startTime: startTime ? startTime.toISOString() : null,
            endTime: endTime ? endTime.toISOString() : null,
            startAmount: startAmount ? BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(startAmount) : null,
            endAmount: endAmount ? BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(endAmount) : null
        }

        setFilter(filter, 'AccountTransactionFilter.handlePickFilter')

        NavStore.goBack()
    }

    handleDownloadCsvFile = async () => {

        const { currencyCode } = this.props.selectedCryptoCurrencyData
        const { walletHash } = this.props.selectedWalletData


        const params = {
            currencyCode,
            walletHash,
            minAmount: 0
        }

        let res = await transactionDS.getTransactionsForCsvFile(params, 'AccountTransactionFilter')

        res = res.map(item => {
            let createdAtUTC = new Date(item.createdAt).toISOString().split('T')
            createdAtUTC = createdAtUTC[0] + ' ' + createdAtUTC[1].slice(0, -5)

            return {
                ...item,
                createdAtUTC,
                addressAmount: UtilsService.cutNumber(BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(item.addressAmount), 8),
                transactionFee: item.transactionFee ? UtilsService.cutNumber(BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makePretty(item.transactionFee), 8) : ''
            }
        })

        const fields = ['createdAtUTC', 'transactionDirection', 'transactionStatus', 'transactionHash', 'addressFrom','addressTo', 'addressAmount', 'transactionFee', 'blockConfirmations']

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(res);

        const path = RNFS.DocumentDirectoryPath + `/logs/TRUSTEE_REPORT_${currencyCode}.csv`

        // write the file
        RNFS.writeFile(path, csv, 'utf8')
            .then(async () => {
                Log.log('Account/AccountTransactionFilter saveTxHistory success save file ', path)
                const fs = new FileSystem({ fileEncoding: 'utf8', fileName: `TRUSTEE_REPORT_${currencyCode}`, fileExtension: 'csv' });

                const shareOptions = {
                    url: await fs.getPathOrBase64()
                }

                prettyShare(shareOptions)
            })
            .catch((err) => {
                Log.err('Account/AccountTransactionFilter saveTxHistory error save file ', err.message)
            });

    }

    renderContent = (content) => {

        const { GRID_SIZE, colors } = this.context

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
                                side='out'
                            />
                        </View>
                        <View style={[styles.buttonContainer, { marginTop: GRID_SIZE * 1.5 }]}>
                            <Button
                                title={strings('account.transaction.discard')}
                                containerStyle={[styles.discardButton, { padding: GRID_SIZE / 2, backgroundColor: colors.common.button.bg  }]}
                                onPress={this.handleDiscardDate}
                                type='withoutShadow'
                                textStyle={{ color: colors.common.button.text}}
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
                                    side='out'
                                />
                            </View>
                            <View style={[styles.buttonContainer, { marginTop: GRID_SIZE * 1.5 }]}>
                                <Button
                                    title={strings('account.transaction.discard')}
                                    containerStyle={[styles.discardButton, { padding: GRID_SIZE / 2, backgroundColor: colors.common.button.bg }]}
                                    onPress={this.handleDiscardAmount}
                                    type='withoutShadow'
                                    textStyle={{ color: colors.common.button.text}}
                                />
                            </View>
                        </View>
                        : null}
            </View>
        )
    }

    handleCleanFilter = () => {
        setFilter(Object.keys(this.props.filterData).map(key => this.props.filterData[key] = false), 'AccountTransactionFilter.handleCleanFilter')
        NavStore.goBack()
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
                            onPress={this.handleDownloadCsvFile}
                            last
                        />
                    </View>

                </ScrollView>
                <View style={{
                    paddingHorizontal: GRID_SIZE,
                    paddingVertical: GRID_SIZE * 1.5
                }}>
                    <TwoButtons
                        mainButton={{
                            onPress: this.handlePickFilter,
                            title: strings('send.setting.apply')
                        }}
                        secondaryButton={{
                            type: 'clean',
                            onPress: this.handleCleanFilter
                        }}
                    />
                </View>
            </ScreenWrapper>
        )
    }
}

TransactionFilter.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedCryptoCurrencyData: getSelectedCryptoCurrencyData(state),
        selectedWalletData: getSelectedWalletData(state),
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
        maxWidth: 150,
        borderRadius: 8
    },
    buttonContainer: {
        alignItems: 'center',
        justifyContent: 'center'
    }
})
