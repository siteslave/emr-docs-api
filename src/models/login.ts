import * as r from 'rethinkdb';
import * as moment from 'moment';

export class LoginModel {
  doLogin(connection: any, username: string, password: string) {
    return new Promise((resolve, reject) => {
      r.db("kemr").table("users")
        .filter(r.row('username').eq(username))
        .filter(r.row('password').eq(password))
        .withFields('username', 'user_type', 'first_name', 'last_name')
        .run(connection, (err, results) => {
          if (err) reject(err);
          else resolve(results);
          connection.close();
        });
    });
  }
}