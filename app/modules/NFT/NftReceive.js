/**
 * @version 0.50
 * @author Vadym
 */

import React from 'react'
import {
    Platform
} from 'react-native'

import ScreenWrapper from '@app/components/elements/ScreenWrapper'
import NavStore from '@app/components/navigation/NavStore'
import { strings } from '@app/services/i18n'
import Log from '@app/services/Log/Log'

import { setLoaderStatus } from '@app/appstores/Stores/Main/MainStoreActions'

import prettyShare from '@app/services/UI/PrettyShare/PrettyShare'
import { FileSystem } from '@app/services/FileSystem/FileSystem'

import NftReceiveComponent from './elements/NftReceiveComponent'

class NftReceive extends React.PureComponent {

    constructor(props) {
        super(props)

        this.nftReceiveComponent = React.createRef()
    }

    handleBack = () => {
        NavStore.goBack()
    }

    handleShare = async () => {
        const data = await this.nftReceiveComponent.getSelectedAddress()
        const { tokenBlockchain, address } = data
        try {
            setLoaderStatus(true)

            const message = `${tokenBlockchain.toLowerCase()}:${address}`
            this.nftReceiveComponent.refSvg.toDataURL(async (data) => {
                if (Platform.OS === 'android') {
                    // noinspection ES6MissingAwait
                    prettyShare({ message, url: `data:image/png;base64,${data}`, title: 'QR', type: 'image/png' })
                } else {
                    const fs = new FileSystem({ fileEncoding: 'base64', fileName: 'QR', fileExtension: 'jpg' })
                    await fs.writeFile(data)
                    // noinspection ES6MissingAwait
                    prettyShare({ message, url: await fs.getPathOrBase64() })
                }
                setLoaderStatus(false)
            })
        } catch (e) {
            setLoaderStatus(false)
            Log.err('NftReceive handleShare error', e)
        }
    }

    render() {
        return (
            <ScreenWrapper
                title={strings('nftMainScreen.title')}
                leftType='back'
                leftAction={this.handleBack}
                rightType='share'
                rightAction={this.handleShare}
            >
                <NftReceiveComponent
                    ref={component => this.nftReceiveComponent = component}
                />
            </ScreenWrapper>
        )
    }
}

export default NftReceive