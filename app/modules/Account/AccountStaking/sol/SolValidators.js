/**
 * @version 0.53
 * @author yura
 */

import React, { PureComponent } from 'react'
import { connect } from 'react-redux'
import {
    FlatList,
    View,
    ActivityIndicator,
    TouchableOpacity,
    Keyboard
} from 'react-native'

import { ThemeContext } from '@app/theme/ThemeProvider'
import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import SolStakeUtils from '@crypto/blockchains/sol/ext/SolStakeUtils'
import BlocksoftPrettyStrings from '@crypto/common/BlocksoftPrettyStrings'

import ListItem from '@app/components/elements/new/list/ListItem/SubSetting'
import BlocksoftPrettyNumbers from '@crypto/common/BlocksoftPrettyNumbers'
import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'
import { setSolValidator } from '@app/appstores/Stores/Main/MainStoreActions'
import { strings } from '@app/services/i18n'

import Button from '@app/components/elements/new/buttons/Button'

class SolValidators extends PureComponent {

    state = {
        validators: [],
        loading: true,
        selectedVoteAddress: {
            address: '',
            commission: false,
            activatedStake: false,
            name: false,
            description: '',
            website: ''
        },
        searchQuery: ''
    }

    async componentDidMount() {
        const res = await SolStakeUtils.getVoteAddresses()

        let selectedVoteAddress = await settingsActions.getSetting('SOL_validator')
        if (selectedVoteAddress) {
            selectedVoteAddress = JSON.parse(selectedVoteAddress)
        } else {
            selectedVoteAddress = res[0]
        }

        this.setState({
            validators: res,
            loading: false,
            selectedVoteAddress
        })
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleClose = () => {
        NavStore.reset('HomeScreen')
    }

    selectSolValidatorFromSearch = (searchQuery) => {
        // later - do validation if its actual validator - now its after stake try fail
        // console.log(JSON.stringify(searchQuery))
        this.selectSolValidator({ address: searchQuery })
    }

    selectSolValidator = (item) => {
        const tmp = JSON.stringify(item)
        if (JSON.stringify(this.state.selectedVoteAddress) === tmp) return

        settingsActions.setSettings('SOL_validator', tmp)
        this.setState({
            selectedVoteAddress: item
        })
        setSolValidator(item)
        NavStore.goBack()
    }

    renderItem = ({ item, index }) => {
        return (
            <ListItem
                key={index}
                title={item.name || BlocksoftPrettyStrings.makeCut(item.address, 8, 8)}
                subtitle={
                    BlocksoftPrettyNumbers.makeCut(BlocksoftPrettyNumbers.setCurrencyCode('SOL').makePretty(item.activatedStake), 2).separated + ' SOL '
                }
                onPress={() => this.selectSolValidator(item)}
                checked={JSON.stringify(this.state.selectedVoteAddress) === JSON.stringify(item)}
                last={this.state.selectedVoteAddress.length - 1 === index}
                percentValue={item.commission}
                percentValueText={strings('settings.walletList.solValidator')}
            />
        )
    }

    onSearch = (value) => {
        this.setState({
            searchQuery: value.toString()
        })
    }

    renderEmptyList = (searchQuery) => {

        const { GRID_SIZE } = this.context

        let isSearchTokenAddress = false
        if (searchQuery) {
            searchQuery = searchQuery.trim()
            if (searchQuery.length >= 38) {
                isSearchTokenAddress = true
            } else {
                return null
            }
        }

        if (isSearchTokenAddress) {
            return (
                <TouchableOpacity style={{ marginTop: GRID_SIZE * 6 }} onPress={Keyboard.dismiss}>
                    <Button
                        title={strings('settings.walletList.useCustomValidator') + searchQuery}
                        onPress={() => this.selectSolValidatorFromSearch(searchQuery)}
                    />
                </TouchableOpacity>
            )
        }
    }

    render() {

        const { loading, validators, searchQuery } = this.state
        const { GRID_SIZE } = this.context
        const lowerCaseSearchQuery = searchQuery.toLowerCase()

        return (
            <ScreenWrapper
                title={strings('settings.walletList.selectValidatorSOL')}
                leftType='back'
                leftAction={this.handleBack}
                rightType='close'
                rightAction={this.handleClose}
                search
                onSearch={this.onSearch}
                searchQuery={searchQuery}
            >
                <View style={{ flex: 1 }}>
                    <FlatList
                        data={searchQuery ? validators.filter(item => item?.name.toString().toLowerCase().includes(lowerCaseSearchQuery) || item.address.toString().toLowerCase().includes(lowerCaseSearchQuery)) : validators}
                        renderItem={this.renderItem}
                        contentContainerStyle={{ paddingVertical: GRID_SIZE, marginHorizontal: GRID_SIZE }}
                        showsVerticalScrollIndicator={false}
                        keyExtractor={item => item.address.toString()}
                        ListEmptyComponent={() => {
                            if (loading) {
                                return (
                                    <ActivityIndicator
                                        size='large'
                                        style={{
                                            backgroundColor: 'transparent',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            paddingTop: GRID_SIZE
                                        }}
                                        color={this.context.colors.common.text2}
                                    />
                                )
                            } else {
                                return this.renderEmptyList(searchQuery)
                            }
                        }}
                    />

                </View>

            </ScreenWrapper>
        )
    }
}

SolValidators.contextType = ThemeContext

export default connect()(SolValidators)
