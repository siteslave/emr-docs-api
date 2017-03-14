import * as r from 'rethinkdb';
import * as moment from 'moment';
import { IDocument, IFile } from '../DataModels';

export class DocumentModel {
  saveDocs(connection: any, docs: IDocument) {
    return new Promise((resolve, reject) => {
      r.db("kemr").table("documents")
        .insert(docs)
        .run(connection, (err, results) => {
          if (err) reject(err);
          else resolve(results);
          connection.close();
        });
    });
  }

  getImageData(connection: any, id: string) {
    return new Promise((resolve, reject) => {
      r.db('kemr').table('documents')
        .get(id)
        .pluck('id', 'mimetype', 'type', 'data', 'filename')
        .run(connection, (err, results) => {
          if (err) reject(err);
          else resolve(results);
          connection.close();
        });
    });
  }

  getImageList(connection: any, vn: string) {
    return new Promise((resolve, reject) => {
      r.db('kemr').table('documents')
        .filter(r.row('vn').eq(vn))
        .pluck('id', 'mimetype', 'type', 'filename')
        .run(connection, (err, results) => {
          if (err) reject(err);
          else resolve(results);
          connection.close();
        });
    });
  }

  removeImage(connection: any, id: string) {
    return new Promise((resolve, reject) => {
      r.db('kemr').table('documents')
        .get(id)
        .delete()
        .run(connection, (err) => {
          if (err) reject(err);
          else resolve();
          connection.close();
        });
    });
  }
}