'use strict';
import * as path from 'path';
import * as fs from 'fs';
import * as rimraf from 'rimraf';

import * as express from 'express';
import * as _ from 'lodash';
import * as moment from 'moment';
import { Cursor } from 'rethinkdb';
import * as r from 'rethinkdb';

import { IConnection } from 'mysql';
import { EmrModel } from '../models/emr';
import { PatientModel } from '../models/patient';

import { DocumentModel } from '../models/documents';
import { Connection } from '../models/connection';

const router = express.Router();
const emrModel = new EmrModel();
const patientModel = new PatientModel();
const documentModel = new DocumentModel();
const connection = new Connection();

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

            res.send({ ok: true, rows: vstdate });
          })
          .catch(error => {
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
            res.send({ ok: true, rows: visits })
          })
          .catch(error => {
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

            res.send({ ok: true, rows: visit });
          })
          .catch(error => {
            console.log(error);
            res.send({
              ok: false,
              code: 500,
              message: "Server error!"
            })
          });
      });
  } else {
    res.send({ ok: false, error: 'ไม่พบรหัส VN' })
  }
})

router.get('/view-image/:imageId', (req, res, next) => {
  let imageId = req.params.imageId;

  if (imageId) {
    connection.getRethinkConnection()
      .then((conn: any) => {
        documentModel.getImageData(conn, imageId)
          .then((results: any) => {
            let data = results.data;
            res.writeHead(200, {
              'Content-Type': results.mimetype,
              'Content-Length': data.length
            });
            res.end(data);
            // save to file
            // rimraf.sync('xxx.png');
            // fs.writeFileSync('xxx.png', data);
          })
          .catch(err => {
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
      .then((conn: any) => {
        documentModel.getImageList(conn, vn)
          .then((cursor: Cursor) => {
            cursor.toArray((err, rows) => {
              if (err) res.send({ ok: false, error: err });
              else res.send({ ok: true, rows: rows });
            })
          })
          .catch(err => {
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

router.get('/info/:hn', (req, res, next) => {
  let hn = req.params.hn;
  if (hn) {

    let info = {};
    let allergies = [];
    let clinics = [];
    let labs = [];
    let bp = [];
    let fbs = [];

    if (hn.length === 1) hn = `000000${hn}`;
    if (hn.length === 2) hn = `00000${hn}`;
    if (hn.length === 3) hn = `0000${hn}`;
    if (hn.length === 4) hn = `000${hn}`;
    if (hn.length === 5) hn = `00${hn}`;
    if (hn.length === 6) hn = `0${hn}`;

    connection.getMySQLConnection()
      .then((conn: IConnection) => {
        // get info
        patientModel.getInfo(conn, hn)
          .then((results: any) => {
            if (results.length) {
              let info: Object = {
                hn: results[0].hn,
                ptname: results[0].ptname,
                birth: results[0].birthday ? `${moment(results[0].birthday).get('date')} ${moment(results[0].birthday).locale('th').format('MMMM')} ${moment(results[0].birthday).get('year') + 543}` : '',
                age: results[0].age,
                pttype: `${results[0].pttype} - ${results[0].pttype_name}`,
                sex: results[0].sex == '1' ? 'ชาย' : 'หญิง',
                nationality: results[0].nationality_name,
                typearea: results[0].house_regist_type_name,
                address: `${results[0].addrpart} หมู่ ${results[0].moopart} ${results[0].address1}`,
                death: results[0].death,
                bloodgrp: results[0].bloodgrp,
                last_vist: results[0].last_visit ? `${moment(results[0].last_visit).get('date')} ${moment(results.last_visit).locale('th').format('MMMM')} ${moment(results.last_visit).get('year') + 543}` : '',
                last_update: results[0].last_update ? `${moment(results[0].last_update).get('date')} ${moment(results[0].last_update).locale('th').format('MMMM')} ${moment(results[0].last_update).get('year') + 543}` : '',
                firstday: results[0].firstday ? `${moment(results[0].firstday).get('date')} ${moment(results[0].firstday).locale('th').format('MMMM')} ${moment(results[0].firstday).get('year') + 543}` : '',
              }

              patientModel.getClinicMember(conn, hn)
                .then((results: any) => {
                  results.forEach(v => {
                    let obj = {
                      clinic_name: v.clinic_name,
                      regdate: v.regdate ? `${moment(v.regdate).get('date')} ${moment(v.regdate).locale('th').format('MMMM')} ${moment(v.regdate).get('year') + 543}` : '',
                      lastvisit: v.lastvisit ? `${moment(v.lastvisit).get('date')} ${moment(v.lastvisit).locale('th').format('MMMM')} ${moment(v.lastvisit).get('year') + 543}` : '',
                      next_app_date: v.next_app_date ? `${moment(v.next_app_date).get('date')} ${moment(v.next_app_date).locale('th').format('MMMM')} ${moment(v.next_app_date).get('year') + 543}` : '',
                      lastupdate: v.lastupdate ? `${moment(v.lastupdate).get('date')} ${moment(v.lastupdate).locale('th').format('MMMM')} ${moment(v.lastupdate).get('year') + 543}` : '',
                      begin_year: v.begin_year
                    };
                    clinics.push(obj);
                  });
                  return patientModel.getAllergy(conn, hn);
                })
                .then((results: any) => {
                  allergies = results;
                  return patientModel.getLastLab(conn, hn);

                })
                .then((results: any) => {
                  // labs = results;
                  let uniqDate = _.uniqBy(results, "ymd");

                  let visits = [];

                  uniqDate.forEach((v: any) => {
                    let xx = _.filter(results, { ymd: v.ymd });
                    let _items = []
                    xx.forEach((z: any) => {
                      let obj = {
                        lab_items_name: z.lab_items_name,
                        lab_order_result: z.lab_order_result,
                        lab_items_normal_value_ref: z.lab_items_normal_value_ref
                      };
                      _items.push(obj);
                    });

                    let items: Object = {
                      date_serve: `${moment(v.order_date, 'YYYY-MM-DD').format('D')} ${moment(v.order_date, 'YYYY-MM-DD').locale('th').format('MMMM')} ${moment(v.order_date, 'YYYY-MM-DD').get('year') + 543}`,
                      items: _items
                    }
                    labs.push(items);
                  });
                  return patientModel.getScreenBp(conn, hn);
                })
                .then((results: any) => {
                  // screenData = results;
                  results.forEach(v => {
                    let obj = {
                      vstdate: `${moment(v.vstdate, 'YYYY-MM-DD').format('D')} ${moment(v.vstdate, 'YYYY-MM-DD').locale('th').format('MMM')} ${moment(v.vstdate, 'YYYY-MM-DD').get('year') + 543}`,
                      bps: v.bps,
                      bpd: v.bpd,
                      ymd: moment(v.vstdate).format('x')
                    };
                    bp.push(obj);
                  });
                  return patientModel.getScreenFbs(conn, hn);
                })
                .then((results: any) => {
                  results.forEach(v => {
                    let obj = {
                      vstdate: `${moment(v.vstdate, 'YYYY-MM-DD').format('D')} ${moment(v.vstdate, 'YYYY-MM-DD').locale('th').format('MMM')} ${moment(v.vstdate, 'YYYY-MM-DD').get('year') + 543}`,
                      fbs: v.fbs,
                      ymd: moment(v.vstdate).format('x')
                    };
                    fbs.push(obj);
                  });
                  res.send({
                    ok: true,
                    info: info,
                    clinics: clinics,
                    allergies: allergies,
                    labs: labs,
                    bp: bp,
                    fbs: fbs
                  });
                })

            } else {
              res.send({ ok: false, error: 'ไม่พบข้อมูล' })
            }

            conn.release();

          })
          .catch(error => {
            console.log(error);
            res.send({
              ok: false,
              code: 500,
              message: "Server error!"
            })
          });
      });
  } else {
    res.send({ ok: false, error: 'กรุณาระบุ HN' })
  }
})

export default router;