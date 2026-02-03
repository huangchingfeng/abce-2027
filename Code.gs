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
const GEMINI_API_KEY = 'AIzaSyBRlKNGQwN4sdaQjaddar6qN8ucIl8FDa0';
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

// 取得 ABCE 資源庫（詳細數據）
function getBNIResourceDatabase() {
  // ABCE 亞洲商媒會 24 分會的詳細資源統計
  return {
    // 產業分類（企業主數量）
    industries: {
      '科技資訊': { count: 180, examples: ['軟體開發 45 位', '系統整合 35 位', 'AI/雲端 30 位', '網站設計 40 位', '資安服務 30 位'] },
      '金融保險': { count: 150, examples: ['壽險顧問 50 位', '產險專家 30 位', '財務規劃 40 位', '投資理財 30 位'] },
      '製造業': { count: 120, examples: ['精密零件 35 位', '電子製造 30 位', '機械設備 25 位', '包裝材料 30 位'] },
      '建築營造': { count: 100, examples: ['室內設計 30 位', '工程營造 25 位', '建材供應 25 位', '水電工程 20 位'] },
      '餐飲服務': { count: 90, examples: ['餐廳業主 35 位', '食材供應 20 位', '餐飲設備 15 位', '外燴服務 20 位'] },
      '醫療健康': { count: 85, examples: ['診所經營 25 位', '醫療器材 20 位', '健康食品 20 位', '長照服務 20 位'] },
      '教育培訓': { count: 75, examples: ['企業培訓 25 位', '語言教學 20 位', '技能認證 15 位', '親子教育 15 位'] },
      '法律會計': { count: 70, examples: ['律師 25 位', '會計師 20 位', '稅務規劃 15 位', '商標專利 10 位'] },
      '行銷廣告': { count: 65, examples: ['數位行銷 25 位', '廣告設計 20 位', '公關活動 10 位', '影片製作 10 位'] },
      '物流運輸': { count: 60, examples: ['貨運物流 25 位', '倉儲服務 15 位', '報關行 10 位', '快遞服務 10 位'] },
      '零售貿易': { count: 55, examples: ['進出口貿易 20 位', '批發零售 20 位', '電商平台 15 位'] },
      '不動產': { count: 50, examples: ['房屋仲介 20 位', '商辦租賃 15 位', '物業管理 15 位'] }
    },
    // 資源類型（詳細分類）
    resources: {
      'SUPPLIER': {
        count: 320,
        description: '各類供應商',
        subCategories: {
          '餐飲食材供應商': 45,
          '包裝材料供應商': 35,
          '辦公設備供應商': 30,
          '原物料供應商': 40,
          '機械設備供應商': 35,
          '電子零件供應商': 30,
          '建材供應商': 25,
          '印刷供應商': 20,
          '清潔用品供應商': 15,
          '其他供應商': 45
        }
      },
      'BUYER': {
        count: 800,
        description: '潛在買家/客戶',
        subCategories: {
          '中小企業主': 400,
          '連鎖店經營者': 80,
          '餐飲業者': 90,
          '零售業者': 70,
          '製造業者': 60,
          '服務業者': 100
        }
      },
      'CHANNEL': {
        count: 180,
        description: '通路/代理',
        subCategories: {
          '電商平台經營者': 35,
          '實體通路商': 40,
          '經銷代理商': 45,
          '海外代理商': 30,
          '批發商': 30
        }
      },
      'INVESTOR': {
        count: 120,
        description: '投資資源',
        subCategories: {
          '天使投資人': 25,
          '創投基金': 15,
          '企業投資部門': 30,
          '有投資意願的企業主': 50
        }
      },
      'PARTNER': {
        count: 250,
        description: '合作夥伴',
        subCategories: {
          '技術合作夥伴': 60,
          '策略聯盟夥伴': 50,
          '異業合作夥伴': 80,
          '國際合作夥伴': 30,
          '資源共享夥伴': 30
        }
      },
      'TALENT': {
        count: 150,
        description: '人才網絡',
        subCategories: {
          '業務人才': 40,
          '技術人才': 35,
          '管理人才': 30,
          '專業顧問': 25,
          '獵頭公司': 20
        }
      }
    },
    totalMembers: 2000,
    totalChapters: 24,
    totalCountries: 4
  };
}

