import DBInterface from '../DBInterface'

class DBExport {

    async getSql() {

        const dbInterface = new DBInterface()
        const tables = await (dbInterface.setQueryString(`SELECT * FROM sqlite_master WHERE type='table' ORDER BY name`)).query()
        if (!tables.array.length) {
            return 'no tables'
        }

        let sql = ''
        for(let table of tables.array) {

            sql += '\n\n\n' + table.sql + ';\n\n'

            const res = await (dbInterface.setQueryString(`SELECT * FROM ${table.name}`)).query()
            if (res.array.length) {
                const keys = Object.keys(res.array[0])
                sql += `INSERT INTO ${table.name} (${keys.join(', ')}) VALUES ` + '\n('
                let i = 0
                for (let row of res.array) {
                    let tmp = []
                    for (let key of keys) {
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

}

export default new DBExport()
