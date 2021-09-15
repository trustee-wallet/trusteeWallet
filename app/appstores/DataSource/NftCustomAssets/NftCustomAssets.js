/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database'

class NftCustomAssets {

    saveNfts = async () => {
        throw new Error('TODO')
    }

    getNftCustomAsset = async () => {
        const sql = `SELECT id, nft_code AS nftCode, nft_symbol AS nftSymbol, nft_name AS nftName, nft_type AS nftType, nft_address AS nftAddress FROM custom_nfts`
        const res = await Database.query(sql, true)
        if (!res || !res.array || res.array.length === 0) {
            return false
        }
        const tmps = {}
        for (const tmp of res.array) {
            tmp.nftName = Database.unEscapeString(tmp.nftName)
            if (typeof tmps[tmp.nftType] === 'undefined') {
                tmps[tmp.nftType] = {}
            }
            tmps[tmp.nftType][tmp.nftAddress] = tmp
        }
        return tmps
    }

}

export default new NftCustomAssets()
