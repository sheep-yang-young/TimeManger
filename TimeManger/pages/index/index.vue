<template>
	<view class="page">
		<view class="page__frost"></view>

		<view class="top-bar glass" :class="{ 'glass--active': pageLoaded }">
			<view class="top-bar__left" @tap="toggleSideMenu">
				<view class="icon-more">
					<view></view>
					<view></view>
					<view></view>
				</view>
			</view>
			<text class="top-bar__title">今日</text>
			<view class="top-bar__right">
				<text class="top-bar__date">{{ todayLabel }}</text>
			</view>
		</view>

		<view class="side-menu" :class="{ 'side-menu--open': showSideMenu }">
			<view class="side-menu__header">
				<text class="side-menu__title">更多功能</text>
			</view>
			<view class="side-menu__list">
				<view class="side-menu__item" v-for="item in sideMenuItems" :key="item.label" @tap="onSideMenuItemTap(item)">
					<text class="side-menu__item-label">{{ item.label }}</text>
					<text class="side-menu__item-tip">{{ item.tip }}</text>
				</view>
			</view>
		</view>
		<view class="side-menu__mask" v-if="showSideMenu" @tap="toggleSideMenu"></view>

		<view class="main">
		<view class="efficiency glass" :class="{ 'glass--active': pageLoaded }">
				<view class="card-header">
					<text class="card-title">效率概览</text>
				</view>
				<view class="stats-grid">
					<view class="stat-card" v-for="card in statCards" :key="card.key" :class="`stat-card--${card.key}`">
						<view class="stat-card__halo" :style="{ backgroundImage: card.gradient }"></view>
						<view class="stat-card__header">
							<text class="stat-card__label">{{ card.label }}</text>
							<text class="stat-card__value">{{ card.value }}</text>
						</view>
						<text class="stat-card__desc">{{ card.desc }}</text>
						<view class="stat-card__bar">
							<view class="stat-card__bar-fill" :style="{ width: card.progress, backgroundImage: card.gradient }"></view>
						</view>
						<view class="stat-card__footer">
							<text class="stat-card__extra">{{ card.extra }}</text>
							<text class="stat-card__status" :class="`stat-card__status--${card.status}`">{{ card.statusLabel }}</text>
						</view>
					</view>
				</view>
			</view>

			<view class="tasks glass" :class="{ 'glass--active': pageLoaded }">
				<view class="card-header">
					<text class="card-title">今日清单</text>
					<text class="card-sub">{{ summaryLabel }}</text>
				</view>
				<view v-for="task in tasks" :key="task.id" class="task" :class="{ 'task--done': task.done, 'task--expired': task.expired }">
					<view class="task__info" @tap="toggleTaskDone(task)">
						<text class="task__title" :class="{ 'task__title--strikethrough': task.done }">{{ task.title }}</text>
						<text class="task__deadline" :class="{ 'task__deadline--strikethrough': task.done }">{{ task.deadline }}</text>
					</view>
					<view class="task__actions">
						<text class="task__action-btn task__action-btn--edit" @tap.stop="editTask(task)">✎</text>
						<text class="task__action-btn task__action-btn--delete" @tap.stop="deleteTask(task)">×</text>
					</view>
				</view>
			<view v-if="!tasks.length" class="empty">
				<text class="empty__tip">还没有任务，点击右下角添加吧＞﹏＜</text>
			</view>
		</view>
		
		<!-- 页面底部装饰 -->
		<view class="page-footer">
			<text class="page-footer__text">今日事，今日毕</text>
			<view class="page-footer__dots">
				<view class="dot"></view>
				<view class="dot"></view>
				<view class="dot"></view>
			</view>
		</view>
	</view>

	<view class="bottom-bar glass" :class="{ 'glass--active': pageLoaded }">
			<view
				class="bottom-bar__item"
				v-for="item in bottomNavItems"
				:key="item.key"
				:class="{ 'bottom-bar__item--active': activeNav === item.key }"
				@tap="onBottomNavTap(item)"
			>
				<text class="bottom-bar__icon">{{ item.icon }}</text>
				<text class="bottom-bar__label">{{ item.label }}</text>
			</view>
		</view>

		<view class="fab" :class="{ 'fab--pulse': showAddSheet, 'fab--hidden': hideFab }" @tap.stop="toggleAddSheet">
			<text class="fab__icon">+</text>
		</view>

	<view class="sheet-mask" v-if="showAddSheet" @tap="closeAddSheet"></view>
	<view class="sheet glass" :class="{ 'sheet--open': showAddSheet }" @touchmove.stop.prevent>
		<view class="sheet__handle"></view>
		<view class="sheet__header">
			<text class="sheet__title">添加今日任务</text>
			<view class="sheet__close" @tap.stop="closeAddSheet">
				<text class="sheet__close-icon">✕</text>
			</view>
		</view>
		<view class="form-field">
			<text class="form-label">任务名称</text>
			<input class="form-input" placeholder="输入任务标题" v-model="form.title" />
		</view>
		<view class="form-field">
			<text class="form-label">截止时间</text>
			<view class="deadline-options">
				<view class="deadline-option-item" :class="{ 'deadline-option-item--active': form.deadline === '' }" @tap="selectNoDeadline">
					<text class="deadline-option-item__text">不指定时间</text>
				</view>
				<picker mode="date" :value="form.date" :start="minDate" @change="onDateChange">
					<view class="form-value form-value--picker">
						<text>{{ form.date || '选择日期' }}</text>
						<text class="form-arrow">></text>
					</view>
				</picker>
				<picker mode="time" :value="form.time" @change="onTimeChange">
					<view class="form-value form-value--picker">
						<text>{{ form.time || '选择时间' }}</text>
						<text class="form-arrow">></text>
					</view>
				</picker>
			</view>
			<view v-if="form.deadline" class="form-deadline-display">
				<text class="form-deadline-display__text">截止时间：{{ form.deadline }}</text>
			</view>
		</view>
		<button class="sheet__action" type="primary" :disabled="!canSubmit" @tap.stop="confirmTask">添加任务</button>
		</view>

	<view class="sheet-mask" v-if="showEditSheet" @tap="closeEditSheet"></view>
	<view class="sheet glass" :class="{ 'sheet--open': showEditSheet }" @touchmove.stop.prevent>
		<view class="sheet__handle"></view>
		<view class="sheet__header">
			<text class="sheet__title">编辑任务</text>
			<view class="sheet__close" @tap.stop="closeEditSheet">
				<text class="sheet__close-icon">✕</text>
			</view>
		</view>
		<view class="form-field">
			<text class="form-label">任务名称</text>
			<input class="form-input" placeholder="输入任务标题" v-model="form.title" />
		</view>
		<view class="form-field">
			<text class="form-label">截止时间</text>
			<view class="deadline-options">
				<view class="deadline-option-item" :class="{ 'deadline-option-item--active': form.deadline === '' }" @tap="selectNoDeadline">
					<text class="deadline-option-item__text">不指定时间</text>
				</view>
				<picker mode="date" :value="form.date" :start="minDate" @change="onDateChange">
					<view class="form-value form-value--picker">
						<text>{{ form.date || '选择日期' }}</text>
						<text class="form-arrow">></text>
					</view>
				</picker>
				<picker mode="time" :value="form.time" @change="onTimeChange">
					<view class="form-value form-value--picker">
						<text>{{ form.time || '选择时间' }}</text>
						<text class="form-arrow">></text>
					</view>
				</picker>
			</view>
			<view v-if="form.deadline" class="form-deadline-display">
				<text class="form-deadline-display__text">截止时间：{{ form.deadline }}</text>
			</view>
		</view>
		<button class="sheet__action" type="primary" :disabled="!canSubmit" @tap.stop="confirmEditTask">保存修改</button>
		</view>

	</view>
