// 卡片数据存储
let scriptCards = {
    project: {
        title: '未命名剧本',
        type: 'tv-hour', // 默认为一小时剧集
        lastSaved: new Date().toISOString()
    },
    acts: {}
};

// 常量和配置
const APP_VERSION = '0.8.3';
const AUTO_SAVE_INTERVAL = 60000; // 自动保存间隔，单位毫秒（1分钟）
let autoSaveTimer = null;
let lastAutoSaveTime = 0;

// 节拍提示文本
const beatHints = {
    'opening': '故事开始于一个有震撼力、意境或者吸引人的画面，奠定全片的整体基调。',
    'theme': '在开场不久的一场对话或动作，暗示了全片的主题。',
    'setup': '铺垫部分必须点出主人公的欲望，只有认清人物的欲望，才能形成后续的戏剧张力。',
    'catalyst': '推动是被动的（一个电话，一个邮件，床下的尸体，捉奸在床）。',
    'debate': '主人公发生的行为和反馈，让他开始犹豫和思考，到底哪一个才是更好的道路？',
    'act2-tp': '第二幕转折点必须是主动坚决的（主人公主动行为，走向没法回头的道路）。',
    'fun': '游戏时间是要比拼想象力的，必须要新颖好玩酷炫，展现全片最轻松/好玩/酷炫/悬疑/大场面的段落。',
    'bstory': 'B故事呼应的是主角的内心/情感/人物关系的额外展现。',
    'midpoint': '此时发生的一个事件，气氛骤然紧张起来，故事回到了正题。',
    'villain': '坏蛋逼近必须要展现主人公的不断努力，然而魔高一丈，必须是对抗，形成张力。',
    'allislost': '最终主人公所有努力都失败了，他陷入了绝望。',
    'darknight': '灵魂黑夜与一无所有是主角情感最低点，展现绝望和内心挣扎。',
    'act3-tp': '第三幕转折点的反转，要从B故事里面不经意提到线索找到伏笔，这样反转才有力量。',
    'finale': '高明的结局，必须呼应到主题的呈现以及争论。如果主人公的行为没有代价，那么这个行为就没有戏剧意义。',
    'finalimage': '故事结束于一个有震撼力、意境或者吸引人的画面，并与开场画面呼应。'
};

// 不同剧本类型的结构定义
const scriptStructures = {
    'movie': {
        // 电影结构：三幕
        acts: {
            1: {
                title: '第一幕',
                beats: [
                    { id: 'opening', title: '开场画面', recommended: '1个卡片', type: 'single-beat' },
                    { id: 'theme', title: '主题呈现', recommended: '1个卡片', type: 'setup' },
                    { id: 'setup', title: '铺垫', recommended: '3-5个卡片', type: 'setup' },
                    { id: 'catalyst', title: '催化剂', recommended: '1个卡片', type: 'single-beat' },
                    { id: 'debate', title: '争论', recommended: '2-4个卡片', type: 'regular' }
                ]
            },
            2: {
                title: '第二幕（上）',
                beats: [
                    { id: 'act2-tp', title: '第二幕转折点', recommended: '1个卡片', type: 'single-beat' },
                    { id: 'fun', title: '游戏时间', recommended: '4-6个卡片', type: 'fun-games' },
                    { id: 'bstory', title: 'B故事', recommended: '3-5个卡片', type: 'regular' },
                    { id: 'midpoint', title: '中点', recommended: '1个卡片', type: 'single-beat' }
                ]
            },
            3: {
                title: '第二幕（下）',
                beats: [
                    { id: 'villain', title: '坏蛋逼近', recommended: '4-6个卡片', type: 'villain' },
                    { id: 'allislost', title: '一无所有', recommended: '1个卡片', type: 'single-beat' },
                    { id: 'darknight', title: '灵魂黑夜', recommended: '2-3个卡片', type: 'dark-night' }
                ]
            },
            4: {
                title: '第三幕',
                beats: [
                    { id: 'act3-tp', title: '第三幕转折点', recommended: '1个卡片', type: 'single-beat' },
                    { id: 'finale', title: '结局', recommended: '3-5个卡片', type: 'finale' },
                    { id: 'finalimage', title: '终场画面', recommended: '1个卡片', type: 'single-beat' }
                ]
            }
        }
    },
    'tv-hour': {
        // 一小时剧集结构：四幕
        acts: {
            1: {
                title: '第一幕',
                beats: [
                    { id: 'opening', title: '开场画面', recommended: '1个卡片', type: 'single-beat' },
                    { id: 'theme', title: '主题呈现', recommended: '1个卡片', type: 'setup' },
                    { id: 'setup', title: '铺垫', recommended: '1-4个卡片', type: 'setup' },
                    { id: 'catalyst', title: '推动', recommended: '1-2个卡片', type: 'single-beat' },
                    { id: 'debate', title: '争论', recommended: '1-4个卡片', type: 'regular' },
                    { id: 'act2-tp', title: '第二幕转折点', recommended: '1个卡片', type: 'single-beat' }
                ]
            },
            2: {
                title: '第二幕',
                beats: [
                    { id: 'fun', title: '游戏时间', recommended: '2-3个卡片', type: 'fun-games' },
                    { id: 'bstory', title: 'B故事', recommended: '1-3个卡片', type: 'regular' },
                    { id: 'midpoint', title: '中点', recommended: '1个卡片', type: 'single-beat' }
                ]
            },
            3: {
                title: '第三幕',
                beats: [
                    { id: 'villain', title: '坏蛋逼近', recommended: '3-6个卡片', type: 'villain' },
                    { id: 'allislost', title: '一无所有', recommended: '1个卡片', type: 'single-beat' },
                    { id: 'darknight', title: '灵魂黑夜', recommended: '1-4个卡片', type: 'dark-night' },
                    { id: 'act3-tp', title: '第三幕转折点', recommended: '1个卡片', type: 'single-beat' }
                ]
            },
            4: {
                title: '第四幕',
                beats: [
                    { id: 'finale', title: '结局', recommended: '2-6个卡片', type: 'finale' },
                    { id: 'finalimage', title: '终场画面', recommended: '1个卡片', type: 'single-beat' }
                ]
            }
        }
    },
    'tv-half': {
        // 半小时喜剧结构：三幕
        acts: {
            1: {
                title: '第一幕',
                beats: [
                    { id: 'opening', title: '开场画面', recommended: '1个卡片', type: 'single-beat' },
                    { id: 'theme', title: '主题呈现', recommended: '1个卡片', type: 'setup' },
                    { id: 'setup', title: '铺垫', recommended: '1个卡片', type: 'setup' },
                    { id: 'catalyst', title: '推动', recommended: '1个卡片', type: 'single-beat' },
                    { id: 'debate', title: '争论', recommended: '1个卡片', type: 'regular' },
                    { id: 'act2-tp', title: '第二幕转折点', recommended: '1个卡片', type: 'single-beat' }
                ]
            },
            2: {
                title: '第二幕',
                beats: [
                    { id: 'fun', title: '游戏时间', recommended: '1个卡片', type: 'fun-games' },
                    { id: 'bstory', title: 'B故事', recommended: '1个卡片', type: 'regular' },
                    { id: 'midpoint', title: '中点', recommended: '1个卡片', type: 'single-beat' },
                    { id: 'villain', title: '坏蛋逼近', recommended: '1个卡片', type: 'villain' },
                    { id: 'allislost', title: '一无所有', recommended: '1个卡片', type: 'single-beat' }
                ]
            },
            3: {
                title: '第三幕',
                beats: [
                    { id: 'darknight', title: '灵魂黑夜', recommended: '1个卡片', type: 'dark-night' },
                    { id: 'act3-tp', title: '第三幕转折点', recommended: '1个卡片', type: 'single-beat' },
                    { id: 'finale', title: '结局', recommended: '2个卡片', type: 'finale' },
                    { id: 'finalimage', title: '终场画面', recommended: '1个卡片', type: 'single-beat' }
                ]
            }
        }
    }
};

// DOM元素引用
const scriptBoard = document.getElementById('script-board');
const scriptTypeSelector = document.getElementById('script-type');
const cardModal = document.getElementById('card-modal');
const statsModal = document.getElementById('stats-modal');
const filenameModal = document.getElementById('filename-modal');
const importModal = document.getElementById('import-modal');
const feedbackModal = document.getElementById('feedback-modal');
const cardForm = document.getElementById('card-form');
const filenameForm = document.getElementById('filename-form');
const importForm = document.getElementById('import-form');
const feedbackForm = document.getElementById('feedback-form');
const projectTitle = document.getElementById('project-title');
const loadProjectModal = document.getElementById('load-project-modal');
const projectList = document.getElementById('project-list');

// Sortable实例集合
const sortableInstances = [];

// 初始化应用
function initApp() {
    // 尝试从本地存储加载数据
    loadFromLocalStorage();
    
    // 设置项目类型选择器的值
    scriptTypeSelector.value = scriptCards.project.type;
    
    // 生成剧本结构
    generateScriptStructure();
    
    // 更新UI
    renderAllCards();
    updateCardCounts();
    
    // 设置项目标题
    projectTitle.value = scriptCards.project.title;
    
    // 添加事件监听器
    setupEventListeners();
    
    // 检查节拍槽状态
    updateBeatSlotStatus();
    
    // 初始化快速添加功能
    initQuickAdd();
    
    // 添加iPad触控优化
    initTouchOptimizations();
    
    // 初始化自动保存
    initAutoSave();
    
    // 初始化反馈功能
    initFeedback();
    
    // 初始化垃圾桶和灵感箱功能
    initTrashBin();
    initInspirationBox();


}

// 初始化垃圾桶功能
function initTrashBin() {
    const trashBinBtn = document.getElementById('trash-bin-btn');
    if (!trashBinBtn) return;
    
    trashBinBtn.addEventListener('click', function() {
        // 可以添加垃圾桶功能，例如显示最近删除的卡片等
        showToast('垃圾桶功能将在后续版本开放');
    });
}

