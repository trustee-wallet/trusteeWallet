/**
 * @version 0.50
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { View } from 'react-native'

import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import { ThemeContext } from '@app/theme/ThemeProvider'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'
import { strings } from '@app/services/i18n'
import OneUtils from '@crypto/blockchains/one/ext/OneUtils'

class SettingsONE extends Component {

    handleCopy = (copy) => {

        copyToClipboard(copy)

        Toast.setMessage(strings('toast.copied')).show()
    }

    render() {
        const { address } = this.props.account
        const oneAddress = OneUtils.toOneAddress(address)
        return (
            <>
                <View>
                    <ListItem
                        title={oneAddress}
                        iconType='address'
                        onPress={() => this.handleCopy(oneAddress)}
                        rightContent="copy"
                    />
                </View>
            </>
        )
    }
}

SettingsONE.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(SettingsONE)