</template>

<script>
export default {
	data() {
		return {
			pageLoaded: false,
			showSideMenu: false,
		showAddSheet: false,
		showEditSheet: false,
		editingTask: null,
			hideFab: false,
			hideBottomBar: false,
			scrollTop: 0,
			lastScrollTop: 0,
			dailyStats: {
				completed: 5,
				active: 9,
				pomodoro: 7,
				pomodoroGoal: 12,
				expired: 1,
				expiredGoal: 4
			},
			tasks: [],
		form: {
			title: '',
			deadline: '',
			date: '',
			time: ''
		},
			sideMenuItems: [
				{ label: '日历', tip: '查看历史事项', action: 'calendar' },
				{ label: '效率洞察', tip: '查看长期趋势' },
				{ label: '任务模板', tip: '复用高频计划' },
				{ label: '专注计时', tip: '开启番茄钟' },
				{ label: '数据同步', tip: 'HarmonyOS 多端共享' }
			],
		bottomNavItems: [
			{ key: 'today', label: '今日', icon: '◎', target: '/pages/index/index' },
			{ key: 'tracking', label: '番茄钟', icon: '◴', target: '/pages/pomodoro/index' },
			{ key: 'habit', label: '习惯', icon: '△', target: '/pages/habit/index' }
		],
			activeNav: 'today',
			pomodoroListener: null
		};
	},
	computed: {
		completionRatio() {
			return this.safeRatio(this.dailyStats.completed, this.dailyStats.active);
		},
		pomodoroRatio() {
			return this.safeRatio(this.dailyStats.pomodoro, this.dailyStats.pomodoroGoal);
		},
		expiredRatio() {
			return this.safeRatio(this.dailyStats.expired, this.dailyStats.expiredGoal);
		},
		statGradients() {
			return {
				completion: this.buildGradientCSS(['#ff5a5f', '#ff9f1f']),
				pomodoro: this.buildGradientCSS(['#4db2ff', '#2962ff']),
				overdue: this.buildGradientCSS(['#7d61ff', '#c39eff']),
				focus: this.buildGradientCSS(['#5affd0', '#39acff'])
			};
		},
		statCards() {
			const clamp = value => Math.max(0, Math.min(1, value || 0));
			const completionPercent = `${Math.round(clamp(this.completionRatio) * 100)}%`;
			const pomodoroPercent = `${Math.round(clamp(this.pomodoroRatio) * 100)}%`;
			const controlRatio = clamp(1 - this.expiredRatio);
			const controlPercent = `${Math.round(controlRatio * 100)}%`;
			const completionStatus = this.describeStatus(clamp(this.completionRatio));
			const pomodoroStatus = this.describeStatus(clamp(this.pomodoroRatio));
			const overdueStatus = this.describeStatus(controlRatio);
			const focusRatio = clamp((clamp(this.completionRatio) + clamp(this.pomodoroRatio) + controlRatio) / 3);
			const focusPercent = `${Math.round(focusRatio * 100)}%`;
			const focusStatus = this.describeStatus(focusRatio);
			const statusLabels = {
				completion: {
					good: '状态良好',
					warn: '保持节奏',
					alert: '需要加速'
				},
				pomodoro: {
					good: '节奏稳定',
					warn: '稍微加把劲',
					alert: '专注时间不足'
				},
				overdue: {
					good: '风险可控',
					warn: '留意潜在过期',
					alert: '尽快处理过期任务'
				},
				focus: {
					good: '节奏协调',
					warn: '注意平衡',
					alert: '抓紧调整状态'
				}
			};
			return [
				{
					key: 'completion',
					label: '任务完成度',
					value: completionPercent,
					desc: '完成更多任务，保持输出节奏',
					extra: `已完成 ${this.dailyStats.completed} / ${this.dailyStats.active} 项`,
					progress: completionPercent,
					gradient: this.statGradients.completion,
					status: completionStatus,
					statusLabel: statusLabels.completion[completionStatus]
				},
				{
					key: 'pomodoro',
					label: '番茄执行',
					value: pomodoroPercent,
					desc: '番茄执行次数体现专注投入',
					extra: `${this.dailyStats.pomodoro}/${this.dailyStats.pomodoroGoal} 个番茄`,
					progress: pomodoroPercent,
					gradient: this.statGradients.pomodoro,
					status: pomodoroStatus,
					statusLabel: statusLabels.pomodoro[pomodoroStatus]
				},
				{
					key: 'overdue',
					label: '过期控制',
					value: controlPercent,
					desc: '保持任务不过期，节奏才更轻松',
					extra: `仅有 ${this.dailyStats.expired} 项过期 (目标 ≤ ${this.dailyStats.expiredGoal})`,
					progress: controlPercent,
					gradient: this.statGradients.overdue,
					status: overdueStatus,
					statusLabel: statusLabels.overdue[overdueStatus]
				},
				{
					key: 'focus',
					label: '效率平衡',
					value: focusPercent,
					desc: '综合完成、专注与过期控制的平衡指数',
					extra: `综合得分 ${focusPercent}`,
					progress: focusPercent,
					gradient: this.statGradients.focus,
					status: focusStatus,
					statusLabel: statusLabels.focus[focusStatus]
				}
			];
		},
		summaryLabel() {
			return `${this.dailyStats.completed} / ${this.dailyStats.active} 已完成`;
		},
		todayLabel() {
			const date = new Date();
			const month = date.getMonth() + 1;
			const day = date.getDate();
			return `${month}月${day}日`;
		},
	canSubmit() {
		return this.form.title.trim().length > 0;
	},
	minDate() {
		const today = new Date();
		const year = today.getFullYear();
		const month = String(today.getMonth() + 1).padStart(2, '0');
		const day = String(today.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	}
},
onLoad() {
	uni.hideTabBar({ animation: false });
	this.loadLocalData();
	this.initializeSampleTasks();
	this.syncPomodoroCount();
	this.registerPomodoroListener();
	setTimeout(() => {
		this.pageLoaded = true;
	}, 80);
},
onPageScroll(e) {
	if (!e) return;
	
	const currentScrollTop = e.scrollTop || 0;
	const delta = currentScrollTop - this.lastScrollTop;
	
	if (Math.abs(delta) < 1) {
		return;
	}
	
	// 向下滚动超过150时隐藏FAB
	if (currentScrollTop > 150 && delta > 0) {
		this.hideFab = true;
	} 
	// 向上滚动或滚动位置小于100时显示FAB
	else if (delta < 0 || currentScrollTop < 100) {
		this.hideFab = false;
	}
	
	this.lastScrollTop = currentScrollTop;
},
	onShow() {
		this.syncPomodoroCount();
	},
	onUnload() {
		this.unregisterPomodoroListener();
	},
	methods: {
		buildGradientCSS(colors) {
			const stops = colors.map((color, index) => {
				const percent = colors.length === 1 ? 0 : (index / (colors.length - 1)) * 100;
				return `${color} ${percent}%`;
			}).join(', ');
			return `linear-gradient(135deg, ${stops})`;
		},
		describeStatus(ratio) {
			if (ratio >= 0.85) {
				return 'good';
			}
			if (ratio >= 0.55) {
				return 'warn';
			}
			return 'alert';
		},
		safeRatio(numerator, denominator) {
			if (!denominator) {
				return 0;
			}
			const ratio = numerator / denominator;
			if (ratio < 0) {
				return 0;
			}
			if (ratio > 1) {
				return 1;
			}
			return ratio;
		},
		toggleSideMenu() {
			this.showSideMenu = !this.showSideMenu;
		},
		onSideMenuItemTap(item) {
			if (item.action === 'calendar') {
				uni.navigateTo({
					url: '/pages/calendar/index'
				});
				this.showSideMenu = false;
			}
		},
		toggleAddSheet() {
			this.showAddSheet = !this.showAddSheet;
			if (!this.showAddSheet) {
				this.resetForm();
			}
		},
	closeAddSheet() {
		this.showAddSheet = false;
		this.resetForm();
	},
	onDateChange(e) {
		this.form.date = e.detail.value;
		this.updateDeadline();
	},
	onTimeChange(e) {
		this.form.time = e.detail.value;
		this.updateDeadline();
	},
	selectNoDeadline() {
		this.form.deadline = '';
		this.form.date = '';
		this.form.time = '';
	},
	updateDeadline() {
		if (this.form.date && this.form.time) {
			const date = new Date(`${this.form.date} ${this.form.time}`);
			const today = new Date();
			today.setHours(0, 0, 0, 0);
			const taskDate = new Date(date);
			taskDate.setHours(0, 0, 0, 0);
			
			const diffDays = Math.floor((taskDate - today) / (1000 * 60 * 60 * 24));
			const month = date.getMonth() + 1;
			const day = date.getDate();
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			
			if (diffDays === 0) {
				this.form.deadline = `今天 ${hours}:${minutes}`;
			} else if (diffDays === 1) {
				this.form.deadline = `明天 ${hours}:${minutes}`;
			} else if (diffDays === -1) {
				this.form.deadline = `昨天 ${hours}:${minutes}`;
			} else {
				this.form.deadline = `${month}月${day}日 ${hours}:${minutes}`;
			}
		} else {
			this.form.deadline = '';
		}
	},
	onBottomNavTap(item) {
		if (item.key === this.activeNav) {
			return;
		}
		if (item.target) {
			uni.switchTab({ url: item.target });
		}
	},
		onTaskToggle(task, event) {
			const checked = event.detail.value;
			if (task.done === checked) {
				return;
			}
			task.done = checked;
			if (checked) {
				this.dailyStats.completed += 1;
			} else {
				this.dailyStats.completed = Math.max(this.dailyStats.completed - 1, 0);
			}
		},
	toggleTaskDone(task) {
		task.done = !task.done;
		if (task.done) {
			this.dailyStats.completed += 1;
		} else {
			this.dailyStats.completed = Math.max(this.dailyStats.completed - 1, 0);
		}
		this.saveLocalData();
	},
	editTask(task) {
		this.editingTask = task;
		this.form.title = task.title;
		this.form.deadline = task.deadline;
		
		// 解析deadline为date和time
		if (task.deadline && task.deadline !== '无截止时间') {
			const today = new Date();
			let targetDate = new Date();
			
			if (task.deadline.includes('今天')) {
				targetDate = new Date(today);
			} else if (task.deadline.includes('明天')) {
				targetDate = new Date(today);
				targetDate.setDate(today.getDate() + 1);
			} else {
				// 解析 "X月X日 HH:MM" 格式
				const match = task.deadline.match(/(\d+)月(\d+)日\s+(\d+):(\d+)/);
				if (match) {
					targetDate = new Date(today.getFullYear(), parseInt(match[1]) - 1, parseInt(match[2]));
				}
			}
			
			// 提取时间
			const timeMatch = task.deadline.match(/(\d+):(\d+)/);
			if (timeMatch) {
				targetDate.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]));
			}
			
			const year = targetDate.getFullYear();
			const month = String(targetDate.getMonth() + 1).padStart(2, '0');
			const day = String(targetDate.getDate()).padStart(2, '0');
			const hours = String(targetDate.getHours()).padStart(2, '0');
			const minutes = String(targetDate.getMinutes()).padStart(2, '0');
			
			this.form.date = `${year}-${month}-${day}`;
			this.form.time = `${hours}:${minutes}`;
		} else {
			this.form.date = '';
			this.form.time = '';
		}
		
		this.showEditSheet = true;
	},
	deleteTask(task) {
		uni.showModal({
			title: '确认删除',
			content: '确定要删除这个任务吗？',
			success: (res) => {
				if (res.confirm) {
					const index = this.tasks.findIndex(t => t.id === task.id);
					if (index !== -1) {
						this.tasks.splice(index, 1);
						this.dailyStats.active = Math.max(this.dailyStats.active - 1, 0);
						if (task.done) {
							this.dailyStats.completed = Math.max(this.dailyStats.completed - 1, 0);
						}
						this.saveLocalData();
					}
				}
			}
		});
	},
	confirmTask() {
		if (!this.canSubmit) {
			return;
		}
		const now = new Date();
		const createdDate = this.buildTodayKey();
		const targetDate = this.extractTargetDateFromDeadline(this.form.deadline, this.form.date);
		
		const newTask = {
			id: Date.now(),
			title: this.form.title,
			deadline: this.form.deadline || '无截止时间',
			done: false,
			expired: false,
			createdDate: createdDate,
			targetDate: targetDate
		};
		this.tasks.unshift(newTask);
		this.dailyStats.active += 1;
		this.saveLocalData();
		this.resetForm();
		this.closeAddSheet();
	},
	confirmEditTask() {
		if (!this.canSubmit || !this.editingTask) {
			return;
		}
		this.editingTask.title = this.form.title;
		this.editingTask.deadline = this.form.deadline || '无截止时间';
		this.editingTask.targetDate = this.extractTargetDateFromDeadline(this.form.deadline, this.form.date);
		// Preserve createdDate if it exists, otherwise set it to today
		if (!this.editingTask.createdDate) {
			this.editingTask.createdDate = this.buildTodayKey();
		}
		this.saveLocalData();
		this.resetForm();
		this.editingTask = null;
		this.closeEditSheet();
	},
	resetForm() {
		this.form.title = '';
		this.form.deadline = '';
		this.form.date = '';
		this.form.time = '';
	},
	closeEditSheet() {
		this.showEditSheet = false;
		this.editingTask = null;
		this.resetForm();
	},
		registerPomodoroListener() {
			if (this.pomodoroListener) {
				return;
			}
			this.pomodoroListener = () => {
				this.syncPomodoroCount();
			};
			uni.$on('pomodoro-updated', this.pomodoroListener);
		},
		unregisterPomodoroListener() {
			if (!this.pomodoroListener) {
				return;
			}
			uni.$off('pomodoro-updated', this.pomodoroListener);
			this.pomodoroListener = null;
		},
		syncPomodoroCount() {
			const store = this.readPomodoroStore();
			const key = this.buildTodayKey();
			const value = store[key];
			this.dailyStats.pomodoro = typeof value === 'number' ? value : 0;
		},
		readPomodoroStore() {
			try {
				const stored = uni.getStorageSync('pomodoroCounts');
				if (stored && typeof stored === 'object') {
					return stored;
				}
			} catch (err) {
				console.warn('读取番茄统计失败', err);
			}
			return {};
		},
	buildTodayKey() {
		const date = new Date();
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	},
	extractTargetDateFromDeadline(deadlineText, dateValue) {
		// 优先使用日期选择器的值，即便展示文本还没生成
		if (dateValue) {
			return dateValue;
		}
		
		// 如果仍然没有任何截止信息，则视为无具体日期
		if (!deadlineText || deadlineText === '无截止时间') {
			return null;
		}
		
		// Parse deadline text to extract target date
		const today = new Date();
		let targetDate = new Date(today);
		
		if (deadlineText.includes('今天')) {
			// Already set to today
		} else if (deadlineText.includes('明天')) {
			targetDate.setDate(today.getDate() + 1);
		} else if (deadlineText.includes('昨天')) {
			targetDate.setDate(today.getDate() - 1);
		} else {
			// Try to parse "X月X日" format
			const match = deadlineText.match(/(\d+)月(\d+)日/);
			if (match) {
				const month = parseInt(match[1]) - 1;
				const day = parseInt(match[2]);
				targetDate = new Date(today.getFullYear(), month, day);
			} else {
				// If can't parse, return null
				return null;
			}
		}
		
		const year = targetDate.getFullYear();
		const month = String(targetDate.getMonth() + 1).padStart(2, '0');
		const day = String(targetDate.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	},
	saveLocalData() {
		try {
			const dateKey = this.buildTodayKey();
			// Ensure every task carries basic metadata before persisting
			this.tasks.forEach(task => {
				if (!task.createdDate) {
					task.createdDate = dateKey;
				}
				if (task.targetDate === undefined || task.targetDate === '') {
					task.targetDate = this.extractTargetDateFromDeadline(task.deadline, null);
				}
			});
			const serializedTasks = this.tasks.map(task => ({ ...task }));
			uni.setStorageSync('todayTasks', serializedTasks);
			uni.setStorageSync('todayStats', this.dailyStats);
			
			// Save tasks to history by date
			let taskHistory = {};
			try {
				const stored = uni.getStorageSync('taskHistory');
				if (stored && typeof stored === 'object') {
					taskHistory = stored;
				}
			} catch (err) {
				console.warn('读取任务历史失败', err);
			}
			taskHistory[dateKey] = serializedTasks.map(task => ({ ...task }));
			uni.setStorageSync('taskHistory', taskHistory);
		} catch (err) {
			console.error('保存数据失败:', err);
		}
	},
	loadLocalData() {
		try {
			const savedTasks = uni.getStorageSync('todayTasks');
			const savedStats = uni.getStorageSync('todayStats');
			
			if (savedTasks && Array.isArray(savedTasks)) {
				// Migrate old tasks to add metadata if missing
				const todayKey = this.buildTodayKey();
				this.tasks = savedTasks.map(task => {
					if (!task.createdDate) {
						task.createdDate = todayKey;
					}
					if (task.targetDate === undefined) {
						task.targetDate = this.extractTargetDateFromDeadline(task.deadline, null);
					}
					return task;
				});
			}
			if (savedStats && typeof savedStats === 'object') {
				this.dailyStats = { ...this.dailyStats, ...savedStats };
			}
		} catch (err) {
			console.error('加载数据失败:', err);
		}
	},
	initializeSampleTasks() {
		// Only add sample tasks if there are no existing tasks
		if (this.tasks.length === 0) {
			const todayKey = this.buildTodayKey();
			const tomorrow = new Date();
			tomorrow.setDate(tomorrow.getDate() + 1);
			const tomorrowKey = this.getDateKey(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
			
			this.tasks = [
				{ 
					id: Date.now() + 1, 
					title: '整理会议纪要', 
					deadline: '今天 18:30', 
					done: false, 
					expired: false,
					createdDate: todayKey,
					targetDate: todayKey
				},
				{ 
					id: Date.now() + 2, 
					title: '晚间冥想 20 分钟', 
					deadline: '今天 21:00', 
					done: true, 
					expired: false,
					createdDate: todayKey,
					targetDate: todayKey
				},
				{ 
					id: Date.now() + 3, 
					title: '复盘项目进度', 
					deadline: '明天 09:00', 
					done: false, 
					expired: false,
					createdDate: todayKey,
					targetDate: tomorrowKey
				},
				{ 
					id: Date.now() + 4, 
					title: '每日锻炼计划', 
					deadline: '无截止时间', 
					done: false, 
					expired: false,
					createdDate: todayKey,
					targetDate: null
				}
			];
			
			this.dailyStats.active = 4;
			this.dailyStats.completed = 1;
			
			// Save the sample tasks
			this.saveLocalData();
		}
	},
	getDateKey(year, month, day) {
		const m = String(month + 1).padStart(2, '0');
		const d = String(day).padStart(2, '0');
		return `${year}-${m}-${d}`;
	},
}
};
</script>

