/**
 * 성경읽기(Gündəlik Oxu) — 구글 시트 + 텔레그램 봇 연결 스크립트
 * 수학(Riyaziyyat Dostu)과 별도의 시트·봇에서 사용합니다.
 *
 * 시트 탭 3개를 자동으로 만듭니다: 설정 / 학생 / 읽기기록
 * 설치 방법은 oxu/README.md 를 보세요.
 */

const TZ = 'Asia/Tbilisi';
const TAB_SET = '설정';
const TAB_STU = '학생';
const TAB_LOG = '읽기기록';
const STU_HEAD = ['키', '이름', '전화번호', '마지막 장', '마지막 읽은 날', '개인 링크', '왓츠앱 보내기', '메모'];
const LOG_HEAD = ['날짜', '키', '이름', '책', '장', '퀴즈', '다시 읽음', '묵상 질문', '묵상 글', '학생 질문'];

/* ---------- 메뉴 ---------- */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('📖 성경읽기')
    .addItem('1) 처음 설정 (시트 탭 만들기)', 'setup')
    .addItem('2) 텔레그램 채팅 ID 찾기', 'findChatId')
    .addItem('3) 텔레그램 연결 확인', 'testTelegram')
    .addSeparator()
    .addItem('학생 키·링크 만들기', 'makeLinks')
    .addItem('오늘 현황 지금 받기', 'dailyReport')
    .addItem('매일 저녁 현황 알림 켜기', 'installDailyTrigger')
    .addToUi();
}

function setup() {
  const ss = SpreadsheetApp.getActive();
  let set = ss.getSheetByName(TAB_SET);
  if (!set) {
    set = ss.insertSheet(TAB_SET);
    set.getRange(1, 1, 5, 3).setValues([
      ['항목', '값', '설명'],
      ['BOT_TOKEN', '', '@BotFather에서 받은 봇 토큰 (성경읽기용 새 봇)'],
      ['CHAT_ID', '', '메뉴 2) 로 찾은 숫자를 붙여 넣기'],
      ['PAGE_URL', 'https://skyazery.github.io/m-dersleri/oxu/', '학생 페이지 주소'],
      ['알림 시각', 21, '매일 현황을 받을 시각 (0~23, 트빌리시 시간)']
    ]);
    set.getRange('A1:C1').setFontWeight('bold');
    set.setColumnWidth(2, 360); set.setColumnWidth(3, 360);
  }
  let stu = ss.getSheetByName(TAB_STU);
  if (!stu) {
    stu = ss.insertSheet(TAB_STU);
    stu.getRange(1, 1, 1, STU_HEAD.length).setValues([STU_HEAD]).setFontWeight('bold');
    stu.setFrozenRows(1);
    stu.getRange('C:C').setNumberFormat('@');
  }
  let log = ss.getSheetByName(TAB_LOG);
  if (!log) {
    log = ss.insertSheet(TAB_LOG);
    log.getRange(1, 1, 1, LOG_HEAD.length).setValues([LOG_HEAD]).setFontWeight('bold');
    log.setFrozenRows(1);
    log.setColumnWidth(9, 420);
  }
  SpreadsheetApp.getUi().alert('설정 완료!\n\n① [설정] 탭에 봇 토큰을 넣고\n② [학생] 탭에 이름과 전화번호를 적은 뒤\n③ 메뉴에서 "학생 키·링크 만들기"를 누르세요.');
}

/* ---------- 설정 읽기 ---------- */
function cfg_(name) {
  const rows = SpreadsheetApp.getActive().getSheetByName(TAB_SET).getDataRange().getValues();
  const r = rows.find(x => String(x[0]).trim() === name);
  return r ? String(r[1]).trim() : '';
}

