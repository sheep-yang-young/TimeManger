/**
 * 统一数据存储管理工具
 * 将所有应用数据统一存储到一个文件中 (key: timeManager_appData)
 */

const DATA_ROOT_KEY = 'timeManager_appData';

/**
 * 获取所有应用数据
 */
export function getAllAppData() {
	try {
		const data = uni.getStorageSync(DATA_ROOT_KEY);
		const defaultData = getDefaultData();
		
		if (data && typeof data === 'object') {
			// 深度合并，确保新增加的字段（如 calendar）能被读出
			return {
				...defaultData,
				...data,
				tasks: { ...defaultData.tasks, ...(data.tasks || {}) },
				stats: { ...defaultData.stats, ...(data.stats || {}) },
				pomodoro: { ...defaultData.pomodoro, ...(data.pomodoro || {}) },
				habits: { ...defaultData.habits, ...(data.habits || {}) },
				settings: { ...defaultData.settings, ...(data.settings || {}) },
				user: { ...defaultData.user, ...(data.user || {}) },
				calendar: { ...defaultData.calendar, ...(data.calendar || {}) } // 新增日历模块
			};
		}
		return migrateOldData();
	} catch (err) {
		console.error('获取应用数据失败:', err);
		return getDefaultData();
	}
}

/**
 * 保存所有应用数据
 */
export function saveAllAppData(data) {
	try {
		const dataWithMeta = {
			...data,
			_version: '1.1.0', // 版本升级
			_lastUpdate: new Date().toISOString()
		};
		uni.setStorageSync(DATA_ROOT_KEY, dataWithMeta);
	} catch (err) {
		console.error('保存应用数据失败:', err);
	}
}

/**
 * 更新特定数据模块
 * @param {String} module - 模块名称 (tasks, calendar, etc.)
 * @param {Object} data - 该模块的新数据（部分或全部）
 */
export function updateModuleData(module, data) {
	const allData = getAllAppData();
	// 浅合并模块数据
	allData[module] = { ...(allData[module] || {}), ...data };
	saveAllAppData(allData);
}

/**
 * 获取默认数据结构 (单一数据源的定义)
 */
function getDefaultData() {
	return {
		// 任务相关
		tasks: {
			today: [],
			history: {},
			memo: '' // 新增：随手记统一存放在这里
		},
		// 统计概览
		stats: {
			completed: 0,
			active: 0,
			pomodoro: 0,
			pomodoroGoal: 12,
			expired: 0,
			expiredGoal: 4
		},
		// 日历相关 (新增)
		calendar: {
			anniversaries: [], // 纪念日列表
			moodHistory: {}    // 心情像素画记录
		},
		// 番茄钟
		pomodoro: {
			counts: {},
			settings: {
				focusMinutes: 25,
				breakMinutes: 5,
				targetTomatoes: 8
			},
			backgroundState: null
		},
		// 习惯养成
		habits: {
			list: [],
			energy: 0,
			level: 1,
			exp: 0,
			nextLevelExp: 100,
			gold: 0,          // 确保金币也在
			inventory: [],    // 物品清单
			checkins: {},     // 签到记录移入这里
			currentPet: null,
			currentTitle: null
		},
		// 全局设置
		settings: {
			goals: {
				pomodoroGoal: 12,
				expiredGoal: 4
			}
		},
		// 用户状态
		user: {
			hasAgreedUserAgreement: false,
			hasCompletedGuide: false,
			lastCheckInDate: '', // 新增：每日签到日期
			dailyQuote: ''       // 新增：每日签到语录
		}
	};
}

/**
 * 数据迁移：将分散的旧缓存合并到统一文件
 */