<style scoped>
.page {
	position: relative;
	min-height: 100vh;
	background: linear-gradient(160deg, #0f1b2b 0%, #1b2d45 55%, #18323e 100%);
	color: #f6f7fb;
	overflow: hidden;
	padding-bottom: 200rpx;
}

.page__frost {
	position: absolute;
	left: -40vw;
	top: -40vh;
	width: 120vw;
	height: 120vh;
	background: radial-gradient(circle at 30% 20%, rgba(110,203,255,0.45), transparent 55%),
		radial-gradient(circle at 70% 30%, rgba(200,155,255,0.4), transparent 60%),
		radial-gradient(circle at 50% 80%, rgba(255,159,168,0.35), transparent 60%);
	filter: blur(60rpx);
	z-index: 1;
}

.glass {
	background: rgba(255, 255, 255, 0.08);
	border: 1rpx solid rgba(255, 255, 255, 0.12);
	backdrop-filter: blur(50rpx);
	border-radius: 32rpx;
	box-shadow: 0 26rpx 70rpx rgba(9, 20, 35, 0.55);
	transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1),
		box-shadow 0.6s cubic-bezier(0.16, 1, 0.3, 1),
		opacity 0.6s ease;
	opacity: 0;
	transform: translateY(30rpx);
}

.glass--active {
	opacity: 1;
	transform: translateY(0);
}

