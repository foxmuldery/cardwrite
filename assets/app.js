/* ==========================================================================
   老袁编剧卡片系统 · 应用逻辑
   v1.0.0 · 原生 JS，无构建步骤。数据只存本机 localStorage。
   ========================================================================== */
(function () {
  'use strict';

  /* ======================= 常量与结构 ======================= */
  const APP_VERSION = '1.1.0';
  const SCHEMA = 3;
  const K = {
    current: 'scriptCards',
    projectPrefix: 'scriptCards_',
    trash: 'cardwrite.trash',
    theme: 'cardwrite.theme',
    seen: 'cardwrite.seen',
    view: 'cardwrite.view'
  };
  const HISTORY = { db: 'cardwrite-history', store: 'versions', max: 60, throttle: 90000 };
  const TYPE_LABEL = { movie: '电影', 'tv-hour': '一小时剧集', 'tv-half': '半小时喜剧' };
  const STATUS_LABEL = { confirmed: '确认', pending: '保留', question: '存疑' };
  const EMOTION = {
    positive: { sign: '+', label: '上扬', cls: 'tag--pos' },
    negative: { sign: '−', label: '下沉', cls: 'tag--neg' },
    neutral: { sign: '=', label: '持平', cls: 'tag--neu' }
  };
  const LIMITS = { description: 1200, place: 60, conflict: 60, emotionNote: 80, title: 60, idea: 600, history: 40, trash: 120 };

  const HINTS = {
    opening: '故事开始于一个有震撼力、意境或者吸引人的画面，奠定全片的整体基调。',
    theme: '在开场不久的一场对话或动作，暗示了全片的主题。',
    setup: '铺垫部分必须点出主人公的欲望，只有认清人物的欲望，才能形成后续的戏剧张力。',
    catalyst: '推动往往是被动的：一个电话、一封邮件、床下的尸体、捉奸在床。',
    debate: '主人公发生的行为和反馈，让他开始犹豫和思考：到底哪一条才是更好的路？',
    'act2-tp': '第二幕转折点必须是主动坚决的：主人公主动行动，走上没法回头的路。',
    fun: '游戏时间要拼想象力，必须新颖好玩酷炫，展现全片最轻松/好玩/悬疑/大场面的段落。',
    bstory: 'B 故事呼应主角的内心、情感或人物关系，是主线之外的额外展现。',
    midpoint: '此时发生的一个事件让气氛骤然紧张，故事回到正题。',
    villain: '坏蛋逼近要展现主人公的不断努力，然而魔高一丈，必须形成对抗与张力。',
    allislost: '最终主人公所有努力都失败了，他陷入绝望。',
    darknight: '灵魂黑夜与一无所有是主角情感的最低点，展现绝望和内心挣扎。',
    'act3-tp': '第三幕转折点的反转，要从 B 故事里不经意提到的线索找到伏笔，这样反转才有力量。',
    finale: '高明的结局必须呼应主题。如果主人公的行为没有代价，这个行为就没有戏剧意义。',
    finalimage: '故事结束于一个有震撼力、意境或者吸引人的画面，并与开场画面呼应。'
  };

  const STRUCTURES = {
    movie: {
      label: '电影', perCard: 2.4,
      acts: [
        { id: '1', title: '第一幕', beats: [
          { id: 'opening', title: '开场画面', min: 1, max: 1, key: true },
          { id: 'theme', title: '主题呈现', min: 1, max: 1, key: true },
          { id: 'setup', title: '铺垫', min: 3, max: 5, key: false },
          { id: 'catalyst', title: '催化剂', min: 1, max: 1, key: true },
          { id: 'debate', title: '争论', min: 2, max: 4, key: false }
        ] },
        { id: '2', title: '第二幕（上）', beats: [
          { id: 'act2-tp', title: '第二幕转折点', min: 1, max: 1, key: true },
          { id: 'fun', title: '游戏时间', min: 4, max: 6, key: false },
          { id: 'bstory', title: 'B 故事', min: 3, max: 5, key: false },
          { id: 'midpoint', title: '中点', min: 1, max: 1, key: true }
        ] },
        { id: '3', title: '第二幕（下）', beats: [
          { id: 'villain', title: '坏蛋逼近', min: 4, max: 6, key: false },
          { id: 'allislost', title: '一无所有', min: 1, max: 1, key: true },
          { id: 'darknight', title: '灵魂黑夜', min: 2, max: 3, key: false }
        ] },
        { id: '4', title: '第三幕', beats: [
          { id: 'act3-tp', title: '第三幕转折点', min: 1, max: 1, key: true },
          { id: 'finale', title: '结局', min: 3, max: 5, key: true },
          { id: 'finalimage', title: '终场画面', min: 1, max: 1, key: true }
        ] }
      ]
    },
    'tv-hour': {
      label: '一小时剧集', perCard: 1.8,
      acts: [
        { id: '1', title: '第一幕', beats: [
          { id: 'opening', title: '开场画面', min: 1, max: 1, key: true },
          { id: 'theme', title: '主题呈现', min: 1, max: 1, key: true },
          { id: 'setup', title: '铺垫', min: 1, max: 4, key: false },
          { id: 'catalyst', title: '推动', min: 1, max: 2, key: true },
          { id: 'debate', title: '争论', min: 1, max: 4, key: false },
          { id: 'act2-tp', title: '第二幕转折点', min: 1, max: 1, key: true }
        ] },
        { id: '2', title: '第二幕', beats: [
          { id: 'fun', title: '游戏时间', min: 2, max: 3, key: false },
          { id: 'bstory', title: 'B 故事', min: 1, max: 3, key: false },
          { id: 'midpoint', title: '中点', min: 1, max: 1, key: true }
        ] },
        { id: '3', title: '第三幕', beats: [
          { id: 'villain', title: '坏蛋逼近', min: 3, max: 6, key: false },
          { id: 'allislost', title: '一无所有', min: 1, max: 1, key: true },
          { id: 'darknight', title: '灵魂黑夜', min: 1, max: 4, key: false },
          { id: 'act3-tp', title: '第三幕转折点', min: 1, max: 1, key: true }
        ] },
        { id: '4', title: '第四幕', beats: [
          { id: 'finale', title: '结局', min: 2, max: 6, key: true },
          { id: 'finalimage', title: '终场画面', min: 1, max: 1, key: true }
        ] }
      ]
    },
    'tv-half': {
      label: '半小时喜剧', perCard: 1.2,
      acts: [
        { id: '1', title: '第一幕', beats: [
          { id: 'opening', title: '开场画面', min: 1, max: 1, key: true },
          { id: 'theme', title: '主题呈现', min: 1, max: 1, key: true },
          { id: 'setup', title: '铺垫', min: 1, max: 1, key: false },
          { id: 'catalyst', title: '推动', min: 1, max: 1, key: true },
          { id: 'debate', title: '争论', min: 1, max: 1, key: false },
          { id: 'act2-tp', title: '第二幕转折点', min: 1, max: 1, key: true }
        ] },
        { id: '2', title: '第二幕', beats: [
          { id: 'fun', title: '游戏时间', min: 1, max: 1, key: false },
          { id: 'bstory', title: 'B 故事', min: 1, max: 1, key: false },
          { id: 'midpoint', title: '中点', min: 1, max: 1, key: true },
          { id: 'villain', title: '坏蛋逼近', min: 1, max: 1, key: false },
          { id: 'allislost', title: '一无所有', min: 1, max: 1, key: true }
        ] },
        { id: '3', title: '第三幕', beats: [
          { id: 'darknight', title: '灵魂黑夜', min: 1, max: 1, key: false },
          { id: 'act3-tp', title: '第三幕转折点', min: 1, max: 1, key: true },
          { id: 'finale', title: '结局', min: 2, max: 2, key: true },
          { id: 'finalimage', title: '终场画面', min: 1, max: 1, key: true }
        ] }
      ]
    }
  };

  /* ======================= 工具函数 ======================= */
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }
  function nowISO() { return new Date().toISOString(); }
  function uid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }
  function clampText(value, max) { return String(value == null ? '' : value).slice(0, max); }
  function formatDate(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
  function formatTime(iso) {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }
  function relativeTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(diff)) return '';
    const min = Math.floor(diff / 60000);
    if (min < 1) return '刚刚';
    if (min < 60) return `${min} 分钟前`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} 小时前`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day} 天前`;
    return formatDate(iso).slice(0, 10);
  }
  function readJSON(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function safeFileName(name) {
    return (name || '未命名剧本').replace(/[\\/:*?"<>|]+/g, '_').replace(/\s+/g, ' ').trim().slice(0, 60) || '未命名剧本';
  }
  function debounce(fn, wait) {
    let t = 0;
    return function () {
      const args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(() => fn.apply(ctx, args), wait);
    };
  }

  /* ======================= 全局状态 ======================= */
  const state = {
    data: null,
    filter: { act: 'all', status: 'all', q: '' },
    history: [],
    future: [],
    sortables: [],
    editor: null,
    quick: { act: '1', beat: 'opening' },
    trash: [],
    saveTimer: 0,
    saveState: 'saved',
    popover: null,
    dragging: false,
    dragSnapshot: null,
    lastDragEnd: 0,
    pendingConfirm: null,
    view: 'board',
    collapsedActs: new Set(),
    lastSnapshotAt: 0,
    historyReady: false
  };

  const dom = {};

  /* ======================= 数据层 ======================= */
  const structure = () => STRUCTURES[state.data.project.type] || STRUCTURES['tv-hour'];
  const acts = () => structure().acts;
  const beatsOf = actId => {
    const act = acts().find(a => a.id === actId);
    return act ? act.beats : [];
  };
  const allBeats = () => acts().flatMap(a => a.beats.map(b => ({ ...b, act: a.id, actTitle: a.title })));
  const beatMeta = (actId, beatId) => beatsOf(actId).find(b => b.id === beatId) || null;

  function blankData(type, title) {
    const key = STRUCTURES[type] ? type : 'tv-hour';
    const s = STRUCTURES[key];
    const outActs = {};
    s.acts.forEach(act => {
      outActs[act.id] = {};
      act.beats.forEach(beat => { outActs[act.id][beat.id] = []; });
    });
    outActs.bucket = { ideas: [] };
    return {
      project: { id: uid(), title: title || '未命名剧本', type: key, lastSaved: nowISO(), schema: SCHEMA },
      acts: outActs
    };
  }

  function normalizeCard(raw, seenIds) {
    const c = raw && typeof raw === 'object' ? raw : {};
    let id = typeof c.id === 'string' && c.id ? c.id : uid();
    if (seenIds) {
      while (seenIds.has(id)) id = uid();
      seenIds.add(id);
    }
    const loc = c.location && typeof c.location === 'object' ? c.location : {};
    const conf = c.conflict && typeof c.conflict === 'object' ? c.conflict : {};
    const typeOk = ['INT', 'EXT', 'I/E'].includes(loc.type);
    const statusOk = Object.prototype.hasOwnProperty.call(STATUS_LABEL, c.status);
    const emoOk = Object.prototype.hasOwnProperty.call(EMOTION, c.emotionalChange);
    const created = typeof c.createdAt === 'string' ? c.createdAt : nowISO();
    return {
      id,
      status: statusOk ? c.status : 'confirmed',
      location: {
        type: typeOk ? loc.type : 'INT',
        place: clampText(loc.place, LIMITS.place)
      },
      description: clampText(c.description, LIMITS.description),
      conflict: {
        protagonist: clampText(conf.protagonist, 40),
        goal: clampText(conf.goal, LIMITS.conflict),
        obstacle: clampText(conf.obstacle, LIMITS.conflict)
      },
      emotionalChange: emoOk ? c.emotionalChange : 'positive',
      emotionalChangeContent: clampText(c.emotionalChangeContent, LIMITS.emotionNote),
      createdAt: created,
      updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : created,
      tags: Array.isArray(c.tags) ? c.tags.filter(t => typeof t === 'string').slice(0, 6) : [],
      ...(c.origin && typeof c.origin === 'object' ? { origin: { act: String(c.origin.act || ''), beat: String(c.origin.beat || '') } } : {})
    };
  }

  function normalizeData(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const proj = src.project && typeof src.project === 'object' ? src.project : {};
    const type = STRUCTURES[proj.type] ? proj.type : 'tv-hour';
    const data = blankData(type, clampText(proj.title, LIMITS.title) || '未命名剧本');
    data.project.id = typeof proj.id === 'string' && proj.id ? proj.id : uid();
    data.project.lastSaved = typeof proj.lastSaved === 'string' ? proj.lastSaved : nowISO();
    const seen = new Set();
    const actsSrc = src.acts && typeof src.acts === 'object' ? src.acts : {};
    Object.keys(actsSrc).forEach(actId => {
      const beatsSrc = actsSrc[actId];
      if (!beatsSrc || typeof beatsSrc !== 'object') return;
      if (actId === 'bucket') {
        const ideas = Array.isArray(beatsSrc.ideas) ? beatsSrc.ideas : [];
        ideas.forEach(c => data.acts.bucket.ideas.push(normalizeCard(c, seen)));
        return;
      }
      Object.keys(beatsSrc).forEach(beatId => {
        const list = beatsSrc[beatId];
        if (!Array.isArray(list)) return;
        if (data.acts[actId] && Array.isArray(data.acts[actId][beatId])) {
          data.acts[actId][beatId] = list.map(c => normalizeCard(c, seen));
        } else {
          list.forEach(c => {
            const card = normalizeCard(c, seen);
            card.origin = { act: actId, beat: beatId };
            data.acts.bucket.ideas.push(card);
          });
        }
      });
    });
    return data;
  }

  function loadCurrent() {
    const raw = readJSON(K.current, null);
    if (!raw) return blankData('tv-hour', '未命名剧本');
    return normalizeData(raw);
  }

  function saveNow() {
    clearTimeout(state.saveTimer);
    state.saveTimer = 0;
    try {
      state.data.project.lastSaved = nowISO();
      localStorage.setItem(K.current, JSON.stringify(state.data));
      setSaveState('saved');
    } catch (err) {
      console.error(err);
      setSaveState('error');
      toast('保存失败：浏览器存储空间已满，请先导出备份并清理旧项目', 'error', 6000);
    }
  }

  function scheduleSave() {
    setSaveState('dirty');
    clearTimeout(state.saveTimer);
    state.saveTimer = setTimeout(saveNow, 450);
  }

  function setSaveState(mode) {
    state.saveState = mode;
    if (!dom.saveState) return;
    const el = dom.saveState;
    el.classList.toggle('is-dirty', mode === 'dirty');
    el.classList.toggle('is-error', mode === 'error');
    if (mode === 'dirty') el.textContent = '编辑中…';
    else if (mode === 'error') el.textContent = '保存失败';
    else if (mode === 'external') el.textContent = '其他标签页已更新';
    else el.textContent = '已保存 ' + new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  }

  function snapshot() { return JSON.stringify(state.data); }
  function pushHistory(snap) {
    state.history.push(snap || snapshot());
    if (state.history.length > LIMITS.history) state.history.shift();
    state.future.length = 0;
  }

  function mutate(fn, opts) {
    const options = opts || {};
    if (options.history !== false) pushHistory(options.snapshot);
    fn();
    state.data.project.lastSaved = nowISO();
    saveNow();
    queueSnapshot(options.reason || '编辑', options.forceSnapshot);
    renderBoard();
    updateChrome();
  }

  function undo() {
    if (!state.history.length) { toast('没有可撤销的操作'); return; }
    state.future.push(snapshot());
    state.data = JSON.parse(state.history.pop());
    afterHistory();
    toast('已撤销');
  }
  function redo() {
    if (!state.future.length) { toast('没有可重做的操作'); return; }
    state.history.push(snapshot());
    state.data = JSON.parse(state.future.pop());
    afterHistory();
    toast('已重做');
  }
  function afterHistory() {
    purgeTrashDuplicates();
    saveNow();
    renderBoard();
    updateChrome();
    if (dom.ideasDialog && dom.ideasDialog.open) renderIdeas();
    if (dom.trashDialog && dom.trashDialog.open) renderTrash();
  }

  /* ======================= 版本历史（IndexedDB） ======================= */
  let historyDBPromise = null;

  function historyAvailable() {
    return typeof indexedDB !== 'undefined';
  }

  function openHistoryDB() {
    if (!historyAvailable()) return Promise.reject(new Error('IndexedDB 不可用'));
    if (!historyDBPromise) {
      historyDBPromise = new Promise((resolve, reject) => {
        let req;
        try { req = indexedDB.open(HISTORY.db, 1); }
        catch (err) { reject(err); return; }
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(HISTORY.store)) {
            const store = db.createObjectStore(HISTORY.store, { keyPath: 'id' });
            store.createIndex('projectId', 'projectId', { unique: false });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error || new Error('IndexedDB 打开失败'));
      });
    }
    return historyDBPromise;
  }

  async function historyAdd(record) {
    const db = await openHistoryDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HISTORY.store, 'readwrite');
      tx.objectStore(HISTORY.store).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    await historyPrune(record.projectId);
  }

  async function historyAll(projectId) {
    const db = await openHistoryDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(HISTORY.store, 'readonly');
      const req = tx.objectStore(HISTORY.store).index('projectId').getAll(projectId);
      req.onsuccess = () => resolve((req.result || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
      req.onerror = () => reject(req.error);
    });
  }

  async function historyDelete(id) {
    const db = await openHistoryDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HISTORY.store, 'readwrite');
      tx.objectStore(HISTORY.store).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function historyClear(projectId) {
    const items = await historyAll(projectId);
    const db = await openHistoryDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HISTORY.store, 'readwrite');
      const store = tx.objectStore(HISTORY.store);
      items.forEach(item => store.delete(item.id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async function historyPrune(projectId) {
    const items = await historyAll(projectId);
    if (items.length <= HISTORY.max) return;
    const extra = items.slice(HISTORY.max);
    const db = await openHistoryDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(HISTORY.store, 'readwrite');
      const store = tx.objectStore(HISTORY.store);
      extra.forEach(item => store.delete(item.id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  function queueSnapshot(reason, force) {
    if (!historyAvailable() || !state.data) return Promise.resolve(false);
    const now = Date.now();
    if (!force && now - state.lastSnapshotAt < HISTORY.throttle) return Promise.resolve(false);
    state.lastSnapshotAt = now;
    const record = {
      id: uid(),
      projectId: state.data.project.id,
      createdAt: nowISO(),
      reason: reason || '编辑',
      cardCount: countStoryCards(),
      data: JSON.stringify(state.data)
    };
    return historyAdd(record)
      .then(() => {
        if (dom.historyDialog && dom.historyDialog.open) renderHistory();
        return true;
      })
      .catch(err => {
        console.warn('版本历史写入失败', err);
        return false;
      });
  }

  /* 读取 / 写入卡片 */
  function cardsAt(actId, beatId) {
    if (!state.data.acts[actId]) state.data.acts[actId] = {};
    if (!Array.isArray(state.data.acts[actId][beatId])) state.data.acts[actId][beatId] = [];
    return state.data.acts[actId][beatId];
  }
  function storyCards() {
    const out = [];
    acts().forEach(act => act.beats.forEach(beat => {
      (state.data.acts[act.id] && state.data.acts[act.id][beat.id] || []).forEach(card => {
        out.push({ card, act: act.id, beat: beat.id });
      });
    }));
    return out;
  }
  const ideaCards = () => (state.data.acts.bucket && Array.isArray(state.data.acts.bucket.ideas)) ? state.data.acts.bucket.ideas : [];
  function findLocation(id) {
    for (const act of acts()) {
      for (const beat of act.beats) {
        const list = state.data.acts[act.id] && state.data.acts[act.id][beat.id];
        if (Array.isArray(list)) {
          const idx = list.findIndex(c => c.id === id);
          if (idx >= 0) return { act: act.id, beat: beat.id, index: idx, card: list[idx] };
        }
      }
    }
    const idx = ideaCards().findIndex(c => c.id === id);
    if (idx >= 0) return { act: 'bucket', beat: 'ideas', index: idx, card: ideaCards()[idx] };
    return null;
  }
  function removeCard(id) {
    const loc = findLocation(id);
    if (!loc) return null;
    const list = loc.act === 'bucket' ? ideaCards() : state.data.acts[loc.act][loc.beat];
    list.splice(loc.index, 1);
    return loc;
  }
  function insertCard(card, actId, beatId, index) {
    const list = cardsAt(actId, beatId);
    const normalized = normalizeCard(card);
    if (typeof index === 'number' && index >= 0 && index <= list.length) list.splice(index, 0, normalized);
    else list.push(normalized);
    return normalized;
  }
  function countStoryCards() { return storyCards().length; }
  function countAllCards() { return countStoryCards() + ideaCards().length; }

  /* ======================= 回收站 ======================= */
  function loadTrash() {
    const raw = readJSON(K.trash, []);
    state.trash = Array.isArray(raw) ? raw.filter(item => item && item.card && item.deletedAt) : [];
    const cutoff = Date.now() - 30 * 86400000;
    const before = state.trash.length;
    state.trash = state.trash.filter(item => new Date(item.deletedAt).getTime() > cutoff);
    if (state.trash.length !== before) persistTrash();
  }
  function persistTrash() {
    try { localStorage.setItem(K.trash, JSON.stringify(state.trash.slice(0, LIMITS.trash))); }
    catch (e) { /* 忽略：回收站写满不应阻断主流程 */ }
  }
  function trashCard(id) {
    const loc = removeCard(id);
    if (!loc) return false;
    state.trash.unshift({ id: uid(), card: loc.card, act: loc.act, beat: loc.beat, deletedAt: nowISO() });
    persistTrash();
    return true;
  }
  function purgeTrashDuplicates() {
    const ids = new Set();
    storyCards().forEach(x => ids.add(x.card.id));
    ideaCards().forEach(c => ids.add(c.id));
    const next = state.trash.filter(item => !ids.has(item.card.id));
    if (next.length !== state.trash.length) { state.trash = next; persistTrash(); }
  }

  /* ======================= 渲染：卡片板 ======================= */
  function renderBoard() {
    destroySortables();
    const frag = document.createDocumentFragment();
    acts().forEach((act, actIndex) => {
      const section = document.createElement('section');
      section.className = 'act';
      section.dataset.act = act.id;
      section.setAttribute('aria-labelledby', 'act-title-' + act.id);
      section.style.animationDelay = (actIndex * 30) + 'ms';

      const beatsHtml = act.beats.map((beat, i) => {
        const hint = HINTS[beat.id] || '';
        const rec = beat.min === beat.max ? String(beat.min) : beat.min + '–' + beat.max;
        return '' +
          '<article class="beat" data-act="' + act.id + '" data-beat="' + beat.id + '">' +
            '<header class="beat__head">' +
              '<span class="beat__num" aria-hidden="true">' + String(i + 1).padStart(2, '0') + '</span>' +
              '<h3 class="beat__title">' + escapeHtml(beat.title) + '</h3>' +
              '<span class="beat__count" title="建议 ' + rec + ' 张">0</span>' +
            '</header>' +
            (hint ? '<p class="beat__hint" title="' + escapeHtml(hint) + '">' + escapeHtml(hint) + '</p>' : '') +
            '<div class="cards" role="group" data-act="' + act.id + '" data-beat="' + beat.id + '" aria-label="' + escapeHtml(beat.title) + '的卡片"></div>' +
            '<button type="button" class="beat__add" data-act="' + act.id + '" data-beat="' + beat.id + '">' +
              '<svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>添加' +
            '</button>' +
          '</article>';
      }).join('');

      section.innerHTML =
        '<header class="act__head">' +
          '<h2 class="act__title" id="act-title-' + act.id + '">' + escapeHtml(act.title) + '</h2>' +
          '<span class="act__count">0 张</span>' +
          '<div class="act__progress" aria-hidden="true"><i></i></div>' +
        '</header>' +
        '<div class="act__beats">' + beatsHtml + '</div>';

      act.beats.forEach(beat => {
        const list = section.querySelector('.cards[data-act="' + act.id + '"][data-beat="' + beat.id + '"]');
        const cards = cardsAt(act.id, beat.id);
        cards.forEach(card => list.appendChild(cardEl(card, act.id, beat.id)));
      });

      frag.appendChild(section);
    });

    dom.board.innerHTML = '';
    dom.board.appendChild(frag);
    updateCounts();
    applyFilter();
    if (state.view === 'outline') renderOutline();
    initSortables();
  }

  /* ======================= 渲染：大纲 ======================= */
  function outlineCardEl(card, actId, beatId) {
    const locText = card.location.place ? card.location.type + '. ' + card.location.place : '未标场景';
    const tags = (card.tags || []).slice(0, 4).map(t => '<span class="tag tag--label">' + escapeHtml(t) + '</span>').join('');
    const conflict = [card.conflict.protagonist, card.conflict.goal].filter(Boolean).join(' → ');
    const conflictTag = conflict ? '<span class="tag tag--conflict" title="' + escapeHtml(conflict) + '">' + escapeHtml(conflict) + '</span>' : '';
    const meta = (tags || conflictTag) ? '<div class="outline-card__meta">' + conflictTag + tags + '</div>' : '';

    const el = document.createElement('li');
    el.className = 'outline-card';
    el.dataset.id = card.id;
    el.dataset.status = card.status;
    el.dataset.act = actId;
    el.dataset.beat = beatId;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', STATUS_LABEL[card.status] + '卡片，' + locText + '：' + (card.description || '空'));
    el.innerHTML =
      '<span class="outline-card__dot" aria-hidden="true"></span>' +
      '<span class="outline-card__scene">' + escapeHtml(locText) + '</span>' +
      '<div class="outline-card__body">' +
        '<p>' + (card.description ? escapeHtml(card.description) : '<span class="card__empty">（还没有写内容）</span>') + '</p>' +
        meta +
      '</div>' +
      '<span class="outline-card__status">' + escapeHtml(STATUS_LABEL[card.status]) + '</span>';
    return el;
  }

  function renderOutline() {
    if (!dom.outline) return;
    const frag = document.createDocumentFragment();
    acts().forEach(act => {
      const section = document.createElement('section');
      section.className = 'outline-act' + (state.collapsedActs.has(act.id) ? ' is-collapsed' : '');
      section.dataset.act = act.id;
      const actCount = act.beats.reduce((n, b) => n + (state.data.acts[act.id] && state.data.acts[act.id][b.id] || []).length, 0);
      section.innerHTML =
        '<button type="button" class="outline-act__head" aria-expanded="' + (!state.collapsedActs.has(act.id)) + '" data-act="' + act.id + '">' +
          '<span class="outline-act__title">' + escapeHtml(act.title) + '</span>' +
          '<b>' + actCount + ' 张</b>' +
          '<svg class="icon" aria-hidden="true"><use href="#i-chevron"/></svg>' +
        '</button>' +
        '<div class="outline-act__body"></div>';

      const body = section.querySelector('.outline-act__body');
      act.beats.forEach((beat, i) => {
        const cards = cardsAt(act.id, beat.id);
        const beatEl = document.createElement('div');
        beatEl.className = 'outline-beat' + (cards.length ? '' : ' is-empty');
        beatEl.dataset.act = act.id;
        beatEl.dataset.beat = beat.id;
        beatEl.innerHTML =
          '<div class="outline-beat__head">' +
            '<span class="outline-beat__num">' + String(i + 1).padStart(2, '0') + '</span>' +
            '<span class="outline-beat__title">' + escapeHtml(beat.title) + '</span>' +
            '<span class="outline-beat__count">' + (cards.length ? cards.length + ' 张' : '空') + '</span>' +
            '<button type="button" class="outline-beat__add" data-act="' + act.id + '" data-beat="' + beat.id + '" aria-label="在' + escapeHtml(beat.title) + '添加卡片">' +
              '<svg class="icon" aria-hidden="true"><use href="#i-plus"/></svg>添加' +
            '</button>' +
          '</div>' +
          '<ol class="outline-cards"></ol>';
        const list = beatEl.querySelector('.outline-cards');
        cards.forEach(card => list.appendChild(outlineCardEl(card, act.id, beat.id)));
        body.appendChild(beatEl);
      });
      frag.appendChild(section);
    });
    dom.outline.innerHTML = '';
    dom.outline.appendChild(frag);
    applyOutlineFilter();
  }

  function setView(view, persist) {
    state.view = view === 'outline' ? 'outline' : 'board';
    if (persist !== false) {
      try { localStorage.setItem(K.view, state.view); } catch (e) { /* noop */ }
    }
    if (dom.board) dom.board.hidden = state.view !== 'board';
    if (dom.outline) dom.outline.hidden = state.view !== 'outline';
    $$('#view-switch button').forEach(btn => {
      const active = btn.dataset.view === state.view;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
    if (state.view === 'outline') {
      renderOutline();
      applyFilter();
    } else {
      applyFilter();
    }
  }

  function cardEl(card, actId, beatId) {
    const emo = EMOTION[card.emotionalChange] || EMOTION.neutral;
    const locText = card.location.place ? card.location.type + '. ' + card.location.place : '';
    const conflictText = [card.conflict.protagonist, card.conflict.goal, card.conflict.obstacle].filter(Boolean).join(' · ');

    let meta = '';
    if (card.emotionalChangeContent) {
      meta += '<span class="tag ' + emo.cls + '" title="' + escapeHtml(card.emotionalChangeContent) + '">' +
        emo.sign + ' ' + escapeHtml(card.emotionalChangeContent) + '</span>';
    } else if (card.emotionalChange !== 'positive') {
      meta += '<span class="tag ' + emo.cls + '">' + emo.sign + ' ' + emo.label + '</span>';
    }
    if (conflictText) {
      meta += '<span class="tag tag--conflict" title="' + escapeHtml(conflictText) + '">' + escapeHtml(conflictText) + '</span>';
    }
    if (card.tags && card.tags.length) {
      meta += card.tags.slice(0, 4).map(t => '<span class="tag tag--label">' + escapeHtml(t) + '</span>').join('');
    }

    const el = document.createElement('article');
    el.className = 'card';
    el.dataset.id = card.id;
    el.dataset.status = card.status;
    el.dataset.act = actId;
    el.dataset.beat = beatId;
    el.tabIndex = 0;
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', STATUS_LABEL[card.status] + '卡片' + (locText ? '，' + locText : '') + '：' + (card.description || '空'));
    el.innerHTML =
      '<div class="card__top">' +
        '<span class="card__dot" aria-hidden="true"></span>' +
        (locText ? '<span class="card__loc">' + escapeHtml(locText) + '</span>' : '<span class="card__loc">未标场景</span>') +
        '<button type="button" class="card__more" tabindex="-1" aria-label="卡片操作" aria-haspopup="menu">' +
          '<svg class="icon" aria-hidden="true"><use href="#i-dots"/></svg>' +
        '</button>' +
      '</div>' +
      '<p class="card__desc">' + (card.description ? escapeHtml(card.description) : '<span class="card__empty">（还没有写内容）</span>') + '</p>' +
      (meta ? '<div class="card__meta">' + meta + '</div>' : '');
    return el;
  }

  function updateCounts() {
    let total = 0;
    let keyTotal = 0;
    let keyFilled = 0;
    acts().forEach(act => {
      let actCount = 0;
      let actMax = 0;
      act.beats.forEach(beat => {
        const n = (state.data.acts[act.id] && state.data.acts[act.id][beat.id] || []).length;
        actCount += n;
        actMax += beat.max;
        if (beat.key) {
          keyTotal++;
          if (n > 0) keyFilled++;
        }
        const beatEl = dom.board.querySelector('.beat[data-act="' + act.id + '"][data-beat="' + beat.id + '"]');
        if (beatEl) {
          const countEl = beatEl.querySelector('.beat__count');
          countEl.textContent = String(n);
          countEl.classList.toggle('is-over', n > beat.max);
          beatEl.classList.toggle('is-filled', n > 0);
        }
      });
      total += actCount;
      const section = dom.board.querySelector('.act[data-act="' + act.id + '"]');
      if (section) {
        section.querySelector('.act__count').textContent = actCount + ' 张';
        const bar = section.querySelector('.act__progress i');
        bar.style.width = Math.min(100, actMax ? Math.round(actCount / actMax * 100) : 0) + '%';
      }
    });

    dom.statusSummary.textContent = total + ' 张卡片 · 关键节拍 ' + keyFilled + '/' + keyTotal;
    dom.ideasCount.textContent = String(ideaCards().length);
    dom.ideasCount.hidden = ideaCards().length === 0;
    dom.trashCount.textContent = String(state.trash.length);
    dom.trashCount.hidden = state.trash.length === 0;
    return { total, keyTotal, keyFilled };
  }

  /* ======================= 筛选 ======================= */
  function cardMatches(card, q) {
    if (state.filter.status !== 'all' && card.status !== state.filter.status) return false;
    if (!q) return true;
    const hay = [
      card.description,
      card.location.place,
      card.location.type,
      card.conflict.protagonist,
      card.conflict.goal,
      card.conflict.obstacle,
      card.emotionalChangeContent,
      (card.tags || []).join(' ')
    ].join('\n').toLowerCase();
    return hay.indexOf(q) !== -1;
  }

  function applyFilter() {
    const q = state.filter.q.trim().toLowerCase();
    const filtering = Boolean(q) || state.filter.status !== 'all';
    let visible = 0;
    let total = 0;

    $$('.act', dom.board).forEach(section => {
      const actId = section.dataset.act;
      const actAllowed = state.filter.act === 'all' || actId === state.filter.act;
      let actVisible = 0;
      $$('.beat', section).forEach(beatEl => {
        let beatVisible = 0;
        $$('.card', beatEl).forEach(el => {
          const loc = findLocation(el.dataset.id);
          const ok = loc ? cardMatches(loc.card, q) : true;
          el.classList.toggle('is-hidden', filtering && !ok);
          if (!filtering || ok) beatVisible++;
          if (actAllowed) total++;
        });
        const beatEmpty = beatVisible === 0;
        beatEl.classList.toggle('is-dim', filtering && beatEmpty);
        actVisible += beatVisible;
      });
      const hideAct = !actAllowed || (filtering && actVisible === 0);
      section.classList.toggle('is-hidden', hideAct);
      if (!hideAct) visible += filtering ? actVisible : 0;
    });

    if (filtering) {
      dom.resultCount.textContent = '匹配 ' + visible + ' / ' + total + ' 张';
    } else {
      dom.resultCount.textContent = '';
    }
    applyOutlineFilter();
  }

  function applyOutlineFilter() {
    if (!dom.outline) return;
    const q = state.filter.q.trim().toLowerCase();
    const filtering = Boolean(q) || state.filter.status !== 'all';
    $$('.outline-act', dom.outline).forEach(section => {
      const actId = section.dataset.act;
      const actAllowed = state.filter.act === 'all' || actId === state.filter.act;
      let actVisible = 0;
      $$('.outline-beat', section).forEach(beatEl => {
        let beatVisible = 0;
        $$('.outline-card', beatEl).forEach(el => {
          const loc = findLocation(el.dataset.id);
          const ok = loc ? cardMatches(loc.card, q) : true;
          el.classList.toggle('is-hidden', filtering && !ok);
          if (!filtering || ok) beatVisible++;
        });
        beatEl.classList.toggle('is-dim', filtering && beatVisible === 0);
        actVisible += beatVisible;
      });
      section.classList.toggle('is-hidden', !actAllowed || (filtering && actVisible === 0));
    });
  }

  function resetFilters() {
    state.filter = { act: 'all', status: 'all', q: '' };
    dom.search.value = '';
    dom.searchClear.hidden = true;
    $$('#status-filter button').forEach(b => b.classList.toggle('is-active', b.dataset.status === 'all'));
    renderTabs();
    applyFilter();
  }

  // 打印时临时显示全部，打印后恢复筛选
  window.addEventListener('beforeprint', () => {
    $$('.is-hidden', dom.board).forEach(el => el.classList.remove('is-hidden'));
    $$('.is-dim', dom.board).forEach(el => el.classList.remove('is-dim'));
  });
  window.addEventListener('afterprint', () => applyFilter());

  /* ======================= 拖拽 ======================= */
  function destroySortables() {
    state.sortables.forEach(s => { try { s.destroy(); } catch (e) { /* noop */ } });
    state.sortables = [];
  }

  function initSortables() {
    if (typeof Sortable === 'undefined') {
      console.warn('SortableJS 未加载，拖拽功能不可用');
      return;
    }
    const trashEl = dom.trashDrop;
    const lists = $$('.cards', dom.board);

    lists.forEach(list => {
      const sortable = new Sortable(list, {
        group: 'cards',
        animation: 150,
        delay: 120,
        delayOnTouchOnly: true,
        touchStartThreshold: 4,
        ghostClass: 'is-ghost',
        chosenClass: 'is-chosen',
        dragClass: 'is-drag',
        fallbackOnBody: true,
        swapThreshold: 0.7,
        emptyInsertThreshold: 10,
        onStart() {
          state.dragging = true;
          state.dragSnapshot = snapshot();
          document.body.classList.add('is-dragging');
          trashEl.classList.add('is-visible');
          closePopover();
        },
        onMove(evt) {
          $$('.cards', dom.board).forEach(l => l.classList.toggle('is-drop-target', l === evt.to));
          const p = eventPoint(evt);
          const overTrash = p && pointInElement(p, trashEl);
          if (trashEl) trashEl.classList.toggle('is-over', overTrash);
          return true;
        },
        onEnd(evt) {
          const p = eventPoint(evt);
          const overTrash = p && pointInElement(p, trashEl);
          cleanupDrag();
          if (overTrash) {
            const dropId = evt.item.dataset.id;
            const dropLoc = findLocation(dropId);
            if (dropLoc) {
              if (state.dragSnapshot) pushHistory(state.dragSnapshot);
              state.dragSnapshot = null;
              trashCard(dropId);
              saveNow();
              queueSnapshot('删除卡片', true);
              setTimeout(() => { renderBoard(); updateChrome(); }, 20);
              toast('卡片已移入垃圾桶', { action: { label: '撤销', onClick: undo }, duration: 5000 });
            }
            return;
          }
          const from = { act: evt.from.dataset.act, beat: evt.from.dataset.beat };
          const to = { act: evt.to.dataset.act, beat: evt.to.dataset.beat };
          if (!from.act || !to.act) { renderBoard(); return; }
          if (from.act === to.act && from.beat === to.beat && evt.oldIndex === evt.newIndex) {
            renderBoard();
            return;
          }
          const id = evt.item.dataset.id;
          const loc = findLocation(id);
          if (!loc) { renderBoard(); return; }
          const card = loc.card;
          removeCard(id);
          insertCard(card, to.act, to.beat);
          syncFromDom(to.act, to.beat);
          syncFromDom(from.act, from.beat);
          card.updatedAt = nowISO();
          pushHistory(state.dragSnapshot);
          state.dragSnapshot = null;
          saveNow();
          queueSnapshot('移动卡片', true);
          renderBoard();
          updateChrome();
          if (from.act !== to.act || from.beat !== to.beat) {
            const meta = beatMeta(to.act, to.beat);
            toast('已移动到 ' + (meta ? meta.title : '节拍'));
          }
        }
      });
      state.sortables.push(sortable);
    });

  }

  function eventPoint(evt) {
    const oe = evt.originalEvent || evt;
    const t = (oe.touches && oe.touches[0]) || (oe.changedTouches && oe.changedTouches[0]) || oe;
    if (!t || typeof t.clientX !== 'number') return null;
    return { x: t.clientX, y: t.clientY };
  }
  function pointInElement(p, el) {
    if (!p || !el) return false;
    const r = el.getBoundingClientRect();
    return p.x >= r.left && p.x <= r.right && p.y >= r.top && p.y <= r.bottom;
  }

  function cleanupDrag() {
    state.dragging = false;
    state.lastDragEnd = Date.now();
    document.body.classList.remove('is-dragging');
    if (dom.trashDrop) {
      dom.trashDrop.classList.remove('is-visible', 'is-over');
    }
    $$('.cards', dom.board).forEach(l => l.classList.remove('is-drop-target'));
  }

  function syncFromDom(actId, beatId) {
    const list = dom.board.querySelector('.cards[data-act="' + actId + '"][data-beat="' + beatId + '"]');
    if (!list) return;
    const map = new Map(cardsAt(actId, beatId).map(c => [c.id, c]));
    const ids = $$('.card', list).map(el => el.dataset.id);
    const ordered = ids.map(id => map.get(id)).filter(Boolean);
    if (ordered.length) state.data.acts[actId][beatId] = ordered;
  }

  /* ======================= 弹窗基础 ======================= */
  function openDialog(dialog, focusSelector) {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    if (focusSelector) {
      setTimeout(() => {
        const target = $(focusSelector, dialog);
        if (target) target.focus();
      }, 40);
    }
  }
  function closeDialog(dialog) {
    if (!dialog) return;
    try {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
    } catch (e) { dialog.removeAttribute('open'); }
  }

  // 点击遮罩关闭
  $$('dialog').forEach(dialog => {
    dialog.addEventListener('click', e => {
      if (e.target === dialog) attemptClose(dialog);
    });
  });

  function attemptClose(dialog) {
    if (dialog === dom.editorDialog) { tryCloseEditor(); return; }
    closeDialog(dialog);
  }

  /* ======================= 卡片编辑器 ======================= */
  function fillActSelect(select, value) {
    select.innerHTML = acts().map(a => '<option value="' + a.id + '">' + escapeHtml(a.title) + '</option>').join('');
    if (value && acts().some(a => a.id === value)) select.value = value;
  }
  function fillBeatSelect(actId, value) {
    const beats = beatsOf(actId);
    dom.cardBeat.innerHTML = beats.map(b => '<option value="' + b.id + '">' + escapeHtml(b.title) + '</option>').join('');
    if (value && beats.some(b => b.id === value)) dom.cardBeat.value = value;
    else if (beats[0]) dom.cardBeat.value = beats[0].id;
  }

  function setSegmented(container, attr, value) {
    $$('button', container).forEach(btn => {
      const active = btn.dataset[attr] === value;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  function getSegmented(container, attr, fallback) {
    const active = $('button.is-active', container);
    return active ? active.dataset[attr] : fallback;
  }

  function parseTags(value) {
    const seen = new Set();
    return String(value || '')
      .split(/[,，、\s]+/)
      .map(t => t.trim().replace(/^#/, ''))
      .filter(t => {
        if (!t) return false;
        const key = t.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map(t => t.slice(0, 16))
      .slice(0, 6);
  }

  function openEditor(opts) {
    const options = opts || {};
    closePopover();
    if (options.ideaId) {
      const idea = ideaCards().find(c => c.id === options.ideaId);
      if (!idea) return;
      state.editor = { ideaId: idea.id, isNew: false, id: idea.id };
      dom.editorTitle.textContent = '灵感转为卡片';
      dom.editorIdeaNote.hidden = false;
      fillActSelect(dom.cardAct, state.filter.act !== 'all' ? state.filter.act : acts()[0].id);
      fillBeatSelect(dom.cardAct.value, null);
      fillForm(idea);
    } else if (options.id) {
      const loc = findLocation(options.id);
      if (!loc) return;
      state.editor = { id: options.id, isNew: false, ideaId: null };
      dom.editorTitle.textContent = '编辑卡片';
      dom.editorIdeaNote.hidden = true;
      fillActSelect(dom.cardAct, loc.act === 'bucket' ? acts()[0].id : loc.act);
      fillBeatSelect(dom.cardAct.value, loc.beat);
      fillForm(loc.card);
    } else {
      const act = options.act || (state.filter.act !== 'all' ? state.filter.act : acts()[0].id);
      const beat = options.beat || (beatsOf(act)[0] && beatsOf(act)[0].id);
      state.editor = { id: null, isNew: true, ideaId: null };
      dom.editorTitle.textContent = '新建卡片';
      dom.editorIdeaNote.hidden = true;
      fillActSelect(dom.cardAct, act);
      fillBeatSelect(act, beat);
      fillForm(null);
    }
    if (options.status) setSegmented(dom.cardStatus, 'status', options.status);
    updateDescCount();
    autoGrow(dom.cardDesc);
    state.editor.baseline = JSON.stringify(readForm());
    openDialog(dom.editorDialog);
    setTimeout(() => {
      dom.cardDesc.focus();
      const len = dom.cardDesc.value.length;
      try { dom.cardDesc.setSelectionRange(len, len); } catch (e) { /* noop */ }
    }, 70);
  }

  function fillForm(card) {
    const c = card || {};
    const loc = c.location || { type: 'INT', place: '' };
    const conf = c.conflict || { protagonist: '', goal: '', obstacle: '' };
    dom.sceneType.value = loc.type || 'INT';
    dom.scenePlace.value = loc.place || '';
    dom.cardDesc.value = c.description || '';
    dom.conflictWho.value = conf.protagonist || '';
    dom.conflictGoal.value = conf.goal || '';
    dom.conflictBlock.value = conf.obstacle || '';
    dom.emotionNote.value = c.emotionalChangeContent || '';
    dom.cardTags.value = (c.tags || []).join(', ');
    setSegmented(dom.cardStatus, 'status', c.status || 'confirmed');
    setSegmented(dom.emotionType, 'value', c.emotionalChange || 'positive');
    autoGrow(dom.cardDesc);
  }

  function readForm() {
    return {
      act: dom.cardAct.value,
      beat: dom.cardBeat.value,
      status: getSegmented(dom.cardStatus, 'status', 'confirmed'),
      sceneType: dom.sceneType.value,
      place: dom.scenePlace.value.trim(),
      description: dom.cardDesc.value.trim(),
      who: dom.conflictWho.value.trim(),
      goal: dom.conflictGoal.value.trim(),
      obstacle: dom.conflictBlock.value.trim(),
      emotion: getSegmented(dom.emotionType, 'value', 'positive'),
      emotionNote: dom.emotionNote.value.trim(),
      tags: parseTags(dom.cardTags.value)
    };
  }

  function editorIsDirty() {
    if (!state.editor) return false;
    try { return JSON.stringify(readForm()) !== state.editor.baseline; } catch (e) { return false; }
  }

  function tryCloseEditor() {
    if (!state.editor || !editorIsDirty()) { closeEditor(); return; }
    confirmAction({
      title: '放弃修改？',
      body: '这张卡片还有没保存的修改，关闭后会丢失。',
      okText: '放弃修改',
      danger: true
    }).then(ok => { if (ok) closeEditor(); });
  }

  function closeEditor() {
    state.editor = null;
    closeDialog(dom.editorDialog);
  }

  function saveEditor(event) {
    if (event) event.preventDefault();
    if (!state.editor) return;
    const v = readForm();
    if (!v.description) {
      toast('先写点剧情内容再保存', 'error');
      dom.cardDesc.focus();
      return;
    }
    const old = state.editor.id ? findLocation(state.editor.id) : null;
    const isNew = !state.editor.id;
    const ts = nowISO();

    mutate(() => {
      const card = {
        id: state.editor.id || uid(),
        status: v.status,
        location: { type: v.sceneType, place: v.place },
        description: v.description,
        conflict: { protagonist: v.who, goal: v.goal, obstacle: v.obstacle },
        emotionalChange: v.emotion,
        emotionalChangeContent: v.emotionNote,
        tags: v.tags,
        createdAt: old ? old.card.createdAt : ts,
        updatedAt: ts
      };
      if (state.editor.ideaId) {
        removeCard(state.editor.ideaId);
        insertCard(card, v.act, v.beat);
        toast('灵感已转为卡片');
      } else if (isNew) {
        insertCard(card, v.act, v.beat);
        toast('卡片已添加');
      } else if (old && (old.act !== v.act || old.beat !== v.beat)) {
        removeCard(state.editor.id);
        insertCard(card, v.act, v.beat);
        toast('卡片已移动并保存');
      } else {
        const list = cardsAt(v.act, v.beat);
        const idx = list.findIndex(c => c.id === state.editor.id);
        if (idx >= 0) list[idx] = card;
        else list.push(card);
        toast('已保存');
      }
    }, { reason: isNew ? '新增卡片' : '编辑卡片', forceSnapshot: true });

    const cameFromIdea = Boolean(state.editor && state.editor.ideaId);
    closeEditor();
    if (cameFromIdea) {
      renderIdeas();
      closeDialog(dom.ideasDialog);
    }
    if (state.quick.act === v.act) state.quick.beat = v.beat;
  }

  function deleteFromEditor() {
    if (!state.editor || !state.editor.id) { closeEditor(); return; }
    const id = state.editor.id;
    confirmAction({
      title: '删除这张卡片？',
      body: '删除后可以在「垃圾桶」里恢复，30 天后彻底清除。',
      okText: '删除',
      danger: true
    }).then(ok => {
      if (!ok) return;
      mutate(() => { trashCard(id); }, { reason: '删除卡片', forceSnapshot: true });
      closeEditor();
      toast('已移入垃圾桶', { action: { label: '撤销', onClick: undo }, duration: 5000 });
    });
  }

  function duplicateFromEditor() {
    if (!state.editor) return;
    const v = readForm();
    if (!v.description) { toast('内容为空，无法复制', 'error'); return; }
    const ts = nowISO();
    mutate(() => {
      insertCard({
        id: uid(),
        status: v.status,
        location: { type: v.sceneType, place: v.place },
        description: v.description,
        conflict: { protagonist: v.who, goal: v.goal, obstacle: v.obstacle },
        emotionalChange: v.emotion,
        emotionalChangeContent: v.emotionNote,
        tags: v.tags,
        createdAt: ts,
        updatedAt: ts
      }, v.act, v.beat);
    }, { reason: '复制卡片', forceSnapshot: true });
    closeEditor();
    toast('已复制一张卡片');
  }

  function updateDescCount() {
    const len = dom.cardDesc.value.length;
    dom.descCount.textContent = len + ' / ' + LIMITS.description;
    dom.descCount.style.color = len > LIMITS.description * 0.9 ? 'var(--danger)' : '';
  }

  function autoGrow(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(360, Math.max(92, textarea.scrollHeight)) + 'px';
  }

  /* ======================= 快速添加 ======================= */
  function openQuick(opts) {
    const options = opts || {};
    const act = options.act || (state.filter.act !== 'all' ? state.filter.act : acts()[0].id);
    state.quick.act = acts().some(a => a.id === act) ? act : acts()[0].id;
    state.quick.beat = options.beat || (beatsOf(state.quick.act)[0] || {}).id;
    dom.quickDesc.value = '';
    renderQuickChips();
    openDialog(dom.quickDialog, '#quick-desc');
  }

  function renderQuickChips() {
    dom.quickActs.innerHTML = acts().map(a =>
      '<button type="button" class="chip' + (a.id === state.quick.act ? ' is-active' : '') + '" aria-pressed="' + (a.id === state.quick.act) + '" data-act="' + a.id + '">' + escapeHtml(a.title) + '</button>'
    ).join('');
    const beats = beatsOf(state.quick.act);
    if (!beats.some(b => b.id === state.quick.beat)) state.quick.beat = beats[0] && beats[0].id;
    dom.quickBeats.innerHTML = beats.map(b =>
      '<button type="button" class="chip' + (b.id === state.quick.beat ? ' is-active' : '') + '" aria-pressed="' + (b.id === state.quick.beat) + '" data-beat="' + b.id + '">' + escapeHtml(b.title) + '</button>'
    ).join('');
    const meta = beatMeta(state.quick.act, state.quick.beat);
    dom.quickHint.textContent = meta ? (HINTS[meta.id] || '') : '';
  }

  function saveQuick(keepOpen) {
    const desc = dom.quickDesc.value.trim();
    if (!desc) {
      toast('写一句剧情再添加', 'error');
      dom.quickDesc.focus();
      return;
    }
    const ts = nowISO();
    mutate(() => {
      insertCard({
        id: uid(),
        status: 'confirmed',
        location: { type: 'INT', place: '' },
        description: desc,
        conflict: { protagonist: '', goal: '', obstacle: '' },
        emotionalChange: 'positive',
        emotionalChangeContent: '',
        createdAt: ts,
        updatedAt: ts
      }, state.quick.act, state.quick.beat);
    }, { reason: '快速添加', forceSnapshot: true });
    if (keepOpen) {
      dom.quickDesc.value = '';
      dom.quickDesc.focus();
      toast('已添加，继续下一条');
    } else {
      closeDialog(dom.quickDialog);
      toast('卡片已添加');
    }
  }

  /* ======================= 卡片操作浮层 ======================= */
  function openCardMenu(anchor, cardElNode) {
    closePopover();
    const id = cardElNode.dataset.id;
    const menu = document.createElement('div');
    menu.className = 'popover';
    menu.setAttribute('role', 'menu');
    menu.innerHTML =
      '<button type="button" role="menuitem" data-action="edit"><svg class="icon"><use href="#i-doc"/></svg>编辑<kbd>↵</kbd></button>' +
      '<button type="button" role="menuitem" data-action="duplicate"><svg class="icon"><use href="#i-grid"/></svg>复制一张</button>' +
      '<button type="button" role="menuitem" data-action="move"><svg class="icon"><use href="#i-arrow"/></svg>更改位置</button>' +
      '<hr>' +
      '<button type="button" role="menuitem" class="is-danger" data-action="delete"><svg class="icon"><use href="#i-trash"/></svg>删除</button>';
    document.body.appendChild(menu);
    state.popover = menu;

    const rect = anchor.getBoundingClientRect();
    const mw = menu.offsetWidth;
    const mh = menu.offsetHeight;
    let left = rect.right - mw;
    let top = rect.bottom + 6;
    if (left < 8) left = 8;
    if (left + mw > window.innerWidth - 8) left = window.innerWidth - mw - 8;
    if (top + mh > window.innerHeight - 8) top = rect.top - mh - 6;
    menu.style.left = left + 'px';
    menu.style.top = Math.max(8, top) + 'px';

    menu.addEventListener('click', e => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      const action = btn.dataset.action;
      closePopover();
      if (action === 'edit') openEditor({ id });
      else if (action === 'move') openEditor({ id });
      else if (action === 'delete') deleteCardWithConfirm(id);
      else if (action === 'duplicate') duplicateCard(id);
    });

    const first = menu.querySelector('button');
    if (first) first.focus();

    setTimeout(() => {
      document.addEventListener('pointerdown', onOutsidePopover, true);
      document.addEventListener('keydown', onPopoverKey, true);
      window.addEventListener('resize', closePopover);
    }, 0);
  }

  function onOutsidePopover(e) {
    if (state.popover && !state.popover.contains(e.target) && !e.target.closest('.card__more')) closePopover();
  }
  function onPopoverKey(e) {
    if (e.key === 'Escape') { e.stopPropagation(); closePopover(); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      const items = $$('button', state.popover);
      const idx = items.indexOf(document.activeElement);
      const next = e.key === 'ArrowDown' ? (idx + 1) % items.length : (idx - 1 + items.length) % items.length;
      e.preventDefault();
      items[next].focus();
    }
  }
  function closePopover() {
    if (!state.popover) return;
    state.popover.remove();
    state.popover = null;
    document.removeEventListener('pointerdown', onOutsidePopover, true);
    document.removeEventListener('keydown', onPopoverKey, true);
    window.removeEventListener('resize', closePopover);
  }

  function duplicateCard(id) {
    const loc = findLocation(id);
    if (!loc) return;
    const copy = JSON.parse(JSON.stringify(loc.card));
    copy.id = uid();
    copy.createdAt = nowISO();
    copy.updatedAt = copy.createdAt;
    mutate(() => {
      if (loc.act === 'bucket') insertCard(copy, '1', beatsOf('1')[0].id);
      else {
        const list = cardsAt(loc.act, loc.beat);
        const idx = list.findIndex(c => c.id === id);
        list.splice(idx + 1, 0, copy);
      }
    });
    toast('已复制一张卡片');
  }

  function deleteCardWithConfirm(id) {
    confirmAction({
      title: '删除这张卡片？',
      body: '删除后可以在「垃圾桶」里恢复，30 天后彻底清除。',
      okText: '删除',
      danger: true
    }).then(ok => {
      if (!ok) return;
      mutate(() => { trashCard(id); }, { reason: '删除卡片', forceSnapshot: true });
      toast('已移入垃圾桶', { action: { label: '撤销', onClick: undo }, duration: 5000 });
    });
  }

  /* ======================= 确认框 ======================= */
  function confirmAction(opts) {
    const options = opts || {};
    dom.confirmTitle.textContent = options.title || '确认';
    dom.confirmBody.textContent = options.body || '';
    dom.confirmOk.textContent = options.okText || '确定';
    dom.confirmOk.classList.toggle('btn--danger', Boolean(options.danger));
    dom.confirmOk.classList.toggle('btn--primary', !options.danger);

    return new Promise(resolve => {
      let settled = false;
      const finish = value => {
        if (settled) return;
        settled = true;
        dom.confirmOk.removeEventListener('click', onOk);
        dom.confirmDialog.removeEventListener('close', onClose);
        closeDialog(dom.confirmDialog);
        resolve(value);
      };
      const onOk = () => finish(true);
      const onClose = () => finish(false);
      dom.confirmOk.addEventListener('click', onOk);
      dom.confirmDialog.addEventListener('close', onClose);
      openDialog(dom.confirmDialog);
      setTimeout(() => dom.confirmOk.focus(), 40);
    });
  }

  /* ======================= 项目 ======================= */
  function listProjects() {
    const list = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (key === K.current) {
        list.push({
          key: K.current,
          name: '当前项目',
          title: state.data.project.title || '未命名剧本',
          type: state.data.project.type,
          lastSaved: state.data.project.lastSaved,
          count: countStoryCards(),
          current: true
        });
      } else if (key.indexOf(K.projectPrefix) === 0) {
        try {
          const data = normalizeData(JSON.parse(localStorage.getItem(key)));
          list.push({
            key,
            name: key.slice(K.projectPrefix.length),
            title: data.project.title || key.slice(K.projectPrefix.length),
            type: data.project.type,
            lastSaved: data.project.lastSaved,
            count: (function () {
              let n = 0;
              Object.keys(data.acts).forEach(a => {
                if (a === 'bucket') return;
                Object.keys(data.acts[a]).forEach(b => { n += data.acts[a][b].length; });
              });
              return n;
            })(),
            current: false
          });
        } catch (e) { /* 跳过损坏的项目 */ }
      }
    }
    list.sort((a, b) => {
      if (a.current) return -1;
      if (b.current) return 1;
      return new Date(b.lastSaved) - new Date(a.lastSaved);
    });
    return list;
  }

  function renderProjects() {
    const items = listProjects();
    dom.projectList.innerHTML = '';
    if (!items.length) {
      dom.projectList.innerHTML = '<p class="project-empty">还没有保存过项目</p>';
      return;
    }
    items.forEach(item => {
      const row = document.createElement('div');
      row.className = 'project-item' + (item.current ? ' is-current' : '');
      row.dataset.key = item.key;
      row.innerHTML =
        '<div class="project-item__main">' +
          '<div class="project-item__name">' + escapeHtml(item.title) + '</div>' +
          '<div class="project-item__meta"><span>' + escapeHtml(TYPE_LABEL[item.type] || '剧本') + '</span><span>' + item.count + ' 张</span><span>' + escapeHtml(relativeTime(item.lastSaved)) + '</span><span>' + (item.current ? '当前打开' : '快照') + '</span></div>' +
        '</div>' +
        '<div class="project-item__actions">' +
          (item.current ? '' : '<button type="button" class="btn btn--ghost" data-paction="open">打开</button><button type="button" class="btn btn--ghost" data-paction="rename">重命名</button><button type="button" class="btn btn--danger-ghost" data-paction="delete">删除</button>') +
        '</div>';
      dom.projectList.appendChild(row);
    });
  }

  function uniqueProjectName(base) {
    const clean = safeFileName(base).slice(0, 50);
    let name = clean;
    let n = 2;
    while (localStorage.getItem(K.projectPrefix + name)) name = clean + ' ' + n++;
    return name;
  }

  function workspaceSignature(data) {
    const clean = data.project && data.project.schema === SCHEMA
      ? data
      : normalizeData(JSON.parse(JSON.stringify(data)));
    return JSON.stringify({ title: clean.project.title, type: clean.project.type, acts: clean.acts });
  }

  function backupWorkspace() {
    if (countStoryCards() === 0) return;
    const sig = workspaceSignature(state.data);
    // 内容已经在某个快照里，就不必再存一份
    for (const item of listProjects()) {
      if (item.current) continue;
      const raw = readJSON(item.key, null);
      if (raw && workspaceSignature(normalizeData(raw)) === sig) return;
    }
    const name = uniqueProjectName(state.data.project.title || '未命名剧本');
    try {
      localStorage.setItem(K.projectPrefix + name, JSON.stringify(state.data));
    } catch (e) { /* 存储满时静默失败，主流程仍会提示导出 */ }
  }

  function openProject(key) {
    const raw = readJSON(key, null);
    if (!raw) { toast('项目读取失败，文件可能已损坏', 'error'); return; }
    backupWorkspace();
    state.data = normalizeData(raw);
    state.history.length = 0;
    state.future.length = 0;
    state.filter.q = '';
    dom.search.value = '';
    dom.searchClear.hidden = true;
    saveNow();
    renderBoard();
    updateChrome();
    renderProjects();
    if (historyAvailable()) {
      historyAll(state.data.project.id)
        .then(list => { if (!list.length) queueSnapshot('初始版本', true); })
        .catch(() => {});
    }
    closeDialog(dom.projectsDialog);
    toast('已打开「' + state.data.project.title + '」');
  }

  function deleteSnapshot(key) {
    const escaped = (window.CSS && CSS.escape) ? CSS.escape(key) : key.replace(/["\\]/g, '\\$&');
    const row = dom.projectList.querySelector('.project-item[data-key="' + escaped + '"]');
    const title = row ? $('.project-item__name', row).textContent : '这个项目';
    confirmAction({
      title: '删除项目快照？',
      body: '「' + title + '」将从这个浏览器中删除。如果还没导出 JSON 备份，将无法恢复。',
      okText: '删除',
      danger: true
    }).then(ok => {
      if (!ok) return;
      localStorage.removeItem(key);
      renderProjects();
      toast('项目快照已删除');
    });
  }

  function startRename(row, key) {
    const nameEl = $('.project-item__name', row);
    const oldName = key.slice(K.projectPrefix.length);
    const input = document.createElement('input');
    input.type = 'text';
    input.value = oldName;
    input.maxLength = 50;
    nameEl.innerHTML = '';
    nameEl.appendChild(input);
    input.focus();
    input.select();

    let done = false;
    const commit = () => {
      if (done) return;
      done = true;
      const next = input.value.trim().replace(/[\\/:*?"<>|]/g, '_').slice(0, 50);
      if (!next || next === oldName) { renderProjects(); return; }
      const target = K.projectPrefix + next;
      if (localStorage.getItem(target)) { toast('已有同名项目', 'error'); renderProjects(); return; }
      try {
        localStorage.setItem(target, localStorage.getItem(key));
        localStorage.removeItem(key);
        renderProjects();
        toast('已重命名');
      } catch (e) { toast('重命名失败，存储空间可能已满', 'error'); renderProjects(); }
    };
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); commit(); }
      if (e.key === 'Escape') { done = true; renderProjects(); }
    });
    input.addEventListener('blur', commit);
  }

  function saveAsProject() {
    const name = uniqueProjectName(state.data.project.title || '未命名剧本');
    try {
      localStorage.setItem(K.projectPrefix + name, JSON.stringify(state.data));
      renderProjects();
      toast('已另存为「' + name + '」');
    } catch (e) {
      toast('另存失败：浏览器存储空间不足，请先导出并删除旧快照', 'error', 6000);
    }
  }

  function newProject() {
    confirmAction({
      title: '新建项目？',
      body: countStoryCards() > 0
        ? '当前项目会先自动备份到「我的项目」，然后打开一张空白卡片板。'
        : '将打开一张空白卡片板。',
      okText: '新建'
    }).then(ok => {
      if (!ok) return;
      backupWorkspace();
      const type = state.data.project.type;
      state.data = blankData(type, '未命名剧本');
      state.history.length = 0;
      state.future.length = 0;
      saveNow();
      queueSnapshot('新建项目', true);
      resetFilters();
      renderBoard();
      updateChrome();
      toast('已新建项目');
    });
  }

  /* 切换剧本类型：尽量保留卡片，放不下的移入灵感箱 */
  function changeType(nextType) {
    if (!STRUCTURES[nextType] || nextType === state.data.project.type) {
      dom.typeSelect.value = state.data.project.type;
      return;
    }
    confirmAction({
      title: '切换到「' + TYPE_LABEL[nextType] + '」？',
      body: '节拍表会换成对应结构。能对应上的卡片会留在原位，对应不上的会移入灵感箱，不会丢失。',
      okText: '切换'
    }).then(ok => {
      if (!ok) { dom.typeSelect.value = state.data.project.type; return; }
      const old = state.data;
      const next = blankData(nextType, old.project.title);
      next.project.id = old.project.id;
      next.project.lastSaved = old.project.lastSaved;
      const beatOnlyIndex = new Map();
      STRUCTURES[nextType].acts.forEach(a => a.beats.forEach(b => {
        if (!beatOnlyIndex.has(b.id)) beatOnlyIndex.set(b.id, { act: a.id, beat: b.id });
      }));

      pushHistory();
      const ideasBefore = ideaCards().length;
      scriptCardsEach(old, (card, actId, beatId) => {
        if (next.acts[actId] && Array.isArray(next.acts[actId][beatId])) {
          next.acts[actId][beatId].push(card);
        } else if (beatOnlyIndex.has(beatId)) {
          const t = beatOnlyIndex.get(beatId);
          card.origin = { act: actId, beat: beatId };
          next.acts[t.act][t.beat].push(card);
        } else {
          card.origin = { act: actId, beat: beatId };
          next.acts.bucket.ideas.push(card);
        }
      });
      old.acts.bucket && old.acts.bucket.ideas.forEach(card => next.acts.bucket.ideas.push(card));

      state.data = next;
      state.data.project.type = nextType;
      saveNow();
      queueSnapshot('切换结构', true);
      renderBoard();
      updateChrome();
      const moved = ideaCards().length - ideasBefore;
      toast('已切换到' + TYPE_LABEL[nextType] + (moved > 0 ? '，' + moved + ' 张卡片移入灵感箱' : ''));
    });
  }

  function scriptCardsEach(data, fn) {
    const s = STRUCTURES[data.project.type];
    if (!s) return;
    s.acts.forEach(act => act.beats.forEach(beat => {
      const list = data.acts[act.id] && data.acts[act.id][beat.id];
      if (Array.isArray(list)) list.forEach(card => fn(card, act.id, beat.id));
    }));
  }

  /* ======================= 灵感箱 ======================= */
  function renderIdeas() {
    const list = ideaCards();
    dom.ideaList.innerHTML = '';
    if (!list.length) {
      dom.ideaList.innerHTML = '<p class="list-empty">灵感箱是空的。还没想好放哪里的点子，先丢进来。</p>';
      return;
    }
    list.forEach(card => {
      const row = document.createElement('div');
      row.className = 'idea-item';
      row.innerHTML =
        '<div class="idea-item__text">' + escapeHtml(card.description) + '<small>记录于 ' + escapeHtml(relativeTime(card.createdAt)) + '</small></div>' +
        '<div class="idea-item__actions">' +
          '<button type="button" class="btn btn--ghost" data-iaction="promote">转为卡片</button>' +
          '<button type="button" class="btn btn--danger-ghost" data-iaction="delete">删除</button>' +
        '</div>';
      row.dataset.id = card.id;
      dom.ideaList.appendChild(row);
    });
  }

  function addIdea(text) {
    const desc = text.trim();
    if (!desc) { toast('写点什么再存', 'error'); return; }
    const ts = nowISO();
    mutate(() => {
      ideaCards().push({
        id: uid(),
        status: 'pending',
        location: { type: 'INT', place: '' },
        description: desc.slice(0, LIMITS.idea),
        conflict: { protagonist: '', goal: '', obstacle: '' },
        emotionalChange: 'neutral',
        emotionalChangeContent: '',
        createdAt: ts,
        updatedAt: ts
      });
    });
    renderIdeas();
    toast('已存入灵感箱');
  }

  function deleteIdea(id) {
    confirmAction({
      title: '删除这条灵感？',
      body: '会移入垃圾桶，30 天内可以恢复。',
      okText: '删除',
      danger: true
    }).then(ok => {
      if (!ok) return;
      mutate(() => { trashCard(id); }, { reason: '删除灵感', forceSnapshot: true });
      renderIdeas();
      toast('已移入垃圾桶', { action: { label: '撤销', onClick: undo }, duration: 5000 });
    });
  }

  /* ======================= 垃圾桶 ======================= */
  function renderTrash() {
    dom.trashList.innerHTML = '';
    if (!state.trash.length) {
      dom.trashList.innerHTML = '<p class="list-empty">垃圾桶是空的。</p>';
      return;
    }
    state.trash.forEach(item => {
      const row = document.createElement('div');
      row.className = 'trash-item';
      const loc = item.act === 'bucket' ? '灵感箱' : (beatMeta(item.act, item.beat) ? beatMeta(item.act, item.beat).title : '未知节拍');
      row.innerHTML =
        '<div class="trash-item__text">' + escapeHtml(item.card.description || '（空卡片）') + '<small>' + escapeHtml(loc) + ' · 删除于 ' + escapeHtml(relativeTime(item.deletedAt)) + '</small></div>' +
        '<div class="trash-item__actions">' +
          '<button type="button" class="btn btn--ghost" data-taction="restore">恢复</button>' +
          '<button type="button" class="btn btn--danger-ghost" data-taction="purge">彻底删除</button>' +
        '</div>';
      row.dataset.id = item.id;
      dom.trashList.appendChild(row);
    });
  }

  function restoreTrash(id) {
    const idx = state.trash.findIndex(t => t.id === id);
    if (idx < 0) return;
    const item = state.trash[idx];
    const card = item.card;
    if (findLocation(card.id)) card.id = uid();
    mutate(() => {
      state.trash.splice(idx, 1);
      persistTrash();
      if (item.act === 'bucket' || !beatsOf(item.act).some(b => b.id === item.beat)) {
        ideaCards().push(card);
      } else {
        insertCard(card, item.act, item.beat);
      }
    }, { reason: '恢复卡片', forceSnapshot: true });
    renderTrash();
    toast('卡片已恢复');
  }

  function purgeTrash(id) {
    const idx = state.trash.findIndex(t => t.id === id);
    if (idx < 0) return;
    state.trash.splice(idx, 1);
    persistTrash();
    renderTrash();
    updateChrome();
    toast('已彻底删除');
  }

  /* ======================= 版本历史 UI ======================= */
  function historySummary(record) {
    try {
      const data = JSON.parse(record.data);
      const lines = [];
      const struct = STRUCTURES[data.project && data.project.type] || STRUCTURES['tv-hour'];
      struct.acts.forEach(act => {
        const count = act.beats.reduce((n, b) => n + (data.acts[act.id] && data.acts[act.id][b.id] || []).length, 0);
        if (!count) return;
        lines.push(act.title + ' · ' + count + ' 张');
        act.beats.forEach(beat => {
          const list = data.acts[act.id] && data.acts[act.id][beat.id] || [];
          list.slice(0, 4).forEach(card => {
            const scene = card.location && card.location.place ? card.location.type + '. ' + card.location.place : '未标场景';
            lines.push('  ' + beat.title + '｜' + scene + '｜' + (card.description || '').slice(0, 40));
          });
        });
      });
      return lines.join('\n') || '（空项目）';
    } catch (e) {
      return '版本数据读取失败';
    }
  }

  async function renderHistory() {
    if (!dom.historyDialog || !dom.historyDialog.open) return;
    dom.historyList.innerHTML = '<p class="history-empty">读取中…</p>';
    try {
      const items = await historyAll(state.data.project.id);
      if (!dom.historyDialog.open) return;
      if (!items.length) {
        dom.historyList.innerHTML = '<p class="history-empty">还没有历史版本。修改卡片后会自动留档。</p>';
        return;
      }
      dom.historyList.innerHTML = '';
      items.forEach(record => {
        const row = document.createElement('div');
        row.className = 'history-item';
        row.dataset.id = record.id;
        const size = Math.max(1, Math.round((record.data || '').length / 1024));
        row.innerHTML =
          '<div class="history-item__head">' +
            '<span class="history-item__time">' + escapeHtml(formatTime(record.createdAt)) + '</span>' +
            '<span class="history-item__reason">' + escapeHtml(record.reason || '编辑') + '</span>' +
            '<span class="history-item__meta">' + (record.cardCount || 0) + ' 张 · ' + size + ' KB</span>' +
            '<div class="history-item__actions">' +
              '<button type="button" class="btn btn--ghost" data-haction="preview">预览</button>' +
              '<button type="button" class="btn btn--ghost" data-haction="restore">恢复</button>' +
              '<button type="button" class="btn btn--danger-ghost" data-haction="delete">删除</button>' +
            '</div>' +
          '</div>';
        dom.historyList.appendChild(row);
      });
    } catch (err) {
      dom.historyList.innerHTML = '<p class="history-empty">历史版本读取失败：浏览器可能禁用了 IndexedDB。</p>';
      console.warn(err);
    }
  }

  function openHistory() {
    if (!historyAvailable()) {
      toast('当前浏览器不支持版本历史（IndexedDB 不可用）', 'error');
      return;
    }
    openDialog(dom.historyDialog);
    renderHistory();
  }

  function toggleHistoryPreview(row, record) {
    const existing = row.querySelector('.history-preview');
    if (existing) { existing.remove(); return; }
    const pre = document.createElement('div');
    pre.className = 'history-preview';
    pre.textContent = historySummary(record);
    row.appendChild(pre);
  }

  function restoreVersion(record) {
    confirmAction({
      title: '恢复到这个版本？',
      body: formatTime(record.createdAt) + ' · ' + (record.cardCount || 0) + ' 张卡片。当前内容会先自动存为一个版本。',
      okText: '恢复'
    }).then(ok => {
      if (!ok) return;
      queueSnapshot('恢复前', true);
      try {
        state.data = normalizeData(JSON.parse(record.data));
      } catch (e) {
        toast('版本数据损坏，无法恢复', 'error');
        return;
      }
      state.filter.q = '';
      dom.search.value = '';
      dom.searchClear.hidden = true;
      state.lastSnapshotAt = 0;
      saveNow();
      renderBoard();
      updateChrome();
      renderHistory();
      toast('已恢复到 ' + formatTime(record.createdAt));
    });
  }

  async function handleHistoryAction(action, id) {
    const items = await historyAll(state.data.project.id);
    const record = items.find(x => x.id === id);
    if (!record) return;
    if (action === 'restore') restoreVersion(record);
    else if (action === 'delete') {
      confirmAction({
        title: '删除这个历史版本？',
        body: formatDate(record.createdAt) + ' 的版本将被删除，不影响当前项目。',
        okText: '删除',
        danger: true
      }).then(ok => {
        if (!ok) return;
        historyDelete(id).then(() => { renderHistory(); toast('版本已删除'); });
      });
    }
  }

  /* ======================= 结构诊断 ======================= */
  function openStats() {
    renderStats();
    openDialog(dom.statsDialog);
  }

  function renderStats() {
    const type = state.data.project.type;
    const struct = structure();
    const items = storyCards();
    const total = items.length;
    const ideas = ideaCards().length;

    const perAct = struct.acts.map(act => ({
      id: act.id,
      title: act.title,
      count: act.beats.reduce((n, b) => n + (state.data.acts[act.id] && state.data.acts[act.id][b.id] || []).length, 0),
      max: act.beats.reduce((n, b) => n + b.max, 0),
      keyTotal: act.beats.filter(b => b.key).length,
      keyFilled: act.beats.filter(b => b.key && (state.data.acts[act.id] && state.data.acts[act.id][b.id] || []).length > 0).length
    }));

    const statusCount = { confirmed: 0, pending: 0, question: 0 };
    const emotionCount = { positive: 0, negative: 0, neutral: 0 };
    let conflictFilled = 0;
    items.forEach(({ card }) => {
      statusCount[card.status] = (statusCount[card.status] || 0) + 1;
      emotionCount[card.emotionalChange] = (emotionCount[card.emotionalChange] || 0) + 1;
      if (card.conflict.protagonist && card.conflict.goal && card.conflict.obstacle) conflictFilled++;
    });

    const keyBeats = allBeats().filter(b => b.key);
    const keyFilled = keyBeats.filter(b => (state.data.acts[b.act] && state.data.acts[b.act][b.id] || []).length > 0).length;
    const emptyKey = keyBeats.filter(b => !(state.data.acts[b.act] && state.data.acts[b.act][b.id] || []).length);
    const estimated = Math.round(total * struct.perCard);
    const targetMin = allBeats().reduce((n, b) => n + b.min, 0);
    const targetMax = allBeats().reduce((n, b) => n + b.max, 0);

    const maxAct = Math.max(1, ...perAct.map(a => a.count));
    const barsHtml = perAct.map(a =>
      '<div class="bar-row"><span>' + escapeHtml(a.title) + '</span><div class="bar"><i style="width:' + Math.round(a.count / maxAct * 100) + '%"></i></div><b>' + a.count + '</b></div>'
    ).join('');

    const stTotal = Math.max(1, total);
    const statusHtml =
      '<div class="status-split" aria-hidden="true">' +
        '<i class="s-confirmed" style="width:' + (statusCount.confirmed / stTotal * 100) + '%"></i>' +
        '<i class="s-pending" style="width:' + (statusCount.pending / stTotal * 100) + '%"></i>' +
        '<i class="s-question" style="width:' + (statusCount.question / stTotal * 100) + '%"></i>' +
      '</div>' +
      '<div class="status-legend"><span><i style="background:var(--ok)"></i>确认 ' + statusCount.confirmed + '</span>' +
      '<span><i style="background:var(--warn)"></i>保留 ' + statusCount.pending + '</span>' +
      '<span><i style="background:var(--danger)"></i>存疑 ' + statusCount.question + '</span></div>';

    const advice = [];
    if (total === 0) {
      advice.push({ level: 'warn', text: '还没有卡片。先从「开场画面」和「终场画面」各写一张，故事的骨架就立住了。' });
    } else {
      if (emptyKey.length) {
        advice.push({ level: 'bad', text: '关键节拍还空着：' + emptyKey.slice(0, 6).map(b => b.title).join('、') + (emptyKey.length > 6 ? ' 等' : '') + '。这些位置决定结构是否成立。' });
      } else {
        advice.push({ level: 'good', text: '关键节拍全部有卡片，结构骨架完整。' });
      }
      if (total < targetMin) advice.push({ level: 'warn', text: '卡片偏少（' + total + ' 张，建议 ' + targetMin + '–' + targetMax + ' 张），注意每一拍是否有足够的戏。' });
      else if (total > targetMax) advice.push({ level: 'warn', text: '卡片偏多（' + total + ' 张，建议 ' + targetMin + '–' + targetMax + ' 张），考虑合并重复功能的场景。' });
      else advice.push({ level: 'good', text: '卡片数量在推荐区间内（' + targetMin + '–' + targetMax + ' 张）。' });

      if (emotionCount.positive === 0 || emotionCount.negative === 0) {
        advice.push({ level: 'warn', text: '情感曲线几乎只有一个方向，考虑增加一次明确的转折。' });
      } else {
        advice.push({ level: 'good', text: '情感有上下起伏，曲线不是一条直线。' });
      }
      if (statusCount.question / total > 0.25) {
        advice.push({ level: 'warn', text: '存疑卡片超过四分之一，先集中把不确定的场景定下来，再往下写。' });
      }
      if (conflictFilled / total < 0.5) {
        advice.push({ level: 'warn', text: '过半卡片的「主人公 / 目标 / 障碍」没写全。不必每张都写，但关键场景值得补上。' });
      }
      const over = allBeats().filter(b => {
        const n = (state.data.acts[b.act] && state.data.acts[b.act][b.id] || []).length;
        return n > b.max;
      });
      if (over.length) {
        advice.push({ level: 'warn', text: over.slice(0, 3).map(b => b.title + '（' + (state.data.acts[b.act][b.id].length) + ' 张）').join('、') + ' 超过建议数量，检查是不是塞了太多功能。' });
      }
      const emptyActs = perAct.filter(a => a.count === 0);
      if (emptyActs.length) advice.push({ level: 'warn', text: emptyActs.map(a => a.title).join('、') + ' 还是空的。' });
    }
    if (ideas) advice.push({ level: 'warn', text: '灵感箱里还有 ' + ideas + ' 条点子，挑有用的放进节拍表。' });

    const adviceHtml = advice.map(a => '<li class="' + (a.level === 'good' ? 'is-good' : a.level === 'bad' ? 'is-bad' : 'is-warn') + '">' + escapeHtml(a.text) + '</li>').join('');

    const curveHtml = renderCurve(items);

    dom.statsBody.innerHTML =
      '<div class="stat-grid">' +
        '<div class="stat"><div class="stat__num">' + total + '<small>张</small></div><div class="stat__label">故事卡片</div></div>' +
        '<div class="stat"><div class="stat__num">' + keyFilled + '<small>/' + keyBeats.length + '</small></div><div class="stat__label">关键节拍覆盖</div></div>' +
        '<div class="stat"><div class="stat__num">' + (total ? Math.round(conflictFilled / total * 100) : 0) + '<small>%</small></div><div class="stat__label">冲突三要素完整</div></div>' +
        '<div class="stat"><div class="stat__num">' + estimated + '<small>分钟</small></div><div class="stat__label">粗估时长（按 ' + escapeHtml(TYPE_LABEL[type]) + '）</div></div>' +
      '</div>' +
      '<div class="stats-block"><h3>幕分布</h3><div class="bars">' + barsHtml + '</div></div>' +
      '<div class="stats-block"><h3>情感曲线</h3>' + curveHtml +
        '<div class="status-legend"><span>按故事顺序排列，共 ' + total + ' 张卡片</span></div></div>' +
      '<div class="stats-block"><h3>卡片标记</h3>' + statusHtml + '</div>' +
      '<div class="stats-block"><h3>结构建议</h3><ul class="advice">' + adviceHtml + '</ul></div>';
  }

  function renderCurve(items) {
    if (!items.length) return '<p class="list-empty">还没有卡片，暂时画不出情感曲线。</p>';
    const w = 600, h = 84, pad = 10;
    const stepX = items.length > 1 ? (w - pad * 2) / (items.length - 1) : 0;
    const val = c => c.emotionalChange === 'positive' ? 1 : c.emotionalChange === 'negative' ? -1 : 0;
    const yOf = v => h / 2 - v * 27;
    const pts = items.map((it, i) => [pad + i * stepX, yOf(val(it.card))]);
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
    const area = line + ' L' + pts[pts.length - 1][0].toFixed(1) + ' ' + (h / 2) + ' L' + pts[0][0].toFixed(1) + ' ' + (h / 2) + ' Z';
    const dots = pts.map(p => '<circle class="curve__dot" cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.4"/>').join('');
    return '<svg class="curve" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" role="img" aria-label="情感变化曲线">' +
      '<path class="curve__area" d="' + area + '"/>' +
      '<line class="curve__zero" x1="0" y1="' + (h / 2) + '" x2="' + w + '" y2="' + (h / 2) + '"/>' +
      '<path class="curve__line" d="' + line + '"/>' + dots + '</svg>';
  }

  /* ======================= 导出 ======================= */
  function download(text, filename, mime) {
    const blob = new Blob([text], { type: mime || 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  }

  function exportJSON() {
    const name = safeFileName(state.data.project.title) + '_' + new Date().toISOString().slice(0, 10) + '.json';
    download(JSON.stringify(state.data, null, 2), name, 'application/json');
    toast('已导出 JSON 备份');
  }

  function exportMarkdown() {
    const struct = structure();
    const lines = [];
    lines.push('# ' + state.data.project.title);
    lines.push('');
    lines.push('- 剧本类型：' + TYPE_LABEL[state.data.project.type]);
    lines.push('- 卡片数量：' + countStoryCards() + ' 张');
    lines.push('- 导出时间：' + formatDate(nowISO()));
    lines.push('');

    struct.acts.forEach(act => {
      const actCards = act.beats.reduce((n, b) => n + (state.data.acts[act.id] && state.data.acts[act.id][b.id] || []).length, 0);
      if (!actCards) return;
      lines.push('## ' + act.title);
      lines.push('');
      act.beats.forEach(beat => {
        const cards = state.data.acts[act.id] && state.data.acts[act.id][beat.id] || [];
        if (!cards.length) return;
        lines.push('### ' + beat.title + '（' + cards.length + ' 张）');
        lines.push('');
        cards.forEach(card => {
          const scene = card.location.place ? card.location.type + '. ' + card.location.place : '未标场景';
          const flag = card.status === 'question' ? ' ❓' : card.status === 'pending' ? ' ⏳' : '';
          lines.push('- **' + scene + '**' + flag + ' — ' + card.description.replace(/\n+/g, ' '));
          const conflict = [card.conflict.protagonist && '主人公：' + card.conflict.protagonist, card.conflict.goal && '目标：' + card.conflict.goal, card.conflict.obstacle && '障碍：' + card.conflict.obstacle].filter(Boolean);
          if (conflict.length) lines.push('  - 冲突 · ' + conflict.join('；'));
          if (card.emotionalChangeContent) lines.push('  - 情感 · ' + (EMOTION[card.emotionalChange] || EMOTION.neutral).label + '：' + card.emotionalChangeContent);
          if (card.tags && card.tags.length) lines.push('  - 标签 · ' + card.tags.join('、'));
        });
        lines.push('');
      });
    });

    if (ideaCards().length) {
      lines.push('## 灵感箱');
      lines.push('');
      ideaCards().forEach(card => {
        lines.push('- ' + card.description.replace(/\n+/g, ' '));
      });
      lines.push('');
    }

    download(lines.join('\n'), safeFileName(state.data.project.title) + '_大纲.md', 'text/markdown;charset=utf-8');
    toast('已导出 Markdown 大纲');
  }

  function csvCell(value) {
    const s = String(value == null ? '' : value);
    return '"' + s.replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
  }

  function exportCSV() {
    const rows = [['幕', '节拍', '状态', '场景类型', '场景', '剧情内容', '主人公', '目标', '障碍', '情感', '情感说明', '标签', '创建时间']];
    storyCards().forEach(({ card, act, beat }) => {
      const meta = beatMeta(act, beat);
      const actTitle = (acts().find(a => a.id === act) || {}).title || act;
      rows.push([
        actTitle,
        meta ? meta.title : beat,
        STATUS_LABEL[card.status] || card.status,
        card.location.type,
        card.location.place,
        card.description,
        card.conflict.protagonist,
        card.conflict.goal,
        card.conflict.obstacle,
        (EMOTION[card.emotionalChange] || EMOTION.neutral).label,
        card.emotionalChangeContent,
        (card.tags || []).join(' / '),
        card.createdAt
      ]);
    });
    const csv = '\ufeff' + rows.map(r => r.map(csvCell).join(',')).join('\r\n');
    download(csv, safeFileName(state.data.project.title) + '_卡片.csv', 'text/csv;charset=utf-8');
    toast('已导出 CSV 表格');
  }

  function exportPrint() {
    const wasFiltered = state.filter.q || state.filter.status !== 'all' || state.filter.act !== 'all';
    if (wasFiltered) {
      resetFilters();
      toast('已临时显示全部卡片，打印后可重新筛选');
    }
    updatePrintHead();
    setTimeout(() => window.print(), 120);
  }

  function updatePrintHead() {
    if (!dom.printHead) return;
    const total = countStoryCards();
    const keyBeats = allBeats().filter(b => b.key);
    const filled = keyBeats.filter(b => (state.data.acts[b.act] && state.data.acts[b.act][b.id] || []).length > 0).length;
    dom.printHead.innerHTML =
      '<h1>' + escapeHtml(state.data.project.title) + '</h1>' +
      '<p>' + escapeHtml(TYPE_LABEL[state.data.project.type]) + ' · ' + total + ' 张卡片 · 关键节拍 ' + filled + '/' + keyBeats.length + ' · ' + formatDate(nowISO()) + '</p>';
  }

  /* ======================= 导入 ======================= */
  function importFile(file) {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('文件过大（超过 5MB），可能不是本项目文件', 'error'); return; }
    const reader = new FileReader();
    reader.onload = e => {
      let raw;
      try { raw = JSON.parse(e.target.result); }
      catch (err) { toast('导入失败：不是有效的 JSON 文件', 'error'); return; }
      if (!raw || typeof raw !== 'object' || !raw.acts || !raw.project) {
        toast('导入失败：缺少 project / acts 字段，不像是卡片系统项目', 'error');
        return;
      }
      const data = normalizeData(raw);
      let count = 0;
      Object.keys(data.acts).forEach(a => {
        if (a === 'bucket') return;
        Object.keys(data.acts[a]).forEach(b => { count += data.acts[a][b].length; });
      });
      confirmAction({
        title: '导入「' + (data.project.title || '未命名') + '」？',
        body: '共 ' + count + ' 张卡片。当前项目会先自动备份到「我的项目」，导入后打开新项目。',
        okText: '导入'
      }).then(ok => {
        if (!ok) return;
        backupWorkspace();
        state.data = data;
        state.history.length = 0;
        state.future.length = 0;
        saveNow();
        queueSnapshot('导入项目', true);
        resetFilters();
        renderBoard();
        updateChrome();
        toast('项目已导入');
      });
    };
    reader.onerror = () => toast('读取文件失败', 'error');
    reader.readAsText(file);
  }

  /* ======================= 顶部 / 工具条 chrome ======================= */
  function renderTabs() {
    if (state.filter.act !== 'all' && !acts().some(a => a.id === state.filter.act)) {
      state.filter.act = 'all';
    }
    const total = countStoryCards();
    const html = ['<button type="button" role="tab" data-act="all" aria-selected="' + (state.filter.act === 'all') + '" class="' + (state.filter.act === 'all' ? 'is-active' : '') + '">全部 <b>' + total + '</b></button>'];
    acts().forEach(act => {
      const n = act.beats.reduce((sum, b) => sum + (state.data.acts[act.id] && state.data.acts[act.id][b.id] || []).length, 0);
      html.push('<button type="button" role="tab" data-act="' + act.id + '" aria-selected="' + (state.filter.act === act.id) + '" class="' + (state.filter.act === act.id ? 'is-active' : '') + '">' + escapeHtml(act.title) + ' <b>' + n + '</b></button>');
    });
    dom.actTabs.innerHTML = html.join('');
  }

  function updateChrome() {
    // 外部载入（打开 / 导入 / 新建）会让标题变化；此时若输入框仍在焦点上，
    // 先退出编辑，避免界面继续显示上一个项目的名字。
    if (document.activeElement === dom.titleInput && dom.titleInput.value !== state.data.project.title) {
      dom.titleInput.blur();
    }
    dom.titleInput.value = state.data.project.title;
    dom.typeSelect.value = state.data.project.type;
    renderTabs();
    updateCounts();
    applyFilter();
    updatePrintHead();
    if (dom.helpVersion) dom.helpVersion.textContent = '版本 ' + APP_VERSION + ' · 数据保存在本机浏览器';
  }

  function updateThemeButton() {
    const dark = document.documentElement.dataset.theme === 'dark';
    dom.themeBtn.setAttribute('aria-label', dark ? '切换到浅色模式' : '切换到深色模式');
    dom.themeBtn.title = dark ? '切换到浅色模式' : '切换到深色模式';
  }

  function syncThemeColor() {
    const meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', document.documentElement.dataset.theme === 'dark' ? '#15120e' : '#f4efe5');
  }

  function toggleTheme() {
    const dark = document.documentElement.dataset.theme === 'dark';
    const next = dark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem(K.theme, next); } catch (e) { /* noop */ }
    updateThemeButton();
    syncThemeColor();
  }

  /* ======================= 提示 ======================= */
  function toast(message, opts, timeout) {
    const options = typeof opts === 'string' ? { type: opts } : (opts || {});
    const el = document.createElement('div');
    el.className = 'toast' + (options.type === 'error' ? ' toast--error' : '');
    el.innerHTML = '<span class="toast__msg">' + escapeHtml(message) + '</span>';
    if (options.action) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'toast__action';
      btn.textContent = options.action.label;
      btn.addEventListener('click', () => {
        options.action.onClick();
        dismiss();
      });
      el.appendChild(btn);
    }
    dom.toasts.appendChild(el);
    while (dom.toasts.children.length > 3) dom.toasts.firstElementChild.remove();

    const duration = options.duration || timeout || 3000;
    let timer = setTimeout(dismiss, duration);
    function dismiss() {
      clearTimeout(timer);
      el.classList.add('is-out');
      setTimeout(() => el.remove(), 220);
    }
    el.addEventListener('pointerenter', () => clearTimeout(timer));
    el.addEventListener('pointerleave', () => { timer = setTimeout(dismiss, 1600); });
  }

  /* ======================= 事件绑定 ======================= */
  function cacheDom() {
    const map = {
      board: '#board', actTabs: '#act-tabs', statusFilter: '#status-filter', search: '#search',
      searchClear: '#search-clear', resultCount: '#result-count', statusSummary: '#status-summary',
      titleInput: '#project-title', saveState: '#save-state', typeSelect: '#script-type',
      btnNew: '#btn-new', btnOpen: '#btn-open', btnImport: '#btn-import', btnStats: '#btn-stats',
      btnHelp: '#btn-help', themeBtn: '#btn-theme', exportMenu: '#export-menu', btnAdd: '#btn-add',
      btnMore: '#btn-more', moreMenu: '#more-menu', btnHistory: '#btn-history',
      outline: '#outline', viewSwitch: '#view-switch',
      historyDialog: '#dlg-history', historyList: '#history-list',
      btnSnapshotNow: '#btn-snapshot-now', btnClearHistory: '#btn-clear-history',
      cardTags: '#card-tags',
      btnIdeas: '#btn-ideas', btnTrash: '#btn-trash', ideasCount: '#ideas-count',
      trashCount: '#trash-count', trashDrop: '#trash-drop', fab: '#fab', toasts: '#toasts',
      fileInput: '#file-input', versionLabel: '#version-label',
      editorDialog: '#dlg-editor', quickDialog: '#dlg-quick', projectsDialog: '#dlg-projects',
      statsDialog: '#dlg-stats', trashDialog: '#dlg-trash', ideasDialog: '#dlg-ideas',
      helpDialog: '#dlg-help', confirmDialog: '#dlg-confirm', cardForm: '#card-form',
      editorTitle: '#editor-title', cardAct: '#card-act', cardBeat: '#card-beat',
      cardStatus: '#card-status', sceneType: '#scene-type', scenePlace: '#scene-place',
      cardDesc: '#card-desc', descCount: '#desc-count', conflictWho: '#conflict-who',
      conflictGoal: '#conflict-goal', conflictBlock: '#conflict-block', emotionType: '#emotion-type',
      emotionNote: '#emotion-note', editorIdeaNote: '#editor-idea-note',
      btnDeleteCard: '#btn-delete-card', btnDuplicateCard: '#btn-duplicate-card',
      quickActs: '#quick-acts', quickBeats: '#quick-beats', quickDesc: '#quick-desc',
      quickHint: '#quick-hint', quickAddMore: '#quick-add-more', quickAddSave: '#quick-add-save',
      projectList: '#project-list', btnSaveAs: '#btn-save-as', statsBody: '#stats-body',
      trashList: '#trash-list', btnEmptyTrash: '#btn-empty-trash', ideaForm: '#idea-form',
      ideaInput: '#idea-input', ideaList: '#idea-list', confirmTitle: '#confirm-title',
      confirmBody: '#confirm-body', confirmOk: '#confirm-ok', helpVersion: '#help-version'
    };
    Object.keys(map).forEach(key => { dom[key] = $(map[key]); });
    dom.printHead = $('#print-head');
  }

  function bindEvents() {
    /* 顶栏 */
    dom.titleInput.addEventListener('input', () => {
      state.data.project.title = clampText(dom.titleInput.value, LIMITS.title);
      scheduleSave();
      updatePrintHead();
    });
    dom.titleInput.addEventListener('blur', () => {
      if (!dom.titleInput.value.trim()) {
        state.data.project.title = '未命名剧本';
        dom.titleInput.value = '未命名剧本';
      }
      scheduleSave();
    });
    dom.btnMore.addEventListener('click', e => {
      e.stopPropagation();
      const open = dom.moreMenu.hidden;
      dom.moreMenu.hidden = !open;
      dom.btnMore.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    dom.moreMenu.addEventListener('click', e => {
      const btn = e.target.closest('button[data-more]');
      if (!btn) return;
      dom.moreMenu.hidden = true;
      dom.btnMore.setAttribute('aria-expanded', 'false');
      const action = btn.dataset.more;
      if (action === 'new') newProject();
      else if (action === 'import') dom.fileInput.click();
      else if (action === 'stats') openStats();
      else if (action === 'history') openHistory();
      else if (action === 'help') openDialog(dom.helpDialog);
    });
    document.addEventListener('click', e => {
      if (!dom.moreMenu.hidden && !dom.moreMenu.contains(e.target) && !dom.btnMore.contains(e.target)) {
        dom.moreMenu.hidden = true;
        dom.btnMore.setAttribute('aria-expanded', 'false');
      }
    });

    dom.btnNew.addEventListener('click', newProject);
    dom.btnOpen.addEventListener('click', () => { renderProjects(); openDialog(dom.projectsDialog); });
    dom.btnImport.addEventListener('click', () => dom.fileInput.click());
    dom.fileInput.addEventListener('change', () => {
      const file = dom.fileInput.files && dom.fileInput.files[0];
      importFile(file);
      dom.fileInput.value = '';
    });
    dom.btnStats.addEventListener('click', openStats);
    dom.btnHelp.addEventListener('click', () => openDialog(dom.helpDialog));
    dom.themeBtn.addEventListener('click', toggleTheme);
    dom.typeSelect.addEventListener('change', () => changeType(dom.typeSelect.value));
    dom.btnHistory.addEventListener('click', openHistory);

    dom.viewSwitch.addEventListener('click', e => {
      const btn = e.target.closest('button[data-view]');
      if (!btn) return;
      setView(btn.dataset.view);
    });

    dom.outline.addEventListener('click', e => {
      const head = e.target.closest('.outline-act__head');
      if (head) {
        const actId = head.dataset.act;
        if (state.collapsedActs.has(actId)) state.collapsedActs.delete(actId);
        else state.collapsedActs.add(actId);
        const section = head.closest('.outline-act');
        section.classList.toggle('is-collapsed', state.collapsedActs.has(actId));
        head.setAttribute('aria-expanded', state.collapsedActs.has(actId) ? 'false' : 'true');
        return;
      }
      const add = e.target.closest('.outline-beat__add');
      if (add) {
        openEditor({ act: add.dataset.act, beat: add.dataset.beat });
        return;
      }
      const card = e.target.closest('.outline-card');
      if (card) openEditor({ id: card.dataset.id });
    });
    dom.outline.addEventListener('keydown', e => {
      const card = e.target.closest('.outline-card');
      if (!card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openEditor({ id: card.dataset.id });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteCardWithConfirm(card.dataset.id);
      }
    });

    dom.historyList.addEventListener('click', async e => {
      const btn = e.target.closest('button[data-haction]');
      if (!btn) return;
      const row = btn.closest('.history-item');
      const id = row.dataset.id;
      const action = btn.dataset.haction;
      if (action === 'preview') {
        try {
          const items = await historyAll(state.data.project.id);
          const record = items.find(x => x.id === id);
          if (record) toggleHistoryPreview(row, record);
        } catch (err) { toast('预览失败', 'error'); }
        return;
      }
      handleHistoryAction(action, id);
    });
    dom.btnSnapshotNow.addEventListener('click', () => {
      queueSnapshot('手动保存', true).then(ok => {
        toast(ok ? '已保存当前版本' : '版本保存失败', ok ? 'info' : 'error');
        renderHistory();
      });
    });
    dom.btnClearHistory.addEventListener('click', () => {
      confirmAction({
        title: '清空版本历史？',
        body: '只会删除历史版本，不影响当前项目。此操作不可恢复。',
        okText: '清空',
        danger: true
      }).then(ok => {
        if (!ok) return;
        historyClear(state.data.project.id).then(() => { renderHistory(); toast('历史已清空'); });
      });
    });

    dom.exportMenu.addEventListener('click', e => {
      const btn = e.target.closest('button[data-export]');
      if (!btn) return;
      dom.exportMenu.open = false;
      const kind = btn.dataset.export;
      if (kind === 'json') exportJSON();
      else if (kind === 'md') exportMarkdown();
      else if (kind === 'csv') exportCSV();
      else if (kind === 'print') exportPrint();
    });
    document.addEventListener('click', e => {
      if (dom.exportMenu.open && !dom.exportMenu.contains(e.target)) dom.exportMenu.open = false;
    });

    /* 筛选 */
    dom.actTabs.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      state.filter.act = btn.dataset.act;
      renderTabs();
      applyFilter();
    });
    dom.statusFilter.addEventListener('click', e => {
      const btn = e.target.closest('button[data-status]');
      if (!btn) return;
      state.filter.status = btn.dataset.status;
      $$('button', dom.statusFilter).forEach(b => {
        const active = b === btn;
        b.classList.toggle('is-active', active);
        b.setAttribute('aria-pressed', active ? 'true' : 'false');
      });
      applyFilter();
    });
    const debouncedSearch = debounce(() => applyFilter(), 120);
    dom.search.addEventListener('input', () => {
      state.filter.q = dom.search.value;
      dom.searchClear.hidden = !dom.search.value;
      debouncedSearch();
    });
    dom.searchClear.addEventListener('click', () => {
      dom.search.value = '';
      state.filter.q = '';
      dom.searchClear.hidden = true;
      applyFilter();
      dom.search.focus();
    });
    dom.search.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        dom.search.value = '';
        state.filter.q = '';
        dom.searchClear.hidden = true;
        applyFilter();
        dom.search.blur();
      }
    });

    /* 板上的事件委托 */
    dom.board.addEventListener('click', e => {
      const more = e.target.closest('.card__more');
      if (more) {
        e.stopPropagation();
        openCardMenu(more, more.closest('.card'));
        return;
      }
      const add = e.target.closest('.beat__add');
      if (add) {
        openEditor({ act: add.dataset.act, beat: add.dataset.beat });
        return;
      }
      const hint = e.target.closest('.beat__hint');
      if (hint) { hint.classList.toggle('is-open'); return; }
      const card = e.target.closest('.card');
      if (card && !state.dragging && Date.now() - (state.lastDragEnd || 0) > 280) {
        openEditor({ id: card.dataset.id });
      }
    });
    dom.board.addEventListener('dblclick', e => {
      if (e.target.closest('.card')) return;
      const beat = e.target.closest('.beat');
      if (beat) openEditor({ act: beat.dataset.act, beat: beat.dataset.beat });
    });
    dom.board.addEventListener('keydown', e => {
      const card = e.target.closest('.card');
      if (!card) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openEditor({ id: card.dataset.id });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteCardWithConfirm(card.dataset.id);
      }
    });

    /* 浮动按钮 */
    dom.btnAdd.addEventListener('click', () => openQuick());
    dom.btnIdeas.addEventListener('click', () => { renderIdeas(); openDialog(dom.ideasDialog, '#idea-input'); });
    dom.btnTrash.addEventListener('click', () => { renderTrash(); openDialog(dom.trashDialog); });

    /* 编辑器 */
    dom.cardForm.addEventListener('submit', saveEditor);
    dom.cardAct.addEventListener('change', () => fillBeatSelect(dom.cardAct.value, null));
    dom.cardDesc.addEventListener('input', () => { updateDescCount(); autoGrow(dom.cardDesc); });
    dom.btnDeleteCard.addEventListener('click', deleteFromEditor);
    dom.btnDuplicateCard.addEventListener('click', duplicateFromEditor);
    dom.cardStatus.addEventListener('click', e => {
      const btn = e.target.closest('button[data-status]');
      if (btn) setSegmented(dom.cardStatus, 'status', btn.dataset.status);
    });
    dom.emotionType.addEventListener('click', e => {
      const btn = e.target.closest('button[data-value]');
      if (btn) setSegmented(dom.emotionType, 'value', btn.dataset.value);
    });
    dom.editorDialog.addEventListener('cancel', e => {
      e.preventDefault();
      tryCloseEditor();
    });

    /* 快速添加 */
    dom.quickActs.addEventListener('click', e => {
      const btn = e.target.closest('button[data-act]');
      if (!btn) return;
      state.quick.act = btn.dataset.act;
      state.quick.beat = (beatsOf(state.quick.act)[0] || {}).id;
      renderQuickChips();
    });
    dom.quickBeats.addEventListener('click', e => {
      const btn = e.target.closest('button[data-beat]');
      if (!btn) return;
      state.quick.beat = btn.dataset.beat;
      renderQuickChips();
    });
    dom.quickAddSave.addEventListener('click', () => saveQuick(false));
    dom.quickAddMore.addEventListener('click', () => saveQuick(true));
    dom.quickDesc.addEventListener('keydown', e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); saveQuick(false); }
    });

    /* 项目 */
    dom.projectList.addEventListener('click', e => {
      const btn = e.target.closest('button[data-paction]');
      if (!btn) return;
      const row = btn.closest('.project-item');
      const key = row.dataset.key;
      const action = btn.dataset.paction;
      if (action === 'open') openProject(key);
      else if (action === 'rename') startRename(row, key);
      else if (action === 'delete') deleteSnapshot(key);
    });
    dom.btnSaveAs.addEventListener('click', saveAsProject);

    /* 垃圾桶 */
    dom.trashList.addEventListener('click', e => {
      const btn = e.target.closest('button[data-taction]');
      if (!btn) return;
      const id = btn.closest('.trash-item').dataset.id;
      if (btn.dataset.taction === 'restore') restoreTrash(id);
      else purgeTrash(id);
    });
    dom.btnEmptyTrash.addEventListener('click', () => {
      if (!state.trash.length) { toast('垃圾桶已经是空的'); return; }
      confirmAction({
        title: '清空垃圾桶？',
        body: '这 ' + state.trash.length + ' 张卡片将被彻底删除，无法恢复。',
        okText: '彻底删除',
        danger: true
      }).then(ok => {
        if (!ok) return;
        state.trash = [];
        persistTrash();
        renderTrash();
        updateChrome();
        toast('垃圾桶已清空');
      });
    });

    /* 灵感箱 */
    dom.ideaForm.addEventListener('submit', e => {
      e.preventDefault();
      addIdea(dom.ideaInput.value);
      dom.ideaInput.value = '';
    });
    dom.ideaList.addEventListener('click', e => {
      const btn = e.target.closest('button[data-iaction]');
      if (!btn) return;
      const id = btn.closest('.idea-item').dataset.id;
      const action = btn.dataset.iaction;
      if (action === 'promote') openEditor({ ideaId: id });
      else if (action === 'delete') deleteIdea(id);
    });

    /* 弹窗关闭按钮 */
    $$('dialog').forEach(dialog => {
      $$('[data-close]', dialog).forEach(btn => {
        btn.addEventListener('click', () => attemptClose(dialog));
      });
      dialog.addEventListener('cancel', e => {
        if (dialog === dom.editorDialog) { e.preventDefault(); tryCloseEditor(); }
      });
    });

    /* 全局键盘 */
    document.addEventListener('keydown', e => {
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault();
        exportJSON();
        return;
      }
      if (meta && e.key.toLowerCase() === 'z' && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo(); else undo();
        return;
      }
      if (meta && e.key.toLowerCase() === 'y' && !typing) {
        e.preventDefault();
        redo();
        return;
      }
      if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (document.querySelector('dialog[open]')) {
        if (e.key === '?' && e.target.closest('#dlg-help')) return;
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        dom.search.focus();
        dom.search.select();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openQuick();
      } else if (e.key === '?') {
        e.preventDefault();
        openDialog(dom.helpDialog);
      }
    });

    /* 保存兜底 */
    window.addEventListener('beforeunload', () => {
      if (state.saveTimer) saveNow();
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && state.saveTimer) saveNow();
    });
    window.addEventListener('resize', () => {
      if (!dom.moreMenu.hidden) {
        dom.moreMenu.hidden = true;
        dom.btnMore.setAttribute('aria-expanded', 'false');
      }
    });
    window.addEventListener('storage', e => {
      if (e.key === K.current && e.newValue) setSaveState('external');
      if (e.key === K.trash) loadTrash();
    });
  }

  /* ======================= 启动 ======================= */
  function init() {
    cacheDom();
    const rawText = localStorage.getItem(K.current);
    state.data = loadCurrent();
    // 老版本数据结构在读取时已迁移，这里静默写回一次，避免下次重复迁移
    if (rawText) {
      try {
        const migrated = JSON.stringify(state.data);
        if (migrated !== rawText) localStorage.setItem(K.current, migrated);
      } catch (e) { /* noop */ }
    }
    loadTrash();
    try {
      const savedView = localStorage.getItem(K.view);
      state.view = savedView === 'outline' ? 'outline' : 'board';
    } catch (e) { state.view = 'board'; }
    bindEvents();
    renderBoard();
    updateChrome();
    setView(state.view, false);
    updateThemeButton();
    syncThemeColor();
    dom.versionLabel.textContent = 'v' + APP_VERSION;
    dom.helpVersion.textContent = '版本 ' + APP_VERSION + ' · 数据保存在本机浏览器';

    // 首次访问：打一声招呼，但不打扰
    if (!localStorage.getItem(K.seen)) {
      try { localStorage.setItem(K.seen, '1'); } catch (e) { /* noop */ }
      setTimeout(() => toast('数据只存在本机，记得定期导出备份。', { duration: 5200 }), 900);
    }

    // 首次打开时留一个初始版本；之后由 mutate 自动留档
    if (historyAvailable()) {
      historyAll(state.data.project.id)
        .then(list => {
          if (list.length) return;
          return queueSnapshot('初始版本', true).then(() => { state.lastSnapshotAt = 0; });
        })
        .catch(() => { /* IndexedDB 不可用时静默 */ });
    }

    // 定期把 pending 的保存落盘
    window.addEventListener('pagehide', () => { if (state.saveTimer) saveNow(); });

    registerServiceWorker();
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* 离线缓存失败不影响使用 */ });
    });
  }

  // 暴露少量调试接口，方便排查数据问题
  window.CardWrite = {
    version: APP_VERSION,
    exportJSON,
    getData: () => JSON.parse(JSON.stringify(state.data)),
    reset: () => { state.data = blankData('tv-hour', '未命名剧本'); saveNow(); renderBoard(); updateChrome(); }
  };

  init();
})();