/* ---------- 학생 링크 ---------- */
function makeLinks() {
  const sh = SpreadsheetApp.getActive().getSheetByName(TAB_STU);
  const page = cfg_('PAGE_URL');
  const last = sh.getLastRow();
  if (last < 2) { SpreadsheetApp.getUi().alert('[학생] 탭 2행부터 이름과 전화번호를 적어 주세요.'); return; }
  const data = sh.getRange(2, 1, last - 1, STU_HEAD.length).getValues();
  const used = new Set(data.map(r => String(r[0])).filter(Boolean));
  let made = 0;
  data.forEach((r, i) => {
    const row = i + 2, name = String(r[1]).trim();
    if (!name) return;
    let key = String(r[0]).trim();
    if (!key) { do { key = newKey_(); } while (used.has(key)); used.add(key); sh.getRange(row, 1).setValue(key); made++; }
    if (r[3] === '' || r[3] === null) sh.getRange(row, 4).setValue(0);
    const link = page + '?k=' + key;
    sh.getRange(row, 6).setValue(link);
    const phone = waPhone_(r[2]);
    if (phone) {
      const text = 'Salam, ' + name + '! 📖\nGəl hər gün Müqəddəs Kitabdan bir fəsil oxuyaq.\n' +
        'Bu sənin şəxsi linkindir, başqasına göndərmə:\n' + link;
      sh.getRange(row, 7).setFormula('=HYPERLINK("https://wa.me/' + phone + '?text=' + encodeURIComponent(text) + '","보내기")');
    }
  });
  SpreadsheetApp.getUi().alert('완료! 새 키 ' + made + '개를 만들었습니다.\n[왓츠앱 보내기] 칸의 "보내기"를 누르면 학생에게 보낼 메시지가 왓츠앱에 열립니다.');
}
function newKey_() {
  const abc = 'abcdefghjkmnpqrstuvwxyz23456789';
  let s = ''; for (let i = 0; i < 6; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return s;
}
function waPhone_(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 9) d = '995' + d;          // 조지아 휴대폰 9자리 → 국가번호 995 붙이기
  if (d.length === 10 && d[0] === '0') d = '995' + d.slice(1);
  return d;
}

/* ---------- 학생 찾기 ---------- */
function findStudent_(key) {
  const sh = SpreadsheetApp.getActive().getSheetByName(TAB_STU);
  const last = sh.getLastRow();
  if (!key || last < 2) return null;
  const data = sh.getRange(2, 1, last - 1, 5).getValues();
  for (let i = 0; i < data.length; i++) {
    if (String(data[i][0]).trim() === key) return { sh, row: i + 2, name: String(data[i][1]), son: Number(data[i][3]) || 0 };
  }
  return null;
}
function json_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* ---------- 웹 앱: 학생 정보 ---------- */
function doGet(e) {
  const s = findStudent_(String((e && e.parameter && e.parameter.k) || '').trim());
  if (!s) return json_({ ok: false });
  return json_({ ok: true, ad: s.name, son: s.son });
}

/* ---------- 웹 앱: 읽음 기록 + 텔레그램 ---------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const p = JSON.parse(e.postData.contents);
    const s = findStudent_(String(p.k || '').trim());
    if (!s) return json_({ ok: false, error: 'link' });
    const ch = Number(p.fesil) || 0;
    const now = new Date();
    const fikir = String(p.fikir || '').slice(0, 3000);
    const soru = String(p.soru || '').slice(0, 500);
    SpreadsheetApp.getActive().getSheetByName(TAB_LOG).appendRow([
      Utilities.formatDate(now, TZ, 'yyyy-MM-dd HH:mm'), p.k, s.name, p.kitab || 'Matta', ch,
      p.test || '', p.tekrar ? '예' : '', p.sual || '', fikir, soru
    ]);
    let son = s.son;
    if (ch === s.son + 1) {
      son = ch;
      s.sh.getRange(s.row, 4).setValue(son);
    }
    s.sh.getRange(s.row, 5).setValue(Utilities.formatDate(now, TZ, 'yyyy-MM-dd'));

    const msg = '📖 ' + s.name + ' · ' + (p.kitab || 'Matta') + ' ' + ch + (p.tekrar ? ' (다시 읽음)' : '') + '\n' +
      '✅ 퀴즈 ' + (p.test || '-') + ' · 진도 ' + son + '장\n\n' +
      '💭 ' + (p.sual || '') + '\n' + fikir +
      (soru ? '\n\n❓ 질문: ' + soru : '');
    sendTelegram_(msg);
    return json_({ ok: true, son: son });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- 텔레그램 ---------- */
