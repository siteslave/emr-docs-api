import Knex = require('knex');
import * as moment from 'moment';

export class LoginModel {
  doLogin(knex: Knex, username: string, password: string) {
    return knex('users')
      .where({
        username: username,
        password: password
      })
      .limit(1)
  }
}