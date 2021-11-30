/**
 * @version 0.52
 * @author Vadym
 */

import React from 'react'
import {
    View,
    Text,
    StyleSheet,
    Dimensions
} from 'react-native'

import LottieView from 'lottie-react-native'

import Button from '@app/components/elements/new/buttons/Button'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'

import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import trusteeAsyncStorage from '@appV2/services/trusteeAsyncStorage/trusteeAsyncStorage'

const { width: WINDOW_WIDTH, height: WINDOW_HEIGHT } = Dimensions.get('window')

class GuideScreen extends React.PureComponent {

    handleBack = () => {
        NavStore.goBack()
    }

    handleCountine = () => {
        NavStore.goNext('HomeDragScreen')
    }

    handleAccept = () => {
        const res = trusteeAsyncStorage.getIsTraining()
        if (typeof res === 'undefined' || res === '0') {
            this.handleCountine()
        } else {
            this.handleBack()
        }
    }

    render() {
        const {
            GRID_SIZE,
            isLight,
            colors
        } = this.context

        return(
            <ScreenWrapper 
                title={strings('homeScreen.sort.guideTitle')}
                leftType="back"
                leftAction={this.handleBack}
            >
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
                    <View style={styles.textAndBtn}>
                        <View style={{ marginTop: 10 }}>
                            <Text style={[styles.guideTitle, { color: colors.common.text1, marginBottom: GRID_SIZE / 2 }]}>{strings('modal.dropDownModal.guideTitle')}</Text>
                            <Text style={[styles.guideText, { color: colors.common.text3, marginHorizontal: GRID_SIZE * 2 }]}>{strings('modal.dropDownModal.guideText')}</Text>
                        </View>
                        <Button
                            title={strings('modal.dropDownModal.guideAccept')}
                            onPress={this.handleAccept}
                            containerStyle={{ width: WINDOW_WIDTH - GRID_SIZE * 2, marginBottom: GRID_SIZE }}
                        /> 
                    </View>
                </View> 
            </ScreenWrapper>
        )
    }
}

GuideScreen.contextType = ThemeContext

export default GuideScreen

const styles = StyleSheet.create({
    guideContainer: {
        width: '100%', 
        height: '100%', 
        alignItems: 'center', 
    },
    guideText: {
        fontFamily: 'SFUIDisplay-Semibold',
        fontSize: 16,
        lineHeight: 20,
        textAlign: 'center'
    },
    guideTitle: {
        textAlign: 'center', 
        fontSize: 30, 
        lineHeight: 34, 
        fontFamily: 'Montserrat-Medium'
    },
    textAndBtn: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between'
    }
})