// 初始化灵感箱功能
function initInspirationBox() {
    const inspirationBtn = document.getElementById('inspiration-btn');
    if (!inspirationBtn) return;
    
    inspirationBtn.addEventListener('click', function() {
        // 可以添加灵感箱功能，例如随机提示、创意生成等
        showToast('灵感箱功能将在后续版本开放');
    });
}

// 初始化自动保存功能
function initAutoSave() {
    // 清除之前的定时器
    if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
    }
    
    // 设置新的定时器
    autoSaveTimer = setInterval(function() {
        // 只在数据有变化时保存
        if (scriptCards.project.lastSaved !== lastAutoSaveTime) {
            saveToLocalStorage();
            lastAutoSaveTime = scriptCards.project.lastSaved;
            showAutoSaveIndicator();
        }
    }, AUTO_SAVE_INTERVAL);
    
    // 监听页面卸载事件，确保保存最新数据
    window.addEventListener('beforeunload', function() {
        saveToLocalStorage();
    });
}

// 显示自动保存指示器
function showAutoSaveIndicator() {
    const indicator = document.getElementById('autosave-indicator');
    if (!indicator) return;
    
    indicator.classList.add('show');
    
    // 3秒后隐藏
    setTimeout(function() {
        indicator.classList.remove('show');
    }, 3000);
}

// 初始化反馈功能
function initFeedback() {
    const feedbackBtn = document.getElementById('feedback-btn');
    const feedbackModal = document.getElementById('feedback-modal');
    
    if (!feedbackBtn || !feedbackModal) {
        console.error('反馈按钮或模态框未找到');
        return;
    }
    
    // 显示反馈模态框
    feedbackBtn.addEventListener('click', function() {
        console.log('反馈按钮被点击');
        feedbackModal.style.display = 'block';
    });
    
    // 提交反馈
    if (feedbackForm) {
        feedbackForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('feedback-email').value;
            const content = document.getElementById('feedback-content').value;
            
            // 这里可以添加发送反馈到服务器的代码
            // 示例：通过邮件链接发送
            const subject = encodeURIComponent('编剧卡片系统反馈');
            const body = encodeURIComponent(
                `版本: ${APP_VERSION}\n` +
                `反馈内容: ${content}\n` +
                `联系邮箱: ${email || '未提供'}`
            );
            
            window.open(`mailto:yuanzhe2023@hotmail.com?subject=${subject}&body=${body}`);
            
            // 重置表单并关闭模态框
            feedbackForm.reset();
            feedbackModal.style.display = 'none';
            
            // 显示成功消息
            showToast('感谢您的反馈！');
        });
    }
}

// 从本地存储加载数据
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('scriptCards');
    if (savedData) {
        try {
            scriptCards = JSON.parse(savedData);
            
            // 确保类型属性存在
            if (!scriptCards.project.type) {
                scriptCards.project.type = 'tv-hour';
            }
            
            // 确保数据结构完整
            ensureDataStructure();
            
            // 迁移旧的卡片状态字段
            migrateCardStatus();
        } catch (e) {
            console.error('加载数据出错:', e);
        }
    } else {
        // 初始化空的剧本结构
        initEmptyScriptStructure();
    }
}

// 迁移旧的卡片类型到新的卡片标记
function migrateCardStatus() {
    for (const actId in scriptCards.acts) {
        for (const beatId in scriptCards.acts[actId]) {
            const cards = scriptCards.acts[actId][beatId];
            if (cards && Array.isArray(cards)) {
                cards.forEach(card => {
                    // 如果没有status字段，根据旧的type字段设置默认值
                    if (!card.status) {
                        card.status = 'confirmed'; // 默认为"确认"
                    }
                    
                    // 确保有emotionalChangeContent字段
                    if (!card.emotionalChangeContent) {
                        card.emotionalChangeContent = '';
                    }
                });
            }
        }
    }
}

// 初始化空的剧本结构
function initEmptyScriptStructure() {
    const type = scriptCards.project.type;
    scriptCards.acts = {};
    
    // 为每一幕创建空的节拍容器
    const structure = scriptStructures[type];
    for (const actId in structure.acts) {
        scriptCards.acts[actId] = {};
        
        // 为每个节拍创建空数组
        structure.acts[actId].beats.forEach(beat => {
            scriptCards.acts[actId][beat.id] = [];
        });
    }
    
    // 创建创意桶
    if (!scriptCards.acts.bucket) {
        scriptCards.acts.bucket = { ideas: [] };
    }
}

// 确保数据结构完整
function ensureDataStructure() {
    const type = scriptCards.project.type;
    
    // 为新的剧本类型初始化结构
    if (!scriptCards.acts) {
        scriptCards.acts = {};
    }
    
    // 确保bucket存在
    if (!scriptCards.acts.bucket) {
        scriptCards.acts.bucket = { ideas: [] };
    }
    
    // 为每一幕和节拍确保数据结构存在
    const structure = scriptStructures[type];
    for (const actId in structure.acts) {
        if (!scriptCards.acts[actId]) {
            scriptCards.acts[actId] = {};
        }
        
        // 为每个节拍创建数组（如果不存在）
        structure.acts[actId].beats.forEach(beat => {
            if (!scriptCards.acts[actId][beat.id]) {
                scriptCards.acts[actId][beat.id] = [];
            }
        });
    }
}

// 生成剧本结构HTML
function generateScriptStructure() {
    const type = scriptCards.project.type;
    const structure = scriptStructures[type];
    
    let html = '';
    
    // 为每一幕生成HTML
    for (const actId in structure.acts) {
        const act = structure.acts[actId];
        
        html += `
        <div class="act-row" data-act="${actId}">
            <div class="act-header">
                <h2>${act.title}</h2>
                <span class="card-count">0 张卡片</span>
            </div>
            <div class="beat-slots">
        `;
        
        // 为每个节拍生成HTML
        act.beats.forEach(beat => {
            html += `
                <div class="beat-slot" data-act="${actId}" data-beat="${beat.id}">
                    <h3>${beat.title}</h3>
                    <div class="beat-recommended">${beat.recommended}</div>
                    <div class="beat-hint">${beatHints[beat.id] || ''}</div>
                    <div class="card-list" id="act-${actId}-${beat.id}"></div>
                    <button class="add-card-btn" data-act="${actId}" data-beat="${beat.id}">+</button>
                </div>
            `;
        });
        
        html += `
            </div>
        </div>
        `;
    }
    
    // 更新脚本板
    scriptBoard.innerHTML = html;
}

// 保存到本地存储
function saveToLocalStorage() {
    scriptCards.project.lastSaved = new Date().toISOString();
    localStorage.setItem('scriptCards', JSON.stringify(scriptCards));
}

// 设置事件监听器
function setupEventListeners() {
    // 剧本类型选择器
    scriptTypeSelector.addEventListener('change', function() {
        if (confirm('切换剧本类型将会清空当前卡片内容，确定要继续吗？')) {
            changeScriptType(this.value);
        } else {
            this.value = scriptCards.project.type; // 恢复之前的选择
        }
    });
    
    // 添加卡片按钮
    document.querySelectorAll('.add-card-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const act = this.getAttribute('data-act');
            const beat = this.getAttribute('data-beat');
            openCardModal(null, act, beat);
        });
    });
    
    // 保存项目按钮
    document.getElementById('save-project').addEventListener('click', function() {
        scriptCards.project.title = projectTitle.value || '未命名剧本';
        showFilenameModal();
    });
    
    // 加载项目按钮
    document.getElementById('load-project').addEventListener('click', function() {
    // 先检查是否有未保存的更改
    const hasUnsavedChanges = checkUnsavedChanges();
    if (hasUnsavedChanges) {
        if (!confirm('当前项目有未保存的更改，继续加载其他项目会丢失这些更改。确定要继续吗？')) {
            return;
        }
    }
    
    // 显示项目加载模态框
        showProjectLoadModal();
    });
    
    // 导入项目按钮
    document.getElementById('import-project').addEventListener('click', function() {
        importModal.style.display = 'block';
    });
    
    // 文件名表单提交
    filenameForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const filename = document.getElementById('filename-input').value || scriptCards.project.title || '未命名剧本';
        saveProjectToFile(filename);
        filenameModal.style.display = 'none';
    });
    
    // 导入表单提交
    importForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const fileInput = document.getElementById('import-file');
        if (fileInput.files.length > 0) {
            const file = fileInput.files[0];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    scriptCards = data;
                    
                    // 确保类型属性存在
                    if (!scriptCards.project.type) {
                        scriptCards.project.type = 'tv-hour';
                    }
                    
                    // 更新类型选择器
                    scriptTypeSelector.value = scriptCards.project.type;
                    
                    // 迁移旧的卡片类型
                    migrateCardStatus();
                    
                    // 重新生成结构并确保数据完整
                    generateScriptStructure();
                    ensureDataStructure();
                    
                    projectTitle.value = scriptCards.project.title;
                    renderAllCards();
                    updateCardCounts();
                    updateBeatSlotStatus();
                    importModal.style.display = 'none';
                    alert('项目已导入!');
                } catch (error) {
                    alert('导入失败: 文件格式不正确');
                    console.error('导入错误:', error);
                }
            };
            
            reader.readAsText(file);
        }
    });
    
   // 模态框关闭按钮
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        cardModal.style.display = 'none';
        statsModal.style.display = 'none';
        filenameModal.style.display = 'none';
        importModal.style.display = 'none';
        loadProjectModal.style.display = 'none';
        if (feedbackModal) feedbackModal.style.display = 'none';
    });


// 卡片状态选择器
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('status-option') || e.target.parentElement.classList.contains('status-option')) {
        const option = e.target.classList.contains('status-option') ? e.target : e.target.parentElement;
        
        // 更新选中状态
        document.querySelectorAll('.status-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        option.classList.add('selected');
        
        // 更新隐藏输入值
        document.getElementById('card-status').value = option.getAttribute('data-status');
    }
});

