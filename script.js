// 卡片数据存储
let scriptCards = {
    project: {
        title: '未命名剧本',
        lastSaved: new Date().toISOString()
    },
    acts: {
        // 按幕和节拍组织数据
        1: {
            'pre-opening': [],
            'opening': [],
            'between-opening-theme': [],
            'theme': [],
            'between-theme-setup': [],
            'setup': [],
            'between-setup-catalyst': [],
            'catalyst': [],
            'between-catalyst-debate': [],
            'debate': [],
            'post-debate': []
        },
        2: {
            'pre-bstory': [],
            'bstory': [],
            'between-bstory-fun': [],
            'fun': [],
            'between-fun-midpoint': [],
            'midpoint': [],
            'post-midpoint': []
        },
        3: {
            'pre-villain': [],
            'villain': [],
            'between-villain-darknight': [],
            'darknight': [],
            'between-darknight-allislost': [],
            'allislost': [],
            'post-allislost': []
        },
        4: {
            'pre-finaleprep': [],
            'finaleprep': [],
            'between-finaleprep-finale': [],
            'finale': [],
            'between-finale-finalimage': [],
            'finalimage': [],
            'post-finalimage': []
        },
        bucket: {
            ideas: []
        }
    }
};

// DOM元素引用
const scriptBoard = document.getElementById('script-board');
const cardModal = document.getElementById('card-modal');
const statsModal = document.getElementById('stats-modal');
const filenameModal = document.getElementById('filename-modal');
const importModal = document.getElementById('import-modal');
const cardForm = document.getElementById('card-form');
const filenameForm = document.getElementById('filename-form');
const importForm = document.getElementById('import-form');
const projectTitle = document.getElementById('project-title');

// Sortable实例集合
const sortableInstances = [];

// 初始化应用
function initApp() {
    // 尝试从本地存储加载数据
    loadFromLocalStorage();
    
    // 更新UI
    renderAllCards();
    updateCardCounts();
    
    // 设置项目标题
    projectTitle.value = scriptCards.project.title;
    
    // 添加事件监听器
    setupEventListeners();
    
    // 初始化拖拽
    initSortable();
}

// 从本地存储加载数据
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('scriptCards');
    if (savedData) {
        try {
            scriptCards = JSON.parse(savedData);
            
            // 确保所有新添加的节拍数据结构存在
            ensureDataStructure();
        } catch (e) {
            console.error('加载数据出错:', e);
        }
    }
}

// 确保数据结构完整
function ensureDataStructure() {
    const acts = {
        1: [
            'pre-opening', 'opening', 'between-opening-theme', 'theme', 
            'between-theme-setup', 'setup', 'between-setup-catalyst', 'catalyst', 
            'between-catalyst-debate', 'debate', 'post-debate'
        ],
        2: [
            'pre-bstory', 'bstory', 'between-bstory-fun', 'fun', 
            'between-fun-midpoint', 'midpoint', 'post-midpoint'
        ],
        3: [
            'pre-villain', 'villain', 'between-villain-darknight', 'darknight', 
            'between-darknight-allislost', 'allislost', 'post-allislost'
        ],
        4: [
            'pre-finaleprep', 'finaleprep', 'between-finaleprep-finale', 'finale', 
            'between-finale-finalimage', 'finalimage', 'post-finalimage'
        ],
        bucket: ['ideas']
    };
    
    for (const act in acts) {
        if (!scriptCards.acts[act]) {
            scriptCards.acts[act] = {};
        }
        
        for (const beat of acts[act]) {
            if (!scriptCards.acts[act][beat]) {
                scriptCards.acts[act][beat] = [];
            }
        }
    }
}

// 保存到本地存储
function saveToLocalStorage() {
    scriptCards.project.lastSaved = new Date().toISOString();
    localStorage.setItem('scriptCards', JSON.stringify(scriptCards));
}

