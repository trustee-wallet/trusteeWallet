
import Database from './main';


export async function getSqlForExport() {
    const tables = await (Database.setQueryString(`SELECT * FROM sqlite_master WHERE type='table' ORDER BY name`)).query()
    if (!tables.array.length) {
        return 'no tables'
    }

    let sql = ''
    let table
    for (table of tables.array) {

        sql += '\n\n\n' + table.sql + ';\n\n'

        const res = await (Database.setQueryString(`SELECT * FROM ${table.name}`)).query()
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
