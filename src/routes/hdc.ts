'use strict';
import * as path from 'path';
import * as fs from 'fs';
import * as rimraf from 'rimraf';

import * as express from 'express';
import * as _ from 'lodash';
import * as moment from 'moment';
import { HDCModel } from '../models/hdc';

const router = express.Router();
const hdcModel = new HDCModel();

router.get('/search/:hn', (req, res, next) => {
  let hn = req.params.hn;
  if (hn) {
    if (hn.length === 1) hn = `000000${hn}`;
    if (hn.length === 2) hn = `00000${hn}`;
    if (hn.length === 3) hn = `0000${hn}`;
    if (hn.length === 4) hn = `000${hn}`;
    if (hn.length === 5) hn = `00${hn}`;
    if (hn.length === 6) hn = `0${hn}`;
    let db = req.dbHDC;

    hdcModel.getCid(db, hn)
      .then((rows: any) => {
        let cid = rows[0].cid || null;
        return hdcModel.getVistDate(db, cid);
      })
      .then((results: any) => {
        // console.log(results);
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
        res.send({ ok: true, rows: vstdate });
      })
      .catch(error => {
        console.log(error);
        res.send({
          ok: false,
          code: 500,
          message: error.message
        })
      })
      .finally(() => {
        db.destroy();
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

router.get('/visit-detail/:hospcode/:pid/:seq', (req, res, next) => {
  let hospcode = req.params.hospcode;
  let pid = req.params.pid;
  let seq = req.params.seq;
  let db = req.dbHDC;

  if (hospcode && pid && seq) {
    let service = null;
    let diag = null;
    let proced = null;
    let drug = null;

    hdcModel.getServiceDetail(db, hospcode, pid, seq)
      .then((rows: any) => {
        if (rows[0].length) {
          let results = rows[0];
          service = {
            time_serv: moment(results[0].time_serv, 'HHmmss').format('HH:mm'),
            date_serv: `${moment(results[0].date_serv).get('date')} ${moment(results[0].date_serv).locale('th').format('MMMM')} ${moment(results[0].date_serv).get('year') + 543}`,
            instype: results[0].instypename,
            hospcode: results[0].hospcode,
            hospname: results[0].hospname,
            sbp: results[0].sbp,
            dbp: results[0].dbp,
            chiefcomp: results[0].chiefcomp,
            ptname: results[0].name + ' ' + results[0].lname,
            sex: results[0].sex,
            age: results[0].age,
            birth: `${moment(results[0].birth).get('date')} ${moment(results[0].birth).locale('th').format('MMMM')} ${moment(results[0].birth).get('year') + 543}`
          }
        }
        return hdcModel.getServiceDiag(db, hospcode, pid, seq);
      })
      .then((results: any) => {
        diag = results[0];
        return hdcModel.getServiceProced(db, hospcode, pid, seq);
      })
      .then((results: any) => {
        proced = results[0];
        return hdcModel.getServiceDrug(db, hospcode, pid, seq);
      })
      .then((results: any) => {
        drug = results[0];
        res.send({ ok: true, service: service, diag: diag, proced: proced, drug: drug });
      })
      .catch((error) => {
        console.log(error);
        res.send({ ok: false, error: error.message });
      })
      .finally(() => {
        db.destroy();
      })
  } else {
    res.send({ ok: false, error: 'ไม่พบข้อมูล' })
  }
});

// router.get('/emr-detail/:vn', (req, res, next) => {
//   let vn = req.params.vn;
//   if (vn) {
//     connection.getMySQLConnection()
//       .then((conn: IConnection) => {
//         emrModel.getVisitDetail(conn, vn)
//           .then((results: any) => {
//             let visit: Object = {
//               hn: results.hn,
//               vn: results.vn,
//               ptname: results.ptname,
//               vsttime: moment(results.vsttime, 'HH:mm:ss').format('HH:mm'),
//               date_serv: `${moment(results.vstdate).get('date')} ${moment(results.vstdate).locale('th').format('MMMM')} ${moment(results.vstdate).get('year') + 543}`,
//               department: results.department,
//               pttype: results.pttype_name,
//               spclty: results.spclty_name,
//               doctor: results.doctor_name,
//               diag: results.diag
//             }

//             res.send({ ok: true, rows: visit });
//           })
//           .catch(error => {
//             console.log(error);
//             res.send({
//               ok: false,
//               code: 500,
//               message: "Server error!"
//             })
//           });
//       });
//   } else {
//     res.send({ ok: false, error: 'ไม่พบรหัส VN' })
//   }
// })

// router.get('/view-image/:imageId', (req, res, next) => {
//   let imageId = req.params.imageId;

//   if (imageId) {
//     connection.getRethinkConnection()
//       .then((conn: any) => {
//         documentModel.getImageData(conn, imageId)
//           .then((results: any) => {
//             let data = results.data;
//             res.writeHead(200, {
//               'Content-Type': results.mimetype,
//               'Content-Length': data.length
//             });
//             res.end(data);
//             // save to file
//             // rimraf.sync('xxx.png');
//             // fs.writeFileSync('xxx.png', data);
//           })
//           .catch(err => {
//             console.log(err);
//             res.send({
//               ok: false, error: {
//                 code: 500,
//                 message: 'Server error!'
//               }
//             })
//           });
//       });
//   } else {
//     res.send({ ok: false, error: 'ไม่พบรหัสรูปภาพ' })
//   }
// })

// router.get('/image-list/:vn', (req, res, next) => {
//   let vn = req.params.vn;

//   if (vn) {
//     connection.getRethinkConnection()
//       .then((conn: any) => {
//         documentModel.getImageList(conn, vn)
//           .then((cursor: Cursor) => {
//             cursor.toArray((err, rows) => {
//               if (err) res.send({ ok: false, error: err });
//               else res.send({ ok: true, rows: rows });
//             })
//           })
//           .catch(err => {
//             console.log(err);
//             res.send({
//               ok: false, error: {
//                 code: 500,
//                 message: 'Server error!'
//               }
//             })
//           });
//       });
//   } else {
//     res.send({ ok: false, error: 'ไม่พบรหัสรูปภาพ' })
//   }
// })

// router.delete('/image-remove/:id', (req, res, next) => {
//   let id = req.params.id;

//   if (id) {
//     connection.getRethinkConnection()
//       .then((conn: any) => {
//         documentModel.removeImage(conn, id)
//           .then(() => {
//             res.send({ ok: true });
//           })
//           .catch(err => {
//             console.log(err);
//             res.send({
//               ok: false, error: {
//                 code: 500,
//                 message: 'Server error!'
//               }
//             })
//           });
//       });
//   } else {
//     res.send({ ok: false, error: 'ไม่พบรหัสรูปภาพ' })
//   }
// })

export default router;