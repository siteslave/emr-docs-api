'use strict';
import * as path from 'path';
import * as fs from 'fs';
import * as rimraf from 'rimraf';

import * as express from 'express';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Cursor, Connection as RethinkConnection } from 'rethinkdb';
import * as r from 'rethinkdb';

import { IConnection } from 'mysql';
import { EmrModel } from '../models/emr';
import { DocumentModel } from '../models/documents';
import { Connection } from '../models/connection';

const router = express.Router();
const emrModel = new EmrModel();
const documentModel = new DocumentModel();
const connection = new Connection();

import * as multer from 'multer';
// const upload = multer({ dest: 'uploads/' })
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads')
  },
  filename: function (req, file, cb) {
    let _path = path.extname(file.originalname);
    cb(null, Date.now() + _path)
  }
})

var upload = multer({ storage: storage })


router.post('/uploads', upload.any(), (req, res, next) => {
  let files = req.files;
  let docs = [];
  let hn = req.body.hn;
  let vn = req.body.vn;
  let imageType = req.body.imageType;

  files.forEach(v => {
    let fileData = fs.readFileSync(v.path);
    // let buffer = new Buffer(fileData);
    let uploaded_at = moment().format('x');
    let obj = {
      vn: vn,
      hn: hn,
      data: fileData,
      mimetype: v.mimetype,
      type: imageType,
      filename: v.originalname,
      uploaded_at: uploaded_at
    };
    docs.push(obj);
    rimraf.sync(v.path);
  });

  connection.getRethinkConnection()
    .then((conn: RethinkConnection) => {
      documentModel.saveDocs(conn, docs)
        .then(() => {
          conn.close();
          res.send({ ok: true });
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
        })
    });

});

router.get('/search/:hn', (req, res, next) => {
  let hn = req.params.hn;
  if (hn) {
    if (hn.length === 1) hn = `000000${hn}`;
    if (hn.length === 2) hn = `00000${hn}`;
    if (hn.length === 3) hn = `0000${hn}`;
    if (hn.length === 4) hn = `000${hn}`;
    if (hn.length === 5) hn = `00${hn}`;
    if (hn.length === 6) hn = `0${hn}`;

    connection.getMySQLConnection()
      .then((conn: IConnection) => {
        emrModel.search(conn, hn)
          .then((results: any) => {
            let uniqDate = _.uniqBy(results, "ym");
            let vstdate: any = [];
            let visits = [];

            uniqDate.forEach((v: any) => {
              let xx = _.filter(results, { ym: v.ym });
              let vdate: Object = {
                id: v.ym,
                name: `${moment(v.ym, 'YYYY-MM').locale('th').format('MMMM')} ${moment(v.ym, 'YYYY-MM').get('year') + 543}`,
                visits: xx
              }
              vstdate.push(vdate);
            });
            conn.destroy();
            res.send({ ok: true, rows: vstdate });
          })
          .catch(error => {
            conn.destroy();
            console.log(error);
            res.send({
              ok: false,
              code: 500,
              message: "Server error!"
            })
          })

      })
  } else {
    res.send({
      ok: false,
      error: {
        code: 500,
        message: "ไม่พบคำที่ค้นหา"
      }
    })
  }
})

router.get('/visit-list/:hn/:yymm', (req, res, next) => {
  let hn = req.params.hn;
  let yymm = req.params.yymm;

  if (hn && yymm) {
    connection.getMySQLConnection()
      .then((conn: IConnection) => {
        emrModel.getVistDate(conn, hn, yymm)
          .then((results: any) => {
            let visits: any = [];

            results.forEach((v: any) => {
              let visit: Object = {
                vn: v.vn,
                vsttime: moment(v.vsttime, 'HH:mm:ss').format('HH:mm'),
                vstdate: `${moment(v.vstdate).get('date')} ${moment(v.vstdate).locale('th').format('MMMM')} ${moment(v.vstdate).get('year') + 543}`,
                department: v.department
              }
              visits.push(visit);
            });
            conn.destroy();
            res.send({ ok: true, rows: visits })
          })
          .catch(error => {
            conn.destroy();
            console.log(error);
            res.send({
              ok: false,
              code: 500,
              message: "Server error!"
            })
          });
      })
  } else {
    res.send({
      ok: false,
      error: {
        code: 500,
        message: "ไม่พบคำที่ค้นหา"
      }
    })
  }
})

router.get('/emr-detail/:vn', (req, res, next) => {
  let vn = req.params.vn;
  if (vn) {
    connection.getMySQLConnection()
      .then((conn: IConnection) => {
        emrModel.getVisitDetail(conn, vn)
          .then((results: any) => {
            let visit: Object = {
              hn: results.hn,
              vn: results.vn,
              ptname: results.ptname,
              vsttime: moment(results.vsttime, 'HH:mm:ss').format('HH:mm'),
              vstdate: `${moment(results.vstdate).get('date')} ${moment(results.vstdate).locale('th').format('MMMM')} ${moment(results.vstdate).get('year') + 543}`,
              department: results.department,
              pttype: results.pttype_name,
              spclty: results.spclty_name,
              doctor: results.doctor_name,
              diag: results.diag
            }
            conn.destroy();
            res.send({ ok: true, rows: visit });
          })
          .catch(error => {
            conn.destroy();
            console.log(error);
            res.send({
              ok: false,
              code: 500,
              message: "Server error!"
            })
          })
      });
  } else {
    res.send({ ok: false, error: 'ไม่พบรหัส VN' })
  }
})

router.get('/view-image/:imageId', (req, res, next) => {
  let imageId = req.params.imageId;

  if (imageId) {
    connection.getRethinkConnection()
      .then((conn: RethinkConnection) => {
        documentModel.getImageData(conn, imageId)
          .then((results: any) => {
            let data = results.data;
            res.writeHead(200, {
              'Content-Type': results.mimetype,
              'Content-Length': data.length
            });

            conn.close();
            res.end(data);
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
    res.send({ ok: false, error: 'ไม่พบรหัสรูปภาพ' })
  }
})

router.get('/image-list/:vn', (req, res, next) => {
  let vn = req.params.vn;

  if (vn) {
    connection.getRethinkConnection()
      .then((conn: RethinkConnection) => {
        documentModel.getImageList(conn, vn)
          .then((cursor: Cursor) => {
            cursor.toArray((err, rows) => {
              if (err) res.send({ ok: false, error: err });
              else res.send({ ok: true, rows: rows });
            });

            conn.close();
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
    res.send({ ok: false, error: 'ไม่พบรหัสรูปภาพ' })
  }
})

router.delete('/image-remove/:id', (req, res, next) => {
  let id = req.params.id;

  if (id) {
    connection.getRethinkConnection()
      .then((conn: RethinkConnection) => {
        documentModel.removeImage(conn, id)
          .then(() => {
            conn.close();
            res.send({ ok: true });
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
    res.send({ ok: false, error: 'ไม่พบรหัสรูปภาพ' })
  }
})

export default router;