// 冲突选项卡交互
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('conflict-tab')) {
        // 移除所有active类
        document.querySelectorAll('.conflict-tab').forEach(t => {
            t.classList.remove('active');
        });
        document.querySelectorAll('.conflict-input').forEach(input => {
            input.classList.remove('active');
        });
        
        // 设置当前选项卡为active
        e.target.classList.add('active');
        const field = e.target.getAttribute('data-field');
        document.getElementById(field).classList.add('active');
    }
});

// 情感按钮交互
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('emotion-btn')) {
        e.preventDefault(); // 防止表单提交
        
        // 更新选中状态
        document.querySelectorAll('.emotion-btn').forEach(b => {
            b.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // 更新隐藏输入值
        document.getElementById('emotional-change-type').value = e.target.getAttribute('data-value');
    }
});

// 快速添加状态选项
document.addEventListener('click', function(e) {
    if (e.target.classList.contains('quick-status-option')) {
        // 更新选中状态
        document.querySelectorAll('.quick-status-option').forEach(opt => {
            opt.classList.remove('selected');
        });
        e.target.classList.add('selected');
        
        // 更新隐藏输入值
        document.getElementById('quick-add-status').value = e.target.getAttribute('data-status');
    }
});


    // 更多选项按钮
const moreOptionsBtn = document.getElementById('more-options');
const moreOptionsMenu = document.getElementById('more-options-menu');
if (moreOptionsBtn && moreOptionsMenu) {
    moreOptionsBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        moreOptionsMenu.classList.toggle('show');
    });
    
    // 点击其他地方时关闭菜单
    document.addEventListener('click', function(e) {
        if (moreOptionsMenu.classList.contains('show') && !moreOptionsMenu.contains(e.target) && e.target !== moreOptionsBtn) {
            moreOptionsMenu.classList.remove('show');
        }
    });
}

// 深色模式切换
const themeToggleBtn = document.getElementById('toggle-theme');
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        moreOptionsMenu.classList.remove('show');
        
        // 你可以保存用户的主题偏好到本地存储
        if (document.body.classList.contains('dark-theme')) {
            localStorage.setItem('theme', 'dark');
            this.textContent = '浅色模式';
        } else {
            localStorage.setItem('theme', 'light');
            this.textContent = '深色模式';
        }
    });
    
    // 检查用户之前的主题偏好
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggleBtn.textContent = '浅色模式';
    }
}


// 帮助和关于按钮
const helpBtn = document.getElementById('help-button');
if (helpBtn) {
    helpBtn.addEventListener('click', function() {
        moreOptionsMenu.classList.remove('show');
        alert('帮助文档功能将在后续版本开放');
    });
}

const aboutBtn = document.getElementById('about-button');
if (aboutBtn) {
    aboutBtn.addEventListener('click', function() {
        moreOptionsMenu.classList.remove('show');
        alert('老袁编剧卡片系统 ' + APP_VERSION + '\n开发者: 老袁\n联系: yuanzhe2023@hotmail.com');
    });
}
});

    // 保存卡片表单
    cardForm.addEventListener('submit', function(e) {
        e.preventDefault();
        saveCard();
    });
    
    // 复制卡片按钮
    document.getElementById('duplicate-card').addEventListener('click', duplicateCard);
    
    // 删除卡片按钮
    document.getElementById('delete-card').addEventListener('click', deleteCard);
    
    // 显示统计按钮
    document.getElementById('show-stats').addEventListener('click', showStats);
    
    // 导出大纲按钮
    document.getElementById('export-outline').addEventListener('click', exportOutline);
    
   // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
    if (e.target === cardModal) cardModal.style.display = 'none';
    if (e.target === statsModal) statsModal.style.display = 'none';
    if (e.target === filenameModal) filenameModal.style.display = 'none';
    if (e.target === importModal) importModal.style.display = 'none';
    if (e.target === loadProjectModal) loadProjectModal.style.display = 'none';
    if (feedbackModal && e.target === feedbackModal) feedbackModal.style.display = 'none';
    });
    
    // 视图筛选按钮
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有按钮的active类
            document.querySelectorAll('.view-btn').forEach(b => {
                b.classList.remove('active');
            });
            
            // 添加当前按钮的active类
            this.classList.add('active');
            
            // 获取视图ID
            const viewId = this.id;
            
            // 切换视图
            filterView(viewId);
        });
    });



}

// 初始化快速添加卡片功能
function initQuickAdd() {
    const quickAddBtn = document.getElementById('quick-add-btn');
    const quickAddMenu = document.getElementById('quick-add-menu');
    
    if (!quickAddBtn || !quickAddMenu) {
        console.error('快速添加按钮或菜单未找到');
        return;
    }
    
    const closeBtn = quickAddMenu.querySelector('.close-quick-add');
    
    // 打开快速添加菜单
    quickAddBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        // 生成幕和节拍选择器
        generateActBeatSelectors();
        quickAddMenu.style.display = 'block';
        
        // 清空输入框
        document.getElementById('quick-add-description').value = '';
        
        // 自动聚焦到描述输入框
        setTimeout(() => {
            document.getElementById('quick-add-description').focus();
        }, 100);
    });
    
    // 关闭菜单按钮
    if (closeBtn) {
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            quickAddMenu.style.display = 'none';
        });
    }
    
    // 点击其他区域关闭菜单
    document.addEventListener('click', function(e) {
        if (quickAddMenu.style.display === 'block' && 
            !quickAddMenu.contains(e.target) && 
            e.target !== quickAddBtn) {
            quickAddMenu.style.display = 'none';
        }
    });
    
    // 防止菜单内点击事件冒泡到文档
    quickAddMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // 添加卡片按钮
    const addCardBtn = document.getElementById('quick-add-save');
    if (addCardBtn) {
        addCardBtn.addEventListener('click', function() {
            saveQuickCard(false);
        });
    } else {
        console.error('快速添加保存按钮未找到');
    }
    
    // 添加并创建新卡片按钮
    const addAndNewBtn = document.getElementById('quick-add-save-and-new');
    if (addAndNewBtn) {
        addAndNewBtn.addEventListener('click', function() {
            saveQuickCard(true);
        });
    } else {
        console.error('添加并创建新卡片按钮未找到');
    }
    
    // 添加键盘快捷键
    document.addEventListener('keydown', function(e) {
        // Esc键关闭菜单
        if (e.key === 'Escape') {
            if (quickAddMenu.style.display === 'block') {
                quickAddMenu.style.display = 'none';
            }
            if (cardModal.style.display === 'block') {
                if (confirm('关闭编辑器？未保存的更改将丢失。')) {
                    cardModal.style.display = 'none';
                }
            }
        }
        
        // Ctrl+Enter或Command+Enter保存
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            if (cardModal.style.display === 'block') {
                document.getElementById('save-card').click();
            } else if (quickAddMenu.style.display === 'block') {
                document.getElementById('quick-add-save').click();
            }
        }
    });
}


// 初始化状态选项
function initStatusOptions() {
    const statusOptions = document.querySelectorAll('.status-option');
    const statusInput = document.getElementById('quick-add-status');
    
    if (!statusOptions.length || !statusInput) return;
    
    // 清除所有选中状态
    statusOptions.forEach(option => {
        option.classList.remove('selected');
    });
    
    // 默认选中第一个选项
    statusOptions[0].classList.add('selected');
    statusInput.value = statusOptions[0].getAttribute('data-status');
    
    // 添加点击事件
    statusOptions.forEach(option => {
        option.addEventListener('click', function() {
            // 更新选中状态
            statusOptions.forEach(opt => opt.classList.remove('selected'));
            this.classList.add('selected');
            
            // 更新隐藏输入值
            statusInput.value = this.getAttribute('data-status');
            
            // 添加动画效果以提供更明显的反馈
            this.classList.add('status-selected-animation');
            setTimeout(() => {
                this.classList.remove('status-selected-animation');
            }, 300);
        });
    });
}

// iPad触控优化
function initTouchOptimizations() {
    // 检测是否是触控设备
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTouchDevice) {
        document.body.classList.add('touch-device');
        
        // 增强触控区域
        const clickableElements = document.querySelectorAll('button, .card, .beat-slot h3');
        clickableElements.forEach(el => {
            el.classList.add('touch-enhanced');
        });
        
        // 添加手势支持
        if (window.GestureEvent) { // 仅在支持手势的设备上启用
            enablePinchZoom();
        }
    }
}

// 启用捏合缩放（用于iPad查看大量卡片）
function enablePinchZoom() {
    const board = document.getElementById('script-board');
    if (!board) return;
    
    let initialScale = 1;
    let currentScale = 1;
    
    // 处理手势事件
    board.addEventListener('gesturestart', function(e) {
        e.preventDefault();
        initialScale = currentScale;
    });
    
    board.addEventListener('gesturechange', function(e) {
        e.preventDefault();
        currentScale = Math.min(Math.max(initialScale * e.scale, 0.5), 2);
        board.style.transform = `scale(${currentScale})`;
    });
    
    board.addEventListener('gestureend', function(e) {
        e.preventDefault();
        // 可以添加回弹动画
    });
}

// 筛选视图
function filterView(viewId) {
    const board = document.getElementById('script-board');
    const actRows = document.querySelectorAll('.act-row');
    
    if (viewId === 'view-all') {
        // 显示所有幕
        board.classList.remove('filtered-view');
        actRows.forEach(row => {
            row.classList.remove('hidden');
        });
    } else {
        // 添加筛选视图类
        board.classList.add('filtered-view');
        
        // 确定要显示的幕
        let actToShow;
        
        if (viewId === 'view-bucket') {
            actToShow = 'bucket';
        } else {
            const actNumber = viewId.split('-')[2];
            actToShow = actNumber;
        }
        
        // 隐藏所有幕
        actRows.forEach(row => {
            row.classList.add('hidden');
        });
        
        // 显示指定的幕
        const targetRow = document.querySelector(`.act-row[data-act="${actToShow}"]`);
        if (targetRow) {
            targetRow.classList.remove('hidden');
        }
    }
    
    // 重新初始化拖拽
    setTimeout(initSortable, 100);
}

