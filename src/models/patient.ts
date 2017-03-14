import { IConnection } from 'mysql';

export class PatientModel {
  getInfo(connection: IConnection, hn: string) {
    return new Promise((resolve, reject) => {
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
      // run query
      connection.query(sql, [hn], (err, results) => {
        if (err) reject(err);
        else resolve(results);
        // release connection
        // connection.release();
      });
    });
  }

  getClinicMember(connection: IConnection, hn: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select cm.hn, cm.regdate,cm.lastvisit,cm.next_app_date,
        cm.begin_year, cm.lastupdate, c.name as clinic_name
        from clinicmember as cm
        left join clinic as c on c.clinic=cm.clinic
        where cm.hn=?
      `;
      // run query
      connection.query(sql, [hn], (err, results) => {
        if (err) reject(err);
        else resolve(results);
        // release connection
        // connection.release();
      });
    });
  }

  getAllergy(connection: IConnection, hn: string) {
    return new Promise((resolve, reject) => {
      let sql = `
      select oa.hn, oa.report_date, oa.agent,
      oa.symptom, oa.begin_date, oa.update_datetime,
      ar.relation_name
      from opd_allergy as oa
      left join allergy_relation ar on ar.allergy_relation_id=oa.allergy_relation_id
      where oa.hn=?
      `;
      // run query
      connection.query(sql, [hn], (err, results) => {
        if (err) reject(err);
        else resolve(results);
        // release connection
      });
    });
  }

  getLastLab(connection: IConnection, hn: string) {
    return new Promise((resolve, reject) => {
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
      // run query
      connection.query(sql, [hn], (err, results) => {
        if (err) reject(err);
        else resolve(results);
        // release connection
        // connection.release();
      });
    });
  }

  getLabItemsResult(connection: IConnection, orderNumbers: any) {
    return new Promise((resolve, reject) => {
      let sql = `
        select lo.lab_order_number, lo.lab_order_result, lo.lab_items_normal_value_ref, lt.lab_items_name
        from lab_order as lo
        left join lab_items as lt on lt.lab_items_code=lo.lab_items_code
        where lo.lab_order_number in ?
        and lo.confirm='Y'
        order by lt.lab_items_name
      `;
      // run query
      connection.query(sql, [orderNumbers], (err, results) => {
        if (err) reject(err);
        else resolve(results);
        // release connection
        // connection.release();
      });
    });
  }

  getOrderNumbers(connection: IConnection, vn: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select group_concat(lh.lab_order_number) as lab_orders
        from lab_head as lh
        where lh.vn=?
      `;
      // run query
      connection.query(sql, [vn], (err, results) => {
        if (err) reject(err);
        else resolve(results);
        // release connection
        // connection.release();
      });
    });
  }

  getScreenBp(connection: IConnection, hn: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select vstdate, bpd, bps
        from opdscreen
        where hn='0000919'
        and timestampdiff(year, vstdate, current_date()) <= 1 
        and bpd>0 and bps>0
        order by vstdate desc
        limit 10
      `;
      // run query
      connection.query(sql, [hn], (err, results) => {
        if (err) reject(err);
        else resolve(results);
        // release connection
        // connection.release();
      });
    });
  }

  getScreenFbs(connection: IConnection, hn: string) {
    return new Promise((resolve, reject) => {
      let sql = `
        select vstdate, fbs
        from opdscreen
        where hn=?
        and timestampdiff(year, vstdate, current_date())<=1 
        and fbs>0
        order by vstdate desc
        limit 10
      `;
      // run query
      connection.query(sql, [hn], (err, results) => {
        if (err) reject(err);
        else resolve(results);
        // release connection
        // connection.release();
      });
    });
  }
}