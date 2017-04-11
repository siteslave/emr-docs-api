'use strict';

import * as express from 'express';
const router = express.Router();

// user management
router.route('/users')
  .get()
  .post()
  .put()
  .delete();

// Document type
router.route('/document-types')
  .get()
  .post()
  .put()
  .delete();

// Document type
router.route('/activities')
  .get()
  .post()
  .put()
  .delete();

export default router;