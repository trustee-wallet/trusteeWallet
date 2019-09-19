import accountBalanceDS from '../DataSource/AccountBalance/AccountBalance'

import accountDS from '../DataSource/Account/Account'

import Log from '../../services/Log/Log'

import DBInterface from '../DataSource/DB/DBInterface'

export default {

    insertAccounts: async (accounts) => {

        Log.daemon('ACT/AccountActions insertAccounts called')

        const dbInterface = new DBInterface()

        await dbInterface.setTableName(tableName).setInsertData(data).insert()

        Log.daemon('ACT/AccountActions insertAccounts finished')

    }

}