function migrateOldData() {
	const migratedData = getDefaultData();
	
	try {
		// 1. 任务 & 随手记
		const todayTasks = uni.getStorageSync('todayTasks');
		const taskHistory = uni.getStorageSync('taskHistory');
		const quickMemo = uni.getStorageSync('quickMemo');
		if (todayTasks) migratedData.tasks.today = todayTasks;
		if (taskHistory) migratedData.tasks.history = taskHistory;
		if (quickMemo) migratedData.tasks.memo = quickMemo;
		
		// 2. 统计
		const todayStats = uni.getStorageSync('todayStats');
		if (todayStats) migratedData.stats = todayStats;
		
		// 3. 日历 (纪念日 & 心情)
		const anniversaries = uni.getStorageSync('anniversaries');
		const moodHistory = uni.getStorageSync('moodHistory');
		if (anniversaries) migratedData.calendar.anniversaries = anniversaries;
		if (moodHistory) migratedData.calendar.moodHistory = moodHistory;
		
		// 4. 番茄钟
		const pCounts = uni.getStorageSync('pomodoroCounts');
		const pSettings = uni.getStorageSync('pomodoroSettings');
		const pBg = uni.getStorageSync('pomodoroBackgroundState');
		if (pCounts) migratedData.pomodoro.counts = pCounts;
		if (pSettings) migratedData.pomodoro.settings = pSettings;
		if (pBg) migratedData.pomodoro.backgroundState = pBg;
		
		// 5. 习惯
		const habits = uni.getStorageSync('habits'); // 旧版可能直接存整个对象或数组，需兼容
		// 这里假设旧版分散存储，尝试读取分散key
		const hList = uni.getStorageSync('habits_list') || uni.getStorageSync('habits'); 
		const hCheckins = uni.getStorageSync('habitCheckins');
		if (Array.isArray(hList)) migratedData.habits.list = hList;
		else if (hList && hList.list) migratedData.habits = { ...migratedData.habits, ...hList };
		if (hCheckins) migratedData.habits.checkins = hCheckins;
		
		// 6. 用户 & 设置
		const goals = uni.getStorageSync('userGoals');
		const lastCheckIn = uni.getStorageSync('lastCheckInDate');
		const quote = uni.getStorageSync('dailyQuote');
		const agreed = uni.getStorageSync('hasAgreedUserAgreement');
		const guided = uni.getStorageSync('hasCompletedGuide');
		
		if (goals) migratedData.settings.goals = goals;
		if (lastCheckIn) migratedData.user.lastCheckInDate = lastCheckIn;
		if (quote) migratedData.user.dailyQuote = quote;
		if (agreed) migratedData.user.hasAgreedUserAgreement = agreed;
		if (guided) migratedData.user.hasCompletedGuide = guided;
		
		saveAllAppData(migratedData);
		return migratedData;
	} catch (err) {
		return getDefaultData();
	}
}

// 导出/导入/清除方法保持不变，它们已经基于 getAllAppData 工作
export function exportAllAppData(pretty = true) {
	try {
		const allData = getAllAppData();
		const exportData = { ...allData };
		delete exportData._version;
		delete exportData._lastUpdate;
		return JSON.stringify(exportData, null, pretty ? 2 : 0);
	} catch (e) { return '{}'; }
}

export function importAllAppData(jsonString) {
	try {
		const imported = JSON.parse(jsonString);
		if (!imported || typeof imported !== 'object') return false;
		const current = getAllAppData();
		// 深度合并逻辑简写，实际使用建议用 lodash.merge 或手写深拷贝
		const merged = {
			...current,
			...imported,
			tasks: { ...current.tasks, ...(imported.tasks || {}) },
			stats: { ...current.stats, ...(imported.stats || {}) },
			calendar: { ...current.calendar, ...(imported.calendar || {}) },
			pomodoro: { ...current.pomodoro, ...(imported.pomodoro || {}) },
			habits: { ...current.habits, ...(imported.habits || {}) },
			settings: { ...current.settings, ...(imported.settings || {}) },
			user: { ...current.user, ...(imported.user || {}) }
		};
		saveAllAppData(merged);
		return true;
	} catch (e) { return false; }
}

export function clearAllAppData() {
	uni.removeStorageSync(DATA_ROOT_KEY);
	// 清理旧 Key 以防万一
	const oldKeys = [
		'todayTasks', 'taskHistory', 'todayStats', 'quickMemo',
		'anniversaries', 'moodHistory',
		'pomodoroCounts', 'pomodoroSettings', 'pomodoroBackgroundState',
		'habits', 'habitCheckins', 'lastCheckinDate', // 注意习惯页有个 lastCheckinDate 和首页 lastCheckInDate 命名可能冲突，统一后不再有问题
		'userGoals', 'hasAgreedUserAgreement', 'hasCompletedGuide', 'dailyQuote', 'lastCheckInDate'
	];
	oldKeys.forEach(k => uni.removeStorageSync(k));
}