.top-bar {
	position: relative;
	margin: 60rpx 40rpx 24rpx;
	height: 120rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 30rpx;
	z-index: 3;
}

.top-bar__left,
.top-bar__right {
	width: 120rpx;
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.top-bar__right {
	justify-content: flex-end;
}

.top-bar__title {
	font-size: 42rpx;
	font-weight: 600;
	letter-spacing: 6rpx;
	color: #f9fbff;
}

.top-bar__date {
	font-size: 26rpx;
	color: rgba(255,255,255,0.75);
}

.icon-more {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	height: 40rpx;
	padding: 10rpx 0;
}

.icon-more view {
	width: 42rpx;
	height: 4rpx;
	border-radius: 999rpx;
	background: rgba(255,255,255,0.88);
	transform-origin: left;
	transition: transform 0.35s ease;
}

.side-menu {
	position: fixed;
	left: 0;
	top: 0;
	width: 520rpx;
	height: 100vh;
	background: rgba(18, 30, 45, 0.85);
	backdrop-filter: blur(70rpx);
	transform: translateX(-100%);
	transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	z-index: 6;
	padding: 120rpx 40rpx 80rpx;
}

.side-menu--open {
	transform: translateX(0);
}

.side-menu__mask {
	position: fixed;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	background: rgba(10,17,28,0.6);
	backdrop-filter: blur(6rpx);
	z-index: 5;
	animation: fade-in 0.4s ease;
}

.side-menu__title {
	font-size: 38rpx;
	font-weight: 600;
}

.side-menu__list {
	margin-top: 70rpx;
	display: flex;
	flex-direction: column;
	gap: 44rpx;
}

.side-menu__item-label {
	font-size: 32rpx;
	font-weight: 500;
	color: #f6f7fb;
}

.side-menu__item-tip {
	margin-top: 12rpx;
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}

.main {
	position: relative;
	padding: 0 40rpx;
	padding-bottom: calc(240rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	z-index: 2;
}

/* 底部渐变遮罩 */
.main::after {
	content: '';
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	height: 200rpx;
	background: linear-gradient(to top, rgba(15, 27, 43, 0.95) 0%, rgba(15, 27, 43, 0.6) 40%, transparent 100%);
	pointer-events: none;
	z-index: 1;
}

.efficiency {
	padding: 42rpx 32rpx 58rpx;
	margin-bottom: 40rpx;
}

.card-header {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	margin-bottom: 38rpx;
}

.card-title {
	font-size: 36rpx;
	font-weight: 600;
}

.card-sub {
	font-size: 24rpx;
	color: rgba(255,255,255,0.65);
}


.stats-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 26rpx;
}

.stat-card {
	position: relative;
	padding: 28rpx;
	border-radius: 26rpx;
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.1);
	display: flex;
	flex-direction: column;
	gap: 18rpx;
	box-shadow: 0 18rpx 48rpx rgba(6, 14, 26, 0.32);
	transform: translateY(0);
	transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
		box-shadow 0.35s ease;
}

