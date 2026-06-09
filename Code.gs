/**
 * Qarzlarni boshqarish web app — Google Apps Script backend
 * Google Sheet bilan ishlaydi: o'qish, qidirish, qarz qo'shish/ayirish, yangi mijoz qo'shish.
 *
 * Jadval sarlavhalari (1-qator):
 *   No | Ism | Familiya | Tug‘ilgan yil | Joriy Qarz | Qo'shish | Ayirish
 *
 * "Qo'shish" va "Ayirish" — UI tugmalari orqali "Joriy Qarz" qiymatini o'zgartiradi.
 */

// Agar bu skript Google Sheet'ga biriktirilgan bo'lsa, SHEET_ID ni bo'sh qoldiring.
// Aks holda, jadval ID sini shu yerga yozing:
var SHEET_ID = '1ThHNVw2ljaogQNCRk5JormjxoJXtiKbT_poVKQEsL_Q';
var SHEET_NAME = ''; // bo'sh bo'lsa — birinchi varaq ishlatiladi

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Qarzlar — Magazin')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function getSheet_() {
  var ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Jadval topilmadi. SHEET_ID ni tekshiring.');
  var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getSheets()[0];
  if (!sheet) throw new Error('Varaq topilmadi.');
  return sheet;
}

// Sarlavhalar bo'yicha ustun indekslarini topadi (moslashuvchan)
function getHeaderMap_(sheet) {
  var lastCol = Math.max(sheet.getLastColumn(), 7);
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var norm = function (s) {
    return String(s || '')
      .toLowerCase()
      .replace(/[‘’`]/g, "'")
      .trim();
  };
  var map = {};
  for (var i = 0; i < headers.length; i++) {
    map[norm(headers[i])] = i; // 0-based
  }
  function find(names) {
    for (var j = 0; j < names.length; j++) {
      if (map[names[j]] !== undefined) return map[names[j]];
    }
    return -1;
  }
  return {
    no: find(['no', '№', 'n']),
    ism: find(['ism', 'name']),
    familiya: find(['familiya', 'surname']),
    yil: find(["tug'ilgan yil", 'tugilgan yil', 'yil']),
    qarz: find(['joriy qarz', 'qarz', 'debt']),
    sana: find(["oxirgi to'lov", 'oxirgi tolov', "oxirgi to'lov sanasi", 'sana', 'last payment']),
    telefon: find(['telefon', 'tel', 'phone', 'raqam'])
  };
}

// "Oxirgi to'lov" sana ustunini ta'minlaydi (yo'q bo'lsa yaratadi). 1-based indeks qaytaradi.
function ensureSanaCol_(sheet) {
  var h = getHeaderMap_(sheet);
  if (h.sana >= 0) return h.sana + 1;
  var col = sheet.getLastColumn() + 1;
  sheet.getRange(1, col).setValue("Oxirgi to'lov");
  return col;
}

// "Telefon" ustunini ta'minlaydi (yo'q bo'lsa yaratadi). 1-based indeks qaytaradi.
function ensureTelefonCol_(sheet) {
  var h = getHeaderMap_(sheet);
  if (h.telefon >= 0) return h.telefon + 1;
  var col = sheet.getLastColumn() + 1;
  sheet.getRange(1, col).setValue('Telefon');
  return col;
}

// Barcha mijozlarni qaytaradi
function getClients() {
  var sheet = getSheet_();
  ensureSanaCol_(sheet);
  ensureTelefonCol_(sheet);
  var h = getHeaderMap_(sheet);
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = Math.max(sheet.getLastColumn(), 7);
  var data = sheet.getRange(2, 1, lastRow - 1, lastCol).getValues();
  var tz = Session.getScriptTimeZone();
  var today = new Date();
  var out = [];
  for (var i = 0; i < data.length; i++) {
    var r = data[i];
    var ism = h.ism >= 0 ? r[h.ism] : '';
    var fam = h.familiya >= 0 ? r[h.familiya] : '';
    // Bo'sh qatorni o'tkazib yuborish
    if (String(ism).trim() === '' && String(fam).trim() === '') continue;

    // Oxirgi to'lov sanasi va o'tgan kunlar
    var sanaStr = '';
    var kun = -1; // -1 = sana yo'q / noma'lum
    var dCell = h.sana >= 0 ? r[h.sana] : '';
    var d = null;
    if (dCell instanceof Date) {
      d = dCell;
    } else if (dCell) {
      var p = new Date(dCell);
      if (!isNaN(p.getTime())) d = p;
    }
    if (d) {
      sanaStr = Utilities.formatDate(d, tz, 'dd.MM.yyyy');
      kun = Math.floor((today.getTime() - d.getTime()) / 86400000);
      if (kun < 0) kun = 0;
    }

    out.push({
      row: i + 2, // jadvaldagi haqiqiy qator raqami
      no: h.no >= 0 ? r[h.no] : (i + 1),
      ism: ism,
      familiya: fam,
      yil: h.yil >= 0 ? r[h.yil] : '',
      qarz: Number(h.qarz >= 0 ? r[h.qarz] : 0) || 0,
      sana: sanaStr,
      kun: kun,
      telefon: h.telefon >= 0 ? String(r[h.telefon] || '') : ''
    });
  }
  return out;
}

// Qarzni o'zgartirish: amount musbat = qo'shish, manfiy = ayirish
function changeDebt(row, amount) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var h = getHeaderMap_(sheet);
    if (h.qarz < 0) throw new Error('"Joriy Qarz" ustuni topilmadi.');
    var col = h.qarz + 1; // 1-based
    var cur = Number(sheet.getRange(row, col).getValue()) || 0;
    var next = cur + Number(amount);
    sheet.getRange(row, col).setValue(next);

    // Sana: to'lov (ayirish) qilinsa — bugungi sana yoziladi.
    // Qarz qo'shilsa va sana hali bo'lmasa — boshlanish sanasi yoziladi.
    var sanaCol = ensureSanaCol_(sheet);
    if (Number(amount) < 0) {
      sheet.getRange(row, sanaCol).setValue(new Date());
    } else if (Number(amount) > 0) {
      if (!sheet.getRange(row, sanaCol).getValue()) {
        sheet.getRange(row, sanaCol).setValue(new Date());
      }
    }
    return next;
  } finally {
    lock.releaseLock();
  }
}

// Yangi mijoz qo'shish
function addClient(ism, familiya, yil, qarz, telefon) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var h = getHeaderMap_(sheet);
    var lastRow = sheet.getLastRow();
    var newRow = lastRow + 1;
    var lastCol = Math.max(sheet.getLastColumn(), 7);
    var rowData = new Array(lastCol).fill('');
    // No ustuni — avtomatik tartib raqami
    if (h.no >= 0) rowData[h.no] = lastRow; // sarlavhadan keyingi tartib
    if (h.ism >= 0) rowData[h.ism] = ism;
    if (h.familiya >= 0) rowData[h.familiya] = familiya;
    if (h.yil >= 0) rowData[h.yil] = yil;
    if (h.qarz >= 0) rowData[h.qarz] = Number(qarz) || 0;
    var telCol = ensureTelefonCol_(sheet) - 1; // 0-based
    if (telCol < rowData.length) rowData[telCol] = telefon || '';
    sheet.getRange(newRow, 1, 1, lastCol).setValues([rowData]);
    // Boshlang'ich qarz bo'lsa — boshlanish sanasini yozamiz
    if ((Number(qarz) || 0) > 0) {
      var sanaCol = ensureSanaCol_(sheet);
      sheet.getRange(newRow, sanaCol).setValue(new Date());
    }
    return { row: newRow };
  } finally {
    lock.releaseLock();
  }
}

// Mijoz ma'lumotlarini tahrirlash (qarzga tegmaydi)
function updateClient(row, ism, familiya, yil, telefon) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var h = getHeaderMap_(sheet);
    if (h.ism >= 0) sheet.getRange(row, h.ism + 1).setValue(ism);
    if (h.familiya >= 0) sheet.getRange(row, h.familiya + 1).setValue(familiya);
    if (h.yil >= 0) sheet.getRange(row, h.yil + 1).setValue(yil);
    var telCol = ensureTelefonCol_(sheet);
    sheet.getRange(row, telCol).setValue(telefon || '');
    return true;
  } finally {
    lock.releaseLock();
  }
}

// Mijozni o'chirish
function deleteClient(row) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    sheet.deleteRow(row);
    return true;
  } finally {
    lock.releaseLock();
  }
}
