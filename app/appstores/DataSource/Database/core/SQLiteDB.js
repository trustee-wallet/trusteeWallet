
import SQLiteStorage from 'react-native-sqlite-helper/node_modules/react-native-sqlite-storage';
import SQLiteHelper from 'react-native-sqlite-helper';

import Log from '@app/services/Log/Log';
import config from '@app/config/config';


const SQLiteHelperDB = new SQLiteHelper('TrusteeWalletDB.db')

SQLiteStorage.DEBUG(config.debug.appDBLogs);
SQLiteHelperDB.successInfo = (text, absolutely) => {
  if (!config.debug.appDBLogs) return false;
  Log.log(absolutely ? text : `SQLiteHelper ${text} success`);
};
SQLiteHelperDB.errorInfo = (text, err, absolutely) => {
  if (!config.debug.appDBLogs && !config.debug.appErrors) return false;
  Log.log(absolutely ? text : `SQLiteHelper ${text} error: ${err.message}`);
};


let _instance = null;

export async function getSQLiteInstance() {
  if (_instance !== null) return _instance;

  _instance = SQLiteHelperDB;
  try {
    const { res } = await SQLiteHelperDB.open();
    _instance.query = res;
  } catch (err) {
    Log.err(`SQLiteHelperDB.open() error: ${err.message}`);
  }

  return _instance;
}
