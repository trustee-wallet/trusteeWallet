import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView
} from 'react-native'

import Header from '../../components/elements/new/Header'
import NavStore from '../../components/navigation/NavStore'

import { ThemeContext } from '../../modules/theme/ThemeProvider'

import { strings } from '../../services/i18n'



export default class AgreementScreen extends React.Component {
  state = {
    headerHeight: 0
  }

  setHeaderHeight = (height) => {
    const headerHeight = Math.round(height || 0);
    this.setState(() => ({ headerHeight }))
  }

  getTitle = () => {
    // can't use NavStore here - there is an error
    const pageType = this.props.navigation.getParam('type', '')

    if (pageType === 'terms') return strings('walletCreateScreen.terms')

    if (pageType === 'privacyPolicy') return strings('walletCreateScreen.privacyPolicy')
  }

  handleBack = () => { NavStore.goBack(); }

  render() {
    const { GRID_SIZE, colors } = this.context

    return (
      <View style={[styles.container, { backgroundColor: colors.common.background }]}>
        <Header
          leftType="back"
          leftAction={this.handleBack}
          rightType="close"
          title={this.getTitle()}
          setHeaderHeight={this.setHeaderHeight}
        />
        <ScrollView contentContainerStyle={[styles.content, {
          paddingHorizontal: GRID_SIZE * 2,
          paddingVertical: GRID_SIZE,
          backgroundColor: colors.common.background,
          marginTop: this.state.headerHeight,
        }]}>
          <View>
            {/* TODO: add agreement content */}
          </View>
        </ScrollView>
      </View>
    )
  }
}

AgreementScreen.contextType = ThemeContext

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  content: {
    flex: 1
  },
})