// 更新节拍槽状态
function updateBeatSlotStatus() {
    const beatSlots = document.querySelectorAll('.beat-slot');
    
    beatSlots.forEach(slot => {
        const act = slot.getAttribute('data-act');
        const beat = slot.getAttribute('data-beat');
        
        // 检查该节拍是否有卡片
        if (scriptCards.acts[act] && 
            scriptCards.acts[act][beat] && 
            scriptCards.acts[act][beat].length > 0) {
            slot.classList.add('has-cards');
        } else {
            slot.classList.remove('has-cards');
        }
    });
}

// 切换剧本类型
function changeScriptType(newType) {
    // 更新剧本类型
    scriptCards.project.type = newType;
    
    // 重置卡片数据
    initEmptyScriptStructure();
    
    // 重新生成结构
    generateScriptStructure();
    
    // 重新渲染
    renderAllCards();
    updateCardCounts();
    updateBeatSlotStatus();
    
    // 保存到本地
    saveToLocalStorage();
    
    // 重新初始化拖拽
    initSortable();
}

// 显示文件名输入模态框
function showFilenameModal() {
    const filenameInput = document.getElementById('filename-input');
    filenameInput.value = scriptCards.project.title || '未命名剧本';
    filenameModal.style.display = 'block';
}

// 保存项目到文件
function saveProjectToFile(filename) {
    // 先更新项目标题和保存时间
    scriptCards.project.title = projectTitle.value || filename;
    scriptCards.project.lastSaved = new Date().toISOString();
    
    // 保存到本地存储
    saveToLocalStorage();
    
    // 创建文件并下载
    const dataStr = JSON.stringify(scriptCards, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${filename}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    alert('项目已保存到文件!');
}


// 初始化拖拽功能
function initSortable() {
    // 先销毁所有现有的Sortable实例
    sortableInstances.forEach(instance => {
        instance.destroy();
    });
    sortableInstances.length = 0;
    
    // 获取垃圾桶元素
    const trashBin = document.getElementById('drag-trash-bin');
    
    // 获取所有卡片容器
    const cardLists = document.querySelectorAll('.card-list');
    
    // 对每个容器初始化Sortable
    cardLists.forEach(list => {
        // 如果是展开状态，跳过（由专门的函数处理）
        if (list.hasAttribute('data-expanded')) return;
        
        const act = list.closest('.beat-slot').getAttribute('data-act');
        const beat = list.closest('.beat-slot').getAttribute('data-beat');
        
        const sortable = new Sortable(list, {
            group: 'cards',
            animation: 150, // 启用动画并调整时长
            easing: "cubic-bezier(1, 0, 0, 1)", // 使用更流畅的缓动函数
            delay: 150, // 触摸设备上的延迟启动
            delayOnTouchOnly: true, // 仅在触摸时应用延迟
            touchStartThreshold: 5, // 触摸阈值，防止意外拖动
            
            // 视觉样式类
            ghostClass: 'sortable-ghost',
            chosenClass: 'sortable-chosen',
            dragClass: 'sortable-drag',
            
            // 过滤器
            filter: '.card-stack',
            
            // 开始拖拽
            onStart: function(evt) {
                // 显示垃圾桶
                if (trashBin) {
                    document.querySelector('.floating-menu').style.display = 'none';
                    document.getElementById('quick-add-btn').style.display = 'none';
                    
                    // 添加过渡动画显示垃圾桶
                    trashBin.style.display = 'flex';
                    setTimeout(() => {
                        trashBin.classList.add('visible');
                    }, 10);
                    
                    // 添加拖拽中的样式
                    evt.item.classList.add('is-dragging');
                }
                
                // 初始化垃圾桶
                initTrashBinTarget();
                
                // 高亮所有可放置区域
                document.querySelectorAll('.card-list').forEach(list => {
                    list.classList.add('drop-target');
                });
                
                // 触觉反馈（如果设备支持）
                if (navigator.vibrate) {
                    navigator.vibrate(30);
                }
            },
            
            // 拖拽过程中
            onMove: function(evt, originalEvent) {
                // 高亮当前目标
                document.querySelectorAll('.card-list').forEach(list => {
                    list.classList.remove('active-drop-target');
                });
                
                if (evt.to) {
                    evt.to.classList.add('active-drop-target');
                }
                
                // 垃圾桶检测
                if (trashBin) {
                    // 检测是否在垃圾桶上方
                    const touchOrMouse = originalEvent.touches ? 
                                        originalEvent.touches[0] : originalEvent;
                    const trashRect = trashBin.getBoundingClientRect();
                    
                    if (touchOrMouse.clientX >= trashRect.left && 
                        touchOrMouse.clientX <= trashRect.right && 
                        touchOrMouse.clientY >= trashRect.top && 
                        touchOrMouse.clientY <= trashRect.bottom) {
                        trashBin.classList.add('drag-over');
                    } else {
                        trashBin.classList.remove('drag-over');
                    }
                }
            },
            
            // 结束拖拽
            onEnd: function(evt) {
                // 恢复UI元素
                if (trashBin) {
                    trashBin.classList.remove('visible');
                    trashBin.classList.remove('drag-over');
                    
                    // 使用延迟隐藏垃圾桶，以便动画完成
                    setTimeout(() => {
                        trashBin.style.display = 'none';
                        document.querySelector('.floating-menu').style.display = 'flex';
                        document.getElementById('quick-add-btn').style.display = 'flex';
                    }, 300);
                    
                    evt.item.classList.remove('is-dragging');
                }
                
                // 移除所有高亮
                document.querySelectorAll('.card-list').forEach(list => {
                    list.classList.remove('drop-target');
                    list.classList.remove('active-drop-target');
                });
                
                // 如果是卡片堆栈，忽略
                if (evt.item.classList.contains('card-stack')) return;
                
                const cardId = evt.item.getAttribute('data-id');
                const fromAct = evt.from.closest('.beat-slot').getAttribute('data-act');
                const fromBeat = evt.from.closest('.beat-slot').getAttribute('data-beat');
                
                // 检查是否拖到垃圾桶
                if (evt.to.id === 'trash-bin-target') {
                    // 删除卡片处理逻辑
                    scriptCards.acts[fromAct][fromBeat] = scriptCards.acts[fromAct][fromBeat].filter(card => card.id !== cardId);
                    
                    saveToLocalStorage();
                    updateCardCounts();
                    updateBeatSlotStatus();
                    
                    // 显示删除动画
                    evt.item.classList.add('card-deleted');
                    
                    // 等待动画完成后再更新UI
                    setTimeout(() => {
                        renderActBeatCards(fromAct, fromBeat);
                        showToast('卡片已删除', 'success');
                    }, 300);
                    
                    // 触觉反馈（删除操作）
                    if (navigator.vibrate) {
                        navigator.vibrate([30, 30, 30]);
                    }
                    
                    return;
                }
                
                // 正常的卡片移动逻辑
                const toAct = evt.to.closest('.beat-slot').getAttribute('data-act');
                const toBeat = evt.to.closest('.beat-slot').getAttribute('data-beat');
                
                // 位置没变则不处理
                if (fromAct === toAct && fromBeat === toBeat && evt.oldIndex === evt.newIndex) {
                    return;
                }
                
                // 处理卡片移动
                const cardIndex = scriptCards.acts[fromAct][fromBeat].findIndex(card => card.id === cardId);
                if (cardIndex === -1) return;
                
                const card = scriptCards.acts[fromAct][fromBeat][cardIndex];
                scriptCards.acts[fromAct][fromBeat].splice(cardIndex, 1);
                scriptCards.acts[toAct][toBeat].splice(evt.newIndex, 0, card);
                
                saveToLocalStorage();
                updateCardCounts();
                updateBeatSlotStatus();
                
                // 触觉反馈（成功移动）
                if (navigator.vibrate) {
                    navigator.vibrate(50);
                }
                
                // 更新UI
                renderActBeatCards(fromAct, fromBeat);
                if (fromAct !== toAct || fromBeat !== toBeat) {
                    renderActBeatCards(toAct, toBeat);
                    
                    // 显示移动成功消息
                    const toBeatTitle = getBeatTitle(toBeat);
                    showToast(`卡片已移动到 ${toAct === 'bucket' ? '创意桶' : `第${toAct}幕 - ${toBeatTitle}`}`, 'success');
                }
            }
        });
        
        sortableInstances.push(sortable);
    });
}

// 获取节拍标题 - 新增辅助函数
function getBeatTitle(beatId) {
    const type = scriptCards.project.type;
    const structure = scriptStructures[type];
    
    // 遍历所有幕和节拍
    for (const actId in structure.acts) {
        const beatObj = structure.acts[actId].beats.find(b => b.id === beatId);
        if (beatObj) {
            return beatObj.title;
        }
    }
    
    return beatId; // 如果找不到，返回ID
}

// 高亮所有可放置区域 - 新增函数
function highlightDropTargets() {
    document.querySelectorAll('.card-list').forEach(list => {
        list.classList.add('drop-target');
    });
    
    document.querySelectorAll('.beat-slot').forEach(slot => {
        slot.classList.add('drop-target');
    });
}

// 清除所有高亮 - 新增函数
function clearDropTargets() {
    document.querySelectorAll('.card-list').forEach(list => {
        list.classList.remove('drop-target');
        list.classList.remove('active-drop-target');
    });
    
    document.querySelectorAll('.beat-slot').forEach(slot => {
        slot.classList.remove('drop-target');
        slot.classList.remove('active-drop-target');
    });
}

// 清除当前活动高亮 - 新增函数
function clearActiveDropTarget() {
    document.querySelectorAll('.card-list.active-drop-target').forEach(el => {
        el.classList.remove('active-drop-target');
    });
    
    document.querySelectorAll('.beat-slot.active-drop-target').forEach(el => {
        el.classList.remove('active-drop-target');
    });
}

// 获取节拍标题 - 新增辅助函数
function getBeatTitle(beatId) {
    const type = scriptCards.project.type;
    const structure = scriptStructures[type];
    
    // 遍历所有幕和节拍
    for (const actId in structure.acts) {
        const beatObj = structure.acts[actId].beats.find(b => b.id === beatId);
        if (beatObj) {
            return beatObj.title;
        }
    }
    
    return beatId; // 如果找不到，返回ID
}

// 初始化垃圾桶拖拽目标
function initTrashBinTarget() {
    const trashBin = document.getElementById('drag-trash-bin');
    if (!trashBin) return;
    
    // 检查是否已经初始化
    if (document.getElementById('trash-bin-target')) return;
    
    // 创建一个隐藏的拖拽目标元素
    const trashTarget = document.createElement('div');
    trashTarget.id = 'trash-bin-target';
    trashTarget.style.display = 'none';
    trashBin.appendChild(trashTarget);
    
    // 初始化Sortable
    const trashSortable = new Sortable(trashTarget, {
        group: 'cards',
        sort: false,
        animation: 150
    });
    
    sortableInstances.push(trashSortable);
    
    // 添加拖拽进入和离开的事件处理
    trashBin.addEventListener('dragover', function(e) {
        this.classList.add('drag-over');
    });
    
    trashBin.addEventListener('dragleave', function(e) {
        this.classList.remove('drag-over');
    });
    
    // 添加触摸事件处理
    trashBin.addEventListener('touchmove', function(e) {
        const touch = e.touches[0];
        const trashRect = this.getBoundingClientRect();
        
        // 检查触摸位置是否在垃圾桶上
        if (touch.clientX >= trashRect.left && touch.clientX <= trashRect.right &&
            touch.clientY >= trashRect.top && touch.clientY <= trashRect.bottom) {
            this.classList.add('drag-over');
        } else {
            this.classList.remove('drag-over');
        }
    }, { passive: true });
}



// 获取所有已保存项目
function getAllSavedProjects() {
    const projects = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // 检查两种可能的前缀
        if (key === 'scriptCards' || key.startsWith('scriptCards_')) {
            const projectName = key === 'scriptCards' ? '默认项目' : key.replace('scriptCards_', '');
            projects.push(projectName);
        }
    }
    return projects;
}

