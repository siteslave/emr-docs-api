import Knex = require('knex');

import * as r from 'rethinkdb';
import * as moment from 'moment';

export class EmrModel {
  search(knex: Knex, hn: string) {
    let sql = `
      select o.hn, o.vn, o.vstdate, o.vsttime, k.department,
      DATE_FORMAT(o.vstdate, '%Y-%m') as ym
      from ovst as o
      left join kskdepartment as k on k.depcode=o.main_dep
      where o.hn=?
      and TIMESTAMPDIFF(year, o.vstdate, current_date())<=5
      order by o.vn desc
      `;
    return knex.raw(sql, [hn]);
  }

  getVistDate(knex: Knex, hn: string, yymm: string) {
    let sql = `
      select o.hn, o.vn, o.vstdate, o.vsttime, k.department
      from ovst as o
      left join kskdepartment as k on k.depcode=o.main_dep
      where o.hn=?
      and DATE_FORMAT(o.vstdate, '%Y-%m')=?
      and TIMESTAMPDIFF(year, o.vstdate, current_date())<=5
      order by o.vn desc
      `;

    return knex.raw(sql, [hn, yymm]);
  }

  getVisitDetail(knex: Knex, vn: string) {
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
    return knex.raw(sql, [vn]);
  }
}