function sendTelegram_(text) {
  const token = cfg_('BOT_TOKEN'), chat = cfg_('CHAT_ID');
  if (!token || !chat) return;
  UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'post', muteHttpExceptions: true,
    payload: { chat_id: chat, text: text.slice(0, 4000), disable_web_page_preview: 'true' }
  });
}
function findChatId() {
  const token = cfg_('BOT_TOKEN');
  const ui = SpreadsheetApp.getUi();
  if (!token) { ui.alert('[설정] 탭에 BOT_TOKEN을 먼저 넣어 주세요.'); return; }
  const res = JSON.parse(UrlFetchApp.fetch('https://api.telegram.org/bot' + token + '/getUpdates', { muteHttpExceptions: true }).getContentText());
  const chats = {};
  (res.result || []).forEach(u => {
    const m = u.message || u.channel_post || u.my_chat_member;
    if (m && m.chat) chats[m.chat.id] = m.chat.title || [m.chat.first_name, m.chat.last_name].filter(Boolean).join(' ');
  });
  const list = Object.keys(chats).map(id => id + '  ←  ' + chats[id]).join('\n');
  ui.alert(list ? '찾은 채팅 ID:\n\n' + list + '\n\n이 숫자를 [설정] 탭 CHAT_ID에 붙여 넣으세요.' :
    '아직 찾지 못했습니다.\n텔레그램에서 새 봇에게 아무 메시지나 보낸 뒤 다시 눌러 주세요.');
}
function testTelegram() {
  sendTelegram_('✅ 성경읽기 봇 연결 성공! 학생들이 읽고 묵상을 보내면 여기로 옵니다.');
  SpreadsheetApp.getUi().alert('텔레그램을 확인해 보세요. 메시지가 안 왔다면 BOT_TOKEN과 CHAT_ID를 다시 확인하세요.');
}

/* ---------- 매일 현황 ---------- */
function dailyReport() {
  const ss = SpreadsheetApp.getActive();
  const today = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  const sh = ss.getSheetByName(TAB_STU);
  const last = sh.getLastRow();
  if (last < 2) return;
  const rows = sh.getRange(2, 1, last - 1, 5).getValues().filter(r => String(r[1]).trim());
  const dayMs = 86400000;
  const readToday = [], notToday = [], twoDays = [];
  rows.forEach(r => {
    const name = String(r[1]).trim(), son = Number(r[3]) || 0;
    const lastDay = r[4] instanceof Date ? Utilities.formatDate(r[4], TZ, 'yyyy-MM-dd') : String(r[4] || '');
    if (lastDay === today) readToday.push(name + '(' + son + ')');
    else {
      notToday.push(name);
      const gap = lastDay ? Math.round((new Date(today) - new Date(lastDay)) / dayMs) : 99;
      if (gap >= 2) twoDays.push(name + (lastDay ? ' ' + gap + '일' : ' 시작 전'));
    }
  });
  const msg = '📊 성경읽기 현황 ' + today + '\n' +
    '읽은 학생 ' + readToday.length + '/' + rows.length + '\n' + (readToday.join(', ') || '-') + '\n\n' +
    '오늘 안 읽음: ' + (notToday.join(', ') || '없음 🎉') + '\n' +
    '2일 이상 쉬는 중: ' + (twoDays.join(', ') || '없음');
  sendTelegram_(msg);
}
function installDailyTrigger() {
  ScriptApp.getProjectTriggers().filter(t => t.getHandlerFunction() === 'dailyReport').forEach(t => ScriptApp.deleteTrigger(t));
  const h = Math.max(0, Math.min(23, Number(cfg_('알림 시각')) || 21));
  ScriptApp.newTrigger('dailyReport').timeBased().atHour(h).everyDays(1).inTimezone(TZ).create();
  SpreadsheetApp.getUi().alert('매일 ' + h + '시(트빌리시)에 현황을 텔레그램으로 보내 드립니다.');
}