// 加载项目
function loadProject(name) {
    try {
        // 处理默认项目情况
        const storageKey = name === '默认项目' ? 'scriptCards' : 'scriptCards_' + name;
        const data = localStorage.getItem(storageKey);
        
        if (!data) {
            throw new Error('项目数据不存在');
        }
        
        // 解析项目数据
        scriptCards = JSON.parse(data);
        
        // 确保类型属性存在
        if (!scriptCards.project.type) {
            scriptCards.project.type = 'tv-hour';
        }
        
        // 更新类型选择器
        scriptTypeSelector.value = scriptCards.project.type;
        
        // 迁移旧的卡片类型
        migrateCardStatus();
        
        // 重新生成结构并确保数据完整
        generateScriptStructure();
        ensureDataStructure();
        
        // 更新UI
        projectTitle.value = scriptCards.project.title || name;
        renderAllCards();
        updateCardCounts();
        updateBeatSlotStatus();
        
        showToast(`项目 "${name}" 已成功加载`);
    } catch (e) {
        console.error('加载项目出错:', e);
        
        // 提供更具体的错误提示
        if (e.message.includes('JSON')) {
            alert('加载项目失败：项目数据格式不正确');
        } else if (e.message.includes('不存在')) {
            alert('加载项目失败：项目数据不存在或已被删除');
        } else {
            alert('加载项目失败：' + e.message);
        }
    }
}

// 检查是否有未保存的更改
function checkUnsavedChanges() {
    // 如果上一次保存的时间戳与当前内存中的不同，说明有更改未保存
    const savedData = localStorage.getItem('scriptCards');
    if (!savedData) return false;
    
    try {
        const savedCards = JSON.parse(savedData);
        return savedCards.project.lastSaved !== scriptCards.project.lastSaved;
    } catch (e) {
        return false;
    }
}

// 显示项目加载模态框
function showProjectLoadModal() {
    // 加载项目列表
    loadProjectList();
    
    // 显示模态框
    loadProjectModal.style.display = 'block';
    
    // 添加刷新按钮事件
    document.getElementById('refresh-project-list').addEventListener('click', loadProjectList);
}

// 加载项目列表
function loadProjectList() {
    const projects = getAllSavedProjectsWithDetails();
    
    // 清空现有列表
    projectList.innerHTML = '';
    
    if (projects.length === 0) {
        projectList.innerHTML = '<div class="no-projects">没有找到已保存的项目</div>';
        return;
    }
    
    // 当前项目的键名
    const currentProjectKey = 'scriptCards'; // 假设当前项目就是默认项目
    
    // 添加项目到列表
    projects.forEach(project => {
        const projectItem = document.createElement('div');
        projectItem.className = 'project-item';
        if (project.key === currentProjectKey) {
            projectItem.classList.add('current');
        }
        
        projectItem.innerHTML = `
            <div class="project-name">${project.name}</div>
            <div class="project-date">${new Date(project.lastSaved).toLocaleString()}</div>
            <div class="project-actions">
                <button class="project-action-btn load-btn" data-project="${project.name}">加载</button>
                <button class="project-action-btn rename-btn" data-project="${project.name}">重命名</button>
                <button class="project-action-btn delete-btn" data-project="${project.name}">删除</button>
            </div>
        `;
        
        projectList.appendChild(projectItem);
    });
    
    // 添加加载、重命名和删除按钮的事件监听
    document.querySelectorAll('.load-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const projectName = this.getAttribute('data-project');
            loadProject(projectName);
            loadProjectModal.style.display = 'none';
        });
    });
    
    document.querySelectorAll('.rename-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const projectName = this.getAttribute('data-project');
            renameProject(projectName);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const projectName = this.getAttribute('data-project');
            deleteProject(projectName);
        });
    });
}

// 获取所有已保存项目及其详细信息
function getAllSavedProjectsWithDetails() {
    const projects = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        // 检查两种可能的前缀
        if (key === 'scriptCards' || key.startsWith('scriptCards_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                const projectName = key === 'scriptCards' ? '默认项目' : key.replace('scriptCards_', '');
                
                projects.push({
                    key: key,
                    name: projectName,
                    title: data.project.title || projectName,
                    type: data.project.type || 'tv-hour',
                    lastSaved: data.project.lastSaved || new Date().toISOString(),
                    cardCount: countCards(data)
                });
            } catch (e) {
                console.error('解析项目数据出错:', e);
                // 即使解析出错，也添加基本信息
                const projectName = key === 'scriptCards' ? '默认项目' : key.replace('scriptCards_', '');
                projects.push({
                    key: key,
                    name: projectName,
                    lastSaved: new Date().toISOString(),
                    error: true
                });
            }
        }
    }
    
    // 按最后保存时间排序，最新的在前面
    return projects.sort((a, b) => new Date(b.lastSaved) - new Date(a.lastSaved));
}

// 计算项目中的卡片总数
function countCards(data) {
    let count = 0;
    if (data.acts) {
        for (const actId in data.acts) {
            for (const beatId in data.acts[actId]) {
                if (Array.isArray(data.acts[actId][beatId])) {
                    count += data.acts[actId][beatId].length;
                }
            }
        }
    }
    return count;
}

// 重命名项目
function renameProject(oldName) {
    const newName = prompt(`请输入新的项目名称 (当前: ${oldName}):`);
    if (!newName || newName === oldName) return;
    
    // 检查新名称是否已存在
    const projects = getAllSavedProjects();
    if (projects.includes(newName)) {
        alert('该项目名称已存在，请使用其他名称');
        return;
    }
    
    try {
        // 获取旧项目数据
        const oldKey = oldName === '默认项目' ? 'scriptCards' : 'scriptCards_' + oldName;
        const projectData = localStorage.getItem(oldKey);
        
        if (!projectData) {
            alert('项目数据不存在');
            return;
        }
        
        // 创建新项目
        const newKey = 'scriptCards_' + newName;
        localStorage.setItem(newKey, projectData);
        
        // 如果不是默认项目，则删除旧项目
        if (oldName !== '默认项目') {
            localStorage.removeItem(oldKey);
        }
        
        // 更新项目列表
        loadProjectList();
        showToast(`项目 "${oldName}" 已重命名为 "${newName}"`);
    } catch (e) {
        console.error('重命名项目出错:', e);
        alert('重命名项目时出错');
    }
}

// 删除项目
function deleteProject(name) {
    if (name === '默认项目') {
        alert('默认项目不能删除');
        return;
    }
    
    if (!confirm(`确定要删除项目 "${name}" 吗？此操作不可恢复。`)) {
        return;
    }
    
    try {
        const key = 'scriptCards_' + name;
        localStorage.removeItem(key);
        
        // 更新项目列表
        loadProjectList();
        showToast(`项目 "${name}" 已删除`);
    } catch (e) {
        console.error('删除项目出错:', e);
        alert('删除项目时出错');
    }
}

