/**
 * @version 0.77
 * @description ksu jumping
 */

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, FlatList } from 'react-native'
import LottieView from 'lottie-react-native'
import { TabView } from 'react-native-tab-view'
import Animated, { useAnimatedProps, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated'

import NavStore from '@app/components/navigation/NavStore'
import TwoButtons from '@app/components/elements/new/buttons/TwoButtons'
import CheckBox from '@app/components/elements/new/CheckBox'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import Tabs from '@app/components/elements/new/cashbackTabs'
import MnemonicQrCode from '@app/modules/WalletBackup/elements/MnemonicQrCode'
import Message from '@app/components/elements/new/Message'

import { showModal } from '@app/appstores/Stores/Modal/ModalActions'
import { setWalletMnemonic, setMnemonicLength, setWalletName, setFlowType } from '@app/appstores/Stores/CreateWallet/CreateWalletActions'
import BlocksoftKeys from '@crypto/actions/BlocksoftKeys/BlocksoftKeys'
import BlocksoftKeysStorage from '@crypto/actions/BlocksoftKeysStorage/BlocksoftKeysStorage'
import BlocksoftSecrets from '@crypto/actions/BlocksoftSecrets/BlocksoftSecrets'
import { getLockScreenStatus } from '@app/appstores/Stores/Settings/selectors'
import { LockScreenFlowTypes, setLockScreenConfig } from '@app/appstores/Stores/LockScreen/LockScreenActions'
import { getSelectedWalletData } from '@app/appstores/Stores/Main/selectors'

import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import { useTheme } from '@app/theme/ThemeProvider'

const VISIBILITY_TIMEOUT = 4000

const { width: WINDOW_WIDTH } = Dimensions.get('window')

const BackupStep0Screen = (props) => {
    MarketingAnalytics.setCurrentScreen('WalletBackup.BackupStep0Screen')

    const scrollViewRef = useRef()

    const { GRID_SIZE, colors } = useTheme()

    const selectedWalletData = useSelector(getSelectedWalletData)
    const createWalletStore = useSelector((state) => state.createWalletStore)
    const lockScreenStatus = useSelector(getLockScreenStatus)

    const [isLoading, setIsLoading] = useState(true)
    const [flowSubtype, setFlowSubtype] = useState('') // one of: 'backup', 'createFirst', 'createAnother', 'show'
    const [indexTab, setIndexTab] = useState(0)
    const [walletMnemonicData, setWalletMnemonicData] = useState({
        walletMnemonic: '',
        walletMnemonicArray: []
    })
    const [isMnemonicVisible, setIsMnemonicVisible] = useState(false)
    const [approvedBackup, setApprovedBackup] = useState(false)
    const [visibilityTimer, setVisibilityTimer] = useState(false)

    const animationValue = useSharedValue(0)
    const progress = useSharedValue(0)

    const { flowType, mnemonicLength, source, walletNumber } = createWalletStore
    const { walletHash } = selectedWalletData

    useEffect(() => {
        setIsLoading(true)
        _init()
        setIsLoading(false)
    }, [])

    useEffect(() => {
        const { walletMnemonic } = createWalletStore

        if (createWalletStore.mnemonicLength) {
            scrollViewRef?.current?.scrollTo?.({ x: 0, y: 0, animated: true })

            const walletMnemonicArray = walletMnemonic.split(' ')
            setWalletMnemonicData({
                walletMnemonicArray,
                walletMnemonic
            })
        }
    }, [createWalletStore?.walletMnemonic, createWalletStore.mnemonicLength])

    const _init = async (checkLock = true) => {
        try {
            Log.log('WalletBackup.BackupStep0Screen.componentDidMount init')

            const flowSubtype = NavStore.getParamWrapper(this, 'flowSubtype', 'createFirst')

            let walletMnemonic = ''
            let mnemonic = ''
            if (flowType === 'BACKUP_WALLET' || flowType === 'BACKUP_WALLET_XMR') {
                if (checkLock) {
                    if (lockScreenStatus * 1 > 0) {
                        setLockScreenConfig(
                            {
                                flowType: LockScreenFlowTypes.MNEMONIC_CALLBACK,
                                noCallback: () => {
                                    NavStore.goBack()
                                    NavStore.goBack()
                                },
                                callback: async () => {
                                    await _init(false)
                                }
                            },
                            'BackupStep0Screen'
                        )
                        NavStore.goNext('LockScreen')
                        return false
                    }
                }

                if (walletHash) {
                    try {
                        mnemonic = await BlocksoftKeysStorage.getWalletMnemonic(walletHash, 'BackupStep0Screen.mount')
                    } catch {
                        Log.log('WalletBackup.BackupStep0Screen error mnemonic for ' + walletHash)
                    }
                }
                if (flowType === 'BACKUP_WALLET_XMR') {
                    walletMnemonic = await BlocksoftSecrets.getWords({ currencyCode: 'XMR', mnemonic })
                } else {
                    walletMnemonic = mnemonic
                }
                if (!walletMnemonic || walletMnemonic === '') {
                    Log.log('WalletBackup.BackupStep0Screen no mnenonic for selected wallet')
                    showModal({
                        type: 'INFO_MODAL',
                        icon: 'WARNING',
                        title: strings('settings.walletList.backupModal.title'),
                        description: 'selected wallet is not generated - please select another from the list or reinstall and restart'
                    })
                }
            } else {
                try {
                    walletMnemonic = (await BlocksoftKeys.newMnemonic(mnemonicLength)).mnemonic
                } catch {
                    Log.log('WalletBackup.BackupStep0Screen error mnemonic generation')
                }

                if (!walletMnemonic || walletMnemonic === '') {
                    Log.log('WalletBackup.BackupStep0Screen no mnenonic for new wallet')
                    showModal({
                        type: 'INFO_MODAL',
                        icon: 'WARNING',
                        title: strings('settings.walletList.backupModal.title'),
                        description: 'new wallet is not generated - please reinstall and restart'
                    })
                }
            }

            const walletMnemonicArray = walletMnemonic.split(' ')

            setWalletMnemonic({ walletMnemonic })
            setFlowSubtype(flowSubtype)
            setWalletMnemonicData({
                walletMnemonic,
                walletMnemonicArray
            })
        } catch (e) {
            Log.log('WalletBackup.BackupStep0Screen.componentDidMount error')
        }
    }

    const scrollTabSwitch = () => {
        setTimeout(() => {
            try {
                scrollViewRef?.current?.scrollTo({ x: 0, y: 0, animated: true })
            } catch (e) {}
        }, 0)
    }

    const handleTabChange = (index) => {
        scrollTabSwitch()
        setIndexTab(index)
    }

    const routes = useMemo(
        () => [
            {
                title: strings('walletBackup.step0Screen.phrase'),
                key: 'first'
            },
            {
                title: strings('walletBackup.step0Screen.qr'),
                key: 'second'
            }
        ],
        []
    )

    const renderScene = ({ route }) => {
        switch (route.key) {
            case 'first':
                return renderFirstRoute()
            case 'second':
                return renderSecondRoute()
            default:
                return null
        }
    }

    // for developing and testing only
    const handleCopyModal = () => {
        // mnemonic - no buffer!
        copyToClipboard('disabled')
        Toast.setMessage(strings('toast.copy.disabled')).show()
    }

    const handleAnimate = () => {
        animationValue.value = withSequence(
            withTiming(-20, { duration: 50 }),
            withRepeat(withTiming(20, { duration: 100 }), 2, true),
            withTiming(0, { duration: 50 })
        )
    }

    const style1 = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateX: animationValue.value
                }
            ]
        }
    }, [])

    const animationProgress = useAnimatedProps(() => {
        return {
            progress: progress.value
        }
    }, [])

    const openWalletSettings = () => {
        if (!approvedBackup) {
            handleAnimate()
            return
        }

        NavStore.goNext('BackupSettingsScreen')
    }

    const onNext = () => {
        if (!approvedBackup) {
            handleAnimate()
            return
        }
        NavStore.goNext('BackupStep1Screen')
    }

    const resetWalletStore = () => {
        setWalletName({ walletName: '' })
        setWalletMnemonic({ walletMnemonic: '' })
        setFlowType({ flowType: '' })
        setMnemonicLength({ mnemonicLength: 0 })
    }

    const handleBack = () => {
        resetWalletStore()
        NavStore.goBack()
    }

    const handleClose = () => {
        NavStore.reset('TabBar')
        resetWalletStore()
    }

    const handleApproveBackup = () => {
        setApprovedBackup((prev) => !prev)
    }

    const triggerMnemonicVisible = (visibility, checkLock = true) => {
        if (visibilityTimer) return

        if (visibility) {
            setIsMnemonicVisible((prev) => {
                MarketingEvent.logEvent('gx_view_mnemonic_screen_tap_mnemonic', { walletNumber, source }, 'GX')
                return visibility
            })
        } else {
            setIsMnemonicVisible(visibility)
        }
    }

    const showMnemonic = () => {
        setTimeout(() => {
            setIsMnemonicVisible(false)
            setVisibilityTimer(null)
        }, VISIBILITY_TIMEOUT)

        setIsMnemonicVisible(true)
        setVisibilityTimer(true)
        MarketingEvent.logEvent('gx_view_mnemonic_screen_tap_mnemonic', { walletNumber, source }, 'GX')
        progress.value = withTiming(1, { duration: VISIBILITY_TIMEOUT }, () => {
            progress.value = 0
        })
    }

    const renderWord = ({ item: word, index }) => {
        const wordToRender = isMnemonicVisible ? word : '--------'

        return (
            <View
                style={[
                    styles.wordContainer,
                    {
                        backgroundColor: colors.createWalletScreen.showMnemonic.wordBg,
                        marginHorizontal: GRID_SIZE * 0.75
                    }
                ]}>
                <View style={[styles.wordIndexContainer, { backgroundColor: colors.createWalletScreen.showMnemonic.wordIndexBg }]}>
                    <Text style={[styles.wordIndex, { color: colors.createWalletScreen.showMnemonic.wordIndexText }]}>{index + 1}</Text>
                </View>
                <Text
                    style={[
                        styles.word,
                        {
                            color: colors.common.text1,
                            marginLeft: GRID_SIZE * 0.7
                        }
                    ]}>
                    {wordToRender}
                </Text>
            </View>
        )
    }

    const renderTabs = () => <Tabs active={indexTab} tabs={routes} changeTab={handleTabChange} />

    const renderFirstRoute = () => {
        const { walletMnemonicArray } = walletMnemonicData

        const isInited = walletMnemonicArray.length > 0
        const isShowingPhrase = flowSubtype === 'show'
        const isCreate = flowSubtype === 'createFirst' || flowSubtype === 'createAnother'
        const isXMR = flowType === 'BACKUP_WALLET_XMR'

        const halfArrayNum = Math.ceil(walletMnemonicArray.length / 2)

        let infoText = strings('walletBackup.step0Screen.info')
        if (isXMR) {
            infoText = strings('walletBackup.descriptionXMR')
        }

        return (
            <ScrollView
                showsVerticalScrollIndicator={false}
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollViewContent}
                keyboardShouldPersistTaps='handled'
                scrollEnabled={indexTab === 0}
                nestedScrollEnabled>
                {walletMnemonicArray &&
                    (!isLoading ? (
                        <>
                            <View style={{ paddingHorizontal: GRID_SIZE * 2, paddingTop: GRID_SIZE * 1.5 }}>
                                <Message newFlow progress={animationProgress} timer={visibilityTimer} name='recoveryPhrase' text={infoText} />
                                <TouchableOpacity
                                    activeOpacity={1}
                                    onLongPress={showMnemonic}
                                    onPressIn={() => triggerMnemonicVisible(true)}
                                    onPressOut={() => triggerMnemonicVisible(false)}
                                    delayLongPress={2000}
                                    delayPressIn={100}
                                    disabled={isMnemonicVisible}>
                                    <View
                                        style={[
                                            styles.mnemonicContainer,
                                            {
                                                marginBottom: -(GRID_SIZE * 0.75),
                                                marginTop: GRID_SIZE
                                            }
                                        ]}>
                                        <FlatList
                                            data={walletMnemonicArray.slice(0, halfArrayNum)}
                                            renderItem={renderWord}
                                            keyExtractor={(item) => item}
                                            scrollEnabled={false}
                                            initialNumToRender={24}
                                        />
                                        <FlatList
                                            data={walletMnemonicArray.slice(halfArrayNum)}
                                            renderItem={({ item, index }) => renderWord({ item, index: halfArrayNum + index })}
                                            keyExtractor={(item) => item}
                                            scrollEnabled={false}
                                            initialNumToRender={24}
                                        />
                                    </View>
                                    <View style={{ marginTop: GRID_SIZE * 2, marginBottom: GRID_SIZE * 2 }}>
                                        <Text
                                            style={[
                                                styles.showMnemonicButton,
                                                {
                                                    color: colors.createWalletScreen.showMnemonic.showButtonText,
                                                    opacity: isMnemonicVisible ? 0.5 : 1
                                                }
                                            ]}>
                                            {strings('walletBackup.step0Screen.showButton')}
                                        </Text>
                                    </View>
                                </TouchableOpacity>

                                {!isShowingPhrase && !isXMR && (
                                    <View>
                                        <Animated.View style={style1}>
                                            <CheckBox
                                                checked={approvedBackup}
                                                onPress={handleApproveBackup}
                                                title={strings('walletBackup.infoScreen.checkbox1')}
                                            />
                                        </Animated.View>
                                    </View>
                                )}
                            </View>

                            {isInited && !isShowingPhrase && !isXMR && (
                                <View
                                    style={{
                                        paddingHorizontal: GRID_SIZE,
                                        paddingVertical: GRID_SIZE * 1.5
                                    }}>
                                    <TwoButtons
                                        mainButton={{
                                            onPress: onNext,
                                            title: strings('walletBackup.step0Screen.next')
                                        }}
                                        secondaryButton={
                                            isCreate
                                                ? {
                                                      type: 'settings',
                                                      onPress: openWalletSettings,
                                                      onLongPress: handleCopyModal,
                                                      delayLongPress: 4000
                                                  }
                                                : undefined
                                        }
                                    />
                                </View>
                            )}
                        </>
                    ) : (
                        <View style={styles.loader}>
                            <LottieView
                                style={{
                                    width: WINDOW_WIDTH * 0.7,
                                    height: WINDOW_WIDTH * 0.7
                                }}
                                autoPlay
                                loop
                                speed={3}
                                source={require('@assets/jsons/animations/loaderBlue.json')}
                            />
                        </View>
                    ))}
            </ScrollView>
        )
    }

    const renderSecondRoute = () => {
        return <MnemonicQrCode walletMnemonic={walletMnemonicData?.walletMnemonic} />
    }

    const isShowingPhrase = flowSubtype === 'show'
    const isXMR = flowType === 'BACKUP_WALLET_XMR'

    const headerProps = {}

    if (flowType === 'BACKUP_WALLET_XMR') {
        headerProps.rightType = 'close'
        headerProps.rightAction = handleBack
        headerProps.title = strings('walletBackup.titleBackup')
    } else if (flowSubtype === 'createFirst') {
        headerProps.rightType = 'close'
        headerProps.rightAction = handleBack
        headerProps.title = strings('walletBackup.titleCreate')
    } else {
        headerProps.rightType = 'close'
        headerProps.rightAction = handleClose
        headerProps.leftType = 'back'
        headerProps.leftAction = handleBack
        headerProps.title =
            flowSubtype === 'show'
                ? strings('walletBackup.titleShow')
                : flowSubtype === 'backup'
                  ? strings('walletBackup.titleBackup')
                  : strings('walletBackup.titleCreate')
    }

    return (
        <ScreenWrapper {...headerProps} ExtraView={isShowingPhrase || isXMR ? (!isLoading ? renderTabs : null) : null}>
            <TabView
                style={styles.container}
                navigationState={{ index: indexTab, routes }}
                renderScene={renderScene}
                renderHeader={null}
                onIndexChange={handleTabChange}
                renderTabBar={() => null}
                swipeEnabled={isShowingPhrase || isXMR}
                useNativeDriver
                overScrollMode='always'
            />
        </ScreenWrapper>
    )
}