// 设置事件监听器
function setupEventListeners() {
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
        const projects = getAllSavedProjects();
        if (projects.length === 0) {
            alert('没有找到已保存的项目');
            return;
        }
        
        const projectName = prompt('输入要加载的项目名称: ' + projects.join(', '));
        if (projectName && projects.includes(projectName)) {
            loadProject(projectName);
        }
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
                    ensureDataStructure();
                    projectTitle.value = scriptCards.project.title;
                    renderAllCards();
                    updateCardCounts();
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
        });
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
    
    // 导出项目按钮
    document.getElementById('export-project').addEventListener('click', exportProject);
    
    // 导出大纲按钮
    document.getElementById('export-outline').addEventListener('click', exportOutline);
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(e) {
        if (e.target === cardModal) cardModal.style.display = 'none';
        if (e.target === statsModal) statsModal.style.display = 'none';
        if (e.target === filenameModal) filenameModal.style.display = 'none';
        if (e.target === importModal) importModal.style.display = 'none';
    });
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
    
    // 获取所有卡片容器
    const cardLists = document.querySelectorAll('.card-list');
    
    // 对每个容器初始化Sortable
    cardLists.forEach(list => {
        const act = list.closest('.beat-slot').getAttribute('data-act');
        const beat = list.closest('.beat-slot').getAttribute('data-beat');
        
        const sortable = new Sortable(list, {
            group: 'cards',  // 指定组，允许在不同列表之间拖拽
            animation: 150,  // 动画时间
            ghostClass: 'sortable-ghost',  // 拖动时的样式
            chosenClass: 'sortable-chosen',  // 选中时的样式
            dragClass: 'sortable-drag',  // 拖动中的样式
            
            // 当卡片放置在新位置时触发
            onEnd: function(evt) {
                const cardId = evt.item.getAttribute('data-id');
                const fromAct = evt.from.closest('.beat-slot').getAttribute('data-act');
                const fromBeat = evt.from.closest('.beat-slot').getAttribute('data-beat');
                const toAct = evt.to.closest('.beat-slot').getAttribute('data-act');
                const toBeat = evt.to.closest('.beat-slot').getAttribute('data-beat');
                
                // 如果位置没变，不做任何处理
                if (fromAct === toAct && fromBeat === toBeat && evt.oldIndex === evt.newIndex) {
                    return;
                }
                
                // 找到被移动的卡片
                const cardIndex = scriptCards.acts[fromAct][fromBeat].findIndex(card => card.id === cardId);
                if (cardIndex === -1) return;
                
                // 取出卡片
                const card = scriptCards.acts[fromAct][fromBeat][cardIndex];
                
                // 从原位置删除
                scriptCards.acts[fromAct][fromBeat].splice(cardIndex, 1);
                
                // 插入到新位置
                scriptCards.acts[toAct][toBeat].splice(evt.newIndex, 0, card);
                
                // 保存更改
                saveToLocalStorage();
                
                // 更新计数
                updateCardCounts();
            }
        });
        
        // 保存实例，以便之后可以销毁
        sortableInstances.push(sortable);
    });
}

// 获取所有已保存项目
function getAllSavedProjects() {
    const projects = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('scriptCards_')) {
            projects.push(key.replace('scriptCards_', ''));
        }
    }
    return projects;
}

// 加载项目
function loadProject(name) {
    const data = localStorage.getItem('scriptCards_' + name);
    if (data) {
        try {
            scriptCards = JSON.parse(data);
            ensureDataStructure();
            projectTitle.value = scriptCards.project.title;
            renderAllCards();
            updateCardCounts();
            alert('项目已加载!');
        } catch (e) {
            console.error('加载项目出错:', e);
            alert('加载项目时出错');
        }
    }
}

