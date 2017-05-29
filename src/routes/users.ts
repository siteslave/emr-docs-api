'use strict';
import * as path from 'path';
import * as fs from 'fs';
import * as fse from 'fs-extra';

import * as rimraf from 'rimraf';
import * as mv from 'mv';
const uuidV4 = require('uuid/v4');

import * as express from 'express';
import * as _ from 'lodash';
import * as moment from 'moment';
import * as multer from 'multer';

import { IConnection } from 'mysql';
import { EmrModel } from '../models/emr';
import { DocumentModel } from '../models/documents';
import { IDocument } from '../DataModels';
const router = express.Router();
const emrModel = new EmrModel();
const documentModel = new DocumentModel();
// create uploaded folder
fse.ensureDirSync(process.env.UPLOAD_PATH);
fse.ensureDirSync(process.env.DOCUMENTS_PATH);

// const upload = multer({ dest: 'uploads/' })
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, process.env.UPLOAD_PATH)
  },
  filename: function (req, file, cb) {
    let _ext = path.extname(file.originalname);
    let document_id = uuidV4();
    cb(null, document_id + _ext)
  }
})

var upload = multer({ storage: storage })

router.post('/uploads', upload.any(), (req, res, next) => {
  let files = req.files;
  let docs = [];
  let hn = req.body.hn;
  let vn = req.body.vn;
  let imageType = req.body.imageType;
  let dbDocs = req.dbDocs;

  let sPath = path.join(hn, vn);
  let dPath = path.join(process.env.DOCUMENTS_PATH, sPath); // path for save to storage

  fse.ensureDirSync(dPath);

  files.forEach(file => {
    let fileNameWithOutExt = file.filename.replace(/\.[^/.]+$/, ""); // file without extension
    let sImagePath = path.join(sPath, fileNameWithOutExt); // path for save to database
    let uploaded_at = moment().format('x');
    let doc: IDocument = {
      vn: vn,
      hn: hn,
      ext: path.extname(file.path),
      mimetype: file.mimetype,
      image_type: imageType,
      file_name: file.originalname,
      uploaded_at: uploaded_at,
      file_path: sImagePath,
      username: 'xxx'
    };
    docs.push(doc);
  });

  files.forEach(file => {
    let fileNameWithOutExt = file.filename.replace(/\.[^/.]+$/, ""); // file without extension
    let destFile = path.join(dPath, fileNameWithOutExt);
    let sourceFile = file.path;

    mv(sourceFile, destFile, (err) => { if (err) console.log(err) });

  })

  documentModel.saveDocs(dbDocs, docs)
    .then(() => {
      res.send({ ok: true });
    })
    .catch(err => {
      console.log(err);
      res.send({ ok: false, error: err.message });
    })
    .finally(() => {
      dbDocs.destroy();
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

    let db = req.dbHOS;
    emrModel.search(db, hn)
      .then((rows: any) => {
        let results = rows[0];
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
        db.destroy();
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
      });
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
  let db = req.dbHOS;

  if (hn && yymm) {
    emrModel.getVistDate(db, hn, yymm)
      .then((results: any) => {
        let visits: any = [];
        results[0].forEach((v: any) => {
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
          message: error.message
        })
      })
      .finally(() => {
        db.destroy();
      });
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
  let db = req.dbHOS;

  if (vn) {
    emrModel.getVisitDetail(db, vn)
      .then((rows: any) => {
        let results = rows[0][0];
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
          message: error.message
        })
      })
      .finally(() => {
        db.destroy();
      });
  } else {
    res.send({ ok: false, error: 'ไม่พบรหัส VN' })
  }
})

router.get('/view-image/:imageId', (req, res, next) => {
  let imageId = req.params.imageId;
  let db = req.dbDocs;

  if (imageId) {
    documentModel.getImageData(db, imageId)
      .then((rows: any) => {
        let results = rows[0];
        let filePath = path.join(process.env.DOCUMENTS_PATH, results.file_path);
        let data = fs.readFileSync(filePath);
        res.writeHead(200, {
          'Content-Type': results.mimetype,
          'Content-Length': data.length
        });
        res.end(data);
      })
      .catch(err => {
        console.log(err);
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
    res.send({ ok: false, error: 'ไม่พบรหัสรูปภาพ' })
  }
})

router.get('/image-list/:vn', (req, res, next) => {
  let vn = req.params.vn;
  let db = req.dbDocs;

  if (vn) {
    documentModel.getImageList(db, vn)
      .then((rows: any) => {
        res.send({ ok: true, rows: rows });
      })
      .catch(err => {
        console.log(err);
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
    res.send({ ok: false, error: 'ไม่พบรหัสรูปภาพ' })
  }
})

router.delete('/image-remove/:id', (req, res, next) => {
  let id = req.params.id;
  let db = req.dbDocs;
  if (id) {
    documentModel.removeImage(db, id)
      .then(() => {
        res.send({ ok: true });
      })
      .catch(err => {
        console.log(err);
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
    res.send({ ok: false, error: 'ไม่พบรหัสรูปภาพ' })
  }
})

export default router;