// 打开卡片编辑模态框
function openCardModal(cardId, act, beat) {
    const form = document.getElementById('card-form');
    form.reset();
    
    document.getElementById('card-act').value = act;
    document.getElementById('card-beat').value = beat;
    
    // 重置所有状态选择器
    document.querySelectorAll('.status-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    // 重置冲突选项卡
    document.querySelectorAll('.conflict-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.conflict-input').forEach(input => {
        input.classList.remove('active');
    });
    document.querySelector('.conflict-tab[data-field="protagonist"]').classList.add('active');
    document.getElementById('protagonist').classList.add('active');
    
    // 重置情感按钮
    document.querySelectorAll('.emotion-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.emotion-btn[data-value="positive"]').classList.add('active');
    
    if (cardId) {
        // 编辑现有卡片
        const card = findCardById(cardId, act, beat);
        if (card) {
            document.getElementById('card-id').value = card.id;
            
            // 设置卡片状态
            const status = card.status || 'confirmed';
            document.getElementById('card-status').value = status;
            document.querySelector(`.status-option[data-status="${status}"]`).classList.add('selected');
            
            // 设置场景位置
            document.getElementById('scene-location-type').value = card.location.type;
            document.getElementById('scene-location').value = card.location.place;
            
            // 设置场景描述
            document.getElementById('scene-description').value = card.description;
            
            // 设置冲突
            document.getElementById('protagonist').value = card.conflict.protagonist;
            document.getElementById('goal').value = card.conflict.goal;
            document.getElementById('obstacle').value = card.conflict.obstacle;
            
            // 设置情感变化
            const emotionalChange = card.emotionalChange || 'positive';
            document.getElementById('emotional-change-type').value = emotionalChange;
            document.querySelector(`.emotion-btn[data-value="${emotionalChange}"]`).classList.add('active');
            document.getElementById('emotional-change-content').value = card.emotionalChangeContent || '';
        }
    } else {
        // 新卡片
        document.getElementById('card-id').value = generateId();
        
        // 默认选中"确认"状态
        document.getElementById('card-status').value = 'confirmed';
        document.querySelector('.status-option[data-status="confirmed"]').classList.add('selected');
        
        // 默认选中"正向"情感变化
        document.getElementById('emotional-change-type').value = 'positive';
        document.querySelector('.emotion-btn[data-value="positive"]').classList.add('active');
        
        // 如果是从特定节拍添加，填充相应的提示文本
        if (beat && beatHints[beat]) {
            document.getElementById('scene-description').placeholder = beatHints[beat];
        }
    }
    
    cardModal.style.display = 'block';
    
    // 自动聚焦到场景位置
    setTimeout(() => {
        document.getElementById('scene-location').focus();
    }, 100);
}
// 查找卡片
function findCardById(id, act, beat) {
    return scriptCards.acts[act][beat].find(card => card.id === id);
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 生成幕和节拍选择器
function generateActBeatSelectors() {
    const selectorContainer = document.querySelector('.act-beat-selector');
    if (!selectorContainer) return;
    
    const type = scriptCards.project.type;
    const structure = scriptStructures[type];
    
    // 清空现有选择器
    selectorContainer.innerHTML = '';
    
    // 创建幕选择器
    const actSelector = document.createElement('select');
    actSelector.className = 'act-selector';
    actSelector.id = 'quick-add-act';
    
    // 添加幕选项
    for (const actId in structure.acts) {
        const option = document.createElement('option');
        option.value = actId;
        option.textContent = structure.acts[actId].title;
        actSelector.appendChild(option);
    }
    
    // 创建节拍选择器
    const beatSelector = document.createElement('select');
    beatSelector.className = 'beat-selector';
    beatSelector.id = 'quick-add-beat';
    
    // 初始化节拍选项
    updateBeatOptions(actSelector.value);
    
    // 幕变化时更新节拍
    actSelector.addEventListener('change', function() {
        updateBeatOptions(this.value);
    });
    
    // 添加到容器
    selectorContainer.appendChild(actSelector);
    selectorContainer.appendChild(beatSelector);
    
    // 更新节拍选项的函数
    function updateBeatOptions(actId) {
        beatSelector.innerHTML = '';
        
        if (structure.acts[actId]) {
            structure.acts[actId].beats.forEach(beat => {
                const option = document.createElement('option');
                option.value = beat.id;
                option.textContent = beat.title;
                beatSelector.appendChild(option);
            });
        }
    }
}

// 保存快速创建的卡片 - 简化版
function saveQuickCard(createNew) {
    const actSelector = document.getElementById('quick-add-act');
    const beatSelector = document.getElementById('quick-add-beat');
    const descriptionInput = document.getElementById('quick-add-description');
    
    if (!actSelector || !beatSelector || !descriptionInput) {
        alert('快速添加功能初始化失败');
        return;
    }
    
    const act = actSelector.value;
    const beat = beatSelector.value;
    const description = descriptionInput.value;
    
    // 基本验证
    if (!description) {
        alert('请填写剧情内容');
        return;
    }
    
    // 创建卡片对象 - 使用默认值
    const card = {
        id: generateId(),
        status: 'confirmed', // 默认为"确认"
        location: {
            type: 'INT', // 默认为INT
            place: '' // 默认为空
        },
        description: description,
        conflict: {
            protagonist: '',
            goal: '',
            obstacle: ''
        },
        emotionalChange: 'positive',
        emotionalChangeContent: '',
        createdAt: new Date().toISOString()
    };
    
    // 添加到数据中
    scriptCards.acts[act][beat].push(card);
    
    // 保存并更新UI
    saveToLocalStorage();
    renderActBeatCards(act, beat);
    updateCardCounts();
    updateBeatSlotStatus();
    
    if (createNew) {
        // 只清空描述，保留其他字段
        descriptionInput.value = '';
        descriptionInput.focus();
    } else {
        // 关闭菜单
        document.getElementById('quick-add-menu').style.display = 'none';
    }
    
    // 提示用户
    const actionText = createNew ? '已添加卡片，可继续创建' : '已添加卡片';
    showToast(actionText, 'success');
}

// 显示简短的提示消息
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container') || document.body;
    const toast = document.createElement('div');
    toast.className = `toast-message toast-${type}`;
    
    // 根据消息类型添加图标
    let icon = '';
    switch(type) {
        case 'success':
            icon = '✅ ';
            break;
        case 'error':
            icon = '❌ ';
            break;
        case 'warning':
            icon = '⚠️ ';
            break;
        case 'info':
        default:
            icon = 'ℹ️ ';
            break;
    }
    
    toast.textContent = icon + message;
    toastContainer.appendChild(toast);
    
    // 动画显示
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);
    
    // 自动消失
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 300);
    }, 3000);
}


// 保存卡片
function saveCard() {
    const id = document.getElementById('card-id').value;
    const act = document.getElementById('card-act').value;
    const beat = document.getElementById('card-beat').value;
    
    const card = {
        id: id,
        status: document.getElementById('card-status').value,
        location: {
            type: document.getElementById('scene-location-type').value,
            place: document.getElementById('scene-location').value
        },
        description: document.getElementById('scene-description').value,
        conflict: {
            protagonist: document.getElementById('protagonist').value,
            goal: document.getElementById('goal').value,
            obstacle: document.getElementById('obstacle').value
        },
        emotionalChange: document.getElementById('emotional-change-type').value,
        emotionalChangeContent: document.getElementById('emotional-change-content').value,
        createdAt: new Date().toISOString()
    };
    
    // 检查是编辑还是新建
    const existingCardIndex = scriptCards.acts[act][beat].findIndex(c => c.id === id);
    
    if (existingCardIndex >= 0) {
        // 更新现有卡片
        scriptCards.acts[act][beat][existingCardIndex] = card;
    } else {
        // 添加新卡片
        scriptCards.acts[act][beat].push(card);
    }
    
    // 保存并更新UI
    saveToLocalStorage();
    
    // 检查是否需要应用堆叠逻辑
    const container = document.getElementById(act === 'bucket' ? `bucket-${beat}` : `act-${act}-${beat}`);
    if (container && container.hasAttribute('data-expanded')) {
        renderExpandedCards(container, scriptCards.acts[act][beat], act, beat);
    } else {
        renderActBeatCards(act, beat);
    }
    
    updateCardCounts();
    updateBeatSlotStatus();
    
    // 关闭模态框
    cardModal.style.display = 'none';
    
    // 显示保存成功提示
    showToast('卡片已保存', 'success');
}
// 复制卡片
function duplicateCard() {
    const id = document.getElementById('card-id').value;
    const act = document.getElementById('card-act').value;
    const beat = document.getElementById('card-beat').value;
    
    // 查找原始卡片
    const originalCard = findCardById(id, act, beat);
    if (!originalCard) {
        alert('找不到要复制的卡片');
        return;
    }
    
    // 创建新卡片（复制）
    const newCard = {
        ...JSON.parse(JSON.stringify(originalCard)),
        id: generateId(),
        createdAt: new Date().toISOString()
    };
    
    // 修改描述以表明这是副本
    newCard.description = `[副本] ${newCard.description}`;
    
    // 添加到相同节拍
    scriptCards.acts[act][beat].push(newCard);
    
    // 保存并更新UI
    saveToLocalStorage();
    
    // 检查是否需要应用堆叠逻辑
    const container = document.getElementById(act === 'bucket' ? `bucket-${beat}` : `act-${act}-${beat}`);
    if (container && container.hasAttribute('data-expanded')) {
        renderExpandedCards(container, scriptCards.acts[act][beat], act, beat);
    } else {
        renderActBeatCards(act, beat);
    }
    
    updateCardCounts();
    updateBeatSlotStatus();
    
    // 关闭模态框
    cardModal.style.display = 'none';
    
    alert('卡片已复制!');
}

// 删除卡片
function deleteCard() {
    if (!confirm('确定要删除这张卡片吗?')) return;
    
    const id = document.getElementById('card-id').value;
    const act = document.getElementById('card-act').value;
    const beat = document.getElementById('card-beat').value;
    
    scriptCards.acts[act][beat] = scriptCards.acts[act][beat].filter(card => card.id !== id);
    
    // 保存并更新UI
    saveToLocalStorage();
    
    // 检查是否需要应用堆叠逻辑
    const container = document.getElementById(act === 'bucket' ? `bucket-${beat}` : `act-${act}-${beat}`);
    if (container && container.hasAttribute('data-expanded')) {
        renderExpandedCards(container, scriptCards.acts[act][beat], act, beat);
    } else {
        renderActBeatCards(act, beat);
    }
    
    updateCardCounts();
    updateBeatSlotStatus();
    
    // 关闭模态框
    cardModal.style.display = 'none';
}

