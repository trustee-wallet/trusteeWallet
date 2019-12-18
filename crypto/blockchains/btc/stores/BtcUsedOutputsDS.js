import DBInterface from '../../../../app/appstores/DataSource/DB/DBInterface'

const tableName = 'transactions_used_outputs'


class BtcUsedOutputsDS {
    _currencyCode = ''
    _address = ''
    _inputs = []

    async getUsed(currencyCode, address) {
        let now = Math.round(new Date().getTime() / 1000) - 6000 // 6000 seconds before

        const dbInterface = new DBInterface()
        const res = await dbInterface.setQueryString(`
                SELECT output_tx_id AS txId, output_vout AS vout 
                FROM ${tableName} 
                WHERE currency_code='${currencyCode}' 
                AND output_address='${address}'
                AND created_at > ${now}
                `).query()
        let tmp = {}
        if (res.array) {
            for (let row of res.array) {
                tmp[row.txId + '_' + row.vout] = row
            }
        }
        return tmp
    }
    /**
     * @param {string} inputs[].txId
     * @param {string} inputs[].vout
     */
    setTmpUsed(currencyCode, address, inputs) {
        this._currencyCode = currencyCode
        this._address = address
        this._inputs = inputs
    }
    async saveUsed(txHash) {
        let prepared = []
        let now = new Date().toISOString()
        for (let input of this._inputs) {
            prepared.push({
                currency_code : this._currencyCode,
                output_tx_id: input.txId,
                output_vout : input.vout,
                output_address : this._address,
                use_tx_id : txHash,
                created_at : now
            })
        }
        const dbInterface = new DBInterface()
        await dbInterface.setTableName(tableName).setInsertData({insertObjs : prepared}).insert()
    }
}

export default new BtcUsedOutputsDS()
