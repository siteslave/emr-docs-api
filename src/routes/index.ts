'use strict';

import * as express from 'express';
const router = express.Router();

router
  .get('/', (req, res, next) => {
    res.send({ ok: true, message: 'Welcome to kDocument server', version: '1.0.0' });
  })

export default router;