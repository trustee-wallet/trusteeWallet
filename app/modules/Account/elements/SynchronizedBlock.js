/**
 * @version 0.52
 * @author yura
 */

import React from 'react'
import { View, Text, StyleSheet, Dimensions } from 'react-native'
import LottieView from 'lottie-react-native'

import _isEqual from 'lodash/isEqual'

import { ThemeContext } from '@app/theme/ThemeProvider'
import { HIT_SLOP } from '@app/theme/HitSlop'

import Loader from '@app/components/elements/LoaderItem'
import CustomIcon from '@app/components/elements/CustomIcon'
import TextInput from '@app/components/elements/NewInput'
import NavStore from '@app/components/navigation/NavStore'

import { setFilter } from '@app/appstores/Stores/Main/MainStoreActions'

import { strings } from '@app/services/i18n'

import blackLoader from '@assets/jsons/animations/refreshBlack.json'
import whiteLoader from '@assets/jsons/animations/refreshWhite.json'

import { diffTimeScan } from '../helpers'
import Message from '@app/components/elements/new/Message'
import TouchableDebounce from '@app/components/elements/new/TouchableDebounce'

const { width: SCREEN_WIDTH } = Dimensions.get('window')

class SynchronizedBlock extends React.PureComponent {

    state = {
        searchQuery: this.props.filterData?.searchQuery || '',
        error: null,
        activeFilter: this.props.filterData && this.props.filterData?.active && !this.props.filterData?.searchQuery
    }

    linkInput = React.createRef()

    async componentDidMount() {
        if (this.linkInput) {
            await this.linkInput?.handleInput(this.state.searchQuery)
        }
    }

    componentDidUpdate(prevProps) {
        if (!_isEqual(prevProps.filterData.acitve, this.props.filterData.acitve)) {
            this.setState({
                activeFilter: this.props.filterData && this.props.filterData?.active && !this.props.filterData?.searchQuery
            })
        }
    }

    handleFilter = () => {
        NavStore.goNext('TransactionFilter')
    }

    handleChangeText = (value) => {
        this.setState({
            searchQuery: value.trim(),
            error: false
        })
    }

    handleSearch = async () => {
        if (!this.linkInput?.getValue() ? '' : this.linkInput.getValue()) {
            const searchQuery = this.linkInput.getValue()
            const filter = {
                searchQuery
            }
            setFilter(filter, 'SynchronizedBlock.handleSearch')
        }
    }

