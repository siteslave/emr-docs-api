'use strict';

import * as express from 'express';
import * as crypto from 'crypto';
import { Jwt } from '../models/jwt';
import { LoginModel } from '../models/login';

const router = express.Router();
const jwt = new Jwt();
const loginModel = new LoginModel();

router.post('/', (req, res, next) => {
  let username = req.body.username;
  let password = req.body.password;
  let db = req.dbDocs;

  if (username && password) {
    let encPassword = crypto.createHash('md5').update(password).digest('hex');
    loginModel.doLogin(db, username, encPassword)
      .then((rows) => {
        if (rows.length) {
          let playload = { fullname: rows[0].fullname, usertype: rows[0].usertype, username: rows[0].username }
          const token = jwt.sign(playload)
          res.send({ ok: true, token: token });
        } else {
          res.send({ ok: false, error: 'ชื่อผู้ใช้งาน/รหัสผ่านไม่ถูกต้อง' })
        }
      })
      .catch(err => {
        res.send({
          ok: false, error: {
            code: 500,
            message: err.message
          }
        })
      })
      .finally(() => {
        db.destroy();
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