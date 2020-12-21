import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView
} from 'react-native'

import Header from '../../components/elements/new/Header'
import Button from '../../components/elements/new/buttons/Button'
import CheckBox from '../../components/elements/new/CheckBox'
import NavStore from '../../components/navigation/NavStore'

import {
  setCallback,
  setFlowType,
  setMnemonicLength,
  setWalletName
} from '../../appstores/Stores/CreateWallet/CreateWalletActions'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import { strings } from '../../services/i18n'



export default class BackupInfoScreen extends React.Component {
  state = {
    headerHeight: 0,
    approvedBackup: false,
    approvedPrivate: false
  }

  setHeaderHeight = (height) => {
    const headerHeight = Math.round(height || 0);
    this.setState(() => ({ headerHeight }))
  }

  handleBack = () => { NavStore.goBack(); }

  handleApproveBackup = () => { this.setState(state => ({ approvedBackup: !state.approvedBackup })) }

  handleApprovePrivate = () => { this.setState(state => ({ approvedPrivate: !state.approvedPrivate })) }

  handleContinue = () => {
    setFlowType({ flowType: 'CREATE_NEW_WALLET' })

    setWalletName({ walletName: '' })
    setMnemonicLength({ mnemonicLength: 128 })

    NavStore.goNext('BackupStep0Screen')
  }

  render() {
    const { GRID_SIZE, colors } = this.context
    const { approvedPrivate, approvedBackup, headerHeight } = this.state

    return (
      <View style={[styles.container, { backgroundColor: colors.common.background }]}>
        <Header
          leftType="back"
          leftAction={this.handleBack}
          rightType="close"
          title={strings('walletBackup.pageTitle')}
          setHeaderHeight={this.setHeaderHeight}
        />
        <SafeAreaView style={[styles.content, {
          backgroundColor: colors.common.background,
          marginTop: headerHeight,
        }]}>
          <View style={{
            paddingHorizontal: GRID_SIZE * 2,
            paddingTop: GRID_SIZE * 1.5,
          }}>
            <Text style={[styles.text, { color: colors.common.text3, marginBottom: GRID_SIZE * 2 }]}>{strings('walletBackup.infoScreen.text1')}</Text>

            <CheckBox
              checked={approvedBackup}
              onPress={this.handleApproveBackup}
              title={strings('walletBackup.infoScreen.checkbox1')}
            />
            <View style={{ marginBottom: GRID_SIZE }} />
            <CheckBox
              checked={approvedPrivate}
              onPress={this.handleApprovePrivate}
              title={strings('walletBackup.infoScreen.checkbox2')}
            />

            <Text style={[styles.text, { color: colors.common.text3, marginVertical: GRID_SIZE * 2 }]}>{strings('walletBackup.infoScreen.text2')}</Text>
          </View>


          <View style={{
            paddingHorizontal: GRID_SIZE,
            paddingBottom: GRID_SIZE,
          }}>
            <Button
              title={strings('walletBackup.infoScreen.continue')}
              disabled={!approvedPrivate || !approvedBackup}
              onPress={this.handleContinue}
            />
          </View>
        </SafeAreaView>
      </View>
    )
  }
}

BackupInfoScreen.contextType = ThemeContext

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1,
    justifyContent: 'space-between'
  },
  text: {
    fontFamily: 'SFUIDisplay-Regular',
    fontSize: 16,
    lineHeight: 20,
  }
})
