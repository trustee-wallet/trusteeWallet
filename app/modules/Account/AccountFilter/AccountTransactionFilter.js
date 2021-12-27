/**
 * @version 0.31
 * @author Vadym
 */

import React from 'react'
import {
    View,
    Text,
    ScrollView,
    Platform
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
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'

import Accordion from 'react-native-collapsible/Accordion'
import GradientView from '@app/components/elements/GradientView'

class TransactionFilter extends React.PureComponent {

    state = {
        selectedContent: '',
        startTime: this.props.filterData?.startTime ? new Date(this.props.filterData?.startTime) : null,
        endTime: this.props.filterData?.endTime ? new Date(this.props.filterData?.endTime) : null,
        startAmount: null,
        endAmount: null,
        filterOriginData: this.props.filterData,
        activeSections: [],
        sections: []
    }

    startAmountInput = React.createRef()
    endAmountInput = React.createRef()

    componentDidMount() {
        this.setState({
            startAmount: this.props?.filterData?.startAmount && this.props?.filterData?.startAmount ? this.getPrettyAmount(this.props?.filterData?.startAmount || '') : '',
            endAmount: this.props?.filterData?.endAmount && this.props?.filterData?.endAmount ? this.getPrettyAmount(this.props?.filterData?.endAmount || '') : '',
            sections: [{
                title: strings('account.transaction.timeArray'),
                subtitle: this.state?.startTime && this.state?.endTime ? getCurrentDate(this.state?.startTime) + ' - ' + getCurrentDate(this.state?.endTime) : '',
                iconType: 'timeArray',
                last: true
            },
            {
                title: strings('account.transaction.amountRange'),
                subtitle: strings('account.transaction.allAmount'),
                iconType: 'amountRange',
                last: true
            }]
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
        setFilter({}, 'AccountTransactionFilter.handleClose')
        trusteeAsyncStorage.setAccountFilterData({})
        NavStore.reset('HomeScreen')
    }

    handleCategories = () => {
        NavStore.goNext('TransactionCategories')
    }

    handleSaveStartDate = startTime => {
        this.setState({ 
            startTime,
            sections: [
                {
                    ...this.state.sections[0],
                    subtitle: startTime && this.state?.endTime ? getCurrentDate(startTime) + ' - ' + getCurrentDate(this.state?.endTime) : '',
                },
                this.state.sections[1],
            ]
        })
    }

    handleSaveEndDate = endTime => {
        this.setState({ 
            endTime,
            sections: [
                {
                    ...this.state.sections[0],
                    subtitle: this.state?.startTime && endTime ? getCurrentDate(this.state?.startTime) + ' - ' + getCurrentDate(endTime) : '',
                },
                this.state.sections[1],
            ]
        })
    }


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
            active: !!(startTime || endTime || startAmount || endAmount || this.props.filterData.activeCategories),
            startTime: startTime ? startTime.toISOString() : null,
            endTime: endTime ? endTime.toISOString() : null,
            startAmount: startAmount ? BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(startAmount) : null,
            endAmount: endAmount ? BlocksoftPrettyNumbers.setCurrencyCode(currencyCode).makeUnPretty(endAmount) : null
        }

        setFilter(filter, 'AccountTransactionFilter.handlePickFilter')
        trusteeAsyncStorage.setAccountFilterData(filter)

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

        const fields = ['createdAtUTC', 'transactionDirection', 'transactionStatus', 'transactionHash', 'addressFrom', 'addressTo', 'addressAmount', 'transactionFee', 'blockConfirmations']

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

    _renderHeader = (section, index, isActive) => {

        const {
            colors,
            GRID_SIZE
        } = this.context

        const active = index === 0 ? this.state.startTime || this.state.endTime : this.state.startAmount || this.state.endAmount

        return (
            <>
                <ListItem
                    title={section.title}
                    subtitle={section.subtitle}
                    iconType={section.iconType}
                    rightContent={isActive ? 'arrow_up' : 'arrow_down'}
                    last={section.last}
                    disabled={true}
                    opacityWithDisabled={true}
                    customIconStyle={this.getSelectedIconStyles(active)}
                />
                {index === 0 && !isActive && <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 3 }} />}
            </>
        )
    }

    _renderContent = (section, index) => {
        const { GRID_SIZE, colors } = this.context
        const {
            startTime,
            endTime,
            startAmount,
            endAmount,
        } = this.state

        const { currencySymbol } = this.props.selectedCryptoCurrencyData

        return (
            <>
                {index === 0 ? <>
                    <View style={{ paddingBottom: GRID_SIZE * 1.5 }}>
                        <DatePickerComponent
                            value={startTime}
                            onDateChange={this.handleSaveStartDate}
                        />
                        <View style={{ paddingTop: GRID_SIZE }}>
                            <DatePickerComponent
                                value={endTime}
                                onDateChange={this.handleSaveEndDate}
                                side='out'
                            />
                        </View>
                        <View style={[styles.buttonContainer, { paddingTop: GRID_SIZE * 1.5 }]}>
                            <Button
                                title={strings('account.transaction.discard')}
                                containerStyle={[styles.discardButton, { padding: GRID_SIZE / 2, backgroundColor: colors.common.button.bg }]}
                                onPress={this.handleDiscardDate}
                                type='withoutShadow'
                                textStyle={[styles.discardButtonText, { color: colors.common.button.text }]}
                            />
                        </View>

                    </View>
                    <View style={{ height: 1, backgroundColor: colors.common.listItem.basic.borderColor, marginLeft: GRID_SIZE * 3 }} />
                </> :
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
                                textStyle={[styles.discardButtonText, { color: colors.common.button.text }]}
                            />
                        </View>
                    </View>}
            </>
        )
    }

    _updateSections = (activeSections) => {
        this.setState({ activeSections })
    }

    handleCleanFilter = () => {
        setFilter({}, 'AccountTransactionFilter.handleCleanFilter')
        trusteeAsyncStorage.setAccountFilterData({})

        NavStore.goBack()
    }

    getSelectedIconStyles = (active) => {

        const {
            colors
        } = this.context

        return {
            color: active ? colors.common.checkbox.bgChecked : colors.common.listItem.basic.iconColorLight,
            backgroundColor: active ? colors.common.checkbox.bgChecked + '26' : colors.common.listItem.basic.iconBgLight
        }
    }

    render() {

        const {
            colors,
            GRID_SIZE
        } = this.context

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
                        customIconStyle={this.getSelectedIconStyles(this.props.filterData?.activeCategories)}
                    />
                    <Text style={[styles.blockTitle, { color: colors.common.text3, marginLeft: GRID_SIZE, marginTop: GRID_SIZE * 1.5 }]}>{strings('account.transaction.dateAmount')}</Text>
                    <View>
                        <Accordion
                            sections={this.state.sections}
                            activeSections={this.state.activeSections}
                            renderHeader={this._renderHeader}
                            renderContent={this._renderContent}
                            onChange={this._updateSections}
                            underlayColor="transparent"
                        />
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
                <View style={[styles.btnsContainer, {
                    bottom: GRID_SIZE,
                    paddingHorizontal: GRID_SIZE
                }]}>
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
                <GradientView
                    style={styles.bottomButtons}
                    array={colors.accountScreen.bottomGradient}
                    start={styles.containerBG.start}
                    end={styles.containerBG.end}
                />
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

const styles = {
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
    },
    bottomButtons: {
        position: 'absolute',
        bottom: 0,
        left: 0,

        width: '100%',
        height: 66,
        paddingBottom: Platform.OS === 'ios' ? 30 : 0
    },
    containerBG: {
        start: { x: 1, y: 0 },
        end: { x: 1, y: 1 }
    },
    discardButtonText: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 14,
        lineHeight: 18
    },
    btnsContainer: {
        position: 'absolute',
        width: '100%',
        zIndex: 2
    }
}
