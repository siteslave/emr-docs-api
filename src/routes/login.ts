'use strict';

import * as express from 'express';
import * as crypto from 'crypto';
import * as r from "rethinkdb";
import { Cursor, Connection as RethinkConnection } from 'rethinkdb';

import { IConnection } from 'mysql';
import { Jwt } from '../models/jwt';
import { LoginModel } from '../models/login';
import { Connection } from '../models/connection';

const router = express.Router();
const jwt = new Jwt();
const loginModel = new LoginModel();
const connection = new Connection();

router.post('/', (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;
  if (username && password) {
    let encPassword = crypto.createHash('md5').update(password).digest('hex');

    connection.getRethinkConnection()
      .then((conn: RethinkConnection) => {
        loginModel.doLogin(conn, username, encPassword)
          .then((cursor: Cursor) => {
            cursor.toArray((err, rows) => {
              conn.close();
              if (err) {
                res.send({ ok: false, error: err });
              } else {
                if (rows.length) {
                  let fullname = `${rows[0].first_name} ${rows[0].last_name}`;
                  let playload = {fullname: fullname, user_type: rows[0].user_type, username: rows[0].username}
                  const token = jwt.sign(playload)
                  res.send({ ok: true, token: token });
                } else {
                  res.send({ok: false, error: 'ชื่อผู้ใช้งาน/รหัสผ่านไม่ถูกต้อง'})
                }
              }
            });
            // res.send({ok: true, rows: results})
          })
          .catch(err => {
            conn.close();
            console.log(err);
            res.send({
              ok: false, error: {
                code: 500,
                message: 'Server error!'
              }
            })
          });
      });

  } else {
    res.send({
      ok: false,
      error: {
        code: 200,
        message: 'กรุณาระบุชื่อผู้ใช้งาน/รหัสผ่าน'
      }
    })
  }
})

export default router;