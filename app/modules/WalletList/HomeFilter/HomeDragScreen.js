/**
 * @version 0.52
 * @author yura
 */

import React, { PureComponent } from 'react'
import {
    Platform,
    View,
} from 'react-native'
import { connect } from 'react-redux'

import DraggableFlatList from 'react-native-draggable-flatlist'

import _isEqual from 'lodash/isEqual'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'

import { getHomeFilterWithBalance, getSelectedWalletData, getSortValue } from '@app/appstores/Stores/Main/selectors'
import { getVisibleCurrencies } from '@app/appstores/Stores/Currency/selectors'
import { getIsBalanceVisible } from '@app/appstores/Stores/Settings/selectors'

import CryptoCurrency from '../elements/CryptoCurrency'
import { getSortedData, getDerivedState } from '../helpers'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { strings } from '@app/services/i18n'
import { setSortValue } from '@app/appstores/Stores/Main/MainStoreActions'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import { getAccountList } from '@app/appstores/Stores/Account/selectors'

import GradientView from '@app/components/elements/GradientView'

import Toast from '@app/services/UI/Toast/Toast'

class HomeDragScreen extends PureComponent {

    state = {
        isCurrentlyDraggable: false,
        originalData: [],
        data: [],
        currenciesOrder: [],
        sortValue: this.props.sortValue || trusteeAsyncStorage.getSortValue(),
        fromGuide: false
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        return getDerivedState(nextProps, prevState)
    }

    componentDidUpdate(prevProps) {
        if (!_isEqual(prevProps.sortValue, this.props.sortValue)) {
            this.setState({
                sortValue: this.props.sortValue
            })
        }
    }

    componentDidMount = () => {
        const res = trusteeAsyncStorage.getIsTraining()
        if (typeof res === 'undefined' || res === '0') {
            trusteeAsyncStorage.setIsTraining(false)
            this.setState({
                fromGuide: true
            })
        }
    }

    handleDone = () => {

        NavStore.goBack()
        if (this.state.fromGuide) {
            this.setState({
                fromGuide: false
            })
            NavStore.goBack()
        }
    }

    handleRightAction = () => {
        this.bottomSheetRef.open()
    }

    onDragBegin = () => {
        this.setState(() => ({ isCurrentlyDraggable: true }))
    }

    onDragEnd = ({ data }) => {
        if (this.state.sortValue !== 'custom') {
            Toast.setMessage(strings('homeScreen.setSortValueCustom')).show()
        }

        this.setState({ data, isCurrentlyDraggable: false, sortValue: 'custom' })
        const currenciesOrder = data.map(c => c.currencyCode)
        trusteeAsyncStorage.setCurrenciesList(currenciesOrder)
        setSortValue('custom')
        trusteeAsyncStorage.setSortValue('custom')
    }

    triggerGuide = () => {
        this.setState({
            isTraining: !this.state.isTraining
        })
    }

    handleGuide = () => {
        NavStore.goNext('GuideScreen')
    }

    render() {

        const { walletIsCreatedHere } = this.props.selectedWalletData

        const {
            GRID_SIZE,
            colors
        } = this.context

        const data = getSortedData(this.state.originalData, this.state.data, this.props.accountList, this.state.sortValue)

        return (
            <ScreenWrapper
                title={strings('homeScreen.settings')}
                leftType='done'
                leftAction={this.handleDone}
                withMarginTop
            >
                <DraggableFlatList
                    data={data}
                    extraData={data}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: GRID_SIZE }}
                    autoscrollSpeed={300}
                    renderItem={({ item, index, drag, isActive }) => (
                        <CryptoCurrency
                            index={index}
                            walletIsCreatedHere={walletIsCreatedHere}
                            cryptoCurrency={item}
                            isBalanceVisible={this.props.isBalanceVisible}
                            onDrag={drag}
                            isActive={isActive}
                            constructorMode={true}
                            listData={data}
                            onDragEnd={this.onDragEnd}
                            handleGuide={this.handleGuide}
                        />
                    )}
                    keyExtractor={(_, index) => index.toString()}
                    onDragEnd={this.onDragEnd}
                    onDragBegin={this.onDragBegin}
                    ListFooterComponent={(<View style={{ marginBottom: GRID_SIZE * 1.5 }} />)}
                />
                <GradientView style={styles.bottomButtons} array={colors.accountScreen.bottomGradient} start={styles.containerBG.start} end={styles.containerBG.end} />
            </ScreenWrapper>
        )
    }
}

HomeDragScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        selectedWalletData: getSelectedWalletData(state),
        currencies: getVisibleCurrencies(state),
        isBalanceVisible: getIsBalanceVisible(state.settingsStore),
        sortValue: getSortValue(state),
        accountList: getAccountList(state),
        homeFilterWithBalance: getHomeFilterWithBalance(state)
    }
}

export default connect(mapStateToProps)(HomeDragScreen)

const styles = {
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
    }
}