.stat-card:active {
	transform: translateY(6rpx);
	box-shadow: 0 12rpx 28rpx rgba(6, 14, 26, 0.28);
}

.stat-card__halo {
	position: absolute;
	left: 50%;
	top: -18rpx;
	transform: translateX(-50%);
	width: 110rpx;
	height: 10rpx;
	border-radius: 999rpx;
	background-size: 100%;
	opacity: 0.9;
	filter: blur(0.5px);
}

.stat-card__header {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
}

.stat-card__label {
	font-size: 28rpx;
	color: rgba(255,255,255,0.75);
}

.stat-card__value {
	font-size: 48rpx;
	font-weight: 700;
	color: #fefefe;
}

.stat-card__desc {
	font-size: 24rpx;
	color: rgba(255,255,255,0.62);
}

.stat-card__bar {
	position: relative;
	height: 18rpx;
	border-radius: 12rpx;
	background: rgba(255,255,255,0.12);
	overflow: hidden;
}

.stat-card__bar-fill {
	position: absolute;
	left: 0;
	top: 0;
	height: 100%;
	border-radius: 12rpx;
	background-size: 140%;
	transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.stat-card__footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 22rpx;
	color: rgba(255,255,255,0.55);
}

.stat-card__status {
	padding: 6rpx 16rpx;
	border-radius: 999rpx;
	font-size: 22rpx;
	font-weight: 500;
	border: 1rpx solid transparent;
}

