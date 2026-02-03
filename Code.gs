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
 *
 * Gemini AI 設定：
 * 1. 前往 https://aistudio.google.com/apikey 取得 API Key
 * 2. 在下方 GEMINI_API_KEY 填入你的 API Key
 */

// ===== Gemini AI 設定 =====
const GEMINI_API_KEY = ''; // 請填入你的 Gemini API Key
const GEMINI_MODEL = 'gemini-1.5-flash';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/';

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
  const callback = e.parameter.callback; // JSONP callback

  try {
    let result;

    switch (action) {
      case 'test':
        result = { success: true, message: 'API 連線成功！' };
        break;

      case 'getAll':
        return getAllData();

      case 'getMatchmaking':
        return getSheetData('媒合表單', MATCHMAKING_HEADERS);

      case 'getBooth':
        return getSheetData('攤位申請', BOOTH_HEADERS);

      case 'analyzeMatchmaking':
        // AI 智慧媒合分析（JSONP 方式）
        const userData = {
          name: e.parameter.name || '',
          company: e.parameter.company || '',
          resourceNeeded: e.parameter.resourceNeeded ? e.parameter.resourceNeeded.split(',') : [],
          resourceDetails: e.parameter.resourceDetails ? JSON.parse(decodeURIComponent(e.parameter.resourceDetails)) : {},
          targetIndustries: e.parameter.targetIndustries ? e.parameter.targetIndustries.split(',') : [],
          freeDescription: e.parameter.freeDescription || ''
        };
        result = analyzeMatchmakingWithAI(userData);
        break;

      default:
        result = { success: false, error: '未知的 action' };
    }

    // 支援 JSONP
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return jsonResponse(result);
  } catch (error) {
    const errorResult = { success: false, error: error.message };
    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(errorResult) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return jsonResponse(errorResult);
  }
}

// 處理 POST 請求（接收表單資料）
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const type = data.type || 'matchmaking';

    if (type === 'matchmaking') {
      // 儲存表單資料
      saveMatchmaking(data);

      // 執行智慧媒合分析
      const aiResult = analyzeMatchmakingWithAI(data);

      return jsonResponse({
        success: true,
        message: '資料已儲存',
        matchmaking: aiResult
      });
    } else if (type === 'booth') {
      saveBooth(data);
      return jsonResponse({ success: true, message: '資料已儲存' });
    } else {
      return jsonResponse({ success: false, error: '未知的表單類型' });
    }
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

// ===== Gemini AI 智慧媒合 =====