// 智慧媒合分析
function analyzeMatchmakingWithAI(userData) {
  const resourceDB = getBNIResourceDatabase();

  // 如果有 API Key，嘗試使用 Gemini AI 生成回應
  if (GEMINI_API_KEY) {
    try {
      const aiResponse = generateAIResponse(userData, resourceDB);
      if (aiResponse) {
        return aiResponse;
      }
    } catch (error) {
      console.log('AI 生成失敗，使用靜態回應：', error.message);
    }
  }

  // 回退到靜態回應
  const customResponse = generateCustomResponse(userData, resourceDB);

  return {
    success: true,
    message: customResponse.message,
    summary: customResponse.summary,
    relatedResources: customResponse.resources,
    highlight: customResponse.highlight,
    totalResources: resourceDB.totalMembers,
    closing: customResponse.closing
  };
}

// 使用 Gemini AI 生成回應
function generateAIResponse(userData, resourceDB) {
  const resourceNeeded = userData.resourceNeeded || [];
  const resourceDetails = userData.resourceDetails || {};
  const targetIndustries = userData.targetIndustries || [];
  const freeDescription = userData.freeDescription || '';

  // 產業代碼對應中文
  const industryMap = {
    'FOOD': '餐飲服務', 'TECH': '科技資訊', 'FINANCE': '金融保險',
    'MANUFACTURE': '製造業', 'CONSTRUCTION': '建築營造', 'HEALTH': '醫療健康',
    'EDUCATION': '教育培訓', 'LEGAL': '法律會計', 'MARKETING': '行銷廣告',
    'LOGISTICS': '物流運輸', 'TRADE': '零售貿易', 'REALESTATE': '不動產'
  };

  // 資源代碼對應中文
  const resourceMap = {
    'SUPPLIER': '供應商', 'BUYER': '買家/客戶', 'PARTNER': '合作夥伴',
    'INVESTOR': '投資人', 'CHANNEL': '通路/代理', 'TALENT': '人才', 'OTHER': '其他'
  };

  // 構建用戶需求描述
  let userNeedsText = '';
  if (resourceNeeded.length > 0) {
    const needsList = resourceNeeded.map(r => {
      const name = resourceMap[r] || r;
      const detail = resourceDetails[r] || '';
      return detail ? `${name}（${detail}）` : name;
    });
    userNeedsText += `需要的資源：${needsList.join('、')}\n`;
  }
  if (targetIndustries.length > 0) {
    const industryList = targetIndustries.map(i => industryMap[i] || i);
    userNeedsText += `想媒合的產業：${industryList.join('、')}\n`;
  }
  if (freeDescription) {
    userNeedsText += `補充說明：${freeDescription}\n`;
  }

  // 構建資源庫摘要（只列出相關的）
  let resourceSummary = 'ABCE 亞洲商媒會資源統計：\n';
  resourceSummary += `- 總企業主數：2,000+ 位\n`;
  resourceSummary += `- 分會數：24 個\n`;
  resourceSummary += `- 涵蓋國家：4 個（台灣、日本、韓國、香港）\n\n`;

  // 加入相關資源的詳細數據
  if (resourceNeeded.length > 0) {
    resourceNeeded.forEach(r => {
      if (resourceDB.resources[r]) {
        const res = resourceDB.resources[r];
        resourceSummary += `【${resourceMap[r]}】總數 ${res.count}+ 位\n`;
        if (res.subCategories) {
          Object.entries(res.subCategories).forEach(([name, count]) => {
            resourceSummary += `  - ${name}：${count} 位\n`;
          });
        }
      }
    });
  }

  if (targetIndustries.length > 0) {
    resourceSummary += '\n相關產業企業主：\n';
    targetIndustries.forEach(i => {
      const name = industryMap[i];
      if (name && resourceDB.industries[name]) {
        const ind = resourceDB.industries[name];
        resourceSummary += `【${name}】${ind.count}+ 位\n`;
        resourceSummary += `  ${ind.examples.join('、')}\n`;
      }
    });
  }

  // 構建 prompt
  const prompt = `你是 ABCE 亞洲商媒會的媒合專員。根據以下用戶需求和資源庫數據，生成一段專業的回應。

用戶需求：
${userNeedsText || '未填寫具體需求'}

${resourceSummary}

請生成回應，格式要求：
1. message（開場訊息）：一句話說明我們有什麼資源可以幫助他，要包含具體數字。專業但不矯情。
2. summary（摘要）：簡短說明 ABCE 的資源規模和相關數據。
3. relatedResources（相關資源列表）：JSON 陣列格式，每項包含 name（資源名稱）、count（數量）、examples（陣列，2-3 個具體例子）
4. closing（結語）：一句話歡迎他參加 ABCE 2027

請以 JSON 格式回覆，不要加任何說明文字：
{
  "message": "...",
  "summary": "...",
  "relatedResources": [{"name": "...", "count": 數字, "examples": ["...", "..."]}],
  "closing": "..."
}`;

  // 呼叫 Gemini API
  const aiText = callGemini(prompt);

  // 解析 JSON
  try {
    // 移除可能的 markdown 標記
    let jsonText = aiText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const result = JSON.parse(jsonText);

    return {
      success: true,
      message: result.message || '',
      summary: result.summary || '',
      relatedResources: result.relatedResources || [],
      highlight: '',
      totalResources: resourceDB.totalMembers,
      closing: result.closing || '歡迎參加 ABCE 2027，現場將有更多媒合機會。'
    };
  } catch (parseError) {
    console.log('AI 回應解析失敗：', parseError.message);
    return null;
  }
}