// 打开卡片编辑模态框
function openCardModal(cardId, act, beat) {
    const form = document.getElementById('card-form');
    form.reset();
    
    document.getElementById('card-act').value = act;
    document.getElementById('card-beat').value = beat;
    
    if (cardId) {
        // 编辑现有卡片
        const card = findCardById(cardId, act, beat);
        if (card) {
            document.getElementById('card-id').value = card.id;
            document.getElementById('card-type').value = card.type || 'regular';
            document.getElementById('scene-location-type').value = card.location.type;
            document.getElementById('scene-location').value = card.location.place;
            document.getElementById('scene-description').value = card.description;
            document.getElementById('protagonist').value = card.conflict.protagonist;
            document.getElementById('goal').value = card.conflict.goal;
            document.getElementById('obstacle').value = card.conflict.obstacle;
            document.getElementById('emotional-change').value = card.emotionalChange;
        }
    } else {
        // 新卡片
        document.getElementById('card-id').value = generateId();
        
        // 根据节拍自动设置卡片类型
        const beatToTypeMap = {
            'opening': 'single-beat',
            'theme': 'setup', 
            'catalyst': 'single-beat',
            'midpoint': 'single-beat',
            'allislost': 'single-beat',
            'finale': 'finale',
            'finalimage': 'single-beat',
            'setup': 'setup',
            'fun': 'fun-games',
            'villain': 'villain',
            'darknight': 'dark-night'
        };
        
        if (beatToTypeMap[beat]) {
            document.getElementById('card-type').value = beatToTypeMap[beat];
        }
    }
    
    cardModal.style.display = 'block';
}

// 查找卡片
function findCardById(id, act, beat) {
    return scriptCards.acts[act][beat].find(card => card.id === id);
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// 保存卡片
function saveCard() {
    const id = document.getElementById('card-id').value;
    const act = document.getElementById('card-act').value;
    const beat = document.getElementById('card-beat').value;
    
    const card = {
        id: id,
        type: document.getElementById('card-type').value,
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
        emotionalChange: document.getElementById('emotional-change').value,
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
    renderActBeatCards(act, beat);
    updateCardCounts();
    
    // 关闭模态框
    cardModal.style.display = 'none';
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
    renderActBeatCards(act, beat);
    updateCardCounts();
    
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
    renderActBeatCards(act, beat);
    updateCardCounts();
    
    // 关闭模态框
    cardModal.style.display = 'none';
}

// 渲染所有卡片
function renderAllCards() {
    for (const act in scriptCards.acts) {
        for (const beat in scriptCards.acts[act]) {
            renderActBeatCards(act, beat);
        }
    }
    
    // 重新初始化拖拽
    setTimeout(initSortable, 100);
}

// 渲染单个节拍的卡片
function renderActBeatCards(act, beat) {
    const containerId = act === 'bucket' ? `bucket-${beat}` : `act-${act}-${beat}`;
    const container = document.getElementById(containerId);
    if (!container) return;
    
    container.innerHTML = '';
    
    scriptCards.acts[act][beat].forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.setAttribute('data-id', card.id);
        cardEl.setAttribute('data-type', card.type);
        
        cardEl.innerHTML = `
            <div class="card-type-indicator"></div>
            <div class="card-location">${card.location.type}. ${card.location.place}</div>
            <div class="card-description">${card.description}</div>
        `;
        
        cardEl.addEventListener('click', function(e) {
            // 防止点击触发拖动
            e.stopPropagation();
            openCardModal(card.id, act, beat);
        });
        
        container.appendChild(cardEl);
    });
}

// 更新卡片计数
function updateCardCounts() {
    // 更新每幕的总计数
    for (let act = 1; act <= 4; act++) {
        let count = 0;
        for (const beat in scriptCards.acts[act]) {
            count += scriptCards.acts[act][beat].length;
        }
        
        const countElement = document.querySelector(`.act-row:nth-child(${act}) .card-count`);
        if (countElement) {
            countElement.textContent = `${count} 张卡片`;
            
            // 根据救猫咪理论添加建议
            countElement.classList.remove('warning');
            
            if (act === 1 && (count < 6 || count > 10)) {
                countElement.classList.add('warning');
            } else if (act !== 5 && (count < 5 || count > 8)) {
                countElement.classList.add('warning');
            }
        }
    }
    
    // 更新桶的计数
    let bucketCount = 0;
    for (const beat in scriptCards.acts.bucket) {
        bucketCount += scriptCards.acts.bucket[beat].length;
    }
    
    const bucketCountElement = document.querySelector(`.bucket-row .card-count`);
    if (bucketCountElement) {
        bucketCountElement.textContent = `${bucketCount} 张卡片`;
    }
}