.stat-card__status--good {
	color: #74f7ca;
	border-color: rgba(116,247,202,0.35);
	background: rgba(116,247,202,0.12);
}

.stat-card__status--warn {
	color: #ffd666;
	border-color: rgba(255,214,102,0.35);
	background: rgba(255,214,102,0.12);
}

.stat-card__status--alert {
	color: #ff7b8a;
	border-color: rgba(255,123,138,0.35);
	background: rgba(255,123,138,0.12);
}

@media screen and (max-width: 700px) {
	.stats-grid {
		grid-template-columns: repeat(auto-fit, minmax(260rpx, 1fr));
	}

	.stat-card {
		padding: 24rpx;
	}
}

.tasks {
	padding: 40rpx 32rpx 32rpx;
	margin-bottom: 40rpx;
}

.task {
	margin-bottom: 26rpx;
	padding: 30rpx 26rpx;
	border-radius: 26rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.1);
	transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
		background 0.35s ease;
}

.task--done {
	background: rgba(110,203,255,0.15);
	border-color: rgba(110,203,255,0.35);
}

.task--expired {
	background: rgba(255,159,168,0.16);
	border-color: rgba(255,159,168,0.38);
}

.task__info {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	flex: 1;
	cursor: pointer;
}

.task__title {
	font-size: 30rpx;
	font-weight: 500;
	transition: opacity 0.3s ease;
}