    render() {
        let {
            allTransactionsToView,
            transactionsToView,
            selectedAccountData,
            clickRefresh,
            selectedAccountTransactions,
            handleRefresh,
            toggleSearch,
            isSeaching,
            notFound
        } = this.props

        const { colors, GRID_SIZE, isLight } = this.context

        const { balanceScanTime, balanceScanError, isSynchronized } = selectedAccountData

        const { activeFilter } = this.state

        if (typeof transactionsToView === 'undefined' || !transactionsToView || transactionsToView.length === 0) {
            transactionsToView = selectedAccountTransactions.transactionsToView
        }

        const diff = diffTimeScan(balanceScanTime)
        const isBalanceScanError = balanceScanError && balanceScanError !== '' && balanceScanError !== 'null'
        let diffTimeText = ''
        if (diff > 60) {
            diffTimeText = strings('account.soLong')
        } else {
            if (diff < 1) {
                diffTimeText = strings('account.justScan')
            } else {
                diffTimeText = strings('account.scan', { time: diff })
            }
            if (isBalanceScanError) {
                diffTimeText += '\n' + strings(balanceScanError)
            }
        }

        return (
            <View style={{ flexDirection: 'column', margin: GRID_SIZE }}>
                <View style={[styles.container, { marginRight: GRID_SIZE }]}>
                    <View style={{ flexDirection: 'column' }} >
                        {!isSeaching ?
                            <View style={{ height: 60, justifyContent: 'center' }}>
                                <Text style={[styles.history_title, { color: colors.common.text1 }]}>{strings('account.history')}</Text>
                                <View style={[styles.scan, { marginLeft: GRID_SIZE }]}>
                                    {isSynchronized ?
                                        <Text style={[styles.scan__text, { color: (diff && diff >= 10 || isBalanceScanError) ? colors?.accountScreen?.balanceLongScan : colors.common.text2 }]} numberOfLines={2}>{diffTimeText}</Text>
                                        :
                                        <View style={styles.synchronized__loader}>
                                            <Text style={[styles.synchronized__text, { color: colors.common.text1 }]}>
                                                {strings('homeScreen.synchronizing')}
                                            </Text>
                                            <Loader size={14} color='#999999' />
                                        </View>}
                                </View>
                            </View> :
                            <View style={[styles.textInput, { height: 50, marginVertical: 5 }]}>
                                <TextInput
                                    ref={input => { this.linkInput = input }}
                                    style={{ width: SCREEN_WIDTH * 0.7 }}
                                    name={strings('assets.searchPlaceholder')}
                                    type='TRANSACTION_SEARCH'
                                    id='TRANSACTION_SEARCH'
                                    containerStyle={{ height: 50 }}
                                    inputStyle={{ marginTop: -6 }}
                                    pasteCallback={this.handleSearch}
                                    paste={true}
                                    addressError={this.state.error}
                                    validPlaceholder={true}
                                />
                            </View>}
                    </View>
                    <View style={styles.btns}>
                        {/* {!isSeaching &&
                            <TouchableDebounce
                                style={{ marginHorizontal: GRID_SIZE / 2 }}
                                onPress={toggleSearch}
                                hitSlop={HIT_SLOP}
                            >
                                <CustomIcon name='search' size={20} color={colors.common.text1} />
                            </TouchableDebounce>
                        } */}
                        <TouchableDebounce
                            style={{ marginHorizontal: GRID_SIZE / 2 }}
                            onPress={() => !isSeaching ? handleRefresh(true) : toggleSearch()}
                            hitSlop={HIT_SLOP}
                        >
                            {clickRefresh ?
                                <LottieView
                                    style={{ width: 20, height: 20, }}
                                    source={isLight ? blackLoader : whiteLoader}
                                    autoPlay
                                    loop /> :
                                <CustomIcon name={!isSeaching ? 'reloadTx' : 'cancelTxHistory'} size={20} color={colors.common.text1} />}
                        </TouchableDebounce>
                        <TouchableDebounce
                            style={[styles.activeFilter, { backgroundColor: activeFilter ? colors.common.checkbox.bgChecked + '26' : 'transparent', marginLeft: GRID_SIZE / 4 }]}
                            onPress={this.handleFilter}
                            hitSlop={HIT_SLOP}
                        >
                            <CustomIcon name='filter' size={20} color={activeFilter ? colors.common.checkbox.bgChecked : colors.common.text1} style={{ marginTop: 2 }} />
                        </TouchableDebounce>
                    </View>
                </View>
                {notFound && (
                    <Message
                        name='warningM'
                        timer={false}
                        text={strings('account.noFoundTransactions')}
                        containerStyles={{ marginTop: GRID_SIZE, marginHorizontal: GRID_SIZE }}
                    />
                )}
                {allTransactionsToView.length === 0 && (!transactionsToView || transactionsToView.length === 0) && isSynchronized ?
                    <View style={{ marginRight: GRID_SIZE }} >
                        <Text style={[styles.synchronized__text, { marginLeft: GRID_SIZE, marginTop: GRID_SIZE, color: colors.common.text3 }]}>
                            {strings('account.noTransactions')}
                        </Text>
                    </View>
                    : null}
            </View>
        )
    }
}

SynchronizedBlock.contextType = ThemeContext

export default SynchronizedBlock

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        position: 'relative',
        justifyContent: 'space-between'
    },
    history_title: {
        marginLeft: 16,
        marginBottom: 4,
        fontSize: 17,
        fontFamily: 'Montserrat-Bold'
    },
    scan: {
        flexDirection: 'row'
    },
    scan__text: {
        letterSpacing: 1,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18
    },
    synchronized__loader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 10,
        marginTop: 2
    },
    synchronized__text: {
        marginLeft: 0,
        marginRight: 10,
        marginTop: 0,
        fontSize: 15,
        lineHeight: 19,
        fontFamily: 'SFUIDisplay-Semibold',
        letterSpacing: 1.5
    },
    textInput: {
        justifyContent: 'center',
        borderRadius: 10,
        elevation: 8,
        shadowColor: '#000',
        shadowRadius: 16,
        shadowOpacity: 0.1,
        shadowOffset: {
            width: 0,
            height: 0
        }
    },
    activeFilter: {
        height: 32,
        width: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 50
    },
    btns: {
        flexDirection: 'row',
        alignItems: 'center'
    }
})