// 显示统计信息
function showStats() {
    const statsContent = document.getElementById('stats-content');
    
    // 计算总卡片数
    let totalCards = 0;
    let actCards = {};
    
    for (let act = 1; act <= 4; act++) {
        actCards[act] = 0;
        for (const beat in scriptCards.acts[act]) {
            actCards[act] += scriptCards.acts[act][beat].length;
        }
        totalCards += actCards[act];
    }
    
    // 计算类型分布
    const typeCount = {
        regular: 0,
        'single-beat': 0,
        setup: 0,
        'fun-games': 0,
        villain: 0,
        'dark-night': 0,
        finale: 0
    };
    
    // 计算情感变化
    const emotionalChange = {
        positive: 0,
        negative: 0
    };
    
    // 检查关键节拍是否有卡片
    const keyBeats = {
        'opening': '开场画面',
        'catalyst': '催化剂',
        'midpoint': '中点',
        'allislost': '一切尽失',
        'finalimage': '最终画面'
    };
    
    const missingKeyBeats = [];
    
    for (let act = 1; act <= 4; act++) {
        for (const beat in scriptCards.acts[act]) {
            scriptCards.acts[act][beat].forEach(card => {
                typeCount[card.type || 'regular']++;
                emotionalChange[card.emotionalChange]++;
            });
            
            // 检查关键节拍
            if (keyBeats[beat] && scriptCards.acts[act][beat].length === 0) {
                missingKeyBeats.push(keyBeats[beat]);
            }
        }
    }
    
    // 创建统计HTML
    let statsHTML = `
        <div class="stats-section">
            <h3>剧本概况</h3>
            <p>总卡片数: ${totalCards}</p>
            <p>推荐卡片数: ${totalCards > 0 ? '一小时剧本: 26张 / 半小时剧本: 14张' : '未确定'}</p>
            <p>项目最后保存: ${new Date(scriptCards.project.lastSaved).toLocaleString()}</p>
        </div>
        
        <div class="stats-section">
            <h3>幕分布</h3>
            <ul>
                <li>第一幕: ${actCards[1]} 张卡片 ${actCards[1] < 6 || actCards[1] > 10 ? '(警告: 偏离推荐范围6-10)' : ''}</li>
                <li>第二幕: ${actCards[2]} 张卡片 ${actCards[2] < 5 || actCards[2] > 8 ? '(警告: 偏离推荐范围5-8)' : ''}</li>
                <li>第三幕: ${actCards[3]} 张卡片 ${actCards[3] < 5 || actCards[3] > 8 ? '(警告: 偏离推荐范围5-8)' : ''}</li>
                <li>第四幕: ${actCards[4]} 张卡片 ${actCards[4] < 5 || actCards[4] > 8 ? '(警告: 偏离推荐范围5-8)' : ''}</li>
                <li>创意桶: ${Object.values(scriptCards.acts.bucket).reduce((sum, arr) => sum + arr.length, 0)} 张卡片</li>
            </ul>
        </div>
        
        <div class="stats-section">
            <h3>类型分布</h3>
            <ul>
                <li>单场景节拍: ${typeCount['single-beat']} 张</li>
                <li>铺垫: ${typeCount.setup} 张</li>
                <li>游戏时间: ${typeCount['fun-games']} 张</li>
                <li>坏人逼近: ${typeCount.villain} 张</li>
                <li>灵魂黑夜: ${typeCount['dark-night']} 张</li>
                <li>结局: ${typeCount.finale} 张</li>
                <li>普通场景: ${typeCount.regular} 张</li>
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
            <p>${totalCards < 20 ? '⚠️ 卡片总数偏少，故事可能节奏过慢' : 
                totalCards > 32 ? '⚠️ 卡片总数偏多，故事可能过于紧凑' : 
                '✅ 卡片总数在合理范围内'}</p>
            
            ${missingKeyBeats.length > 0 ? 
              `<p>⚠️ 缺少关键节拍卡片: ${missingKeyBeats.join(', ')}</p>` : 
              '<p>✅ 所有关键节拍都有卡片</p>'}
              
            <p>${emotionalChange.positive === 0 || emotionalChange.negative === 0 ? 
                '⚠️ 情感变化不平衡，考虑增加情感转折' : 
                '✅ 情感变化平衡'}</p>
        </div>
    `;
    
    statsContent.innerHTML = statsHTML;
    statsModal.style.display = 'block';
}