.task__title--strikethrough {
	text-decoration: line-through;
	opacity: 0.6;
}

.task__deadline {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
	transition: opacity 0.3s ease;
}

.task__deadline--strikethrough {
	text-decoration: line-through;
	opacity: 0.5;
}

.task__actions {
	display: flex;
	gap: 20rpx;
	align-items: center;
	margin-left: 20rpx;
}

.task__action-btn {
	width: 60rpx;
	height: 60rpx;
	border-radius: 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	background: rgba(255,255,255,0.08);
	border: 1rpx solid rgba(255,255,255,0.12);
	transition: all 0.25s ease;
	cursor: pointer;
}

.task__action-btn--edit {
	color: #6ecbff;
}

.task__action-btn--edit:active {
	background: rgba(110,203,255,0.2);
	transform: scale(0.9);
}

.task__action-btn--delete {
	color: #ff7b8a;
	font-size: 48rpx;
}

.task__action-btn--delete:active {
	background: rgba(255,123,138,0.2);
	transform: scale(0.9);
}

.empty {
	padding: 80rpx 0;
	text-align: center;
}

.empty__tip {
	font-size: 26rpx;
	color: rgba(255,255,255,0.6);
}

/* 页面底部装饰 */
.page-footer {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	padding: 30rpx 0 20rpx;
	opacity: 0.5;
}

.page-footer__text {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
	letter-spacing: 2rpx;
}

.page-footer__dots {
	display: flex;
	gap: 12rpx;
}

.page-footer__dots .dot {
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
	background: rgba(255,255,255,0.3);
	animation: dot-fade 2s infinite;
}

.page-footer__dots .dot:nth-child(2) {
	animation-delay: 0.3s;
}

.page-footer__dots .dot:nth-child(3) {
	animation-delay: 0.6s;
}

@keyframes dot-fade {
	0%, 100% {
		opacity: 0.3;
		transform: scale(1);
	}
	50% {
		opacity: 1;
		transform: scale(1.2);
	}
}

.bottom-bar {
	position: fixed;
	left: 40rpx;
	right: 40rpx;
	bottom: 40rpx;
	height: 120rpx;
	border-radius: 60rpx;
	display: flex;
	align-items: center;
	justify-content: space-around;
	z-index: 3;
	padding: 0 32rpx;
	transition: transform 0.3s ease, opacity 0.3s ease;
}

.bottom-bar__item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
	font-size: 24rpx;
	color: rgba(255,255,255,0.62);
	flex: 1;
	padding: 10rpx 0;
	transition: transform 0.25s ease, color 0.25s ease;
}

.bottom-bar__item--active {
	color: #ffffff;
	font-weight: 600;
	transform: translateY(-6rpx);
}

.bottom-bar__icon {
	font-size: 32rpx;
}

.bottom-bar__item--disabled {
	color: rgba(255,255,255,0.35);
}

.bottom-bar--hidden {
	opacity: 0 !important;
	pointer-events: none !important;
	transform: translateY(120%) !important;
}

.fab {
	position: fixed;
	width: 140rpx;
	height: 140rpx;
	border-radius: 70rpx;
	background: linear-gradient(135deg, rgba(110,203,255,0.9), rgba(200,155,255,0.9));
	box-shadow: 0 28rpx 46rpx rgba(10, 20, 35, 0.55);
	bottom: calc(200rpx + constant(safe-area-inset-bottom));
	bottom: calc(200rpx + env(safe-area-inset-bottom));
	right: 70rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #101828;
	font-size: 90rpx;
	font-weight: 400;
	z-index: 10;
	transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
		box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1),
		opacity 0.3s ease;
}

