import Knex = require('knex');

export class PatientModel {
  getInfo(knex: Knex, hn: string) {
    let sql = `
      select p.hn, concat(p.pname, p.fname, " ", p.lname) as ptname, timestampdiff(year, p.birthday, current_date()) as age,
      p.birthday, p.addrpart, p.moopart, p.tmbpart, p.amppart,p.chwpart, p.bloodgrp,
      p.firstday, p.nationality, p.pttype, p.sex, p.cid, p.last_update, p.last_visit, p.death,
      nt.name as nationality_name, pt.name as pttype_name,t1.full_name as address1,
      p.type_area, ht.house_regist_type_name
      from patient as p
      left join nationality as nt on nt.nationality=p.nationality
      left join pttype as pt on pt.pttype=p.pttype
      left join thaiaddress as t1 on t1.addressid=concat(p.chwpart,p.amppart,p.tmbpart)
      left join house_regist_type as ht on ht.house_regist_type_id=p.type_area
      where p.hn=?
      `;
    return knex.raw(sql, [hn])
  }

  getClinicMember(knex: Knex, hn: string) {
    let sql = `
        select cm.hn, cm.regdate,cm.lastvisit,cm.next_app_date,
        cm.begin_year, cm.lastupdate, c.name as clinic_name
        from clinicmember as cm
        left join clinic as c on c.clinic=cm.clinic
        where cm.hn=?
      `;
    return knex.raw(sql, [hn]);
  }

  getAllergy(knex: Knex, hn: string) {
    let sql = `
      select oa.hn, oa.report_date, oa.agent,
      oa.symptom, oa.begin_date, oa.update_datetime,
      ar.relation_name
      from opd_allergy as oa
      left join allergy_relation ar on ar.allergy_relation_id=oa.allergy_relation_id
      where oa.hn=?
      `;
    return knex.raw(sql, [hn])
  }

  getLastLab(knex: Knex, hn: string) {
    let sql = `
        select lo.lab_order_number, lo.lab_order_result,
        lab_items_normal_value_ref,
        li.lab_items_name, lh.order_date, DATE_FORMAT(lh.order_date, '%Y-%m-%d') as ymd
        from lab_order as lo
        inner join lab_items as li on li.lab_items_code=lo.lab_items_code
        inner join lab_head as lh on lh.lab_order_number=lo.lab_order_number
        where (lo.lab_order_result is not null and lo.lab_order_result<>'')
        and lh.hn=?
        and timestampdiff(year, lh.order_date, current_date()) < 2
        order by lo.lab_order_number desc
      `;
    return knex.raw(sql, [hn]);
  }

  getLabItemsResult(knex: Knex, orderNumbers: any) {
    let sql = `
        select lo.lab_order_number, lo.lab_order_result, lo.lab_items_normal_value_ref, lt.lab_items_name
        from lab_order as lo
        left join lab_items as lt on lt.lab_items_code=lo.lab_items_code
        where lo.lab_order_number in ?
        and lo.confirm='Y'
        order by lt.lab_items_name
      `;
    return knex.raw(sql, [orderNumbers]);
  }

  getOrderNumbers(knex: Knex, vn: string) {
    let sql = `
        select group_concat(lh.lab_order_number) as lab_orders
        from lab_head as lh
        where lh.vn=?
      `;
    return knex.raw(sql, [vn]);
  }

  getScreenBp(knex: Knex, hn: string) {
    let sql = `
        select vstdate, bpd, bps
        from opdscreen
        where hn=?
        and timestampdiff(year, vstdate, current_date()) <= 1 
        and bpd>0 and bps>0
        order by vstdate desc
        limit 10
      `;
    return knex.raw(sql, [hn]);
  }

  getScreenFbs(knex: Knex, hn: string) {
    let sql = `
        select vstdate, fbs
        from opdscreen
        where hn=?
        and timestampdiff(year, vstdate, current_date())<=1 
        and fbs>0
        order by vstdate desc
        limit 10
      `;
    return knex.raw(sql, [hn]);
  }
}