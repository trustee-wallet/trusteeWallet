/**
 * @version 0.50
 */
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { ActivityIndicator, View } from 'react-native'

import { strings } from '@app/services/i18n'
import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import { ThemeContext } from '@app/theme/ThemeProvider'
import { BlocksoftTransferPrivate } from '@crypto/actions/BlocksoftTransfer/BlocksoftTransferPrivate'
import Database from '@app/appstores/DataSource/Database/main'
import copyToClipboard from '@app/services/UI/CopyToClipboard/CopyToClipboard'
import Toast from '@app/services/UI/Toast/Toast'


class SettingsPrivateXMR extends Component {

    state = {
        loading : true,
        privateViewKey : false,
        privateSpendKey : false,
        derivationPath : false,
        accountJson:  false
    }

    componentDidMount = async () => {
        try {
            // @todo after demon refactor remove
            const findSql = `
                        SELECT
                            id, address,
                            derivation_path AS derivationPath,
                            derivation_type AS derivationType,
                            derivation_index AS derivationIndex,
                            currency_code AS currencyCode,
                            account_json AS accountJson
                        FROM account 
                        WHERE address='${this.props.account.address}'`
            let find = await Database.setQueryString(findSql).query()
            find = find.array[0]
            let accountJson = {}
            try {
                accountJson = JSON.parse(find.accountJson)
            } catch (e) {

            }
            const data = {
                walletHash: this.props.wallet.walletHash,
                currencyCode: this.props.account.currencyCode,
                derivationPath: find.derivationPath,
                accountJson
            }
            const res = await BlocksoftTransferPrivate.initTransferPrivate(data)
            const keys = res.privateKey.split('_')
            this.setState({
                loading : false,
                privateSpendKey : keys[0],
                privateViewKey : keys[1],
                derivationPath : find.derivationPath,
                accountJson,
            })
            console.log(res)
        } catch (e) {
            console.log('SettingsPrivateXMR initTransferPrivate error ' + e.message)
        }
    }

    renderLoading = () => {
        const { colors } = this.context
        return (
            <ActivityIndicator
                size='large'
                style={{
                    backgroundColor: colors.common.header.bg, position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
                color={this.context.colors.common.text2}
            />
        )
    }

    handleCopy = (val) => {
        copyToClipboard(val)

        Toast.setMessage(strings('toast.copied')).show()
    }

    render() {

        if (this.state.loading) {
            return (
                <>
                    <View>
                        {this.renderLoading()}
                    </View>
                </>
            )
        }
        return (
            <>
                <View>
                    <ListItem
                        title={'Address'}
                        subtitle={this.props.account.address}
                        iconType='keyMonero'
                        onPress={this.handlePrivate}
                    />
                    <ListItem
                        title={'public ViewKey'}
                        subtitle={this.state.accountJson.publicViewKey || ' ??? '}
                        iconType='keyMonero'
                        onPress={() => this.handleCopy(this.state.accountJson.publicViewKey)}
                    />
                    <ListItem
                        title={'public SpendKey'}
                        subtitle={this.state.accountJson.publicSpendKey || ' ??? '}
                        iconType='keyMonero'
                        onPress={() => this.handleCopy(this.state.accountJson.publicSpendKey)}
                    />
                    <ListItem
                        title={'private ViewKey'}
                        subtitle={this.state.privateViewKey || ' ??? '}
                        iconType='keyMonero'
                        onPress={() => this.handleCopy(this.state.privateViewKey)}
                    />
                    <ListItem
                        title={'private SpendKey'}
                        subtitle={this.state.privateSpendKey || ' ??? '}
                        iconType='keyMonero'
                        onPress={() => this.handleCopy(this.state.privateSpendKey)}
                    />

                    <ListItem
                        title={'or Copy All (be careful)'}
                        iconType='keyMonero'
                        onPress={() => this.handleCopy(this.state.privateViewKey + ' ' + this.state.privateSpendKey)}
                        rightContent="arrow"
                    />
                </View>
            </>
        )
    }
}

SettingsPrivateXMR.contextType = ThemeContext

export default connect(null, null, null, { forwardRef: true })(SettingsPrivateXMR)
