import i18n from '../../app/services/i18n'

class BlocksoftPrettyLocalize {

    makeLink(link) {
        const main = i18n.locale.split('-')[0].toLowerCase()
        if ((main === 'uk' || main === 'ru') && link) {
            if (link.indexOf('https://blockchair.com/') === 0) {
                link = link.replace('https://blockchair.com/', 'https://blockchair.com/ru/')
            }
        }
        return link
    }
}

export default new BlocksoftPrettyLocalize()