// 呼叫 Gemini API
function callGemini(prompt) {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API Key 未設定');
  }

  const url = `${GEMINI_API_URL}${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  const result = JSON.parse(response.getContentText());

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.candidates[0].content.parts[0].text;
}

// 取得 BNI 會員資源庫（模擬數據，實際可連接真實資料）
function getBNIResourceDatabase() {
  // 這是 BNI 華字輩 24 分會的資源庫模擬數據
  // 實際可以從另一個 Google Sheet 讀取真實會員資料
  return {
    industries: {
      '科技資訊': { count: 180, examples: ['軟體開發', '系統整合', 'AI 解決方案', '雲端服務'] },
      '金融保險': { count: 150, examples: ['壽險', '產險', '財務規劃', '投資顧問'] },
      '製造業': { count: 120, examples: ['精密零件', '電子製造', '機械設備', '包裝材料'] },
      '建築營造': { count: 100, examples: ['室內設計', '工程營造', '建材供應', '水電工程'] },
      '餐飲服務': { count: 90, examples: ['餐廳經營', '食材供應', '餐飲設備', '外燴服務'] },
      '醫療健康': { count: 85, examples: ['診所', '醫療器材', '健康食品', '長照服務'] },
      '教育培訓': { count: 75, examples: ['企業培訓', '語言教學', '技能認證', '親子教育'] },
      '法律會計': { count: 70, examples: ['律師事務所', '會計師事務所', '稅務規劃', '商標專利'] },
      '行銷廣告': { count: 65, examples: ['數位行銷', '廣告設計', '公關活動', '影片製作'] },
      '物流運輸': { count: 60, examples: ['貨運物流', '倉儲服務', '報關行', '快遞服務'] },
      '零售貿易': { count: 55, examples: ['進出口貿易', '批發零售', '電商平台', '代理經銷'] },
      '不動產': { count: 50, examples: ['房屋仲介', '商辦租賃', '物業管理', '土地開發'] }
    },
    resources: {
      'SUPPLIER': { count: 200, description: '供應商資源', examples: ['原物料供應', '設備供應', '服務供應'] },
      'CHANNEL': { count: 180, description: '銷售通路', examples: ['經銷商', '代理商', '零售通路', '電商平台'] },
      'TALENT': { count: 150, description: '人才資源', examples: ['技術人才', '業務人才', '管理人才', '專業顧問'] },
      'FUNDING': { count: 100, description: '資金資源', examples: ['投資人', '創投', '銀行融資', '政府補助'] },
      'TECH': { count: 120, description: '技術合作', examples: ['技術授權', '聯合研發', '顧問諮詢', '系統整合'] },
      'MARKET': { count: 90, description: '市場拓展', examples: ['海外市場', 'B2B客戶', '政府標案', '大型企業'] },
      'OTHER': { count: 500, description: '其他資源', examples: ['異業合作', '策略聯盟', '資源共享'] }
    },
    totalMembers: 2000,
    totalChapters: 24
  };
}

// 智慧媒合分析
function analyzeMatchmakingWithAI(userData) {
  const resourceDB = getBNIResourceDatabase();
  const relatedResources = getRelatedResources(userData, resourceDB);

  // 直接返回專業的資源展示，不需要 AI 生成
  return {
    success: true,
    message: '感謝您的需求提交，我們已收到您的資料。',
    summary: `BNI 華字輩 24 分會擁有 2,000+ 位企業主資源，涵蓋 12 大產業。根據您的需求，以下是相關的資源統計：`,
    relatedResources: relatedResources.list,
    highlight: relatedResources.highlight,
    totalResources: resourceDB.totalMembers,
    closing: '歡迎參加 ABCE 2027，現場將有更多媒合機會。'
  };
}

// 取得相關資源（根據用戶需求匹配）
function getRelatedResources(userData, resourceDB) {
  const results = [];
  let highlight = '';

  // 根據選擇的產業
  if (userData.targetIndustries && Array.isArray(userData.targetIndustries)) {
    userData.targetIndustries.forEach(industry => {
      const industryMap = {
        'FOOD': '餐飲服務',
        'TECH': '科技資訊',
        'FINANCE': '金融保險',
        'MANUFACTURE': '製造業',
        'CONSTRUCTION': '建築營造',
        'HEALTH': '醫療健康',
        'EDUCATION': '教育培訓',
        'LEGAL': '法律會計',
        'MARKETING': '行銷廣告',
        'LOGISTICS': '物流運輸',
        'TRADE': '零售貿易',
        'REALESTATE': '不動產'
      };
      const industryName = industryMap[industry] || industry;
      if (resourceDB.industries[industryName]) {
        results.push({
          name: industryName,
          count: resourceDB.industries[industryName].count,
          examples: resourceDB.industries[industryName].examples
        });
        if (!highlight) {
          highlight = `光是${industryName}就有 ${resourceDB.industries[industryName].count}+ 位企業主！`;
        }
      }
    });
  }

  // 如果沒有匹配到產業，顯示總資源
  if (results.length === 0) {
    // 預設顯示前 3 大產業
    results.push(
      { name: '科技資訊', count: 180, examples: resourceDB.industries['科技資訊'].examples },
      { name: '金融保險', count: 150, examples: resourceDB.industries['金融保險'].examples },
      { name: '製造業', count: 120, examples: resourceDB.industries['製造業'].examples }
    );
    highlight = '2,000+ 位企業主、12 大產業，總有您需要的資源！';
  }

  return { list: results, highlight: highlight };
}

// 基本媒合匹配（AI 失敗時的備用方案）
function getBasicMatches(userData, resourceDB) {
  const matches = [];

  // 根據選擇的產業匹配
  if (userData.targetIndustries && Array.isArray(userData.targetIndustries)) {
    userData.targetIndustries.forEach(industry => {
      if (resourceDB.industries[industry]) {
        matches.push({
          category: industry,
          count: resourceDB.industries[industry].count,
          relevance: 'high',
          description: `${resourceDB.industries[industry].examples.join('、')}等相關會員`
        });
      }
    });
  }

  // 根據需要的資源匹配
  if (userData.resourceNeeded && Array.isArray(userData.resourceNeeded)) {
    userData.resourceNeeded.forEach(resource => {
      if (resourceDB.resources[resource]) {
        matches.push({
          category: resourceDB.resources[resource].description,
          count: resourceDB.resources[resource].count,
          relevance: 'medium',
          description: resourceDB.resources[resource].examples.join('、')
        });
      }
    });
  }

  return matches.slice(0, 5); // 最多返回 5 個匹配
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