export default BackupStep0Screen

const styles = StyleSheet.create({
    container: {
        flexGrow: 1
    },
    scrollViewContent: {
        flexGrow: 1,
        justifyContent: 'space-between'
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    infoText: {
        marginLeft: 12,
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 1,
        flex: 1
    },
    mnemonicContainer: {
        flexDirection: 'row'
        // flexWrap: 'wrap'
    },
    mnemonicColumn: {
        flex: 1
    },
    wordContainer: {
        flex: 1,
        minWidth: 100,
        minHeight: 36,
        padding: 8,
        marginVertical: 7,
        borderRadius: 8
    },
    wordIndexContainer: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 8,
        top: 8,
        bottom: 8,
        borderRadius: 6
    },
    wordIndex: {
        fontFamily: 'Montserrat-Semibold',
        fontSize: 10,
        lineHeight: 13
    },
    word: {
        textAlign: 'center',
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 15,
        lineHeight: 19,
        letterSpacing: 1.3
    },
    showMnemonicButton: {
        textAlign: 'center',
        fontFamily: 'Montserrat-Bold',
        fontSize: 12,
        lineHeight: 15,
        letterSpacing: 1.5,
        textTransform: 'uppercase'
    },
    keyCircle: {
        width: 24,
        height: 24,
        borderRadius: 50,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center'
    },
    loader: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2,
        backgroundColor: 'transparent'
    }
})
