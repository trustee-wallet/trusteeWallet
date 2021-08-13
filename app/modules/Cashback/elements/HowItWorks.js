/**
 * @version 0.42
 */
import React from 'react'
import { View, Text, StyleSheet} from 'react-native'
import Accordion from 'react-native-collapsible/Accordion'

import { strings } from '@app/services/i18n'

import CustomIcon from '@app/components/elements/CustomIcon'

import { ThemeContext } from '@app/theme/ThemeProvider'


const getSections = () => [
    {
        title: strings('cashback.howItWorks.info1Title'),
        content: strings('cashback.howItWorks.info1Content'),
    },
    {
        title: strings('cashback.howItWorks.info2Title'),
        content: strings('cashback.howItWorks.info2Content'),
    },
    {
        title: strings('cashback.howItWorks.info3Title'),
        content: strings('cashback.howItWorks.info3Content'),
    },
    {
        title: strings('cashback.howItWorks.info4Title'),
        content: strings('cashback.howItWorks.info4Content'),
    },
]

export default class HowItWorksContent extends React.Component {
    state = {
        activeSections: []
    }

    sections = getSections()

    _renderHeader = (section, index, isActive) => {
        const { colors } = this.context
        return (
            <View style={styles.sectionHeader}>
                <Text style={[styles.sectionHeaderText, { color: colors.common.text1 }]}>{section.title}</Text>
                <CustomIcon name={isActive ? 'up' : 'down'} color={colors.common.text1} size={16} />
            </View>
        );
    };

    _renderContent = section => {
        return (
            <View style={styles.sectionContent}>
                <Text style={[styles.sectionContentText, { color: this.context.colors.common.text3 }]}>{section.content}</Text>
            </View>
        );
    };

    _updateSections = activeSections => {
        this.setState({ activeSections });
    };

    render() {
        const {
            colors,
            GRID_SIZE,
        } = this.context

        return (
            <View style={{ marginTop: GRID_SIZE * 4 }}>
                <Text style={[styles.blockTitle, { color: colors.common.text1 }]}>{strings('cashback.howItWorks.title')}</Text>

                <Accordion
                    sections={this.sections}
                    activeSections={this.state.activeSections}
                    renderHeader={this._renderHeader}
                    renderContent={this._renderContent}
                    onChange={this._updateSections}
                    underlayColor="transparent"
                    sectionContainerStyle={[styles.section, { padding: GRID_SIZE, backgroundColor: colors.cashback.howItWorksBg, marginVertical: GRID_SIZE / 2 }]}
                />
            </View>
        )
    }
}

HowItWorksContent.contextType = ThemeContext


const styles = StyleSheet.create({
    blockTitle: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 19,
        lineHeight: 19,
        textAlign: 'center',
        marginBottom: 8
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    sectionHeaderText: {
        fontFamily: 'Montserrat-Bold',
        fontSize: 16,
        lineHeight: 21,
        flex: 1,
        marginRight: 20
    },
    sectionContentText: {
        marginTop: 8,
        fontFamily: 'SFUIDisplay-Regular', // TODO: add medium font
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 0.5,
        flex: 1
    },
    section: {
        borderRadius: 16,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 16,
        shadowOffset: {
            height: 5
        }
    }
})
