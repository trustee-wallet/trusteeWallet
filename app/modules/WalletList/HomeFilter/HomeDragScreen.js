/**
 * @version 0.52
 * @author yura
 */

import React, { PureComponent } from 'react'
import {
    Text,
    Platform,
    View,
    Dimensions
} from 'react-native'
import { connect } from 'react-redux'

import DraggableFlatList from 'react-native-draggable-flatlist'

import _isEqual from 'lodash/isEqual'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'

import { getSortValue } from '@app/appstores/Stores/Main/selectors'
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

import LottieView from 'lottie-react-native'
import Button from '@app/components/elements/new/buttons/Button'

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

class HomeDragScreen extends PureComponent {

    state = {
        isCurrentlyDraggable: false,
        originalData: [],
        data: [],
        currenciesOrder: [],
        sortValue: this.props.sortValue || trusteeAsyncStorage.getSortValue(),
        isTraining: true
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

    componentWillMount() {
        trusteeAsyncStorage.getIsTraining().then(res => {
            this.setState(({
                isTraining : res === '1',
            }))
        })

    }

    handleDone = () => {

        if (this.state.sortValue === 'custom') {
            const currenciesOrder = this.state.data.map(c => c.currencyCode)
            trusteeAsyncStorage.setCurrenciesList(currenciesOrder)
        }

        NavStore.goBack()
    }

    handlRightAction = () => {
        NavStore.goNext('HomeSortScreen')
    }

    onDragBegin = () => {
        this.setState(() => ({ isCurrentlyDraggable: true }))
    }

    onDragEnd = ({ data }) => {
        this.setState({ data, isCurrentlyDraggable: false, sortValue: 'custom' })
        setSortValue('custom')
        trusteeAsyncStorage.setSortValue('custom')
    }

    renderTrainingAnimation = () => {

        const {
            GRID_SIZE,
            isLight,
            colors
        } = this.context

        return(
            <View style={styles.guideContainer}>
                <LottieView
                    style={{
                        width: WINDOW_WIDTH * 0.5,
                        height: WINDOW_HEIGHT * 0.6
                    }}
                    autoPlay
                    loop
                    speed={0.8}
                    source={isLight ? require('@assets/jsons/animations/TabAnimationLight.json') : require('@assets/jsons/animations/TabAnimationDark.json')}
                />
                <View>
                    <Text style={[styles.guideTitle, { color: colors.common.text3, marginBottom: GRID_SIZE / 2 }]}>{strings('modal.dropDownModal.guideTitle')}</Text>
                    <Text style={[styles.guideText, { color: colors.common.text3, marginHorizontal: GRID_SIZE * 2 }]}>{strings('modal.dropDownModal.guideText')}</Text>
                </View>
                <Button
                    title={strings('modal.backDropModal.guideAccept')}
                    onPress={() => {
                        trusteeAsyncStorage.setIsTraining(false)
                        this.triggerGuide()  
                    }}
                    containerStyle={{ width: WINDOW_WIDTH - GRID_SIZE * 2, marginBottom: GRID_SIZE }}
                />
            </View>
        )
    }

    triggerGuide = () => { 
        this.setState({
            isTraining: !this.state.isTraining
        })    
    }  

    render() {

        const {
            GRID_SIZE,
            colors
        } = this.context

        const data = getSortedData(this.state.originalData, this.state.data, this.props.accountList, this.state.sortValue === 'custom' ? '' : this.state.sortValue)

        return (
            <ScreenWrapper
                title={strings('homeScreen.settings')}
                leftType='done'
                leftAction={this.handleDone}
                rightType='sort'
                rightAction={this.handlRightAction}
                withoutSafeArea
            >
                {this.state.isTraining ?
                    this.renderTrainingAnimation() :
                <>
                <View style={{ marginBottom: Platform.OS === 'ios' ? GRID_SIZE * 5 : GRID_SIZE * 2.5 }} />
                <DraggableFlatList
                    data={data}
                    extraData={data}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingVertical: GRID_SIZE }}
                    autoscrollSpeed={300}
                    renderItem={({ item, index, drag, isActive }) => (
                        <CryptoCurrency
                            index={index}
                            cryptoCurrency={item}
                            isBalanceVisible={this.props.isBalanceVisible}
                            onDrag={drag}
                            isActive={isActive}
                            constructorMode={true}
                            listData={data}
                            onDragEnd={this.onDragEnd}
                            triggerGuide={this.triggerGuide}
                        />
                    )}
                    keyExtractor={(item, index) => index.toString()}
                    onDragEnd={this.onDragEnd}
                    onDragBegin={this.onDragBegin}
                    ListFooterComponent={(<View style={{ marginBottom: GRID_SIZE * 1.5 }} />)}
                />
                <GradientView style={styles.bottomButtons} array={colors.accountScreen.bottomGradient} start={styles.containerBG.start} end={styles.containerBG.end} />
                </>
}
            </ScreenWrapper>
        )
    }
}

HomeDragScreen.contextType = ThemeContext

const mapStateToProps = (state) => {
    return {
        currencies: getVisibleCurrencies(state),
        isBalanceVisible: getIsBalanceVisible(state.settingsStore),
        sortValue: getSortValue(state),
        accountList: getAccountList(state)
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
    },
    guideContainer: {
        width: '100%', 
        height: '100%', 
        alignItems: 'center', 
        justifyContent: 'space-between'
    },
    guideText: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        textAlign: 'center'
    },
    guideTitle: {
        textAlign: 'center', 
        fontSize: 24, 
        lineHeight: 28, 
        fontFamily: 'SFUIDisplay-Semibold'
    }
}
