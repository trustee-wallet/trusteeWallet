/**
 * @version 0.9
 */
import Database from '@app/appstores/DataSource/Database'

let CACHE = {}
class NftCustomAssets {

    saveCustomAsset = async (tmp) => {
        if (typeof CACHE[tmp.nftType] !== 'undefined' && typeof CACHE[tmp.nftType][tmp.nftAddress] !== 'undefined') {
            return false
        }
        await Database.setTableName('custom_nfts').setInsertData({ insertObjs: [tmp]}).insert()
        return true
    }

    getCustomAssets = async () => {
        const sql = `SELECT id, nft_code AS nftCode, nft_symbol AS nftSymbol, nft_name AS nftName, nft_type AS nftType, nft_address AS nftAddress FROM custom_nfts`
        const res = await Database.query(sql, true)
        if (!res || !res.array || res.array.length === 0) {
            return false
        }
        CACHE = {}
        for (const tmp of res.array) {
            tmp.nftName = Database.unEscapeString(tmp.nftName)
            if (typeof CACHE[tmp.nftType] === 'undefined') {
                CACHE[tmp.nftType] = {}
            }
            CACHE[tmp.nftType][tmp.nftAddress] = tmp
        }
        return CACHE
    }

}

export default new NftCustomAssets()
