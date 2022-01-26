/**
 * @version 0.54
 * @author Vadym
 */
import { ThemeContext } from '@app/theme/ThemeProvider'
import BlocksoftExternalSettings from '@crypto/common/BlocksoftExternalSettings'
import { sublocale } from '@app/services/i18n'


class BlocksoftCustomLinks {
    getLink(link, isLight) {
        const themeColor = isLight ? 'light' : 'dark'
        const siteLang = sublocale()
        const paramsLink = `themeColor=${themeColor}&siteLang=${siteLang}`
        const subLink = BlocksoftExternalSettings.getStatic(link)

        if (subLink.includes('?')) {
            return `${subLink}&${paramsLink}`
        } else {
            return `${subLink}?${paramsLink}`
        }
    }
}

export default new BlocksoftCustomLinks()

BlocksoftCustomLinks.contextType = ThemeContext


