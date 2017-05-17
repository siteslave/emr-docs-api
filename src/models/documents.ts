import Knex = require('knex');
import * as moment from 'moment';
import { IDocument } from '../DataModels';

export class DocumentModel {
  saveDocs(knex: Knex, docs: IDocument) {
    return knex('documents')
      .insert(docs);
  }

  getImageData(knex: Knex, id: string) {
    return knex('documents')
      .where('id', id)
      .limit(1);
  }

  getImageList(knex: Knex, vn: string) {
    return knex('documents')
      .where('vn', vn);
  }

  removeImage(knex: Knex, id: string) {
    return knex('documents')
      .where('id', id)
      .del();
  }
}