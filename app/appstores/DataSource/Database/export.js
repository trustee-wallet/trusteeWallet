
import Database from './main';


export async function getSqlForExport() {
    // cleanup
    await (Database.setQueryString(`UPDATE transactions SET transactions_scan_log='' WHERE created_at<'2020-01-01'`)).query(true)

    const tables = await (Database.setQueryString(`SELECT * FROM sqlite_master WHERE type='table' ORDER BY name`)).query()
    if (!tables.array.length) {
        return 'no tables'
    }

    let sql = ''
    let table
    for (table of tables.array) {

        if (table.name === 'transactions_scanners_tmp' || table.name === 'sqlite_sequence' || table.name === 'android_metadata') continue
        //sql += '\n\n\n' + table.sql + ';\n\n'

        sql += '\n\n\nFOR BETA ONLY ' + table.name
        const res2 = await (Database.setQueryString(`SELECT COUNT(*) AS cn FROM '${table.name}'`)).query()
        if (res2 && res2.array && res2.array[0]) {
            sql += ' count ' + res2.array[0].cn
        }
        sql += '\n\n'


        const res = await (Database.setQueryString(`SELECT * FROM ${table.name} LIMIT 1`)).query()
        if (res.array.length) {
            const keys = Object.keys(res.array[0])
            sql += `INSERT INTO ${table.name} (${keys.join(', ')}) VALUES ` + '\n('
            let i = 0
            let row, key
            for (row of res.array) {
                let tmp = []
                for (key of keys) {
                    if (typeof row[key] === 'number') {
                        tmp.push(row[key])
                    } else {
                        tmp.push("'" + row[key] + "'")
                    }
                }
                if (i > 0) {
                    sql += '), \n('
                }
                sql += tmp.join(', ')
                i++;
            }
            sql += ');\n\n'
        }
    }
    return sql
}