.fab--pulse {
	transform: scale(1.06);
	box-shadow: 0 32rpx 56rpx rgba(8, 16, 30, 0.55);
}

.fab--hidden {
	opacity: 0 !important;
	pointer-events: none !important;
	transform: translateY(30rpx) scale(0.8) !important;
}

.fab__icon {
	margin-top: -6rpx;
}

.sheet-mask {
	position: fixed;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	background: rgba(10,17,28,0.55);
	backdrop-filter: blur(6rpx);
	z-index: 11;
	animation: fade-in 0.4s ease;
}

.sheet {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 42rpx 40rpx 90rpx;
	border-radius: 46rpx 46rpx 0 0;
	z-index: 12;
	transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
	transform: translateY(120%);
	pointer-events: none;
	opacity: 0;
}

.sheet--open {
	transform: translateY(0);
	pointer-events: auto;
	opacity: 1;
}

.sheet__handle {
	width: 120rpx;
	height: 10rpx;
	border-radius: 999rpx;
	background: rgba(255,255,255,0.35);
	margin: 0 auto 30rpx;
}

.sheet__header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 40rpx;
}

.sheet__title {
	font-size: 34rpx;
	font-weight: 600;
}

.sheet__close {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255,255,255,0.08);
	border-radius: 50%;
	transition: all 0.3s ease;
}

.sheet__close:active {
	background: rgba(255,123,138,0.2);
	transform: scale(0.9);
}

.sheet__close-icon {
	font-size: 36rpx;
	color: rgba(255,255,255,0.8);
	font-weight: 300;
}

.form-field {
	margin-bottom: 40rpx;
	display: flex;
	flex-direction: column;
	gap: 18rpx;
}

.form-label {
	font-size: 26rpx;
	color: rgba(255,255,255,0.7);
}

.form-input {
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.08);
	border-radius: 24rpx;
	padding: 24rpx 28rpx;
	color: #ffffff;
	font-size: 30rpx;
}

.form-field--select {
	position: relative;
}

.form-value {
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.08);
	border-radius: 24rpx;
	padding: 24rpx 28rpx;
	color: #ffffff;
	font-size: 30rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.form-value--picker {
	flex: 1;
	margin-left: 16rpx;
}

.form-value--picker:first-of-type {
	margin-left: 0;
}

.form-arrow {
	font-size: 36rpx;
	color: rgba(255,255,255,0.45);
}

.deadline-options {
	display: flex;
	flex-direction: row;
	gap: 16rpx;
	align-items: center;
	flex-wrap: wrap;
}

.deadline-option-item {
	flex: 0 0 auto;
	padding: 20rpx 24rpx;
	background: rgba(255,255,255,0.06);
	border: 2rpx solid rgba(255,255,255,0.1);
	border-radius: 20rpx;
	text-align: center;
	transition: all 0.3s ease;
}

.deadline-option-item--active {
	background: rgba(110,203,255,0.15);
	border-color: rgba(110,203,255,0.4);
}

.deadline-option-item__text {
	font-size: 26rpx;
	color: rgba(255,255,255,0.9);
}

.form-deadline-display {
	margin-top: 16rpx;
	padding: 16rpx 20rpx;
	background: rgba(110,203,255,0.1);
	border-radius: 16rpx;
	border: 1rpx solid rgba(110,203,255,0.2);
}

.form-deadline-display__text {
	font-size: 26rpx;
	color: #6ecbff;
}

.form-slider {
	margin: 0 10rpx;
}

.slider-value {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}

.sheet__action {
	margin-top: 10rpx;
	background: linear-gradient(135deg, rgba(110,203,255,0.85), rgba(200,155,255,0.9));
	color: #101828;
	font-size: 32rpx;
	border: none;
	border-radius: 24rpx;
	height: 96rpx;
	line-height: 96rpx;
}

.sheet__action[disabled] {
	background: rgba(255,255,255,0.12);
	color: rgba(255,255,255,0.4);
}

.deadline {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(18, 30, 45, 0.95);
	border-radius: 46rpx 46rpx 0 0;
	padding: 34rpx 36rpx 120rpx;
	z-index: 13;
	transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
	transform: translateY(120%);
	pointer-events: none;
}

.deadline--open {
	transform: translateY(0);
	pointer-events: auto;
}

.deadline__header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 30rpx;
}

.deadline__title {
	font-size: 32rpx;
	font-weight: 600;
}

.deadline__close {
	font-size: 26rpx;
	color: rgba(255,255,255,0.7);
}

.deadline__body {
	max-height: 460rpx;
}

.deadline-group {
	margin-bottom: 24rpx;
}

.deadline-group__label {
	font-size: 26rpx;
	color: rgba(255,255,255,0.6);
	margin-bottom: 16rpx;
}

.deadline-group__items {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.deadline-option {
	background: rgba(255,255,255,0.06);
	border-radius: 24rpx;
	padding: 24rpx 28rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
	border: 1rpx solid transparent;
}

.deadline-option--active {
	border-color: rgba(110,203,255,0.5);
	background: rgba(110,203,255,0.18);
}

.deadline-option__text {
	font-size: 30rpx;
	font-weight: 500;
}

.deadline-option__sub {
	font-size: 24rpx;
	color: rgba(255,255,255,0.55);
}

@keyframes fade-in {
	0% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
}

scroll-view {
	box-sizing: border-box;
}
</style>
