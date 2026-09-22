/**
 * RSVP backend for the Sai Susmita & Ashish invitation.
 *
 * Paste into Extensions -> Apps Script of the Google Sheet that should hold
 * the RSVPs, then Deploy -> New deployment -> Web app
 * (Execute as: Me, Who has access: Anyone). See SETUP.md.
 *
 * The sheet keeps each guest's full name. What the invitation receives back
 * is only a count and "First L." names, so full names never leave the sheet.
 */

var SHEET = 'RSVPs';
var HEADERS = ['Updated', 'Token', 'Full name', 'Coming', 'Wedding', 'Reception', 'Party size'];

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function rows_(sh) {
  var n = sh.getLastRow() - 1;
  return n > 0 ? sh.getRange(2, 1, n, HEADERS.length).getValues() : [];
}

/** "Lakshmi Prasanna Reddy" -> "Lakshmi R." */
function short_(name) {
  var parts = String(name).replace(/^'/, '').trim().split(/\s+/);
  return parts.length > 1 ? parts[0] + ' ' + parts[parts.length - 1].charAt(0).toUpperCase() + '.' : parts[0];
}

function summary_(sh) {
  var guests = [], people = 0;
  rows_(sh).forEach(function (r) {
    if (r[3] !== 'Yes') return;
    var n = Number(r[6]) || 1;
    people += n;
    guests.push({ name: short_(r[2]), party: n, t: new Date(r[0]).getTime() });
  });
  guests.sort(function (a, b) { return b.t - a.t; });
  return {
    ok: true,
    people: people,
    guests: guests.map(function (g) { return { name: g.name, party: g.party }; })
  };
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return json_(summary_(sheet_()));
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = {};
    try { d = JSON.parse((e && e.postData && e.postData.contents) || '{}'); } catch (err) {}
    if (d.website) return json_(summary_(sheet_()));                            // bots fill the hidden field; store nothing

    var token = String(d.token || '');
    var name = String(d.name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!/^[A-Za-z0-9-]{8,48}$/.test(token) || name.length < 2) return json_({ ok: false, error: 'invalid' });
    if (/^[=+\-@]/.test(name)) name = "'" + name;                                // never let a name become a formula

    var coming = d.coming === true;
    var wedding = coming && d.wedding === true;
    var reception = coming && d.reception === true;
    if (coming && !wedding && !reception) return json_({ ok: false, error: 'pick an event' });
    var party = coming ? Math.min(10, Math.max(1, parseInt(d.party, 10) || 1)) : 0;

    var sh = sheet_();
    var row = [new Date(), token, name, coming ? 'Yes' : 'No', wedding ? 'Yes' : 'No', reception ? 'Yes' : 'No', party];
    var tokens = rows_(sh).map(function (r) { return r[1]; });
    var i = tokens.indexOf(token);
    if (i >= 0) sh.getRange(i + 2, 1, 1, row.length).setValues([row]);         // same phone answering again
    else sh.appendRow(row);

    var out = summary_(sh);
    out.you = short_(name);
    return json_(out);
  } finally {
    lock.releaseLock();
  }
}
