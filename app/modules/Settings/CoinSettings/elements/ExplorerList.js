import React, { PureComponent } from 'react'
import {
    FlatList,
    View,
    LayoutAnimation
} from 'react-native'

import { ThemeContext } from '@app/theme/ThemeProvider'
import BlocksoftDict from '@crypto/common/BlocksoftDict'

import ListItem from '@app/components/elements/new/list/ListItem/Setting'
import SubSetting from '@app/components/elements/new/list/ListItem/SubSetting'

import settingsActions from '@app/appstores/Stores/Settings/SettingsActions'

class ExplorerList extends PureComponent {

    state = {
        dropMenu: false,
        check: null
    }

    toggleDropMenu = () => {
        const CustomAnimation = {
            duration: 1200,
            create: {
                delay: 300,
                type: LayoutAnimation.Types.spring,
                property: LayoutAnimation.Properties.opacity,
                springDamping: 0.7
            },
            update: {
                type: LayoutAnimation.Types.spring,
                springDamping: 0.7
            },
            delete: {
                duration: 100,
                type: LayoutAnimation.Types.linear,
                property: LayoutAnimation.Properties.opacity
            }
        }

        LayoutAnimation.configureNext(CustomAnimation)
        this.setState({ dropMenu: !this.state.dropMenu })
    }

    setExplorer = async (item) => {
        await settingsActions.setSettings(`${item.currencyCode}_explorer`, JSON.stringify(item))
        this.setState({ check: JSON.stringify(item) })
    }

    renderSubItem = (props) => {
        const data = settingsActions.getSettingStatic(`${props.item.currencyCode}_explorer`)

        if (data) {
            this.setState({ check: JSON.stringify(JSON.parse(data)) })
        } else {
            if (props.index === 0) {
                this.setState({ check: JSON.stringify(props.item) })
            }
        }

        return (
            <View style={{ paddingLeft: 40 }}>
                <SubSetting
                    title={props.item.explorerName}
                    checked={this.state.check === JSON.stringify(props.item)}
                    radioButtonFirst={true}
                    withoutLine={true}
                    onPress={() => this.setExplorer(props.item)}
                    checkedStyle={true}
                />
            </View>
        )
    }

    renderItem = (data) => {
        return (
            <FlatList
                data={data}
                renderItem={this.renderSubItem}
            />
        )
    }

    render() {

        const { item, data } = this.props
        const { dropMenu } = this.state

        const coin = BlocksoftDict.getCurrencyAllSettings(item)

        return (
            <ListItem
                title={coin.currencyCode}
                subtitle={coin.currencyName}
                iconType={item.toString().toLowerCase()}
                onPress={this.toggleDropMenu}
                rightContent={dropMenu ? 'arrow_up' : "arrow_down"}
                switchParams={{ value: dropMenu, onPress: this.toggleDropMenu }}
                type='dropdown'
                ExtraView={() => this.renderItem(data)}

            />
        )
    }
}

ExplorerList.contextType = ThemeContext

export default ExplorerList