// 导出项目
function exportProject() {
    showFilenameModal();
}

// 导出大纲
function exportOutline() {
    let outline = `# ${scriptCards.project.title} - 故事大纲\n\n`;
    
    const beatNames = {
        'pre-opening': '开场前区域',
        'opening': '开场画面',
        'between-opening-theme': '开场-主题过渡',
        'theme': '主题陈述',
        'between-theme-setup': '主题-铺垫过渡',
        'setup': '铺垫',
        'between-setup-catalyst': '铺垫-催化剂过渡',
        'catalyst': '催化剂',
        'between-catalyst-debate': '催化剂-争论过渡',
        'debate': '争论',
        'post-debate': '争论后区域',
        
        'pre-bstory': 'B故事前区域',
        'bstory': 'B故事',
        'between-bstory-fun': 'B故事-游戏时间过渡',
        'fun': '游戏时间',
        'between-fun-midpoint': '游戏时间-中点过渡',
        'midpoint': '中点',
        'post-midpoint': '中点后区域',
        
        'pre-villain': '坏人逼近前区域',
        'villain': '坏人逼近',
        'between-villain-darknight': '坏人逼近-灵魂黑夜过渡',
        'darknight': '灵魂黑夜',
        'between-darknight-allislost': '灵魂黑夜-一切尽失过渡',
        'allislost': '一切尽失',
        'post-allislost': '一切尽失后区域',
        
        'pre-finaleprep': '大结局准备前区域',
        'finaleprep': '大结局准备',
        'between-finaleprep-finale': '大结局准备-大结局过渡',
        'finale': '大结局',
        'between-finale-finalimage': '大结局-最终画面过渡',
        'finalimage': '最终画面',
        'post-finalimage': '最终画面后区域'
    };
    
    for (let act = 1; act <= 4; act++) {
        let actHasCards = false;
        for (const beat in scriptCards.acts[act]) {
            if (scriptCards.acts[act][beat].length > 0) {
                actHasCards = true;
                break;
            }
        }
        
        if (!actHasCards) continue;
        
        outline += `## 第${act}幕\n\n`;
        
        for (const beat in scriptCards.acts[act]) {
            if (scriptCards.acts[act][beat].length === 0) continue;
            
            outline += `### ${beatNames[beat] || beat}\n\n`;
            
            scriptCards.acts[act][beat].forEach((card, index) => {
                outline += `**场景 ${index + 1}:** ${card.location.type}. ${card.location.place}\n`;
                outline += `${card.description}\n\n`;
                
                if (card.conflict.protagonist || card.conflict.goal || card.conflict.obstacle) {
                    outline += `**冲突:** ${card.conflict.protagonist || '未指定'} 想要 ${card.conflict.goal || '未指定'} 但是遇到 ${card.conflict.obstacle || '未指定'}\n\n`;
                }
                
                outline += `**情感变化:** ${card.emotionalChange === 'positive' ? '正向 (+)' : '负向 (-)'}\n\n`;
            });
        }
    }
    
    // 检查桶是否有卡片
    let bucketHasCards = false;
    for (const beat in scriptCards.acts.bucket) {
        if (scriptCards.acts.bucket[beat].length > 0) {
            bucketHasCards = true;
            break;
        }
    }
    
    if (bucketHasCards) {
        outline += `## 创意桶\n\n`;
        
        for (const beat in scriptCards.acts.bucket) {
            scriptCards.acts.bucket[beat].forEach((card, index) => {
                outline += `**想法 ${index + 1}:** ${card.location.type}. ${card.location.place}\n`;
                outline += `${card.description}\n\n`;
            });
        }
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