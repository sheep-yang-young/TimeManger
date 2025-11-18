/**
 * 统一数据存储管理工具
 * 将所有应用数据统一存储到一个文件中，便于后续开发和管理
 */

// 数据存储的根key
const DATA_ROOT_KEY = 'timeManager_appData';

/**
 * 获取所有应用数据
 * @returns {Object} 包含所有应用数据的对象
 */
export function getAllAppData() {
	try {
		const data = uni.getStorageSync(DATA_ROOT_KEY);
		if (data && typeof data === 'object') {
			return data;
		}
		// 如果统一存储不存在，尝试从旧存储迁移数据
		return migrateOldData();
	} catch (err) {
		console.error('获取应用数据失败:', err);
		return getDefaultData();
	}
}

/**
 * 保存所有应用数据
 * @param {Object} data - 要保存的数据对象
 */
export function saveAllAppData(data) {
	try {
		// 添加元数据
		const dataWithMeta = {
			...data,
			_version: '1.0.0',
			_lastUpdate: new Date().toISOString()
		};
		uni.setStorageSync(DATA_ROOT_KEY, dataWithMeta);
	} catch (err) {
		console.error('保存应用数据失败:', err);
	}
}

/**
 * 从旧存储迁移数据到统一存储
 * @returns {Object} 迁移后的数据对象
 */
function migrateOldData() {
	const migratedData = getDefaultData();
	
	try {
		// 迁移任务相关数据
		const todayTasks = uni.getStorageSync('todayTasks');
		const taskHistory = uni.getStorageSync('taskHistory');
		const todayStats = uni.getStorageSync('todayStats');
		
		if (todayTasks) migratedData.tasks.today = todayTasks;
		if (taskHistory) migratedData.tasks.history = taskHistory;
		if (todayStats) migratedData.stats = todayStats;
		
		// 迁移番茄钟相关数据
		const pomodoroCounts = uni.getStorageSync('pomodoroCounts');
		const pomodoroSettings = uni.getStorageSync('pomodoroSettings');
		const pomodoroBackgroundState = uni.getStorageSync('pomodoroBackgroundState');
		
		if (pomodoroCounts) migratedData.pomodoro.counts = pomodoroCounts;
		if (pomodoroSettings) migratedData.pomodoro.settings = pomodoroSettings;
		if (pomodoroBackgroundState) migratedData.pomodoro.backgroundState = pomodoroBackgroundState;
		
		// 迁移习惯相关数据
		const habits = uni.getStorageSync('habits');
		const habitEnergy = uni.getStorageSync('habitEnergy');
		const habitLevel = uni.getStorageSync('habitLevel');
		const habitExp = uni.getStorageSync('habitExp');
		const habitNextLevelExp = uni.getStorageSync('habitNextLevelExp');
		const habitCheckins = uni.getStorageSync('habitCheckins');
		const lastCheckinDate = uni.getStorageSync('lastCheckinDate');
		const habitMockDate = uni.getStorageSync('habitMockDate');
		
		if (habits) migratedData.habits.list = habits;
		if (typeof habitEnergy === 'number') migratedData.habits.energy = habitEnergy;
		if (typeof habitLevel === 'number') migratedData.habits.level = habitLevel;
		if (typeof habitExp === 'number') migratedData.habits.exp = habitExp;
		if (typeof habitNextLevelExp === 'number') migratedData.habits.nextLevelExp = habitNextLevelExp;
		if (habitCheckins) migratedData.habits.checkins = habitCheckins;
		if (lastCheckinDate) migratedData.habits.lastCheckinDate = lastCheckinDate;
		if (habitMockDate) migratedData.habits.mockDate = habitMockDate;
		
		// 迁移设置相关数据
		const userGoals = uni.getStorageSync('userGoals');
		if (userGoals) migratedData.settings.goals = userGoals;
		
		// 保存迁移后的数据
		saveAllAppData(migratedData);
		
		console.log('✓ 数据已从旧存储迁移到统一存储');
		return migratedData;
	} catch (err) {
		console.error('数据迁移失败:', err);
		return getDefaultData();
	}
}

/**
 * 获取默认数据结构
 * @returns {Object} 默认数据对象
 */
function getDefaultData() {
	return {
		// 任务相关数据
		tasks: {
			today: [],           // 今天的任务列表
			history: {}          // 任务历史记录（按日期）
		},
		// 统计数据
		stats: {
			completed: 0,
			active: 0,
			pomodoro: 0,
			pomodoroGoal: 12,
			expired: 0,
			expiredGoal: 4
		},
		// 番茄钟相关数据
		pomodoro: {
			counts: {},              // 每日番茄钟计数
			settings: {              // 番茄钟设置
				focusMinutes: 25,
				breakMinutes: 5,
				targetTomatoes: 8
			},
			backgroundState: null    // 后台状态
		},
		// 习惯相关数据
		habits: {
			list: [],                // 习惯列表
			energy: 0,               // 总能量
			level: 1,                // 当前等级
			exp: 0,                  // 当前经验
			nextLevelExp: 100,       // 下一级所需经验
			checkins: {},            // 打卡记录
			lastCheckinDate: null,   // 最后打卡日期
			mockDate: null           // 模拟日期（调试用）
		},
		// 设置相关数据
		settings: {
			goals: {                 // 用户目标
				pomodoroGoal: 12,
				expiredGoal: 4
			}
		}
	};
}

/**
 * 更新特定数据模块
 * @param {String} module - 模块名称 (tasks, stats, pomodoro, habits, settings)
 * @param {Object} data - 要更新的数据
 */
export function updateModuleData(module, data) {
	const allData = getAllAppData();
	if (allData[module]) {
		allData[module] = { ...allData[module], ...data };
	} else {
		allData[module] = data;
	}
	saveAllAppData(allData);
}

/**
 * 获取特定数据模块
 * @param {String} module - 模块名称
 * @returns {Object} 模块数据
 */
export function getModuleData(module) {
	const allData = getAllAppData();
	return allData[module] || {};
}

/**
 * 清除所有应用数据
 */
export function clearAllAppData() {
	try {
		uni.removeStorageSync(DATA_ROOT_KEY);
		// 同时清除旧存储（兼容性）
		const oldKeys = [
			'todayTasks', 'taskHistory', 'todayStats',
			'pomodoroCounts', 'pomodoroSettings', 'pomodoroBackgroundState',
			'habits', 'habitEnergy', 'habitLevel', 'habitExp', 'habitNextLevelExp',
			'habitCheckins', 'lastCheckinDate', 'habitMockDate',
			'userGoals'
		];
		oldKeys.forEach(key => {
			try {
				uni.removeStorageSync(key);
			} catch (e) {
				// 忽略错误
			}
		});
	} catch (err) {
		console.error('清除应用数据失败:', err);
	}
}

