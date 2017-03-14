import { IConnection } from 'mysql';

import * as r from 'rethinkdb';
import * as moment from 'moment';

export class EmrModel {
  search(connection: IConnection, hn: string) {
    return new Promise((resolve, reject) => {
      let sql = `
      select o.hn, o.vn, o.vstdate, o.vsttime, k.department,
      DATE_FORMAT(o.vstdate, '%Y-%m') as ym
      from ovst as o
      left join kskdepartment as k on k.depcode=o.main_dep
      where o.hn=?
      and TIMESTAMPDIFF(year, o.vstdate, current_date())<=5
      order by o.vn desc
      `;
      // run query
      connection.query(sql, [hn], (err, results) => {
        if (err) reject(err);
        else resolve(results);
        // release connection
        connection.release();
      });
    });
  }

  getVistDate(connection: IConnection, hn: string, yymm: string) {
    return new Promise((resolve, reject) => {
      let sql = `
      select o.hn, o.vn, o.vstdate, o.vsttime, k.department
      from ovst as o
      left join kskdepartment as k on k.depcode=o.main_dep
      where o.hn=?
      and DATE_FORMAT(o.vstdate, '%Y-%m')=?
      and TIMESTAMPDIFF(year, o.vstdate, current_date())<=5
      order by o.vn desc
      `;
      // run query
      connection.query(sql, [hn, yymm], (err, results) => {
        if (err) reject(err);
        else resolve(results);
        // release connection
        connection.release();
      });
    });
  }

  getVisitDetail(connection: IConnection, vn: string) {
    return new Promise((resolve, reject) => {
      let sql = `
      select o.hn, o.vn, o.vstdate, o.vsttime, o.doctor, o.pttype, o.spclty,
      concat(o.pttype, " - ", p.name) as pttype_name, s.name as spclty_name, k.department,
      d.name as doctor_name, concat(od.icd10, " - ", icd.name) as diag,
      concat(pt.pname, pt.fname, " ", pt.lname) as ptname
      from ovst as o
      inner join patient as pt on pt.hn=o.hn
      left join pttype as p on p.pttype=o.pttype
      left join spclty as s on s.spclty=o.spclty
      left join kskdepartment as k on k.depcode=o.main_dep
      left join doctor as d on d.code=o.doctor
      left join ovstdiag as od on od.vn=o.vn and od.diagtype='1'
      left join icd101 as icd on icd.code=od.icd10
      where o.vn=? limit 1

      `;
      // run query
      connection.query(sql, [vn], (err, results) => {
        if (err) reject(err);
        else resolve(results[0]);
        // release connection
        connection.release();
      });
    });
  }
}