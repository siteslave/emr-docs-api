'use strict';

require('dotenv').config();
import * as cors from 'cors';

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

const app: express.Express = express();

//view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

//uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname,'public','favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

let authUploader = (req, res, next) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  let jwt = new Jwt();
  jwt.verify(token)
    .then((decoded: any) => {
      if (decoded.user_type === '1') { //uploader
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
  }

  let jwt = new Jwt();
  jwt.verify(token)
    .then((decoded: any) => {
      if (decoded.user_type === '2') { //uploader
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

app.use('/emr-docs/login', loginRouter);
// app.use('/emr-docs', index);
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
