/**
 * RSVP backend for the Sai Susmita & Ashish invitation.
 *
 * Paste into Extensions -> Apps Script of the Google Sheet that should hold
 * the RSVPs, then Deploy -> New deployment -> Web app
 * (Execute as: Me, Who has access: Anyone). See SETUP.md.
 *
 * Each guest answers the wedding and the reception separately, with a party
 * size for each. The sheet keeps full names; the invitation only receives
 * per-event counts and "First L." names, so full names never leave the sheet.
 */

var SHEET = 'RSVPs';
var HEADERS = ['Updated', 'Token', 'Full name', 'Wedding', 'Wedding guests', 'Reception', 'Reception guests'];

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

/** Who is coming to one event: column `col` holds Yes/No, `col + 1` the party size. */
function side_(rows, col) {
  var guests = [], people = 0;
  rows.forEach(function (r) {
    if (r[col] !== 'Yes') return;
    var n = Number(r[col + 1]) || 1;
    people += n;
    guests.push({ name: short_(r[2]), party: n, t: new Date(r[0]).getTime() });
  });
  guests.sort(function (a, b) { return b.t - a.t; });
  return { people: people, guests: guests.map(function (g) { return { name: g.name, party: g.party }; }) };
}

function summary_(sh) {
  var rows = rows_(sh);
  return { ok: true, wedding: side_(rows, 3), reception: side_(rows, 5) };
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

    var w = d.wedding || {}, r = d.reception || {};
    if (typeof w.coming !== 'boolean' || typeof r.coming !== 'boolean') return json_({ ok: false, error: 'answer both' });
    var party = function (x) { return x.coming ? Math.min(10, Math.max(1, parseInt(x.party, 10) || 1)) : 0; };

    var sh = sheet_();
    var row = [new Date(), token, name, w.coming ? 'Yes' : 'No', party(w), r.coming ? 'Yes' : 'No', party(r)];
    var tokens = rows_(sh).map(function (existing) { return existing[1]; });
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
