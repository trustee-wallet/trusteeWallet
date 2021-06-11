/**
 * @version 0.43
 * @author ksu
 * just in case handler doesnt work
 */
import React from 'react'

import { ThemeContext } from '@app/modules/theme/ThemeProvider'
import MarketingAnalytics from '@app/services/Marketing/MarketingAnalytics'
import MarketingEvent from '@app/services/Marketing/MarketingEvent'

import Intercom from 'react-native-intercom'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import { WebView } from 'react-native-webview'
import { Linking } from 'react-native'
import Log from '@app/services/Log/Log'

class IntercomSupportScreen extends React.PureComponent {

    async componentDidMount() {
        Intercom.registerIdentifiedUser({ userId: MarketingEvent.DATA.LOG_CASHBACK });
        Intercom.logEvent('viewed_screen', { extra: 'metadata' });
    }

    handleBack = () => {
        this.props.navigation.jumpTo('HomeScreen')
    }

    render() {
        MarketingAnalytics.setCurrentScreen('IntercomSupportScreen')
        Intercom.displayMessageComposer();
        return (
            <ScreenWrapper
                title={'Intercom'}
            >
            </ScreenWrapper>
        )
    }
}

IntercomSupportScreen.contextType = ThemeContext

export default IntercomSupportScreen
