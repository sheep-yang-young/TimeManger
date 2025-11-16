<template>
	<view class="page">
		<view class="page__frost"></view>

		<view class="top-bar glass" :class="{ 'glass--active': pageLoaded }">
			<view class="top-bar__left">
				<text class="top-bar__back">◉</text>
			</view>
			<view class="top-bar__center">
				<text class="top-bar__title">习惯养成</text>
				<text class="top-bar__subtitle">每一次坚持，都在塑造更好的自己</text>
			</view>
			<view class="top-bar__right">
				<view class="energy-badge">
					<text class="energy-icon">⚡</text>
					<text class="energy-value">{{ totalEnergy }}</text>
				</view>
				<view class="debug-btn" @tap.stop="toggleDebugPanel">
					<text class="debug-btn__icon">🔧</text>
				</view>
			</view>
		</view>

		<view class="main">
		<!-- 能量概览卡片 -->
			<view class="energy-overview glass" :class="{ 'glass--active': pageLoaded }">
				<view class="energy-stats">
					<view class="energy-stat">
						<text class="energy-stat__value">{{ activeHabits }}</text>
						<text class="energy-stat__label">活跃习惯</text>
					</view>
					<view class="energy-divider"></view>
					<view class="energy-stat">
						<text class="energy-stat__value">{{ longestStreak }}</text>
						<text class="energy-stat__label">最长连续</text>
					</view>
					<view class="energy-divider"></view>
					<view class="energy-stat">
						<text class="energy-stat__value">{{ totalCheckins }}</text>
						<text class="energy-stat__label">累计打卡</text>
					</view>
				</view>
				<view class="level-progress">
					<view class="level-progress__header">
						<text class="level-progress__label">习惯大师 Lv.{{ currentLevel }}</text>
						<text class="level-progress__exp">{{ currentExp }}/{{ nextLevelExp }} 经验</text>
					</view>
					<view class="level-progress__bar">
						<view class="level-progress__fill" :style="{ width: levelProgress }"></view>
					</view>
				</view>
			</view>

			<!-- 本周打卡热力图 -->
			<view class="heatmap glass" :class="{ 'glass--active': pageLoaded }">
				<view class="card-header">
					<text class="card-title">本周打卡</text>
					<text class="card-sub">{{ weekCheckinCount }} 次完成</text>
				</view>
				<view class="heatmap-grid">
					<view 
						class="heatmap-cell" 
						v-for="(day, index) in weekDays" 
						:key="index"
						:class="getHeatmapClass(day.count)"
					>
						<text class="heatmap-cell__label">{{ day.label }}</text>
						<view class="heatmap-cell__bar">
							<view class="heatmap-cell__fill" :style="{ height: day.height }"></view>
						</view>
						<text class="heatmap-cell__count">{{ day.count }}</text>
					</view>
				</view>
			</view>

			<!-- 习惯列表 -->
			<view class="habits glass" :class="{ 'glass--active': pageLoaded }">
				<view class="card-header">
					<text class="card-title">我的习惯</text>
					<text class="card-sub">{{ todayCheckinCount }}/{{ habits.length }} 今日完成</text>
				</view>

				<view v-for="habit in habits" :key="habit.id" class="habit-card" :class="getHabitCardClass(habit)">
					<view class="habit-card__main" @tap="toggleHabit(habit)">
						<view class="habit-card__left">
							<view class="habit-checkbox" :class="{ 'habit-checkbox--checked': habit.checkedToday }">
								<text class="habit-checkbox__icon">{{ habit.checkedToday ? '✓' : '' }}</text>
							</view>
							<view class="habit-info">
								<text class="habit-title">{{ habit.title }}</text>
								<view class="habit-meta">
									<text class="habit-meta__badge" :class="`habit-meta__badge--${habit.difficulty}`">
										{{ getDifficultyLabel(habit.difficulty) }}
									</text>
									<text class="habit-meta__time">{{ habit.time }}</text>
									<text class="habit-meta__energy">+{{ habit.energy }}⚡</text>
								</view>
							</view>
						</view>
						<view class="habit-card__right">
							<view class="habit-streak">
								<text class="habit-streak__value">{{ habit.streak }}</text>
								<text class="habit-streak__label">天</text>
							</view>
						</view>
					</view>

					<!-- 习惯链条可视化 -->
					<view class="habit-chain" v-if="habit.streak >= 3">
						<view class="habit-chain__title">
							<text class="habit-chain__label">连续链条</text>
							<text class="habit-chain__milestone" v-if="getNextMilestone(habit.streak)">
								距离 {{ getNextMilestone(habit.streak) }} 天里程碑还剩 {{ getNextMilestone(habit.streak) - habit.streak }} 天
							</text>
						</view>
						<view class="habit-chain__dots">
							<view 
								class="chain-dot" 
								v-for="index in Math.min(habit.streak, 14)" 
								:key="index"
								:class="getChainDotClass(index, habit.streak)"
							></view>
							<text class="chain-more" v-if="habit.streak > 14">+{{ habit.streak - 14 }}</text>
						</view>
						<view class="habit-milestones">
							<view 
								class="milestone" 
								v-for="ms in milestones" 
								:key="ms.days"
								:class="{ 'milestone--achieved': habit.streak >= ms.days }"
							>
								<text class="milestone__icon">{{ ms.icon }}</text>
								<text class="milestone__days">{{ ms.days }}天</text>
							</view>
						</view>
					</view>

					<!-- 操作按钮 -->
					<view class="habit-actions">
						<button class="habit-action-btn habit-action-btn--edit" @tap.stop="editHabit(habit)">
							<text>✎ 编辑</text>
						</button>
						<button class="habit-action-btn habit-action-btn--delete" @tap.stop="deleteHabit(habit)">
							<text>× 删除</text>
						</button>
					</view>
				</view>

			<view v-if="!habits.length" class="empty">
				<text class="empty__icon">🌱</text>
				<text class="empty__tip">还没有习惯，点击右下角创建第一个习惯吧！</text>
			</view>
		</view>
		
		<!-- 页面底部装饰 -->
		<view class="page-footer">
			<text class="page-footer__text">{{ inspirationalQuote }}</text>
			<view class="page-footer__dots">
				<view class="dot"></view>
				<view class="dot"></view>
				<view class="dot"></view>
			</view>
		</view>
	</view>

	<!-- 底部导航栏 -->
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

	<!-- 浮动添加按钮 -->
	<view class="fab" :class="{ 'fab--pulse': showAddSheet, 'fab--hidden': hideFab }" @tap.stop="toggleAddSheet">
		<text class="fab__icon">+</text>
	</view>

	<!-- 添加/编辑习惯表单 -->
	<view class="sheet-mask" v-if="showAddSheet" @tap="closeAddSheet"></view>
	<view class="sheet glass" :class="{ 'sheet--open': showAddSheet }" @touchmove.stop.prevent>
		<view class="sheet__handle"></view>
		<view class="sheet__header">
			<text class="sheet__title">{{ isEditing ? '编辑习惯' : '创建新习惯' }}</text>
			<view class="sheet__close" @tap.stop="closeAddSheet">
				<text class="sheet__close-icon">✕</text>
			</view>
		</view>
		<view class="form-field">
			<text class="form-label">习惯名称</text>
			<input class="form-input" placeholder="例如：每天阅读30分钟" v-model="form.title" />
		</view>
		<view class="form-field">
			<text class="form-label">执行时段</text>
			<view class="time-slots">
				<view 
					class="time-slot" 
					v-for="slot in timeSlots" 
					:key="slot.value"
					:class="{ 'time-slot--active': form.time === slot.value }"
					@tap="selectTimeSlot(slot.value)"
				>
					<text class="time-slot__icon">{{ slot.icon }}</text>
					<text class="time-slot__label">{{ slot.label }}</text>
				</view>
			</view>
		</view>
		<view class="form-field">
			<text class="form-label">难度等级</text>
			<view class="difficulty-levels">
				<view 
					class="difficulty-level" 
					v-for="level in difficultyLevels" 
					:key="level.value"
					:class="[
						`difficulty-level--${level.value}`,
						{ 'difficulty-level--active': form.difficulty === level.value }
					]"
					@tap="selectDifficulty(level.value)"
				>
					<text class="difficulty-level__label">{{ level.label }}</text>
					<text class="difficulty-level__energy">+{{ level.energy }}⚡</text>
					<text class="difficulty-level__desc">{{ level.desc }}</text>
				</view>
			</view>
		</view>
		<button class="sheet__action" type="primary" :disabled="!canSubmit" @tap.stop="confirmHabit">
			{{ isEditing ? '保存修改' : '创建习惯' }}
		</button>
	</view>

	<!-- 调试工具面板 -->
	<view class="sheet-mask" v-if="showDebugPanel" @tap="closeDebugPanel"></view>
	<view class="debug-panel glass" :class="{ 'debug-panel--open': showDebugPanel }" @touchmove.stop.prevent>
		<view class="sheet__handle"></view>
		<view class="sheet__header">
			<text class="sheet__title">调试工具</text>
			<view class="sheet__close" @tap.stop="closeDebugPanel">
				<text class="sheet__close-icon">✕</text>
			</view>
		</view>
		<view class="debug-content">
			<view class="debug-section">
				<text class="debug-section__title">日期模拟</text>
				<view class="debug-info">
					<text class="debug-info__label">当前日期：</text>
					<text class="debug-info__value">{{ currentDateDisplay }}</text>
				</view>
				<view class="debug-info" v-if="mockDate">
					<text class="debug-info__label">模拟日期：</text>
					<text class="debug-info__value debug-info__value--mock">{{ mockDateDisplay }}</text>
				</view>
				<view class="form-field">
					<text class="form-label">设置模拟日期</text>
					<picker mode="date" :value="debugDateInput" @change="onDebugDateChange">
						<view class="form-value form-value--picker">
							<text>{{ debugDateInput || '选择日期' }}</text>
							<text class="form-arrow">></text>
						</view>
					</picker>
				</view>
				<view class="debug-actions">
					<button class="debug-btn-action" @tap.stop="applyMockDate" :disabled="!debugDateInput">
						应用模拟日期
					</button>
					<button class="debug-btn-action debug-btn-action--reset" @tap.stop="resetMockDate" :disabled="!mockDate">
						重置为当前日期
					</button>
				</view>
			</view>
			<view class="debug-section">
				<text class="debug-section__title">快速日期</text>
				<view class="debug-quick-dates">
					<view class="debug-quick-date" v-for="item in quickDates" :key="item.label" @tap="setQuickDate(item.days)">
						<text class="debug-quick-date__label">{{ item.label }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			pageLoaded: false,
			showAddSheet: false,
			isEditing: false,
			editingHabit: null,
			hideFab: false,
			hideBottomBar: false,
			scrollTop: 0,
			lastScrollTop: 0,
			showDebugPanel: false,
			mockDate: null,
			debugDateInput: '',
			quickDates: [
				{ label: '今天', days: 0 },
				{ label: '昨天', days: -1 },
				{ label: '明天', days: 1 },
				{ label: '3天前', days: -3 },
				{ label: '7天前', days: -7 },
				{ label: '30天前', days: -30 }
			],
			totalEnergy: 850,
			currentLevel: 5,
			currentExp: 320,
			nextLevelExp: 500,
			habits: [
				{
					id: 1,
					title: '晨间阅读 30 分钟',
					time: '早晨',
					difficulty: 'medium',
					energy: 15,
					streak: 12,
					checkedToday: true
				},
				{
					id: 2,
					title: '每天喝 8 杯水',
					time: '全天',
					difficulty: 'easy',
					energy: 10,
					streak: 21,
					checkedToday: true
				},
				{
					id: 3,
					title: '晚间冥想 20 分钟',
					time: '晚间',
					difficulty: 'medium',
					energy: 15,
					streak: 7,
					checkedToday: false
				},
				{
					id: 4,
					title: '写作练习 1 小时',
					time: '下午',
					difficulty: 'hard',
					energy: 25,
					streak: 5,
					checkedToday: false
				}
			],
			form: {
				title: '',
				time: '早晨',
				difficulty: 'easy'
			},
			timeSlots: [
				{ value: '早晨', label: '早晨', icon: '🌅' },
				{ value: '上午', label: '上午', icon: '☀️' },
				{ value: '下午', label: '下午', icon: '🌤' },
				{ value: '晚间', label: '晚间', icon: '🌙' },
				{ value: '全天', label: '全天', icon: '⏰' }
			],
			difficultyLevels: [
				{ value: 'easy', label: '简单', energy: 10, desc: '容易坚持，适合新手' },
				{ value: 'medium', label: '中等', energy: 15, desc: '需要一定毅力' },
				{ value: 'hard', label: '困难', energy: 25, desc: '挑战自我，高回报' }
			],
		milestones: [
			{ days: 7, icon: '🌱' },
			{ days: 21, icon: '🌿' },
			{ days: 66, icon: '🌳' },
			{ days: 100, icon: '🏆' }
		],
		bottomNavItems: [
			{ key: 'today', label: '今日', icon: '◎', target: '/pages/index/index' },
			{ key: 'calendar', label: '日历', icon: '◉', target: '/pages/calendar/index' },
			{ key: 'tracking', label: '番茄钟', icon: '◴', target: '/pages/pomodoro/index' },
			{ key: 'habit', label: '习惯', icon: '△', target: '/pages/habit/index' }
		],
		activeNav: 'habit',
		inspirationalQuotes: [
			'坚持，是通往成功最短的路',
			'每一次打卡，都在遇见更好的自己',
			'习惯的力量，能改变一生',
			'微小的改变，带来巨大的不同',
			'今日的努力，是明日的习惯',
			'养成习惯需要21天，成就自己只需坚持'
		]
	};
},
	computed: {
		activeHabits() {
			return this.habits.length;
		},
		longestStreak() {
			if (!this.habits.length) return 0;
			return Math.max(...this.habits.map(h => h.streak));
		},
		totalCheckins() {
			return this.habits.reduce((sum, h) => sum + h.streak, 0);
		},
		levelProgress() {
			const percent = (this.currentExp / this.nextLevelExp) * 100;
			return `${Math.min(percent, 100)}%`;
		},
		todayCheckinCount() {
			return this.habits.filter(h => h.checkedToday).length;
		},
		weekDays() {
			const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
			const counts = [3, 2, 4, 3, 2, 1, 2]; // 模拟数据
			const max = Math.max(...counts);
			return days.map((label, index) => ({
				label,
				count: counts[index],
				height: max > 0 ? `${(counts[index] / max) * 100}%` : '0%'
			}));
		},
		weekCheckinCount() {
			return this.weekDays.reduce((sum, day) => sum + day.count, 0);
		},
	canSubmit() {
		return this.form.title.trim().length > 0;
	},
	inspirationalQuote() {
		// 随机选择一句激励语
		const index = Math.floor(Math.random() * this.inspirationalQuotes.length);
		return this.inspirationalQuotes[index];
	},
	currentDateDisplay() {
		const date = this.getCurrentDate();
		const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
		const weekday = weekdays[date.getDay()];
		const month = date.getMonth() + 1;
		const day = date.getDate();
		return `${date.getFullYear()}年${month}月${day}日 ${weekday}`;
	},
	mockDateDisplay() {
		if (!this.mockDate) return '';
		const date = new Date(this.mockDate);
		const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
		const weekday = weekdays[date.getDay()];
		const month = date.getMonth() + 1;
		const day = date.getDate();
		return `${date.getFullYear()}年${month}月${day}日 ${weekday}`;
	}
},
onLoad() {
	this.loadLocalData();
	this.resetDailyCheckins();
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
	methods: {
		getDifficultyLabel(difficulty) {
			const labels = { easy: '简单', medium: '中等', hard: '困难' };
			return labels[difficulty] || '未知';
		},
		getHabitCardClass(habit) {
			const classes = [];
			if (habit.checkedToday) {
				classes.push('habit-card--checked');
			}
			classes.push(`habit-card--${habit.difficulty}`);
			return classes;
		},
		getHeatmapClass(count) {
			if (count === 0) return 'heatmap-cell--empty';
			if (count <= 1) return 'heatmap-cell--low';
			if (count <= 2) return 'heatmap-cell--medium';
			return 'heatmap-cell--high';
		},
		getChainDotClass(index, streak) {
			const classes = ['chain-dot--filled'];
			if (index === streak && streak >= 7) {
				classes.push('chain-dot--pulse');
			}
			if (streak >= 21 && index > streak - 5) {
				classes.push('chain-dot--gold');
			}
			return classes;
		},
		getNextMilestone(streak) {
			const milestones = [7, 21, 66, 100];
			for (let ms of milestones) {
				if (streak < ms) {
					return ms;
				}
			}
			return null;
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
		resetForm() {
			this.form.title = '';
			this.form.time = '早晨';
			this.form.difficulty = 'easy';
			this.isEditing = false;
			this.editingHabit = null;
		},
		selectTimeSlot(value) {
			this.form.time = value;
		},
		selectDifficulty(value) {
			this.form.difficulty = value;
		},
		toggleHabit(habit) {
			if (habit.checkedToday) {
				// 取消打卡
				habit.checkedToday = false;
				habit.streak = Math.max(0, habit.streak - 1);
				this.totalEnergy -= habit.energy;
				this.currentExp = Math.max(0, this.currentExp - habit.energy);
				uni.showToast({
					title: '已取消打卡',
					icon: 'none'
				});
			} else {
				// 完成打卡
				habit.checkedToday = true;
				habit.streak += 1;
				this.totalEnergy += habit.energy;
				this.currentExp += habit.energy;
				
				// 检查升级
				if (this.currentExp >= this.nextLevelExp) {
					this.currentLevel += 1;
					this.currentExp = this.currentExp - this.nextLevelExp;
					this.nextLevelExp = Math.floor(this.nextLevelExp * 1.5);
					uni.showModal({
						title: '恭喜升级！',
						content: `你已达到 Lv.${this.currentLevel}，继续保持！`,
						showCancel: false
					});
				} else {
					// 检查里程碑
					const milestones = [7, 21, 66, 100];
					if (milestones.includes(habit.streak)) {
						uni.showModal({
							title: `🎉 里程碑达成！`,
							content: `恭喜！"${habit.title}" 已连续坚持 ${habit.streak} 天！`,
							showCancel: false
						});
					} else {
						uni.showToast({
							title: `+${habit.energy} 能量！`,
							icon: 'none'
						});
					}
				}
			}
			this.saveLocalData();
		},
		editHabit(habit) {
			this.isEditing = true;
			this.editingHabit = habit;
			this.form.title = habit.title;
			this.form.time = habit.time;
			this.form.difficulty = habit.difficulty;
			this.showAddSheet = true;
		},
		deleteHabit(habit) {
			uni.showModal({
				title: '确认删除',
				content: `确定要删除习惯"${habit.title}"吗？这将清除所有打卡记录。`,
				success: (res) => {
					if (res.confirm) {
						const index = this.habits.findIndex(h => h.id === habit.id);
						if (index !== -1) {
							this.habits.splice(index, 1);
							this.saveLocalData();
							uni.showToast({
								title: '已删除',
								icon: 'success'
							});
						}
					}
				}
			});
		},
		confirmHabit() {
			if (!this.canSubmit) return;

			const energyMap = { easy: 10, medium: 15, hard: 25 };
			
			if (this.isEditing && this.editingHabit) {
				// 编辑模式
				this.editingHabit.title = this.form.title;
				this.editingHabit.time = this.form.time;
				this.editingHabit.difficulty = this.form.difficulty;
				this.editingHabit.energy = energyMap[this.form.difficulty];
				uni.showToast({
					title: '修改成功',
					icon: 'success'
				});
			} else {
				// 创建模式
				const newHabit = {
					id: Date.now(),
					title: this.form.title,
					time: this.form.time,
					difficulty: this.form.difficulty,
					energy: energyMap[this.form.difficulty],
					streak: 0,
					checkedToday: false
				};
				this.habits.push(newHabit);
				uni.showToast({
					title: '习惯创建成功！',
					icon: 'success'
				});
			}
			
			this.saveLocalData();
			this.closeAddSheet();
		},
	saveLocalData() {
		try {
			uni.setStorageSync('habits', this.habits);
			uni.setStorageSync('habitEnergy', this.totalEnergy);
			uni.setStorageSync('habitLevel', this.currentLevel);
			uni.setStorageSync('habitExp', this.currentExp);
			uni.setStorageSync('habitNextLevelExp', this.nextLevelExp);
			uni.setStorageSync('lastCheckinDate', this.buildTodayKey());
		} catch (err) {
			console.error('保存习惯数据失败:', err);
		}
	},
	loadLocalData() {
		try {
			const savedHabits = uni.getStorageSync('habits');
			const savedEnergy = uni.getStorageSync('habitEnergy');
			const savedLevel = uni.getStorageSync('habitLevel');
			const savedExp = uni.getStorageSync('habitExp');
			const savedNextLevelExp = uni.getStorageSync('habitNextLevelExp');
			const savedMockDate = uni.getStorageSync('habitMockDate');
			
			if (savedHabits && Array.isArray(savedHabits)) {
				this.habits = savedHabits;
			}
			if (typeof savedEnergy === 'number') {
				this.totalEnergy = savedEnergy;
			}
			if (typeof savedLevel === 'number') {
				this.currentLevel = savedLevel;
			}
			if (typeof savedExp === 'number') {
				this.currentExp = savedExp;
			}
			if (typeof savedNextLevelExp === 'number') {
				this.nextLevelExp = savedNextLevelExp;
			}
			if (savedMockDate) {
				this.mockDate = savedMockDate;
			}
		} catch (err) {
			console.error('加载习惯数据失败:', err);
		}
	},
	resetDailyCheckins() {
		const today = this.buildTodayKey();
		const lastCheckinDate = uni.getStorageSync('lastCheckinDate');
		
		// 如果是新的一天，重置所有习惯的checkedToday状态
		if (lastCheckinDate !== today) {
			this.habits.forEach(habit => {
				habit.checkedToday = false;
			});
			uni.setStorageSync('lastCheckinDate', today);
			this.saveLocalData();
		}
	},
	getCurrentDate() {
		// 如果有模拟日期，使用模拟日期；否则使用当前日期
		if (this.mockDate) {
			return new Date(this.mockDate);
		}
		return new Date();
	},
	buildTodayKey() {
		const date = this.getCurrentDate();
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		return `${year}-${month}-${day}`;
	},
	toggleDebugPanel() {
		this.showDebugPanel = !this.showDebugPanel;
		if (this.showDebugPanel) {
			// 如果已有模拟日期，显示在输入框中
			if (this.mockDate) {
				const date = new Date(this.mockDate);
				const year = date.getFullYear();
				const month = String(date.getMonth() + 1).padStart(2, '0');
				const day = String(date.getDate()).padStart(2, '0');
				this.debugDateInput = `${year}-${month}-${day}`;
			}
		}
	},
	closeDebugPanel() {
		this.showDebugPanel = false;
	},
	onDebugDateChange(e) {
		this.debugDateInput = e.detail.value;
	},
	applyMockDate() {
		if (!this.debugDateInput) return;
		this.mockDate = this.debugDateInput;
		uni.setStorageSync('habitMockDate', this.mockDate);
		// 重新加载数据以应用新日期
		this.resetDailyCheckins();
		uni.showToast({
			title: '已应用模拟日期',
			icon: 'success'
		});
	},
	resetMockDate() {
		this.mockDate = null;
		this.debugDateInput = '';
		uni.removeStorageSync('habitMockDate');
		// 重新加载数据
		this.resetDailyCheckins();
		uni.showToast({
			title: '已重置为当前日期',
			icon: 'success'
		});
	},
	setQuickDate(days) {
		const date = new Date();
		date.setDate(date.getDate() + days);
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		const day = String(date.getDate()).padStart(2, '0');
		this.debugDateInput = `${year}-${month}-${day}`;
		this.applyMockDate();
	},
	onBottomNavTap(item) {
		if (item.key === this.activeNav) {
			return;
		}
		if (item.target) {
			uni.switchTab({ url: item.target });
		}
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
		radial-gradient(circle at 70% 30%, rgba(90,255,208,0.4), transparent 60%),
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
	height: 140rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 30rpx;
	z-index: 3;
}

.top-bar__left {
	width: 80rpx;
}

.top-bar__back {
	font-size: 40rpx;
	color: rgba(255,255,255,0.8);
}

.top-bar__center {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.top-bar__title {
	font-size: 42rpx;
	font-weight: 600;
	letter-spacing: 4rpx;
	color: #f9fbff;
}

.top-bar__subtitle {
	font-size: 22rpx;
	color: rgba(255,255,255,0.6);
	letter-spacing: 1rpx;
}

.top-bar__right {
	width: 120rpx;
	display: flex;
	justify-content: flex-end;
}

.energy-badge {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 12rpx 20rpx;
	background: rgba(255,215,0,0.15);
	border: 1rpx solid rgba(255,215,0,0.3);
	border-radius: 999rpx;
}

.energy-icon {
	font-size: 28rpx;
}

.energy-value {
	font-size: 26rpx;
	font-weight: 600;
	color: #ffd700;
}

.debug-btn {
	width: 56rpx;
	height: 56rpx;
	margin-left: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255,255,255,0.08);
	border: 1rpx solid rgba(255,255,255,0.12);
	border-radius: 50%;
	transition: all 0.3s ease;
}

.debug-btn:active {
	background: rgba(110,203,255,0.2);
	transform: scale(0.9);
}

.debug-btn__icon {
	font-size: 28rpx;
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

/* 能量概览 */
.energy-overview {
	padding: 40rpx 32rpx;
	margin-bottom: 32rpx;
}

.energy-stats {
	display: flex;
	justify-content: space-around;
	align-items: center;
	margin-bottom: 40rpx;
}

.energy-stat {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
}

.energy-stat__value {
	font-size: 48rpx;
	font-weight: 700;
	background: linear-gradient(135deg, #6ecbff, #5affd0);
	-webkit-background-clip: text;
	-webkit-text-fill-color: transparent;
	background-clip: text;
}

.energy-stat__label {
	font-size: 24rpx;
	color: rgba(255,255,255,0.65);
}

.energy-divider {
	width: 2rpx;
	height: 60rpx;
	background: rgba(255,255,255,0.15);
}

.level-progress {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.level-progress__header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.level-progress__label {
	font-size: 28rpx;
	font-weight: 600;
	color: #ffd700;
}

.level-progress__exp {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}

.level-progress__bar {
	height: 20rpx;
	background: rgba(255,255,255,0.12);
	border-radius: 999rpx;
	overflow: hidden;
}

.level-progress__fill {
	height: 100%;
	background: linear-gradient(90deg, #ffd700, #ffed4e);
	border-radius: 999rpx;
	transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

/* 热力图 */
.heatmap {
	padding: 40rpx 32rpx;
	margin-bottom: 32rpx;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: baseline;
	margin-bottom: 32rpx;
}

.card-title {
	font-size: 36rpx;
	font-weight: 600;
}

.card-sub {
	font-size: 24rpx;
	color: rgba(255,255,255,0.65);
}

.heatmap-grid {
	display: flex;
	justify-content: space-between;
	gap: 16rpx;
}

.heatmap-cell {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
}

.heatmap-cell__label {
	font-size: 22rpx;
	color: rgba(255,255,255,0.6);
}

.heatmap-cell__bar {
	width: 100%;
	height: 120rpx;
	background: rgba(255,255,255,0.08);
	border-radius: 12rpx;
	position: relative;
	overflow: hidden;
}

.heatmap-cell__fill {
	position: absolute;
	bottom: 0;
	left: 0;
	right: 0;
	background: linear-gradient(180deg, #5affd0, #4db2ff);
	border-radius: 12rpx 12rpx 0 0;
	transition: height 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.heatmap-cell--high .heatmap-cell__fill {
	background: linear-gradient(180deg, #5affd0, #39acff);
}

.heatmap-cell--medium .heatmap-cell__fill {
	background: linear-gradient(180deg, #6ecbff, #4d9aff);
}

.heatmap-cell--low .heatmap-cell__fill {
	background: linear-gradient(180deg, #7d9fff, #6a7aff);
}

.heatmap-cell__count {
	font-size: 26rpx;
	font-weight: 600;
	color: #ffffff;
}

/* 习惯列表 */
.habits {
	padding: 40rpx 32rpx 60rpx;
	margin-bottom: 40rpx;
}

.habit-card {
	margin-bottom: 28rpx;
	padding: 32rpx;
	border-radius: 28rpx;
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.1);
	transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.habit-card--checked {
	background: rgba(90,255,208,0.12);
	border-color: rgba(90,255,208,0.3);
}

.habit-card__main {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 24rpx;
}

.habit-card__left {
	display: flex;
	align-items: center;
	gap: 24rpx;
	flex: 1;
}

.habit-checkbox {
	width: 52rpx;
	height: 52rpx;
	border-radius: 50%;
	border: 3rpx solid rgba(255,255,255,0.3);
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s ease;
}

.habit-checkbox--checked {
	border-color: #5affd0;
	background: #5affd0;
}

.habit-checkbox__icon {
	font-size: 28rpx;
	color: #0f1b2b;
	font-weight: 700;
}

.habit-info {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.habit-title {
	font-size: 30rpx;
	font-weight: 500;
	color: #ffffff;
}

.habit-meta {
	display: flex;
	align-items: center;
	gap: 16rpx;
	flex-wrap: wrap;
}

.habit-meta__badge {
	padding: 4rpx 14rpx;
	border-radius: 999rpx;
	font-size: 20rpx;
	font-weight: 500;
}

.habit-meta__badge--easy {
	background: rgba(90,255,208,0.2);
	color: #5affd0;
}

.habit-meta__badge--medium {
	background: rgba(110,203,255,0.2);
	color: #6ecbff;
}

.habit-meta__badge--hard {
	background: rgba(255,159,31,0.2);
	color: #ff9f1f;
}

.habit-meta__time {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}

.habit-meta__energy {
	font-size: 24rpx;
	color: #ffd700;
	font-weight: 600;
}

.habit-card__right {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.habit-streak {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 12rpx 20rpx;
	background: rgba(255,215,0,0.15);
	border-radius: 20rpx;
	min-width: 80rpx;
}

.habit-streak__value {
	font-size: 36rpx;
	font-weight: 700;
	color: #ffd700;
}

.habit-streak__label {
	font-size: 20rpx;
	color: rgba(255,215,0,0.8);
}

/* 习惯链条 */
.habit-chain {
	margin-top: 24rpx;
	padding: 24rpx;
	background: rgba(255,255,255,0.04);
	border-radius: 20rpx;
	border: 1rpx solid rgba(255,255,255,0.08);
}

.habit-chain__title {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.habit-chain__label {
	font-size: 26rpx;
	font-weight: 600;
	color: rgba(255,255,255,0.9);
}

.habit-chain__milestone {
	font-size: 22rpx;
	color: rgba(255,255,255,0.5);
}

.habit-chain__dots {
	display: flex;
	align-items: center;
	gap: 10rpx;
	flex-wrap: wrap;
	margin-bottom: 20rpx;
}

.chain-dot {
	width: 32rpx;
	height: 32rpx;
	border-radius: 50%;
	background: rgba(255,255,255,0.2);
	transition: all 0.3s ease;
}

.chain-dot--filled {
	background: linear-gradient(135deg, #5affd0, #39acff);
	box-shadow: 0 4rpx 12rpx rgba(90,255,208,0.4);
}

.chain-dot--gold {
	background: linear-gradient(135deg, #ffd700, #ffed4e);
	box-shadow: 0 4rpx 12rpx rgba(255,215,0,0.5);
}

.chain-dot--pulse {
	animation: pulse 1.5s infinite;
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
		opacity: 1;
	}
	50% {
		transform: scale(1.2);
		opacity: 0.8;
	}
}

.chain-more {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
	padding: 4rpx 12rpx;
	background: rgba(255,255,255,0.1);
	border-radius: 999rpx;
}

.habit-milestones {
	display: flex;
	justify-content: space-around;
	gap: 12rpx;
}

.milestone {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	padding: 12rpx 16rpx;
	background: rgba(255,255,255,0.05);
	border-radius: 16rpx;
	opacity: 0.4;
	transition: all 0.3s ease;
}

.milestone--achieved {
	opacity: 1;
	background: rgba(90,255,208,0.15);
	border: 1rpx solid rgba(90,255,208,0.3);
}

.milestone__icon {
	font-size: 32rpx;
}

.milestone__days {
	font-size: 20rpx;
	color: rgba(255,255,255,0.8);
}

/* 习惯操作按钮 */
.habit-actions {
	display: flex;
	gap: 16rpx;
	margin-top: 20rpx;
	padding-top: 20rpx;
	border-top: 1rpx solid rgba(255,255,255,0.08);
}

.habit-action-btn {
	flex: 1;
	height: 64rpx;
	line-height: 64rpx;
	border-radius: 16rpx;
	font-size: 24rpx;
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.1);
	color: rgba(255,255,255,0.8);
	transition: all 0.25s ease;
}

.habit-action-btn::after {
	border: none;
}

.habit-action-btn--edit:active {
	background: rgba(110,203,255,0.2);
	color: #6ecbff;
}

.habit-action-btn--delete:active {
	background: rgba(255,123,138,0.2);
	color: #ff7b8a;
}

.empty {
	padding: 100rpx 0;
	text-align: center;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
}

.empty__icon {
	font-size: 80rpx;
	opacity: 0.6;
}

.empty__tip {
	font-size: 26rpx;
	color: rgba(255,255,255,0.6);
	line-height: 1.6;
}

/* 浮动按钮 */
.fab {
	position: fixed;
	width: 140rpx;
	height: 140rpx;
	border-radius: 70rpx;
	background: linear-gradient(135deg, rgba(90,255,208,0.9), rgba(110,203,255,0.9));
	box-shadow: 0 28rpx 46rpx rgba(10, 20, 35, 0.55);
	bottom: calc(200rpx + constant(safe-area-inset-bottom));
	bottom: calc(200rpx + env(safe-area-inset-bottom));
	right: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #0f1b2b;
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

/* 表单弹窗 */
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

@keyframes fade-in {
	0% {
		opacity: 0;
	}
	100% {
		opacity: 1;
	}
}

.sheet {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 42rpx 40rpx 90rpx;
	border-radius: 46rpx 46rpx 0 0;
	z-index: 12;
	max-height: 90vh;
	overflow-y: auto;
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

.time-slots {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.time-slot {
	flex: 0 0 calc(33.333% - 12rpx);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	padding: 20rpx 12rpx;
	background: rgba(255,255,255,0.06);
	border: 2rpx solid rgba(255,255,255,0.1);
	border-radius: 20rpx;
	transition: all 0.3s ease;
}

.time-slot--active {
	background: rgba(110,203,255,0.2);
	border-color: #6ecbff;
}

.time-slot__icon {
	font-size: 40rpx;
}

.time-slot__label {
	font-size: 24rpx;
	color: rgba(255,255,255,0.9);
}

.difficulty-levels {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.difficulty-level {
	padding: 24rpx;
	background: rgba(255,255,255,0.06);
	border: 2rpx solid rgba(255,255,255,0.1);
	border-radius: 20rpx;
	transition: all 0.3s ease;
}

.difficulty-level--active {
	border-color: rgba(110,203,255,0.5);
	background: rgba(110,203,255,0.15);
}

.difficulty-level--easy.difficulty-level--active {
	border-color: rgba(90,255,208,0.5);
	background: rgba(90,255,208,0.15);
}

.difficulty-level--hard.difficulty-level--active {
	border-color: rgba(255,159,31,0.5);
	background: rgba(255,159,31,0.15);
}

.difficulty-level__label {
	font-size: 28rpx;
	font-weight: 600;
	color: #ffffff;
	margin-bottom: 8rpx;
	display: block;
}

.difficulty-level__energy {
	font-size: 24rpx;
	color: #ffd700;
	margin-bottom: 8rpx;
	display: block;
}

.difficulty-level__desc {
	font-size: 22rpx;
	color: rgba(255,255,255,0.6);
	display: block;
}

.sheet__action {
	margin-top: 20rpx;
	background: linear-gradient(135deg, rgba(90,255,208,0.85), rgba(110,203,255,0.9));
	color: #0f1b2b;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
	border-radius: 24rpx;
	height: 96rpx;
	line-height: 96rpx;
}

.sheet__action::after {
	border: none;
}

.sheet__action[disabled] {
	background: rgba(255,255,255,0.12);
	color: rgba(255,255,255,0.4);
}

/* 底部导航栏 */
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

.bottom-bar__label {
	font-size: 24rpx;
}

.bottom-bar--hidden {
	opacity: 0 !important;
	pointer-events: none !important;
	transform: translateY(120%) !important;
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
	text-align: center;
	font-style: italic;
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

/* 调试面板 */
.debug-panel {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 42rpx 40rpx 90rpx;
	border-radius: 46rpx 46rpx 0 0;
	z-index: 12;
	max-height: 85vh;
	overflow-y: auto;
	transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
	transform: translateY(120%);
	pointer-events: none;
	opacity: 0;
}

.debug-panel--open {
	transform: translateY(0);
	pointer-events: auto;
	opacity: 1;
}

.debug-content {
	display: flex;
	flex-direction: column;
	gap: 32rpx;
}

.debug-section {
	padding: 24rpx;
	background: rgba(255,255,255,0.04);
	border-radius: 20rpx;
	border: 1rpx solid rgba(255,255,255,0.08);
}

.debug-section__title {
	font-size: 28rpx;
	font-weight: 600;
	color: #ffffff;
	margin-bottom: 20rpx;
	display: block;
}

.debug-info {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
	font-size: 24rpx;
}

.debug-info__label {
	color: rgba(255,255,255,0.7);
	margin-right: 12rpx;
}

.debug-info__value {
	color: #6ecbff;
	font-weight: 500;
}

.debug-info__value--mock {
	color: #ffd700;
}

.debug-actions {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-top: 20rpx;
}

.debug-btn-action {
	height: 72rpx;
	line-height: 72rpx;
	background: rgba(110,203,255,0.15);
	border: 1rpx solid rgba(110,203,255,0.3);
	border-radius: 16rpx;
	color: #6ecbff;
	font-size: 26rpx;
	transition: all 0.3s ease;
}

.debug-btn-action::after {
	border: none;
}

.debug-btn-action:active {
	background: rgba(110,203,255,0.25);
	transform: scale(0.98);
}

.debug-btn-action[disabled] {
	opacity: 0.4;
	pointer-events: none;
}

.debug-btn-action--reset {
	background: rgba(255,123,138,0.15);
	border-color: rgba(255,123,138,0.3);
	color: #ff7b8a;
}

.debug-btn-action--reset:active {
	background: rgba(255,123,138,0.25);
}

.debug-quick-dates {
	display: flex;
	flex-wrap: wrap;
	gap: 12rpx;
}

.debug-quick-date {
	padding: 16rpx 24rpx;
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.1);
	border-radius: 16rpx;
	transition: all 0.3s ease;
}

.debug-quick-date:active {
	background: rgba(110,203,255,0.2);
	border-color: rgba(110,203,255,0.4);
	transform: scale(0.95);
}

.debug-quick-date__label {
	font-size: 24rpx;
	color: rgba(255,255,255,0.9);
}
</style>

