/**
 * @version 0.50
 * @author yura
 */

import React, { PureComponent } from 'react'
import {
    View,
    ScrollView,
    StyleSheet,
    FlatList
} from 'react-native'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { strings } from '@app/services/i18n'
import { ThemeContext } from '@app/theme/ThemeProvider'
import CurrenciesExplorer from '@crypto/common/BlocksoftExplorerDict'
import ExplorerList from './elements/ExplorerList'


class GlobalCoinSettings extends PureComponent {

    handleBack = () => {
        NavStore.goBack()
    }

    renderItemExplorer = (props) => {
        return (
            <ExplorerList
                data={CurrenciesExplorer[props.item]}
                {...props}
            />
        )
    }

    render() {

        const {
            GRID_SIZE
        } = this.context

        const list = Object.keys(CurrenciesExplorer)

        return (
            <ScreenWrapper
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleBack}
                title={strings('settings.blockchainExplorer')}
            >
                <ScrollView
                    ref={(ref) => {
                        this.scrollView = ref
                    }}
                    keyboardShouldPersistTaps='handled'
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: 'space-between',
                        padding: GRID_SIZE,
                        paddingBottom: GRID_SIZE * 2,
                    }}
                >
                    <View>
                        <FlatList
                            data={list}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={styles.list}
                            renderItem={this.renderItemExplorer}
                        />
                    </View>

                </ScrollView>
            </ScreenWrapper>
        )
    }
}

GlobalCoinSettings.contextType = ThemeContext

export default GlobalCoinSettings

const styles = StyleSheet.create({
    container: {
        flex: 1
    }
})