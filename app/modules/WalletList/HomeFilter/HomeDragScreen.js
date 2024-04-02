/**
 * @version 0.52
 * @author yura
 */

import React, { useEffect, useState } from 'react'
import { Platform, View } from 'react-native'
import { useSelector } from 'react-redux'
import _orderBy from 'lodash/orderBy'

import DraggableFlatList from 'react-native-draggable-flatlist'

import _isEqual from 'lodash/isEqual'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'

import { getHomeFilterWithBalance, getSelectedWalletData, getSortValue } from '@app/appstores/Stores/Main/selectors'
import { getVisibleCurrencies } from '@app/appstores/Stores/Currency/selectors'
import { getIsBalanceVisibleV2 } from '@app/appstores/Stores/Settings/selectors'

import CryptoCurrency from '../elements/CryptoCurrency'
import { getSortedData } from '../helpers'

import { useTheme } from '@app/theme/ThemeProvider'
import { strings } from '@app/services/i18n'
import { setSortValue } from '@app/appstores/Stores/Main/MainStoreActions'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'
import { getAccountList } from '@app/appstores/Stores/Account/selectors'

import GradientView from '@app/components/elements/GradientView'

import Toast from '@app/services/UI/Toast/Toast'

const HomeDragScreen = (props) => {
    const { GRID_SIZE, colors } = useTheme()

    const selectedWalletData = useSelector(getSelectedWalletData)
    const currencies = useSelector(getVisibleCurrencies)
    const isBalanceVisible = useSelector(getIsBalanceVisibleV2)
    const sortValue = useSelector(getSortValue)
    const accountList = useSelector(getAccountList)
    const homeFilterWithBalance = useSelector(getHomeFilterWithBalance)

    const [isFromGuide, setIsFromGuide] = useState(false)
    const [currentSortValue, setCurrentSortValue] = useState(sortValue || trusteeAsyncStorage.getSortValue())
    const [data, setData] = useState([])
    const [originalData, setOriginalData] = useState([])
    const [currenciesOrder, setCurrenciesOrder] = useState([])
    const [isCurrentlyDraggable, setIsCurrentlyDraggable] = useState(false)

    const { walletIsCreatedHere } = selectedWalletData

    useEffect(() => {
        const res = trusteeAsyncStorage.getIsTraining()
        if (typeof res === 'undefined' || res === '0') {
            trusteeAsyncStorage.setIsTraining(false)
            setIsFromGuide(true)
        }
    }, [])

    useEffect(() => {
        if (sortValue) {
            setCurrentSortValue(sortValue)
        }
    }, [sortValue])

    useEffect(() => {
        if (!_isEqual(currencies, originalData)) {
            const _currenciesOrder = currenciesOrder
            const currenciesLength = currencies.length
            const data = _orderBy(currencies, (item) =>
                _currenciesOrder.indexOf(item.currencyCode) !== -1 ? _currenciesOrder.indexOf(item.currencyCode) : currenciesLength
            )

            setOriginalData(currencies)
            setData(getSortedData(currencies, data, accountList, sortValue, homeFilterWithBalance))

            const newOrder = data.map((item) => item.currencyCode)
            if (_currenciesOrder.length && !_isEqual(_currenciesOrder, newOrder)) {
                setCurrenciesOrder(newOrder)
                trusteeAsyncStorage.setCurrenciesList(newOrder)
            }
        }
    }, [originalData, currencies, currenciesOrder, accountList, sortValue, data])

    const onDragBegin = () => {
        setIsCurrentlyDraggable(true)
    }

    const onDragEnd = ({ data }) => {
        if (sortValue !== 'custom') {
            Toast.setMessage(strings('homeScreen.setSortValueCustom')).show()
        }

        setData(data)
        setCurrentSortValue('custom')
        setIsCurrentlyDraggable(false)
        const currenciesOrder = data.map((item) => item?.currencyCode)
        trusteeAsyncStorage.setCurrenciesList(currenciesOrder)
        setSortValue('custom')
        trusteeAsyncStorage.setSortValue('custom')
    }

    const handleGuide = () => {
        NavStore.goNext('GuideScreen')
    }

    const handleDone = () => {
        NavStore.goBack()
        if (isFromGuide) {
            setIsFromGuide(false)
            NavStore.goBack()
        }
    }

    return (
        <ScreenWrapper title={strings('homeScreen.settings')} leftType='done' leftAction={handleDone} withMarginTop>
            <DraggableFlatList
                data={data}
                extraData={data}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: GRID_SIZE }}
                autoscrollSpeed={300}
                renderItem={({ item, getIndex, drag, isActive }) => {
                    return (
                        <CryptoCurrency
                            index={getIndex()}
                            walletIsCreatedHere={walletIsCreatedHere}
                            cryptoCurrency={item}
                            isBalanceVisible={isBalanceVisible}
                            onDrag={drag}
                            isActive={isActive}
                            constructorMode
                            listData={data}
                            onDragEnd={onDragEnd}
                            handleGuide={handleGuide}
                        />
                    )
                }}
                keyExtractor={(item) => item?.currencyCode?.toString()}
                onDragEnd={onDragEnd}
                onDragBegin={onDragBegin}
                ListFooterComponent={<View style={{ marginBottom: GRID_SIZE * 1.5 }} />}
            />
            <GradientView
                style={styles.bottomButtons}
                array={colors.accountScreen.bottomGradient}
                start={styles.containerBG.start}
                end={styles.containerBG.end}
            />
        </ScreenWrapper>
    )
}

export default HomeDragScreen

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
