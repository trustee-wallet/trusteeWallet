
import Database from './main';
import config from '@app/config/config'


export async function getSqlForExport(fs) {
    const createdTs = new Date().getTime() - 480 * 3600000
    const createdAt = new Date(createdTs).toISOString() // 20 days

    const tables = await Database.query(`SELECT * FROM sqlite_master WHERE type='table' ORDER BY name`)
    if (!tables.array.length) {
        await fs.writeLine('no tables')
        return false
    }

    let table
    for (table of tables.array) {

        if (table.name === 'transactions_scanners_tmp' || table.name === 'sqlite_sequence' || table.name === 'android_metadata' || table.name === 'settings') continue
        await fs.writeLine('\n\n\n' + table.sql + ';\n\n')


        let selectSql = `SELECT * FROM ${table.name}`
        let isPaging = true
        if (table.name === 'app_news') {
            selectSql += ' ORDER BY news_created DESC LIMIT 20'
            isPaging = false
        } else if (table.name === 'transactions') {
            selectSql += ` WHERE created_at > '${createdAt}'`
        }

        try {
            const perPage = 20
            let totalPages = 0
            if (isPaging) {
                const resCount = await Database.query(`SELECT COUNT(*) AS cn FROM ${table.name}`)
                if (resCount && resCount.array) {
                    totalPages = Math.floor(resCount.array[0].cn / perPage)
                }
            }
            for (let i = 0; i <= totalPages; i++) {
                let selectPagingSql = selectSql
                if (isPaging) {
                    selectPagingSql += ' LIMIT ' + perPage
                    if (i > 0) {
                        selectPagingSql += ' OFFSET ' + (perPage * i)
                    }
                }
                const res = await Database.query(selectPagingSql)
                if (res.array.length) {
                    const keys = Object.keys(res.array[0])
                    let tableTmp = `INSERT INTO ${table.name} (${keys.join(', ')}) VALUES ` + '\n('
                    let i = 0
                    for (const row of res.array) {
                        const tmp = []
                        for (const key of keys) {
                            if (typeof row[key] === 'number') {
                                tmp.push(row[key])
                            } else {
                                tmp.push("'" + row[key] + "'")
                            }
                        }
                        if (i > 0) {
                            tableTmp += '), \n('
                        }
                        tableTmp += tmp.join(', ')
                        i++;
                    }
                    await fs.writeLine(tableTmp + ');\n\n')
                }
            }
        } catch (e) {
            if (config.debug.appErrors) {
                console.log('Database.export error ' + e.message)
            }
            await fs.writeLine('Database.export error ' + e.message)
        }
    }
    return
}