// 渲染所有卡片
function renderAllCards() {
    const type = scriptCards.project.type;
    const structure = scriptStructures[type];
    
    // 渲染每一幕的每个节拍
    for (const actId in structure.acts) {
        structure.acts[actId].beats.forEach(beat => {
            if (scriptCards.acts[actId] && scriptCards.acts[actId][beat.id]) {
                renderActBeatCards(actId, beat.id);
            }
        });
    }
    
    // 渲染创意桶
    if (scriptCards.acts.bucket && scriptCards.acts.bucket.ideas) {
        renderActBeatCards('bucket', 'ideas');
    }
    
    // 重新初始化拖拽
    setTimeout(initSortable, 100);
}

// 渲染单个节拍的卡片，增加堆叠功能
function renderActBeatCards(act, beat) {
    const containerId = act === 'bucket' ? `bucket-${beat}` : `act-${act}-${beat}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    const cards = scriptCards.acts[act][beat];
    if (!cards) return;
    
    // 如果卡片数量超过3，则创建堆叠视图
    if (cards.length > 3 && !container.hasAttribute('data-expanded')) {
        createCardStack(container, cards, act, beat);
    } else {
        // 否则正常显示卡片
        renderIndividualCards(container, cards, act, beat);
    }
    
    // 更新节拍槽的状态
    const beatSlot = container.closest('.beat-slot');
    if (beatSlot) {
        if (cards.length > 0) {
            beatSlot.classList.add('has-cards');
        } else {
            beatSlot.classList.remove('has-cards');
        }
    }
}

// 创建卡片堆叠视图
function createCardStack(container, cards, act, beat) {
    const stackContainer = document.createElement('div');
    stackContainer.className = 'card-stack';
    stackContainer.setAttribute('data-count', cards.length);
    stackContainer.setAttribute('data-act', act);
    stackContainer.setAttribute('data-beat', beat);
    
    // 只展示前3张卡片作为预览
    for (let i = 0; i < Math.min(3, cards.length); i++) {
        const card = cards[i];
        const previewEl = document.createElement('div');
        previewEl.className = 'stack-preview';
        
        // 只有当场景位置不为空时才显示位置
        const locationDisplay = card.location.place 
            ? `${card.location.type}. ${card.location.place}` 
            : '';
        
        previewEl.innerHTML = `
            ${locationDisplay ? `<div class="card-location">${locationDisplay}</div>` : ''}
            <div class="card-description">${truncateText(card.description, 40)}</div>
        `;
        
        stackContainer.appendChild(previewEl);
    }
    
    // 点击堆叠时展开
    stackContainer.addEventListener('click', function() {
        expandCardStack(this);
    });
    
    container.appendChild(stackContainer);
}

// 展开卡片堆叠
function expandCardStack(stackElement) {
    const act = stackElement.getAttribute('data-act');
    const beat = stackElement.getAttribute('data-beat');
    const containerId = act === 'bucket' ? `bucket-${beat}` : `act-${act}-${beat}`;
    const container = document.getElementById(containerId);
    
    // 标记容器为展开状态
    container.setAttribute('data-expanded', 'true');
    
    // 重新渲染
    renderExpandedCards(container, scriptCards.acts[act][beat], act, beat);
}

// 渲染展开的卡片
function renderExpandedCards(container, cards, act, beat) {
    container.innerHTML = '';
    
    const expandedContainer = document.createElement('div');
    expandedContainer.className = 'expanded-stack';
    
    // 添加标题和折叠按钮
    const header = document.createElement('div');
    header.className = 'stack-header';
    header.innerHTML = `
        <div class="stack-title">${cards.length}张卡片</div>
        <button class="collapse-btn">折叠</button>
    `;
    
    expandedContainer.appendChild(header);
    
    // 渲染所有卡片
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.setAttribute('data-id', card.id);
        cardEl.setAttribute('data-status', card.status || 'confirmed');
        
        // 只有当场景位置不为空时才显示位置
        const locationDisplay = card.location.place 
            ? `${card.location.type}. ${card.location.place}` 
            : '';
        
        cardEl.innerHTML = `
            <div class="card-type-indicator"></div>
            ${locationDisplay ? `<div class="card-location">${locationDisplay}</div>` : ''}
            <div class="card-description">${card.description}</div>
        `;
        
        // 卡片点击事件
        cardEl.addEventListener('click', function(e) {
            // 防止点击触发拖动
            e.stopPropagation();
            openCardModal(card.id, act, beat);
        });
        
        expandedContainer.appendChild(cardEl);
    });
    
    container.appendChild(expandedContainer);
    
    // 折叠按钮点击事件
    container.querySelector('.collapse-btn').addEventListener('click', function(e) {
        e.stopPropagation();
        collapseCardStack(container, act, beat);
    });
    
    // 重新初始化拖拽
    initSortableForContainer(container, act, beat);
}

// 折叠卡片堆叠
function collapseCardStack(container, act, beat) {
    // 移除展开标记
    container.removeAttribute('data-expanded');
    
    // 重新渲染
    renderActBeatCards(act, beat);
}

// 正常渲染单个卡片
function renderIndividualCards(container, cards, act, beat) {
    cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.setAttribute('data-id', card.id);
        cardEl.setAttribute('data-status', card.status || 'confirmed');
        
        // 只有当场景位置不为空时才显示位置
        const locationDisplay = card.location.place 
            ? `${card.location.type}. ${card.location.place}` 
            : '';
        
        cardEl.innerHTML = `
            <div class="card-type-indicator"></div>
            ${locationDisplay ? `<div class="card-location">${locationDisplay}</div>` : ''}
            <div class="card-description">${card.description}</div>
        `;
        
        // 卡片点击事件
        cardEl.addEventListener('click', function(e) {
            // 防止点击触发拖动
            e.stopPropagation();
            openCardModal(card.id, act, beat);
        });
        
        container.appendChild(cardEl);
    });
}

// 切换卡片状态
function toggleCardStatus(cardId, act, beat) {
    const card = findCardById(cardId, act, beat);
    if (!card) return;
    
    // 状态循环：confirmed -> pending -> question -> confirmed
    const statusCycle = ['confirmed', 'pending', 'question'];
    const currentIndex = statusCycle.indexOf(card.status || 'confirmed');
    const nextIndex = (currentIndex + 1) % statusCycle.length;
    card.status = statusCycle[nextIndex];
    
    // 保存更改
    saveToLocalStorage();
    
    // 更新UI
    renderActBeatCards(act, beat);
    
    // 显示提示
    const statusNames = {
        'confirmed': '确认',
        'pending': '保留',
        'question': '存疑'
    };
    showToast(`卡片状态已更改为: ${statusNames[card.status]}`);
}

// 仅初始化单个容器的拖拽功能
function initSortableForContainer(container, act, beat) {
    const cardList = container.querySelector('.expanded-stack');
    if (!cardList) return;
    
    // 获取垃圾桶元素
    const trashBin = document.getElementById('drag-trash-bin');
    
    const sortable = new Sortable(cardList, {
        group: 'cards',
        animation: 150,
        ghostClass: 'sortable-ghost',
        chosenClass: 'sortable-chosen',
        dragClass: 'sortable-drag',
        filter: '.stack-header', // 忽略标题行
        
        onStart: function(evt) {
            // 显示垃圾桶
            if (trashBin) {
                // 隐藏浮动菜单和添加按钮
                document.querySelector('.floating-menu').style.display = 'none';
                document.getElementById('quick-add-btn').style.display = 'none';
                
                // 显示垃圾桶
                trashBin.classList.add('visible');
                
                // 添加到拖拽元素上的标记类
                evt.item.classList.add('is-dragging');
            }
            
            // 初始化垃圾桶拖拽目标
            initTrashBinTarget();
        },
        
        onEnd: function(evt) {
            // 隐藏垃圾桶，显示浮动菜单和添加按钮
            if (trashBin) {
                trashBin.classList.remove('visible');
                trashBin.classList.remove('drag-over');
                document.querySelector('.floating-menu').style.display = 'flex';
                document.getElementById('quick-add-btn').style.display = 'flex';
                
                // 移除拖拽元素上的标记类
                evt.item.classList.remove('is-dragging');
            }
            
            if (evt.item.classList.contains('card')) {
                const cardId = evt.item.getAttribute('data-id');
                const fromAct = act;
                const fromBeat = beat;
                
                // 检查是否被拖到了垃圾桶
                if (evt.to.id === 'trash-bin-target') {
                    // 从数据中删除卡片
                    scriptCards.acts[fromAct][fromBeat] = scriptCards.acts[fromAct][fromBeat].filter(card => card.id !== cardId);
                    
                    // 保存更改
                    saveToLocalStorage();
                    
                    // 更新UI
                    updateCardCounts();
                    updateBeatSlotStatus();
                    
                    // 重新渲染源节拍的卡片
                    renderActBeatCards(fromAct, fromBeat);
                    
                    // 显示删除提示
                    showToast('卡片已删除');
                    
                    return;
                }
                
                const toEl = evt.to.closest('.expanded-stack') || evt.to;
                const toAct = toEl.closest('.beat-slot').getAttribute('data-act');
                const toBeat = toEl.closest('.beat-slot').getAttribute('data-beat');
                
                // 如果位置没变，不做任何处理
                if (fromAct === toAct && fromBeat === toBeat && evt.oldIndex === evt.newIndex) {
                    return;
                }
                
                // 找到被移动的卡片
                const cardIndex = scriptCards.acts[fromAct][fromBeat].findIndex(c => c.id === cardId);
                if (cardIndex === -1) return;
                
                // 取出卡片
                const card = scriptCards.acts[fromAct][fromBeat][cardIndex];
                
                // 从原位置删除
                scriptCards.acts[fromAct][fromBeat].splice(cardIndex, 1);
                
                // 插入到新位置
                // 需要调整索引，因为展开视图中有标题元素
                let newIndex = evt.newIndex;
                if (evt.to.classList.contains('expanded-stack')) {
                    newIndex -= 1; // 减去标题行
                }
                scriptCards.acts[toAct][toBeat].splice(newIndex, 0, card);
                
                // 保存更改
                saveToLocalStorage();
                
                // 更新UI
                updateCardCounts();
                updateBeatSlotStatus();
                
                // 重新渲染来源和目标节拍的卡片
                renderActBeatCards(fromAct, fromBeat);
                if (fromAct !== toAct || fromBeat !== toBeat) {
                    renderActBeatCards(toAct, toBeat);
                }
            }
        }
    });
    
    sortableInstances.push(sortable);
}

// 文本截断辅助函数
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// 更新卡片计数
function updateCardCounts() {
    const type = scriptCards.project.type;
    const structure = scriptStructures[type];
    
    // 更新每幕的总计数
    for (const actId in structure.acts) {
        let count = 0;
        
        // 计算该幕所有节拍的卡片总数
        structure.acts[actId].beats.forEach(beat => {
            if (scriptCards.acts[actId] && scriptCards.acts[actId][beat.id]) {
                count += scriptCards.acts[actId][beat.id].length;
            }
        });
        
        // 查找DOM元素并更新计数
        const actRow = document.querySelector(`.act-row[data-act="${actId}"]`);
        if (actRow) {
            const countElement = actRow.querySelector('.card-count');
            if (countElement) {
                countElement.textContent = `${count} 张卡片`;
            }
        }
    }
    
    // 更新桶的计数
    let bucketCount = 0;
    if (scriptCards.acts.bucket && scriptCards.acts.bucket.ideas) {
        bucketCount = scriptCards.acts.bucket.ideas.length;
    }
}

// 显示统计信息
function showStats() {
    const statsContent = document.getElementById('stats-content');
    
    // 获取当前剧本类型和结构
    const type = scriptCards.project.type;
    const structure = scriptStructures[type];
    
    // 计算总卡片数和每幕卡片数
    let totalCards = 0;
    let actCards = {};
    
    for (const actId in structure.acts) {
        actCards[actId] = 0;
        
        structure.acts[actId].beats.forEach(beat => {
            if (scriptCards.acts[actId] && scriptCards.acts[actId][beat.id]) {
                actCards[actId] += scriptCards.acts[actId][beat.id].length;
            }
        });
        
        totalCards += actCards[actId];
    }
    
    // 计算卡片标记分布
    const statusCount = {
        confirmed: 0,
        pending: 0,
        question: 0
    };
    
    // 计算情感变化
    const emotionalChange = {
        positive: 0,
        negative: 0
    };
    
    // 检查关键节拍是否有卡片
    const keyBeats = [];
    for (const actId in structure.acts) {
        structure.acts[actId].beats.forEach(beat => {
            if (beat.recommended.includes('1个卡片')) {
                keyBeats.push({ id: beat.id, title: beat.title, act: actId });
            }
        });
    }
    
    const missingKeyBeats = [];
    
    for (const actId in structure.acts) {
        structure.acts[actId].beats.forEach(beat => {
            if (scriptCards.acts[actId] && scriptCards.acts[actId][beat.id]) {
                scriptCards.acts[actId][beat.id].forEach(card => {
                    statusCount[card.status || 'confirmed']++;
                    emotionalChange[card.emotionalChange]++;
                });
            }
            
            // 检查关键节拍
            const isKeyBeat = keyBeats.some(kb => kb.id === beat.id && kb.act === actId);
            if (isKeyBeat && (!scriptCards.acts[actId] || !scriptCards.acts[actId][beat.id] || scriptCards.acts[actId][beat.id].length === 0)) {
                missingKeyBeats.push(beat.title);
            }
        });
    }
    
    // 根据剧本类型获取推荐卡片数
    let recommendedCardCount = '';
    switch (type) {
        case 'movie':
            recommendedCardCount = '约25-35张';
            break;
        case 'tv-hour':
            recommendedCardCount = '约20-30张';
            break;
        case 'tv-half':
            recommendedCardCount = '约12-18张';
            break;
    }
    
    // 创建统计HTML
    let statsHTML = `
        <div class="stats-section">
            <h3>剧本概况</h3>
            <p>剧本类型: ${type === 'movie' ? '电影' : (type === 'tv-hour' ? '一小时剧集' : '半小时喜剧')}</p>
            <p>总卡片数: ${totalCards}</p>
            <p>推荐卡片数: ${recommendedCardCount}</p>
            <p>项目最后保存: ${new Date(scriptCards.project.lastSaved).toLocaleString()}</p>
        </div>
        
        <div class="stats-section">
            <h3>幕分布</h3>
            <ul>
    `;
    
    // 为每一幕添加统计
    for (const actId in structure.acts) {
        statsHTML += `<li>${structure.acts[actId].title}: ${actCards[actId]} 张卡片</li>`;
    }
    
    // 添加创意桶统计
    const bucketCount = scriptCards.acts.bucket && scriptCards.acts.bucket.ideas ? scriptCards.acts.bucket.ideas.length : 0;
    statsHTML += `<li>创意桶: ${bucketCount} 张卡片</li>`;
    
    statsHTML += `
            </ul>
        </div>
        
        <div class="stats-section">
            <h3>卡片标记分布</h3>
            <ul>
                <li>✅ 确认: ${statusCount.confirmed} 张</li>
                <li>⏳ 保留: ${statusCount.pending} 张</li>
                <li>❓ 存疑: ${statusCount.question} 张</li>
            </ul>
        </div>
        
        <div class="stats-section">
            <h3>情感变化</h3>
            <ul>
                <li>正向变化(+): ${emotionalChange.positive} 张</li>
                <li>负向变化(-): ${emotionalChange.negative} 张</li>
            </ul>
        </div>
        
        <div class="stats-section">
            <h3>救猫咪理论建议</h3>
            <p>${missingKeyBeats.length > 0 ? 
              `⚠️ 缺少关键节拍卡片: ${missingKeyBeats.join(', ')}` : 
              '✅ 所有关键节拍都有卡片'}</p>
              
            <p>${emotionalChange.positive === 0 || emotionalChange.negative === 0 ? 
                '⚠️ 情感变化不平衡，考虑增加情感转折' : 
                '✅ 情感变化平衡'}</p>
        </div>
    `;
    
    statsContent.innerHTML = statsHTML;
    statsModal.style.display = 'block';
}

// 导出大纲
function exportOutline() {
    const type = scriptCards.project.type;
    const structure = scriptStructures[type];
    
    let outline = `# ${scriptCards.project.title} - 故事大纲\n\n`;
    outline += `## 剧本类型: ${type === 'movie' ? '电影' : (type === 'tv-hour' ? '一小时剧集' : '半小时喜剧')}\n\n`;
    
    // 为每一幕生成大纲
    for (const actId in structure.acts) {
        const act = structure.acts[actId];
        let actHasCards = false;
        
        // 检查该幕是否有卡片
        act.beats.forEach(beat => {
            if (scriptCards.acts[actId] && scriptCards.acts[actId][beat.id] && scriptCards.acts[actId][beat.id].length > 0) {
                actHasCards = true;
            }
        });
        
        if (!actHasCards) continue;
        
        outline += `## ${act.title}\n\n`;
        
        // 为每个节拍生成大纲
        act.beats.forEach(beat => {
            if (!scriptCards.acts[actId] || !scriptCards.acts[actId][beat.id] || scriptCards.acts[actId][beat.id].length === 0) {
                return;
            }
            
            outline += `### ${beat.title} (${beat.recommended})\n\n`;
            
            scriptCards.acts[actId][beat.id].forEach((card, index) => {
                const locationDisplay = card.location.place 
                    ? `${card.location.type}. ${card.location.place}` 
                    : '场景未设置';
                    
                outline += `**场景 ${index + 1}:** ${locationDisplay}\n`;
                outline += `${card.description}\n\n`;
                
                if (card.conflict.protagonist || card.conflict.goal || card.conflict.obstacle) {
                    outline += `**冲突:** ${card.conflict.protagonist || '未指定'} 想要 ${card.conflict.goal || '未指定'} 但是遇到 ${card.conflict.obstacle || '未指定'}\n\n`;
                }
                
                if (card.emotionalChangeContent) {
                    outline += `**情感变化 (${card.emotionalChange === 'positive' ? '+' : '-'}):** ${card.emotionalChangeContent}\n\n`;
                } else {
                    outline += `**情感变化:** ${card.emotionalChange === 'positive' ? '正向 (+)' : '负向 (-)'}\n\n`;
                }
                
                const statusNames = {
                    'confirmed': '✅ 确认',
                    'pending': '⏳ 保留',
                    'question': '❓ 存疑'
                };
                outline += `**状态:** ${statusNames[card.status || 'confirmed']}\n\n`;
            });
        });
    }
    
    // 检查桶是否有卡片
    if (scriptCards.acts.bucket && scriptCards.acts.bucket.ideas && scriptCards.acts.bucket.ideas.length > 0) {
        outline += `## 创意桶\n\n`;
        
        scriptCards.acts.bucket.ideas.forEach((card, index) => {
            const locationDisplay = card.location.place 
                ? `${card.location.type}. ${card.location.place}` 
                : '场景未设置';
                
            outline += `**想法 ${index + 1}:** ${locationDisplay}\n`;
            outline += `${card.description}\n\n`;
        });
    }
    
    // 创建并下载文本文件
    const filename = (scriptCards.project.title || '未命名剧本').replace(/\s+/g, '_') + '_大纲.txt';
    const blob = new Blob([outline], {type: 'text/plain;charset=utf-8'});
    
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}


// 当页面加载完成时初始化应用
document.addEventListener('DOMContentLoaded', initApp);