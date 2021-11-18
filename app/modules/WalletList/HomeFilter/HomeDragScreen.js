import React, { PureComponent } from 'react'
import {
    Vibration
} from 'react-native'
import { connect } from 'react-redux'

import DraggableFlatList from 'react-native-draggable-flatlist'

import _orderBy from 'lodash/orderBy'
import _isEqual from 'lodash/isEqual'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'

import { getSortValue } from '@app/appstores/Stores/Main/selectors'
import { getVisibleCurrencies } from '@app/appstores/Stores/Currency/selectors'
import { getIsBalanceVisible } from '@app/appstores/Stores/Settings/selectors'

import CryptoCurrency from '../elements/CryptoCurrency'
import { getSortedData } from '../helpers'

import Log from '@app/services/Log/Log'
import { ThemeContext } from '@app/theme/ThemeProvider'
import { strings } from '@app/services/i18n'
import { setSortValue } from '@app/appstores/Stores/Main/MainStoreActions'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'

class HomeDragScreen extends PureComponent {

    constructor(props) {
        super(props)
        this.state = {
            isCurrentlyDraggable: false,
            originalData: [],
            data: [],
            currenciesOrder: []
        }

        this.getCurrenciesOrder()
    }

    static getDerivedStateFromProps(nextProps, prevState) {
        let newState = null

        if (!_isEqual(nextProps.currencies, prevState.originalData)) {
            newState = {}
            const currenciesOrder = prevState.currenciesOrder
            const currenciesLength = nextProps.currencies.length
            const data = _orderBy(nextProps.currencies, c => currenciesOrder.indexOf(c.currencyCode) !== -1 ? currenciesOrder.indexOf(c.currencyCode) : currenciesLength)
            newState.data = data
            newState.originalData = nextProps.currencies
            const newOrder = data.map(c => c.currencyCode)
            if (currenciesOrder.length && !_isEqual(currenciesOrder, newOrder)) {
                newState.currenciesOrder = newOrder
                trusteeAsyncStorage.setCurrenciesList(JSON.stringify(newOrder))
            }
        }

        return newState
    }

    componentDidUpdate(prevProps){
        if (!_isEqual(prevProps.sortValue, this.props.sortValue)) {
            this.setState({
                data: getSortedData(this.state.originalData, this.state.data, this.props.sortValue)
            })
        }
    }

    getCurrenciesOrder = async () => {
        try {
            const res = await trusteeAsyncStorage.getCurrenciesList()
            const currenciesOrder = res !== null ? JSON.parse(res) : []
            const currenciesLength = this.state.data.length

            this.setState(state => ({
                currenciesOrder,
                data: _orderBy(state.data, c => currenciesOrder.indexOf(c.currencyCode) !== -1 ? currenciesOrder.indexOf(c.currencyCode) : currenciesLength)
            }))
        } catch (e) {
            Log.err(`HomeScreen getCurrenciesOrder error ${e.message}`)
        }
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handlRightAction = () => {
        NavStore.goNext('HomeSortScreen')
    }

    onDragBegin = () => {
        Vibration.vibrate(100)
        this.setState(() => ({ isCurrentlyDraggable: true }))
    }

    onDragEnd = ({ data }) => {
        const currenciesOrder = data.map(c => c.currencyCode)
        trusteeAsyncStorage.setCurrenciesList(JSON.stringify(currenciesOrder))
        this.setState({ data, isCurrentlyDraggable: false })
        setSortValue('custom')
        trusteeAsyncStorage.setSortValue('custom')
    }

    render() {

        const {
            GRID_SIZE
        } = this.context

        return (
            <ScreenWrapper
                title={strings('homeScreen.settings')}
                leftType='done'
                leftAction={this.handleBack}
                rightType='sort'
                rightAction={this.handlRightAction}
            >
                <DraggableFlatList
                    data={getSortedData(this.state.originalData, this.state.data, this.props.sortValue)}
                    extraData={getSortedData(this.state.originalData, this.state.data, this.props.sortValue)}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: GRID_SIZE }}
                    autoscrollSpeed={300}
                    renderItem={({ item, drag, isActive }) => (
                        <CryptoCurrency
                            cryptoCurrency={item}
                            isBalanceVisible={this.props.isBalanceVisible}
                            onDrag={drag}
                            isActive={isActive}
                            constructorMode={true}
                        />
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    onDragEnd={this.onDragEnd}
                    onDragBegin={this.onDragBegin}
                />

            </ScreenWrapper>
        )
    }
}

HomeDragScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        currencies: getVisibleCurrencies(state),
        isBalanceVisible: getIsBalanceVisible(state.settingsStore),
        sortValue: getSortValue(state)
    }
}

export default connect(mapStateToProps)(HomeDragScreen)