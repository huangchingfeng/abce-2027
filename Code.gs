/**
 * ABCE 2027 後台 API
 *
 * 設定步驟：
 * 1. 開啟 Google Sheets，建立新試算表
 * 2. 點擊「擴充功能」→「Apps Script」
 * 3. 刪除預設程式碼，貼上這份程式碼
 * 4. 點擊「部署」→「新增部署」
 * 5. 選擇「網頁應用程式」
 * 6. 設定「存取權」為「所有人」
 * 7. 點擊「部署」，複製網址
 * 8. 將網址貼到 admin.html 的設定欄位
 */

// 取得試算表（自動取得綁定的試算表）
function getSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// 取得或建立工作表
function getOrCreateSheet(name, headers) {
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

// 媒合表單欄位
const MATCHMAKING_HEADERS = [
  'submittedAt', 'name', 'company', 'contactType', 'contact',
  'resourceNeeded', 'resourceOtherText', 'targetIndustries',
  'freeDescription', 'language'
];

// 攤位申請欄位
const BOOTH_HEADERS = [
  'submittedAt', 'name', 'company', 'email', 'phone', 'country',
  'industry', 'companyIntro', 'products', 'attendedBefore',
  'boothCount', 'taxId', 'specialRequest', 'language'
];

// 處理 GET 請求
function doGet(e) {
  const action = e.parameter.action || 'test';

  try {
    switch (action) {
      case 'test':
        return jsonResponse({ success: true, message: 'API 連線成功！' });

      case 'getAll':
        return getAllData();

      case 'getMatchmaking':
        return getSheetData('媒合表單', MATCHMAKING_HEADERS);

      case 'getBooth':
        return getSheetData('攤位申請', BOOTH_HEADERS);

      default:
        return jsonResponse({ success: false, error: '未知的 action' });
    }
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

// 處理 POST 請求（接收表單資料）
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const type = data.type || 'matchmaking';

    if (type === 'matchmaking') {
      saveMatchmaking(data);
    } else if (type === 'booth') {
      saveBooth(data);
    } else {
      return jsonResponse({ success: false, error: '未知的表單類型' });
    }

    return jsonResponse({ success: true, message: '資料已儲存' });
  } catch (error) {
    return jsonResponse({ success: false, error: error.message });
  }
}

// 儲存媒合表單
function saveMatchmaking(data) {
  const sheet = getOrCreateSheet('媒合表單', MATCHMAKING_HEADERS);

  const row = [
    data.submittedAt || new Date().toISOString(),
    data.name || '',
    data.company || '',
    data.contactType || '',
    data.contact || '',
    Array.isArray(data.resourceNeeded) ? data.resourceNeeded.join(', ') : (data.resourceNeeded || ''),
    data.resourceOtherText || '',
    Array.isArray(data.targetIndustries) ? data.targetIndustries.join(', ') : (data.targetIndustries || ''),
    data.freeDescription || '',
    data.language || 'zh'
  ];

  sheet.appendRow(row);
}

// 儲存攤位申請
function saveBooth(data) {
  const sheet = getOrCreateSheet('攤位申請', BOOTH_HEADERS);

  const row = [
    data.submittedAt || new Date().toISOString(),
    data.name || '',
    data.company || '',
    data.email || '',
    data.phone || '',
    data.country || '',
    data.industry || '',
    data.companyIntro || '',
    data.products || '',
    data.attendedBefore ? '是' : '否',
    data.boothCount || 1,
    data.taxId || '',
    data.specialRequest || '',
    data.language || 'zh'
  ];

  sheet.appendRow(row);
}

// 取得所有資料
function getAllData() {
  const matchmaking = getSheetDataArray('媒合表單', MATCHMAKING_HEADERS, 'matchmaking');
  const booth = getSheetDataArray('攤位申請', BOOTH_HEADERS, 'booth');

  // 合併並按時間排序
  const allData = [...matchmaking, ...booth].sort((a, b) => {
    return new Date(b.submittedAt) - new Date(a.submittedAt);
  });

  return jsonResponse({ success: true, data: allData });
}

// 取得單一工作表資料（回傳陣列）
function getSheetDataArray(sheetName, headers, type) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);

  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const rows = data.slice(1); // 去掉標題列

  return rows.map(row => {
    const obj = { type };
    headers.forEach((header, index) => {
      let value = row[index];
      // 將逗號分隔的字串轉回陣列
      if (['resourceNeeded', 'targetIndustries'].includes(header) && typeof value === 'string' && value) {
        value = value.split(', ').filter(v => v);
      }
      obj[header] = value;
    });
    return obj;
  });
}

// 取得單一工作表資料（回傳 JSON Response）
function getSheetData(sheetName, headers) {
  const data = getSheetDataArray(sheetName, headers, sheetName === '媒合表單' ? 'matchmaking' : 'booth');
  return jsonResponse({ success: true, data });
}

// JSON 回應
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// 測試函數（可在 Apps Script 編輯器中執行）
function testSaveMatchmaking() {
  saveMatchmaking({
    name: '測試用戶',
    company: '測試公司',
    contactType: 'LINE',
    contact: 'test123',
    resourceNeeded: ['資金', '人才'],
    targetIndustries: ['科技資訊', '金融保險'],
    freeDescription: '這是測試資料',
    language: 'zh'
  });
}