// 生成客製化回應（根據用戶填寫的資源需求）
function generateCustomResponse(userData, resourceDB) {
  const resourceNeeded = userData.resourceNeeded || [];
  const resourceDetails = userData.resourceDetails || {};
  const targetIndustries = userData.targetIndustries || [];
  const freeDescription = userData.freeDescription || '';

  // 資源類型對應的中文名稱和回應模板
  const resourceMap = {
    'SUPPLIER': {
      name: '供應商',
      response: '找供應商',
      description: '原物料、設備、服務供應'
    },
    'BUYER': {
      name: '買家/客戶',
      response: '找客戶',
      description: '企業採購、批發商、零售商'
    },
    'PARTNER': {
      name: '合作夥伴',
      response: '找合作夥伴',
      description: '策略聯盟、技術合作、異業結盟'
    },
    'INVESTOR': {
      name: '投資人',
      response: '找投資人',
      description: '天使投資、創投、企業投資'
    },
    'CHANNEL': {
      name: '通路/代理',
      response: '找通路',
      description: '經銷商、代理商、電商平台'
    },
    'TALENT': {
      name: '人才',
      response: '找人才',
      description: '業務、技術、管理人才'
    },
    'OTHER': {
      name: '其他資源',
      response: '找資源',
      description: '其他商務資源'
    }
  };

  // 產業代碼對應中文
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

  let message = '';
  let summary = '';
  let resources = [];
  let highlight = '';
  let closing = '';

  // 根據用戶選擇的資源類型生成客製化訊息
  if (resourceNeeded.length > 0) {
    // 收集用戶需要的資源名稱
    const neededNames = resourceNeeded.map(r => resourceMap[r]?.name || r).filter(Boolean);

    // 生成針對性的開場訊息
    if (resourceNeeded.includes('SUPPLIER')) {
      const detail = resourceDetails['SUPPLIER'] || '';
      if (detail) {
        message = `您需要「${detail}」相關的供應商，我們有相關資源可以協助。`;
      } else {
        message = '您需要供應商資源，ABCE 亞洲商媒會有超過 200 位供應商會員。';
      }
    } else if (resourceNeeded.includes('BUYER')) {
      const detail = resourceDetails['BUYER'] || '';
      if (detail) {
        message = `您想找「${detail}」類型的客戶，這正是我們擅長的媒合領域。`;
      } else {
        message = '您需要開發客戶，我們的會員涵蓋各產業的企業主，都是潛在的買家。';
      }
    } else if (resourceNeeded.includes('INVESTOR')) {
      const detail = resourceDetails['INVESTOR'] || '';
      if (detail) {
        message = `您正在尋找「${detail}」，ABCE 會員中有相關的投資資源。`;
      } else {
        message = '您需要投資人資源，我們有約 100 位具有投資能力或意願的會員。';
      }
    } else if (resourceNeeded.includes('PARTNER')) {
      const detail = resourceDetails['PARTNER'] || '';
      if (detail) {
        message = `您想找「${detail}」的合作夥伴，商媒會是建立合作關係的好地方。`;
      } else {
        message = '您想找合作夥伴，ABCE 會員之間已促成許多策略聯盟。';
      }
    } else if (resourceNeeded.includes('CHANNEL')) {
      const detail = resourceDetails['CHANNEL'] || '';
      if (detail) {
        message = `您需要「${detail}」通路資源，我們有經銷商、代理商會員可以媒合。`;
      } else {
        message = '您需要通路資源，ABCE 有約 180 位通路相關的會員。';
      }
    } else if (resourceNeeded.includes('TALENT')) {
      const detail = resourceDetails['TALENT'] || '';
      if (detail) {
        message = `您需要「${detail}」，透過會員網絡可以接觸到合適的人才資源。`;
      } else {
        message = '您需要人才資源，ABCE 會員網絡可協助您找到合適的人才。';
      }
    } else {
      const detail = resourceDetails['OTHER'] || freeDescription || '';
      if (detail) {
        message = `您的需求「${detail}」已記錄，我們會評估是否有合適的資源。`;
      } else {
        message = '感謝您的需求提交，我們會協助媒合合適的資源。';
      }
    }

    // 如果有多種需求，補充說明
    if (resourceNeeded.length > 1) {
      summary = `您還需要${neededNames.slice(1).join('、')}等資源。ABCE 亞洲商媒會 24 分會、2,000+ 位企業主，涵蓋 12 大產業，以下是相關統計：`;
    } else {
      summary = `ABCE 亞洲商媒會 24 分會、2,000+ 位企業主，涵蓋 12 大產業，以下是相關統計：`;
    }

    // 根據需要的資源顯示對應的資源統計
    resourceNeeded.forEach(resourceCode => {
      if (resourceDB.resources[resourceCode]) {
        resources.push({
          name: resourceMap[resourceCode]?.name || resourceCode,
          count: resourceDB.resources[resourceCode].count,
          examples: resourceDB.resources[resourceCode].examples
        });
      }
    });

  } else if (freeDescription) {
    // 只有自由描述，沒有勾選資源
    message = `您的需求「${freeDescription.substring(0, 50)}${freeDescription.length > 50 ? '...' : ''}」已記錄。`;
    summary = 'ABCE 亞洲商媒會 24 分會、2,000+ 位企業主，我們會評估是否有合適的資源：';
  } else {
    // 什麼都沒填，只選了產業
    message = '感謝您的需求提交，我們已收到您的資料。';
    summary = 'ABCE 亞洲商媒會 24 分會、2,000+ 位企業主，涵蓋 12 大產業：';
  }

  // 根據目標產業補充資源列表
  if (targetIndustries.length > 0) {
    targetIndustries.forEach(industryCode => {
      const industryName = industryMap[industryCode];
      if (industryName && resourceDB.industries[industryName]) {
        resources.push({
          name: industryName,
          count: resourceDB.industries[industryName].count,
          examples: resourceDB.industries[industryName].examples
        });
        if (!highlight) {
          highlight = `${industryName}有 ${resourceDB.industries[industryName].count}+ 位企業主`;
        }
      }
    });
  }

  // 如果沒有任何匹配，顯示預設的三大產業
  if (resources.length === 0) {
    resources.push(
      { name: '科技資訊', count: 180, examples: resourceDB.industries['科技資訊'].examples },
      { name: '金融保險', count: 150, examples: resourceDB.industries['金融保險'].examples },
      { name: '製造業', count: 120, examples: resourceDB.industries['製造業'].examples }
    );
  }

  // 根據需求生成結語
  if (resourceNeeded.includes('BUYER')) {
    closing = '歡迎參加 ABCE 2027，現場將有大量企業主等待認識您。';
  } else if (resourceNeeded.includes('SUPPLIER')) {
    closing = '歡迎參加 ABCE 2027，現場可直接與供應商企業主交流。';
  } else {
    closing = '歡迎參加 ABCE 2027，現場將有更多媒合機會。';
  }

  return { message, summary, resources, highlight, closing };
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
