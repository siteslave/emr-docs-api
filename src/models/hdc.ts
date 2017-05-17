import Knex = require('knex');
import * as moment from 'moment';

const HOSPCODE = '11053';

export class HDCModel {
  getCid(knex: Knex, hn: string) {
    let sql = `
      select p.cid
      from person as p
      where p.hospcode=?
      and p.hn=?
      limit 1
      `;
    return knex.raw(sql, [HOSPCODE, hn])
  }

  getVistDate(knex: Knex, cid: string = '00000') {
    let sql = `
      select ch.hospname, ch.hospcode,
      s.pid, s.seq, s.date_serv, s.time_serv, date_format(s.date_serv, '%Y-%m') as ym
      from service as s
      left join chospcode as ch on ch.hospcode=s.hospcode
      where concat(s.HOSPCODE, s.PID) in (
        select concat(p.hospcode, p.pid) as hpid
        from person as p
        where p.cid=?
      )
      group by s.hospcode, s.pid, s.date_serv
      order by s.date_serv desc
      `;
    return knex.raw(sql, [cid]);
  }

  getServiceDetail(knex: Knex, hospcode: string, pid: string, seq: string) {
    let sql = `
        select h.hospname, h.hospcode, s.date_serv, s.time_serv,cins.instypename,
        s.sbp, s.dbp, s.chiefcomp, p.name, p.lname, if(p.sex='1', 'ชาย', 'หญิง') as sex,
        p.birth, timestampdiff(year, p.birth, s.date_serv) as age
        from service as s
        left join cinstype_new as cins on cins.instypecode=s.instype
        left join chospcode as h on h.hospcode=s.hospcode
        inner join person as p on p.hospcode=s.hospcode and p.pid=s.pid
        where s.hospcode=? and s.pid=? and s.seq=?
        limit 1
      `;

    return knex.raw(sql, [hospcode, pid, seq]);
  }

  getServiceDiag(knex: Knex, hospcode: string, pid: string, seq: string) {
    let sql = `
        select d.diagcode, icd.diagtname, icd.diagename, dt.diagtypedesc as diagtype
        from diagnosis_opd as d
        left join cicd10tm as icd on icd.diagcode=d.diagcode
        left join cdiagtype as dt on dt.diagtype=d.diagtype
        where d.hospcode=? and d.pid=? and d.seq=?
        order by d.diagtype
      `;
    return knex.raw(sql, [hospcode, pid, seq])
  }

  getServiceProced(knex: Knex, hospcode: string, pid: string, seq: string) {
    let sql = `
        select p.procedcode, cp.th_desc, cp.en_desc, p.serviceprice
        from procedure_opd as p
        left join cproced as cp on cp.procedcode=p.procedcode
        where p.hospcode=? and p.pid=? and p.seq=?
      `;
    return knex.raw(sql, [hospcode, pid, seq])

  }

  getServiceDrug(knex: Knex, hospcode: string, pid: string, seq: string) {
    let sql = `
        select d.dname, d.amount, d.drugprice, cu.unit
        from drug_opd as d
        left join cunit as cu on cu.id_unit=d.unit
        where d.hospcode=? and d.pid=? and d.seq=?
      `;
    return knex.raw(sql, [hospcode, pid, seq])
  }
}