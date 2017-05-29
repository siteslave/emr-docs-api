'use strict';

require('dotenv').config();
import * as cors from 'cors';
const protect = require('@risingstack/protect');

import * as express from 'express';
import * as path from 'path';
import * as favicon from 'serve-favicon';
import * as logger from 'morgan';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';

import index from './routes/index';
import userRouter from './routes/users';
import loginRouter from './routes/login';
import doctorRouter from './routes/doctors';
import hdcRouter from './routes/hdc';
import { Jwt } from './models/jwt';
import Knex = require('knex');
import { MySqlConnectionConfig } from 'knex';

const app: express.Express = express();

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname,'public','favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

app.use(protect.express.sqlInjection({
  body: true,
  loggerFunction: console.error
}));

app.use(protect.express.xss({
  body: true,
  loggerFunction: console.error
}));

let authUploader = (req, res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else if (req.body && req.body.token) {
    token = req.body.token;
  }

  let jwt = new Jwt();
  jwt.verify(token)
    .then((decoded: any) => {
      if (decoded.usertype === '1') { //uploader
        req.decoded = decoded;
        next();
      } else {
        return res.send({ ok: false, error: 'Permission denied!' });
      }
    }, err => {
      return res.send({
        ok: false,
        error: 'No token provided.',
        code: 403
      });
    });
}

let authDoctor = (req, res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  } else if (req.body && req.body.token) {
    token = req.body.token;
  }

  let jwt = new Jwt();
  jwt.verify(token)
    .then((decoded: any) => {
      if (decoded.usertype === '2') { //uploader
        req.decoded = decoded;
        next();
      } else {
        return res.send({ ok: false, error: 'Permission denied!' });
      }
    }, err => {
      return res.send({
        ok: false,
        error: 'No token provided.',
        code: 403
      });
    });
}

let dbDocs: MySqlConnectionConfig = {
  host: process.env.DOC_DBHOST,
  port: process.env.DOC_DBPORT,
  user: process.env.DOC_DBUSER,
  password: process.env.DOC_DBPASSWORD,
  database: process.env.DOC_DBNAME,
}

let dbHos: MySqlConnectionConfig = {
  host: process.env.HOS_DBHOST,
  port: process.env.HOS_DBPORT,
  user: process.env.HOS_DBUSER,
  password: process.env.HOS_DBPASSWORD,
  database: process.env.HOS_DBNAME,
}

let dbHdc: MySqlConnectionConfig = {
  host: process.env.HDC_DBHOST,
  port: process.env.HDC_DBPORT,
  user: process.env.HDC_DBUSER,
  password: process.env.HDC_DBPASSWORD,
  database: process.env.HDC_DBNAME,
}

app.use((req, res, next) => {
  req.dbDocs = Knex({
    client: 'mysql',
    connection: dbDocs,
    pool: {
      min: 0,
      max: 7,
      afterCreate: (conn, done) => {
        conn.query('SET NAMES utf8', (err) => {
          done(err, conn);
        });
      }
    },
    debug: true,
    acquireConnectionTimeout: 5000
  });

  req.dbHDC = Knex({
    client: 'mysql',
    connection: dbHdc,
    pool: {
      min: 0,
      max: 7,
      afterCreate: (conn, done) => {
        conn.query('SET NAMES utf8', (err) => {
          done(err, conn);
        });
      }
    },
    debug: true,
    acquireConnectionTimeout: 5000
  });

  req.dbHOS = Knex({
    client: 'mysql',
    connection: dbHos,
    pool: {
      min: 0,
      max: 7,
      afterCreate: (conn, done) => {
        conn.query('SET NAMES utf8', (err) => {
          done(err, conn);
        });
      }
    },
    debug: true,
    acquireConnectionTimeout: 5000
  });

  next();
});
app.use('/emr-docs/login', loginRouter);
app.use('/emr-docs', index);
app.use('/emr-docs/users', authUploader, userRouter);
app.use('/emr-docs/doctors', authDoctor, doctorRouter);
app.use('/emr-docs/hdc', authDoctor, hdcRouter);

//catch 404 and forward to error handler
app.use((req, res, next) => {
  var err = new Error('Not Found');
  err['status'] = 404;
  next(err);
});

//error handlers

//development error handler
//will print stacktrace
if (process.env.NODE_ENV === 'development') {
  app.use((err: Error, req, res, next) => {
    res.status(err['status'] || 500);
    res.send({
      title: 'error',
      message: err.message,
      error: err
    });
  });
}

//production error handler
// no stacktrace leaked to user
app.use((err: Error, req, res, next) => {
  console.log(err);
  res.status(err['status'] || 500);
  res.send({
    title: 'error',
    message: err.message,
    error: {}
  });
});

export default app;
