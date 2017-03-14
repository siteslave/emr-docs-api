import * as mysql from 'mysql';
import * as r from "rethinkdb";
import { ConnectionOptions } from 'rethinkdb';
import { IConnection } from 'mysql';


export class Connection {
  getMySQLConnection() {
    return new Promise((resolve, reject) => {
      let config = {
        host: process.env.HOS_DBHOST || 'localhost',
        port: process.env.HOS_DBPORT || 3306,
        database: process.env.HOS_DBNAME || 'kinv',
        user: process.env.HOS_DBUSER || 'root',
        password: process.env.HOS_DBPASSWORD || ''
      }

      let pool = mysql.createPool(config);

      pool.getConnection((err, connection) => {
        if (err) reject(err);
        else resolve(connection)
      });

      pool.on('connection', (connection) => {
        connection.query('SET NAMES utf8')
      });
    });
  }
  getHDCConnection() {
    return new Promise((resolve, reject) => {
      let config = {
        host: process.env.HDC_DBHOST || 'localhost',
        port: process.env.HDC_DBPORT || 3306,
        database: process.env.HDC_DBNAME || 'kinv',
        user: process.env.HDC_DBUSER || 'root',
        password: process.env.HDC_DBPASSWORD || ''
      }

      let pool = mysql.createPool(config);

      pool.getConnection((err, connection) => {
        if (err) reject(err);
        else resolve(connection)
      });

      pool.on('connection', (connection) => {
        connection.query('SET NAMES utf8')
      });
    });
  }

  getRethinkConnection() {
    return new Promise((resolve, reject) => {
      let options: ConnectionOptions = {
        host: 'localhost',
        port: 28015
      }

      r.connect(options, (error, connection) => {
        if (error) reject(error);
        else resolve(connection);
      });
    });
  }
}