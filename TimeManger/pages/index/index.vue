<template>
	<view class="page">
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
		<view class="side-menu__mask" v-show="showSideMenu" @tap="toggleSideMenu"></view>

		<scroll-view scroll-y class="main-scroll" @scroll="onPageScroll">
			<view class="top-bar glass" :class="{ 'glass--active': pageLoaded }">
				<view class="top-bar__left" @tap="toggleSideMenu">
					<view class="icon-more">
						<text class="icon-more__line"></text>
						<text class="icon-more__line"></text>
						<text class="icon-more__line"></text>
					</view>
				</view>
				<text class="top-bar__title">今日</text>
				<view class="top-bar__right">
					<text class="top-bar__date">{{ todayLabel }}</text>
				</view>
			</view>

			<view class="main-content">
				
				<view class="checkin-card glass" :class="{ 'glass--active': pageLoaded }" @tap="handleDailyCheckIn">
					<view class="checkin-content">
						<view class="checkin-icon-box">
							<text class="checkin-icon">{{ hasCheckedIn ? '⚡' : '✨' }}</text>
						</view>
						<view class="checkin-texts">
							<text class="checkin-title">{{ hasCheckedIn ? '今日能量已充满' : '领取今日能量' }}</text>
							<text class="checkin-sub">{{ dailyQuote }}</text>
						</view>
					</view>
					<view class="checkin-action" v-if="!hasCheckedIn">
						<text class="checkin-btn">签到</text>
					</view>
				</view>

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
							<view class="stat-card__bar" :prop="card" :change:prop="renderjs.updateBar">
								<view class="stat-card__bar-fill" :data-id="card.key"></view>
							</view>
							<text class="stat-card__extra">{{ card.extra }}</text>
							<view class="stat-card__footer">
								<text class="stat-card__status" :class="`stat-card__status--${card.status}`">{{ card.statusLabel }}</text>
							</view>
						</view>
					</view>
				</view>

				<view class="home-tabs glass" :class="{ 'glass--active': pageLoaded }">
					<view 
						class="tab-pill" 
						:class="{ 'tab-pill--active': activeTab === 'tasks' }"
						@tap="activeTab = 'tasks'"
					>
						<text class="tab-icon">📋</text>
						<text class="tab-text">今日清单</text>
						<view class="active-dot" v-if="activeTab === 'tasks'"></view>
					</view>
					<view 
						class="tab-pill" 
						:class="{ 'tab-pill--active': activeTab === 'memo' }"
						@tap="activeTab = 'memo'"
					>
						<text class="tab-icon">📝</text>
						<text class="tab-text">随手记</text>
						<view class="active-dot" v-if="activeTab === 'memo'"></view>
					</view>
				</view>

				<view v-if="activeTab === 'tasks'" class="tasks glass fade-in" :class="{ 'glass--active': pageLoaded }">
					<view class="card-header">
						<view class="header-left">
							<text class="card-title">待办事项</text>
							<text class="card-sub">{{ summaryLabel }}</text>
						</view>
						<view class="sort-btn" @tap="toggleSortMode">
							<text class="sort-icon">⇅</text>
							<text class="sort-label">{{ sortMode === 'default' ? '默认' : '未完优先' }}</text>
						</view>
					</view>
					
					<template v-if="sortedTasks.length">
						<view v-for="task in sortedTasks" :key="task.id" class="task" :class="[task.done && 'task--done', task.expired && 'task--expired']">
							<view class="task__info" @tap="toggleTaskDone(task)">
								<text class="task__title" :class="task.done && 'task__title--strikethrough'">{{ task.title }}</text>
								<text class="task__deadline" :class="task.done && 'task__deadline--strikethrough'">{{ task.deadline }}</text>
							</view>
							<view class="task__actions">
								<view class="task__action-btn task__action-btn--edit" @tap.stop="editTask(task)">✎</view>
								<view class="task__action-btn task__action-btn--delete" @tap.stop="deleteTask(task)">×</view>
							</view>
						</view>
					</template>
					<view v-else class="empty">
						<text class="empty__tip">还没有任务，点击右下角添加吧＞﹏＜</text>
					</view>
				</view>

				<view v-if="activeTab === 'memo'" class="memo-card glass fade-in" :class="{ 'glass--active': pageLoaded }">
					<view class="card-header">
						<text class="card-title">灵感与备忘</text>
						<view class="header-action" v-if="quickMemo" @tap.stop="clearMemo">
							<text class="action-text">清空</text>
						</view>
					</view>
					<textarea 
						class="memo-input" 
						placeholder="在此处快速记录稍纵即逝的想法..." 
						placeholder-class="memo-placeholder"
						v-model="quickMemo"
						@blur="saveLocalData"
						:maxlength="500"
						auto-height
					/>
				</view>
				
				<view style="height: 200rpx;"></view>
			</view>
		</scroll-view>

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

		<view class="fab" 
			:class="{ 'fab--pulse': showAddSheet, 'fab--hidden': hideFab || showSideMenu || activeTab !== 'tasks' }" 
			@tap.stop="toggleAddSheet"
		>
			<text class="fab__icon">+</text>
		</view>

		<view class="sheet-mask" v-show="showAddSheet" @tap="closeAddSheet"></view>
		<view class="sheet glass" :class="{ 'sheet--open': showAddSheet }" v-show="showAddSheet" @touchmove.stop>
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
					<view class="deadline-option-item" :class="{ 'deadline-option-item--active': form.deadline === '' && !form.date && !form.time }" @tap="selectNoDeadline">
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
				<view v-show="form.deadline" class="form-deadline-display">
					<text class="form-deadline-display__text">截止时间：{{ form.deadline }}</text>
				</view>
			</view>
			<button class="sheet__action" type="primary" :disabled="!canSubmit" @tap.stop="confirmTask">添加任务</button>
		</view>
		
		<view class="sheet-mask" v-show="showEditSheet" @tap="closeEditSheet"></view>
		<view class="sheet glass" :class="{ 'sheet--open': showEditSheet }" v-show="showEditSheet" @touchmove.stop>
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
					<view class="deadline-option-item" :class="{ 'deadline-option-item--active': form.deadline === '' && !form.date && !form.time }" @tap="selectNoDeadline">
						<text class="deadline-option-item__text">不指定时间</text>
					</view>
					<picker mode="date" :value="form.date" :start="minDate" @change="onDateChange" class="form-value form-value--picker">
						<text>{{ form.date || '选择日期' }}</text>
						<text class="form-arrow">></text>
					</picker>
					<picker mode="time" :value="form.time" @change="onTimeChange" class="form-value form-value--picker">
						<text>{{ form.time || '选择时间' }}</text>
						<text class="form-arrow">></text>
					</picker>
				</view>
				<view v-show="form.deadline" class="form-deadline-display">
					<text class="form-deadline-display__text">截止时间：{{ form.deadline }}</text>
				</view>
			</view>
			<button class="sheet__action" type="primary" :disabled="!canSubmit" @tap.stop="confirmEditTask">保存修改</button>
		</view>

		<view class="sheet-mask" v-show="showGoalsSheet" @tap="closeGoalsSheet"></view>
		<view class="sheet glass" :class="{ 'sheet--open': showGoalsSheet }" v-show="showGoalsSheet" @touchmove.stop>
			<view class="sheet__handle"></view>
			<view class="sheet__header">
				<text class="sheet__title">目标设置</text>
				<view class="sheet__close" @tap.stop="closeGoalsSheet">
					<text class="sheet__close-icon">✕</text>
				</view>
			</view>
			<view class="form-field">
				<view class="form-label-row">
					<text class="form-label">每日番茄目标</text>
					<text class="form-value">{{ goals.pomodoroGoal }} 个</text>
				</view>
				<slider
					class="form-slider"
					min="1"
					max="20"
					step="1"
					:value="goals.pomodoroGoal"
					activeColor="#4db2ff"
					backgroundColor="rgba(255,255,255,0.12)"
					@changing="onPomodoroGoalChanging"
					@change="onPomodoroGoalChange"
				></slider>
			</view>
			<view class="form-field">
				<view class="form-label-row">
					<text class="form-label">过期任务容忍度</text>
					<text class="form-value">{{ goals.expiredGoal }} 个</text>
				</view>
				<slider
					class="form-slider"
					min="0"
					max="10"
					step="1"
					:value="goals.expiredGoal"
					activeColor="#7d61ff"
					backgroundColor="rgba(255,255,255,0.12)"
					@changing="onExpiredGoalChanging"
					@change="onExpiredGoalChange"
				></slider>
			</view>
			<button class="sheet__action" type="primary" @tap.stop="saveGoals">保存设置</button>
		</view>

		<view class="sheet-mask" v-show="showBackupSheet" @tap="closeBackupSheet"></view>
		<view class="sheet glass" :class="{ 'sheet--open': showBackupSheet }" v-show="showBackupSheet" @touchmove.stop>
			<view class="sheet__handle"></view>
			<view class="sheet__header">
				<text class="sheet__title">数据备份</text>
				<view class="sheet__close" @tap.stop="closeBackupSheet">
					<text class="sheet__close-icon">✕</text>
				</view>
			</view>
			<view class="backup-content">
				<view class="backup-section">
					<text class="backup-section-title">数据导出</text>
					<text class="backup-section-desc">导出所有应用数据为 JSON 格式，方便备份和迁移</text>
					<button class="backup-btn backup-btn--export" @tap.stop="exportData">
						<text class="backup-btn-icon">📥</text>
						<text>导出数据</text>
					</button>
				</view>
				
				<view class="backup-section">
					<text class="backup-section-title">数据导入</text>
					<text class="backup-section-desc">从 JSON 文件导入数据（将合并到现有数据）</text>
					<button class="backup-btn backup-btn--import" @tap.stop="importData">
						<text class="backup-btn-icon">📤</text>
						<text>导入数据</text>
					</button>
				</view>
				
				<view class="backup-section" v-if="exportedDataJson">
					<text class="backup-section-title">导出的数据（JSON）</text>
					<scroll-view class="backup-json-view" scroll-y>
						<text class="backup-json-text">{{ exportedDataJson }}</text>
					</scroll-view>
					<button class="backup-btn backup-btn--copy" @tap.stop="copyExportedData">
						<text class="backup-btn-icon">📋</text>
						<text>复制 JSON</text>
					</button>
				</view>
			</view>
		</view>

		<view class="sheet-mask" v-show="showFeedbackSheet" @tap="closeFeedbackSheet"></view>
		<view class="sheet glass" :class="{ 'sheet--open': showFeedbackSheet }" v-show="showFeedbackSheet" @touchmove.stop>
			<view class="sheet__handle"></view>
			<view class="sheet__header">
				<text class="sheet__title">反馈建议</text>
				<view class="sheet__close" @tap.stop="closeFeedbackSheet">
					<text class="sheet__close-icon">✕</text>
				</view>
			</view>
			<view class="feedback-content">
				<view class="feedback-email-section">
					<text class="feedback-email-label">反馈邮箱：</text>
					<view class="feedback-email-value" @tap.stop="copyEmail">
						<text class="feedback-email-text">390403426@qq.com</text>
						<text class="feedback-email-copy">📋</text>
					</view>
				</view>
			</view>
		</view>

		<view class="sheet-mask" v-show="showAboutSheet" @tap="closeAboutSheet"></view>
		<view class="sheet glass" :class="{ 'sheet--open': showAboutSheet }" v-show="showAboutSheet" @touchmove.stop>
			<view class="sheet__handle"></view>
			<view class="sheet__header">
				<text class="sheet__title">关于应用</text>
				<view class="sheet__close" @tap.stop="closeAboutSheet">
					<text class="sheet__close-icon">✕</text>
				</view>
			</view>
			<view class="about-content">
				<view class="about-logo">
					<text class="about-logo__text">TimeManager</text>
					<text class="about-logo__subtitle">时间管理，成就更好的自己</text>
				</view>
				<view class="about-info">
					<view class="about-info__item">
						<text class="about-info__label">版本号</text>
						<text class="about-info__value">1.0.0</text>
					</view>
					<view class="about-info__item">
						<text class="about-info__label">构建号</text>
						<text class="about-info__value">100</text>
					</view>
				</view>
				<view class="about-desc">
					<text class="about-desc__text">TimeManager 是一款专注于时间管理的应用，帮助您更好地规划时间、完成任务、养成习惯。</text>
				</view>
			</view>
		</view>
		
		<view class="sheet-mask" v-if="showGuide" @tap.stop></view>
		<view class="sheet glass" :class="{ 'sheet--open': showGuide }" v-if="showGuide" @touchmove.stop>
			<view class="sheet__handle"></view>
			<view class="sheet__header">
				<text class="sheet__title">{{ currentGuideStep.title }}</text>
				<view class="sheet__close" @tap.stop="skipGuide" v-if="currentGuideStepIndex < guideSteps.length - 1">
					<text class="sheet__close-icon">✕</text>
				</view>
			</view>
			
			<view class="guide-content">
				<view class="guide-video-container" v-if="currentGuideStep.videoPath">
					<video
						class="guide-video"
						:src="currentGuideStep.videoPath"
						:autoplay="true"
						:loop="false"
						:controls="false"
						:show-center-play-btn="false"
						:show-play-btn="false"
						:enable-play-gesture="false"
						:show-fullscreen-btn="false"
						@ended="onGuideVideoEnded"
						@error="onGuideVideoError"
					></video>
					</view>
				
				<view class="guide-placeholder" v-if="!currentGuideStep.videoPath">
					<view class="guide-icon">
						<text class="guide-icon-text">{{ currentGuideStep.icon }}</text>
					</view>
					<text class="guide-description">{{ currentGuideStep.description }}</text>
				</view>
				
				<view class="guide-indicators">
					<view 
						class="guide-indicator" 
						v-for="(step, index) in guideSteps" 
						:key="index"
						:class="{ 'guide-indicator--active': index === currentGuideStepIndex }"
					></view>
				</view>
			</view>
			
			<view class="guide-actions">
				<button 
					class="guide-btn guide-btn--prev" 
					v-if="currentGuideStepIndex > 0"
					@tap.stop="prevGuideStep"
				>
					<text class="guide-btn-icon">←</text>
					<text>上一步</text>
				</button>
				<button 
					class="guide-btn guide-btn--next" 
					@tap.stop="nextGuideStep"
				>
					<text>{{ currentGuideStepIndex === guideSteps.length - 1 ? '开始使用' : '下一步' }}</text>
					<text class="guide-btn-icon" v-if="currentGuideStepIndex < guideSteps.length - 1">→</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script>
import { getAllAppData, saveAllAppData, updateModuleData, getModuleData, exportAllAppData, importAllAppData } from '@/utils/dataManager.js';

export default {
	data() {
		return {
			pageLoaded: false,
			showSideMenu: false,
			showAddSheet: false,
			showEditSheet: false,
			showGoalsSheet: false,
			showBackupSheet: false,
			showFeedbackSheet: false,
			showAboutSheet: false,
			showGuide: false,
			
			editingTask: null,
			hideFab: false,
			scrollTimer: null,
			lastScrollTop: 0,
			
			// 核心功能 Tab (默认显示任务)
			activeTab: 'tasks', // 'tasks' | 'memo'
			
			// 每日签到
			hasCheckedIn: false,
			dailyQuote: '新的一天，新的开始',
			checkInQuotes: [
				'保持专注，即刻出发 🚀',
				'效率是做好工作的灵魂 ✨',
				'今日事今日毕 💪',
				'积跬步，至千里 ⛰️',
				'你的努力，时间看得到 ⏳'
			],
			
			// 随手记
			quickMemo: '',
			
			// 任务排序
			sortMode: 'default', // 'default' | 'todo'
			
			dailyStats: {
				completed: 0, active: 0, pomodoro: 0, pomodoroGoal: 12, expired: 0, expiredGoal: 4
			},
			tasks: [],
			form: { title: '', deadline: '', date: '', time: '' },
			goals: { pomodoroGoal: 12, expiredGoal: 4 },
			
			// 菜单配置
			sideMenuItems: [
				{ label: '目标设置', tip: '设置效率指标目标', action: 'goals' },
				{ label: '反馈建议', tip: '发送反馈', action: 'feedback' },
				{ label: '关于应用', tip: '版本信息与说明', action: 'about' }
			],
			bottomNavItems: [
				{ key: 'today', label: '今日', icon: '◎', target: '/pages/index/index' },
				{ key: 'calendar', label: '日历', icon: '◉', target: '/pages/calendar/index' },
				{ key: 'tracking', label: '番茄钟', icon: '◴', target: '/pages/pomodoro/index' },
				{ key: 'habit', label: '习惯', icon: '△', target: '/pages/habit/index' }
			],
			activeNav: 'today',
			pomodoroListener: null,
			exportedDataJson: '',
			
			// 缓存变量
			_statGradientsCache: null,
			_statCardsCache: null,
			_statCardsCacheKey: null,
			
			currentGuideStepIndex: 0,
			guideSteps: [
				{ title: '欢迎使用 TimeManager', icon: '⏱', description: '一款专注于时间管理的应用，帮助您高效管理每一天', videoPath: '' },
				{ title: '今日任务', icon: '📋', description: '创建和管理您的每日任务，设置截止时间，让工作更有条理', videoPath: '' },
				{ title: '番茄钟', icon: '🍅', description: '使用番茄工作法，专注工作25分钟，休息5分钟，提高工作效率', videoPath: '' },
				{ title: '习惯养成', icon: '🌱', description: '记录每日习惯，坚持打卡，养成好习惯，成就更好的自己', videoPath: '' },
				{ title: '感谢选择', icon: '✨', description: '感谢您选择 TimeManager，让我们一起开启高效的时间管理之旅！', videoPath: '' }
			]
		};
	},
	computed: {
		currentGuideStep() { return this.guideSteps[this.currentGuideStepIndex] || {}; },
		// 排序后的任务列表
		sortedTasks() {
			if (this.sortMode === 'default') {
				return this.tasks;
			}
			// 未完成优先
			return [...this.tasks].sort((a, b) => {
				if (a.done === b.done) return 0;
				return a.done ? 1 : -1;
			});
		},
		completionRatio() { return this.safeRatio(this.dailyStats.completed, this.dailyStats.active); },
		pomodoroRatio() { return this.safeRatio(this.dailyStats.pomodoro, this.dailyStats.pomodoroGoal); },
		expiredRatio() { return this.safeRatio(this.dailyStats.expired, this.dailyStats.expiredGoal); },
		statGradients() {
			if (!this._statGradientsCache) {
				this._statGradientsCache = {
					completion: this.buildGradientCSS(['#ff5a5f', '#ff9f1f']),
					pomodoro: this.buildGradientCSS(['#4db2ff', '#2962ff']),
					overdue: this.buildGradientCSS(['#7d61ff', '#c39eff']),
					focus: this.buildGradientCSS(['#5affd0', '#39acff'])
				};
			}
			return this._statGradientsCache;
		},
		statCards() {
			const statsKey = `${this.dailyStats.completed}-${this.dailyStats.active}-${this.dailyStats.pomodoro}-${this.dailyStats.pomodoroGoal}-${this.dailyStats.expired}-${this.dailyStats.expiredGoal}`;
			if (this._statCardsCache && this._statCardsCacheKey === statsKey) return this._statCardsCache;
			
			const clamp = v => Math.max(0, Math.min(1, v || 0));
			const cR = this.completionRatio, pR = this.pomodoroRatio, eR = this.expiredRatio;
			const cP = `${Math.round(clamp(cR) * 100)}%`;
			const pP = `${Math.round(clamp(pR) * 100)}%`;
			const ctrR = clamp(1 - eR);
			const ctrP = `${Math.round(ctrR * 100)}%`;
			const fR = clamp((clamp(cR) + clamp(pR) + ctrR) / 3);
			const fP = `${Math.round(fR * 100)}%`;
			
			const cards = [
				{ key: 'completion', label: '任务完成度', value: cP, desc: '保持输出节奏', extra: `${this.dailyStats.completed}/${this.dailyStats.active} 项`, progress: cP, gradient: this.statGradients.completion, status: this.describeStatus(cR), statusLabel: this.getStatusLabel('completion', cR) },
				{ key: 'pomodoro', label: '番茄执行', value: pP, desc: '体现专注投入', extra: `${this.dailyStats.pomodoro}/${this.dailyStats.pomodoroGoal} 个`, progress: pP, gradient: this.statGradients.pomodoro, status: this.describeStatus(pR), statusLabel: this.getStatusLabel('pomodoro', pR) },
				{ key: 'overdue', label: '过期控制', value: ctrP, desc: '节奏更轻松', extra: `${this.dailyStats.expired} 项过期`, progress: ctrP, gradient: this.statGradients.overdue, status: this.describeStatus(ctrR), statusLabel: this.getStatusLabel('overdue', ctrR) },
				{ key: 'focus', label: '效率平衡', value: fP, desc: '综合平衡指数', extra: `得分 ${fP}`, progress: fP, gradient: this.statGradients.focus, status: this.describeStatus(fR), statusLabel: this.getStatusLabel('focus', fR) }
			];
			this._statCardsCache = cards; this._statCardsCacheKey = statsKey;
			return cards;
		},
		summaryLabel() { return `${this.dailyStats.completed} / ${this.dailyStats.active} 已完成`; },
		todayLabel() { const d = new Date(); return `${d.getMonth()+1}月${d.getDate()}日`; },
		canSubmit() { return this.form.title.trim().length > 0; },
		minDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
	},
	onLoad() {
		uni.hideTabBar({ animation: false });
		this.loadLocalData();
		this.loadGoals();
		this.initializeSampleTasks();
		this.syncPomodoroCount();
		this.registerPomodoroListener();
		
		// 加载新功能数据
		this.loadExtraData();
		
		this.pageLoaded = true;
		
		// 新用户引导
		setTimeout(() => { this.checkIsNewUser(); }, 300);
	},
	onShow() {
		this.syncPomodoroCount();
		this.activeNav = 'today';
		this.pageLoaded = true;
	},
	onUnload() {
		this.unregisterPomodoroListener();
		if (this.scrollTimer) clearTimeout(this.scrollTimer);
	},
	methods: {
		// --- 新增功能方法 ---
		loadExtraData() {
			// 1. 加载随手记
			const memo = uni.getStorageSync('quickMemo');
			if (memo) this.quickMemo = memo;
			
			// 2. 加载签到状态
			const lastCheckIn = uni.getStorageSync('lastCheckInDate');
			const today = this.buildTodayKey();
			if (lastCheckIn === today) {
				this.hasCheckedIn = true;
				const savedQuote = uni.getStorageSync('dailyQuote');
				if (savedQuote) this.dailyQuote = savedQuote;
			} else {
				this.hasCheckedIn = false;
				this.dailyQuote = '签到获取今日能量与寄语';
			}
		},
		
		handleDailyCheckIn() {
			if (this.hasCheckedIn) return;
			
			this.hasCheckedIn = true;
			const randIndex = Math.floor(Math.random() * this.checkInQuotes.length);
			this.dailyQuote = this.checkInQuotes[randIndex];
			
			// 保存状态
			uni.setStorageSync('lastCheckInDate', this.buildTodayKey());
			uni.setStorageSync('dailyQuote', this.dailyQuote);
			
			uni.showToast({
				title: '能量已充满！',
				icon: 'none'
			});
		},
		
		clearMemo() {
			uni.showModal({
				title: '清空',
				content: '确定清空随手记内容吗？',
				success: (res) => {
					if (res.confirm) {
						this.quickMemo = '';
						this.saveLocalData();
					}
				}
			});
		},
		
		toggleSortMode() {
			this.sortMode = this.sortMode === 'default' ? 'todo' : 'default';
			uni.showToast({
				title: this.sortMode === 'default' ? '默认排序' : '未完成优先',
				icon: 'none'
			});
		},
		
		// --- 原有方法 (部分微调以支持新数据保存) ---
		saveLocalData() {
			const dateKey = this.buildTodayKey();
			const serializedTasks = this.tasks.map(task => ({ ...task }));
			uni.setStorageSync('todayTasks', serializedTasks);
			uni.setStorageSync('todayStats', this.dailyStats);
			uni.setStorageSync('quickMemo', this.quickMemo); // 保存随手记
			
			let taskHistory = uni.getStorageSync('taskHistory') || {};
			taskHistory[dateKey] = serializedTasks;
			
			const allData = getAllAppData();
			allData.tasks = { today: serializedTasks, history: taskHistory };
			allData.stats = { ...this.dailyStats };
			
			saveAllAppData(allData);
		},
		
		// ScrollView 滚动处理
		onPageScroll(e) {
			const scrollTop = e.detail.scrollTop;
			if (this.scrollTimer) return;
			this.scrollTimer = setTimeout(() => {
				const delta = scrollTop - this.lastScrollTop;
				if (Math.abs(delta) < 5) { this.scrollTimer = null; return; }
				if (scrollTop > 100 && delta > 0) {
					this.hideFab = true;
				} else if (delta < 0) {
					this.hideFab = false;
				}
				this.lastScrollTop = scrollTop;
				this.scrollTimer = null;
			}, 50);
		},
		
		// ... 其他原有方法保持不变 ...
		buildGradientCSS(c) { return `linear-gradient(135deg, ${c[0]}, ${c[1]})`; },
		safeRatio(n, d) { return d ? n/d : 0; },
		describeStatus(r) { return r >= 0.8 ? 'good' : (r >= 0.5 ? 'warn' : 'alert'); },
		getStatusLabel(key, r) { return r >= 0.8 ? '状态良好' : (r >= 0.5 ? '保持节奏' : '需要加速'); },
		toggleSideMenu() { this.showSideMenu = !this.showSideMenu; },
		onSideMenuItemTap(item) { 
			this.showSideMenu = false;
			switch (item.action) {
				case 'goals': this.showGoalsSheet = true; break;
				case 'feedback': this.showFeedbackSheet = true; break;
				case 'about': this.showAboutSheet = true; break;
				default: uni.showToast({ title: '功能开发中', icon: 'none' });
			}
		},
		toggleAddSheet() { this.showAddSheet = !this.showAddSheet; if(!this.showAddSheet) this.resetForm(); },
		closeAddSheet() { this.showAddSheet = false; this.resetForm(); },
		resetForm() { this.form = { title: '', deadline: '', date: '', time: '' }; },
		onDateChange(e) { 
			this.form.date = e.detail.value; 
			if (!this.form.time) { const now = new Date(); this.form.time = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`; }
			this.updateDeadline(); 
		},
		onTimeChange(e) { 
			this.form.time = e.detail.value; 
			if (!this.form.date) { const d = new Date(); this.form.date = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
			this.updateDeadline(); 
		},
		selectNoDeadline() { this.form.deadline = ''; this.form.date = ''; this.form.time = ''; },
		updateDeadline() { 
			if(this.form.date && this.form.time) {
				const d = new Date(`${this.form.date} ${this.form.time}`);
				const now = new Date(); now.setHours(0,0,0,0);
				const t = new Date(d); t.setHours(0,0,0,0);
				const diff = Math.floor((t - now) / 86400000);
				const hm = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
				if(diff===0) this.form.deadline = `今天 ${hm}`;
				else if(diff===1) this.form.deadline = `明天 ${hm}`;
				else this.form.deadline = `${d.getMonth()+1}月${d.getDate()}日 ${hm}`;
			} else this.form.deadline = '';
		},
		onBottomNavTap(item) { if(item.target) uni.switchTab({ url: item.target }); },
		toggleTaskDone(task) {
			task.done = !task.done;
			if(task.done) this.dailyStats.completed++;
			else this.dailyStats.completed = Math.max(0, this.dailyStats.completed - 1);
			this.saveLocalData();
		},
		editTask(task) { 
			this.editingTask = task; this.form.title = task.title; this.form.deadline = task.deadline;
			// Simplified parse logic for editing
			this.showEditSheet = true; 
		},
		deleteTask(task) {
			uni.showModal({
				title: '确认删除', content: '确定要删除这个任务吗？',
				success: (res) => {
					if (res.confirm) {
						const idx = this.tasks.findIndex(t => t.id === task.id);
						if(idx > -1) {
							this.tasks.splice(idx, 1);
							this.dailyStats.active = Math.max(0, this.dailyStats.active - 1);
							if(task.done) this.dailyStats.completed = Math.max(0, this.dailyStats.completed - 1);
							this.saveLocalData();
						}
					}
				}
			});
		},
		confirmTask() {
			if(!this.canSubmit) return;
			const newTask = {
				id: Date.now(), title: this.form.title, deadline: this.form.deadline || '无截止时间',
				done: false, expired: false, createdDate: this.buildTodayKey(),
				targetDate: this.extractTargetDateFromDeadline(this.form.deadline, this.form.date)
			};
			this.tasks.unshift(newTask);
			this.dailyStats.active++;
			this.saveLocalData();
			this.resetForm();
			this.closeAddSheet();
		},
		confirmEditTask() {
			if(!this.editingTask) return;
			this.editingTask.title = this.form.title;
			this.editingTask.deadline = this.form.deadline || '无截止时间';
			this.editingTask.targetDate = this.extractTargetDateFromDeadline(this.form.deadline, this.form.date);
			this.saveLocalData();
			this.resetForm();
			this.editingTask = null;
			this.closeEditSheet();
		},
		closeEditSheet() { this.showEditSheet = false; this.editingTask = null; this.resetForm(); },
		readPomodoroStore() { try { return uni.getStorageSync('pomodoroCounts') || {}; } catch(e){ return {}; } },
		syncPomodoroCount() { const s = this.readPomodoroStore(); this.dailyStats.pomodoro = s[this.buildTodayKey()] || 0; },
		registerPomodoroListener() { uni.$on('pomodoro-updated', () => this.syncPomodoroCount()); },
		unregisterPomodoroListener() { uni.$off('pomodoro-updated'); },
		buildTodayKey() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; },
		extractTargetDateFromDeadline(txt, val) { if(val) return val; return null; }, // Simplified
		
		// Load Goals & Init
		loadGoals() {
			const g = uni.getStorageSync('userGoals');
			if(g) { this.goals = g; this.dailyStats.pomodoroGoal = g.pomodoroGoal; this.dailyStats.expiredGoal = g.expiredGoal; }
		},
		saveGoals() {
			this.dailyStats.pomodoroGoal = this.goals.pomodoroGoal;
			this.dailyStats.expiredGoal = this.goals.expiredGoal;
			uni.setStorageSync('userGoals', this.goals);
			this.saveLocalData();
			this.closeGoalsSheet();
			uni.showToast({ title: '已保存', icon: 'success' });
		},
		onPomodoroGoalChanging(e) { this.goals.pomodoroGoal = Number(e.detail.value); },
		onPomodoroGoalChange(e) { this.goals.pomodoroGoal = Number(e.detail.value); },
		onExpiredGoalChanging(e) { this.goals.expiredGoal = Number(e.detail.value); },
		onExpiredGoalChange(e) { this.goals.expiredGoal = Number(e.detail.value); },
		closeGoalsSheet() { this.showGoalsSheet = false; this.loadGoals(); },
		
		// Backup, Feedback, About
		closeBackupSheet() { this.showBackupSheet = false; this.exportedDataJson = ''; },
		exportData() {
			try { this.exportedDataJson = exportAllAppData(true); uni.showToast({ title: '导出成功', icon: 'success' }); }
			catch(e) { uni.showToast({ title: '导出失败', icon: 'none' }); }
		},
		copyExportedData() {
			if(!this.exportedDataJson) return;
			uni.setClipboardData({ data: this.exportedDataJson, success: () => uni.showToast({ title: '已复制', icon: 'success' }) });
		},
		importData() {
			uni.showModal({
				title: '导入数据', editable: true, placeholderText: '粘贴 JSON...', confirmText: '导入',
				success: (res) => {
					if(res.confirm && res.content) {
						if(importAllAppData(res.content)) {
							this.loadLocalData(); uni.showToast({ title: '导入成功', icon: 'success' });
						} else uni.showToast({ title: '导入失败', icon: 'none' });
					}
				}
			});
		},
		copyEmail() { uni.setClipboardData({ data: 'support@timemanager.com', success: () => uni.showToast({ title: '已复制', icon: 'success' }) }); },
		closeFeedbackSheet() { this.showFeedbackSheet = false; },
		closeAboutSheet() { this.showAboutSheet = false; },
		
		// Guide
		checkIsNewUser() {
			const all = getAllAppData();
			if (!all.user?.hasCompletedGuide) { this.showGuide = true; this.currentGuideStepIndex = 0; }
		},
		prevGuideStep() { if(this.currentGuideStepIndex > 0) this.currentGuideStepIndex--; },
		nextGuideStep() { if(this.currentGuideStepIndex < this.guideSteps.length-1) this.currentGuideStepIndex++; else this.completeGuide(); },
		completeGuide() { updateModuleData('user', { hasCompletedGuide: true }); this.showGuide = false; },
		skipGuide() { this.completeGuide(); },
		onGuideVideoEnded() {}, onGuideVideoError(e) {},
		
		// Init Logic
		initializeSampleTasks() {
			// Only add if truly empty
			if (this.tasks.length === 0 && !uni.getStorageSync('todayTasks')) {
				const today = this.buildTodayKey();
				this.tasks = [
					{ id: Date.now(), title: '整理会议纪要', deadline: '今天 18:30', done: false, expired: false, createdDate: today },
					{ id: Date.now()+1, title: '每日锻炼计划', deadline: '无截止时间', done: false, expired: false, createdDate: today }
				];
				this.dailyStats.active = 2;
				this.saveLocalData();
			}
		},
		loadLocalData() {
			const all = getAllAppData();
			if (all.tasks?.today) this.tasks = all.tasks.today;
			if (all.stats) this.dailyStats = { ...this.dailyStats, ...all.stats };
			// fallback old storage
			if (!this.tasks.length) this.loadLocalDataOld();
		},
		loadLocalDataOld() {
			try {
				const t = uni.getStorageSync('todayTasks');
				if(t) this.tasks = t;
				const s = uni.getStorageSync('todayStats');
				if(s) this.dailyStats = { ...this.dailyStats, ...s };
			} catch(e){}
		}
	}
};
</script>

<script module="renderjs" lang="renderjs">
export default {
	methods: {
		updateBar(newValue, oldValue, ownerInstance, instance) {
			if (!newValue) return;
			const { progress, gradient, key } = newValue;
			const barFill = ownerInstance.$el.querySelector(`[data-id="${key}"]`);
			if (barFill) {
				requestAnimationFrame(() => {
					const percentNum = parseFloat(progress) || 0;
					barFill.style.width = '100%';
					barFill.style.backgroundImage = gradient;
					barFill.style.transform = `scaleX(${percentNum / 100})`;
					barFill.style.transformOrigin = 'left';
				});
			}
		}
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
}

.glass {
	background: rgba(255, 255, 255, 0.12);
	border: 1rpx solid rgba(255, 255, 255, 0.18);
	border-radius: 32rpx;
	box-shadow: 0 26rpx 70rpx rgba(9, 20, 35, 0.55),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
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

.icon-more__line {
	display: block;
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
	background: rgba(18, 30, 45, 0.95);
	box-shadow: 2rpx 0 20rpx rgba(0, 0, 0, 0.3);
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
	background: rgba(10,17,28,0.7);
	z-index: 5;
	animation: fade-in 0.4s ease;
}

.side-menu__title {
	font-size: 38rpx;
	font-weight: 600;
}

.side-menu__header,
.side-menu__item {
	opacity: 0;
	transform: translateX(-32rpx);
	transition: transform 0.45s cubic-bezier(0.4, 0, 0.2, 1),
		opacity 0.35s ease;
}

.side-menu--open .side-menu__header,
.side-menu--open .side-menu__item {
	opacity: 1;
	transform: translateX(0);
}

.side-menu--open .side-menu__header {
	transition-delay: 0.02s;
}

.side-menu__list {
	margin-top: 70rpx;
	display: flex;
	flex-direction: column;
	gap: 44rpx;
}

.side-menu--open .side-menu__item:nth-child(1) {
	transition-delay: 0.08s;
}

.side-menu--open .side-menu__item:nth-child(2) {
	transition-delay: 0.12s;
}

.side-menu--open .side-menu__item:nth-child(3) {
	transition-delay: 0.16s;
}

.side-menu--open .side-menu__item:nth-child(4) {
	transition-delay: 0.2s;
}

.side-menu--open .side-menu__item:nth-child(5) {
	transition-delay: 0.24s;
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

/* 核心改动：修改 ScrollView 布局，使其占据全屏 */
.main-scroll {
	position: absolute;
	top: 0; /* 改为 0，从顶部开始 */
	bottom: 0; /* 改为 0，占据到底部 */
	width: 100%;
}

.main-content {
	padding: 0 40rpx;
	/* 移除 padding-bottom，使用下方空 view 占位 */
}

/* 1. 每日签到卡片 */
.checkin-card {
	padding: 32rpx;
	margin-bottom: 40rpx;
	display: flex;
	justify-content: space-between;
	align-items: center;
}
.checkin-content {
	display: flex;
	align-items: center;
	gap: 24rpx;
}
.checkin-icon-box {
	width: 80rpx;
	height: 80rpx;
	background: rgba(255,255,255,0.1);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2rpx solid rgba(255,255,255,0.2);
}
.checkin-icon {
	font-size: 40rpx;
}
.checkin-texts {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}
.checkin-title {
	font-size: 30rpx;
	font-weight: 600;
}
.checkin-sub {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}
.checkin-action {
	background: linear-gradient(135deg, #ffd700, #ffa502);
	padding: 10rpx 30rpx;
	border-radius: 30rpx;
	box-shadow: 0 8rpx 20rpx rgba(255,165,2,0.3);
}
.checkin-btn {
	color: #0f1b2b;
	font-size: 26rpx;
	font-weight: 700;
}

/* 2. 效率概览 */
.efficiency {
	padding: 42rpx 32rpx 58rpx;
	margin-bottom: 40rpx;
}

.card-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 38rpx;
}

.header-left {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
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

.efficiency.glass--active .stat-card {
	animation: float-in 0.75s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.efficiency.glass--active .stat-card:nth-child(2) {
	animation-delay: 0.08s;
}
.efficiency.glass--active .stat-card:nth-child(3) {
	animation-delay: 0.16s;
}
.efficiency.glass--active .stat-card:nth-child(4) {
	animation-delay: 0.24s;
}
.efficiency.glass--active .stat-card:nth-child(5) {
	animation-delay: 0.32s;
}
.efficiency.glass--active .stat-card:nth-child(6) {
	animation-delay: 0.4s;
}

.stat-card {
	position: relative;
	padding: 28rpx 28rpx 32rpx;
	border-radius: 26rpx;
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.1);
	display: flex;
	flex-direction: column;
	gap: 18rpx;
	min-height: 260rpx;
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
	width: 100%;
	height: 100%;
	border-radius: 12rpx;
	background-size: 140%;
	transform-origin: left;
	transition: transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.stat-card__footer {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	font-size: 22rpx;
	color: rgba(255,255,255,0.55);
	margin-top: auto;
}

.stat-card__extra {
	line-height: 1.6;
	color: rgba(255,255,255,0.7);
	font-size: 24rpx;
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

/* 3. Tab 切换栏 */
.home-tabs {
	display: flex;
	padding: 10rpx;
	margin-bottom: 30rpx;
	gap: 20rpx;
}

.tab-pill {
	flex: 1;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	background: rgba(255,255,255,0.06);
	border-radius: 24rpx;
	transition: all 0.3s ease;
	position: relative;
}

.tab-pill--active {
	background: rgba(255,255,255,0.15);
	border: 1rpx solid rgba(255,255,255,0.1);
}

.tab-icon {
	font-size: 32rpx;
}

.tab-text {
	font-size: 28rpx;
	color: rgba(255,255,255,0.8);
	font-weight: 500;
}

.tab-pill--active .tab-text {
	color: #fff;
	font-weight: 600;
}

.active-dot {
	position: absolute;
	bottom: 10rpx;
	width: 8rpx;
	height: 8rpx;
	background: #6ecbff;
	border-radius: 50%;
}

/* 4. 内容区域 */
.tasks {
	padding: 40rpx 32rpx 32rpx;
	margin-bottom: 40rpx;
}

/* 排序按钮 */
.sort-btn {
	display: flex;
	align-items: center;
	gap: 8rpx;
	padding: 10rpx 20rpx;
	background: rgba(255,255,255,0.08);
	border-radius: 24rpx;
}

.sort-icon { font-size: 24rpx; color: rgba(255,255,255,0.6); }
.sort-label { font-size: 24rpx; color: rgba(255,255,255,0.8); }

.tasks.glass--active .task {
	animation: list-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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

/* 随手记样式 */
.memo-card {
	padding: 32rpx;
	margin-bottom: 40rpx;
}
.header-action {
	background: rgba(255,255,255,0.1);
	padding: 8rpx 24rpx;
	border-radius: 20rpx;
}
.action-text {
	font-size: 22rpx;
	color: rgba(255,255,255,0.7);
}
.memo-input {
	width: 100%;
	min-height: 200rpx;
	background: rgba(0,0,0,0.2);
	border-radius: 16rpx;
	padding: 24rpx;
	box-sizing: border-box;
	font-size: 28rpx;
	color: #fff;
	line-height: 1.6;
	margin-top: 20rpx;
}
.memo-placeholder {
	color: rgba(255,255,255,0.3);
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

@keyframes float-in {
	0% {
		opacity: 0;
		transform: translateY(50rpx) scale(0.96);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes list-in {
	0% {
		opacity: 0;
		transform: translateY(40rpx) scale(0.98);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@keyframes sheet-bounce {
	0% {
		opacity: 0;
		transform: translateY(120%);
	}
	70% {
		opacity: 1;
		transform: translateY(-2%);
	}
	100% {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes fab-glow {
	0% {
		opacity: 0.35;
		transform: scale(0.95);
	}
	100% {
		opacity: 0.8;
		transform: scale(1.05);
	}
}

@keyframes fade-in {
	0% { opacity: 0; transform: translateY(10rpx); }
	100% { opacity: 1; transform: translateY(0); }
}

.fade-in {
	animation: fade-in 0.3s ease-out forwards;
}

@media (prefers-reduced-motion: reduce) {
	.efficiency.glass--active .stat-card,
	.tasks.glass--active .task,
	.tasks.glass--active .empty,
	.fab::after,
	.sheet--open {
		animation: none !important;
	}
	.glass,
	.task,
	.fab,
	.sheet,
	.side-menu__header,
	.side-menu__item {
		transition-duration: 0.01ms !important;
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

/* 底部 bar 使用实时动态模糊 */
.bottom-bar.glass {
	background: rgba(255, 255, 255, 0.08);
	border: 1rpx solid rgba(255, 255, 255, 0.12);
	backdrop-filter: blur(50rpx);
	-webkit-backdrop-filter: blur(50rpx);
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
	overflow: visible;
	transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
		box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1),
		opacity 0.3s ease;
}

.fab::after {
	content: '';
	position: absolute;
	inset: -18rpx;
	border-radius: inherit;
	background: radial-gradient(circle, rgba(110,203,255,0.55), rgba(16,24,40,0));
	opacity: 0.6;
	filter: blur(18rpx);
	z-index: -1;
	animation: fab-glow 4s ease-in-out infinite;
	pointer-events: none;
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
	background: rgba(10,17,28,0.85);
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

/* 弹窗使用假模糊效果，提升性能 */
.sheet.glass {
	background: rgba(18, 30, 45, 0.95);
	box-shadow: 0 26rpx 70rpx rgba(9, 20, 35, 0.55),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
}

.sheet--open {
	transform: translateY(0);
	pointer-events: auto;
	opacity: 1;
	animation: sheet-bounce 0.65s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
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

picker.form-value--picker {
	flex: 1;
	margin-left: 16rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

picker.form-value--picker:first-of-type {
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

/* 目标设置样式 */
.form-label-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.form-label-row .form-value {
	font-size: 28rpx;
	color: rgba(255,255,255,0.9);
	font-weight: 500;
}

/* 数据备份样式 */
.backup-content {
	padding: 40rpx;
	display: flex;
	flex-direction: column;
	gap: 40rpx;
}

.backup-section {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.backup-section-title {
	font-size: 30rpx;
	font-weight: 600;
	color: rgba(255,255,255,0.9);
}

.backup-section-desc {
	font-size: 26rpx;
	color: rgba(255,255,255,0.6);
	line-height: 1.6;
}

.backup-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	height: 88rpx;
	border-radius: 24rpx;
	font-size: 28rpx;
	font-weight: 600;
	border: none;
	transition: all 0.3s ease;
	margin-top: 8rpx;
}

.backup-btn::after {
	border: none;
}

.backup-btn-icon {
	font-size: 32rpx;
}

.backup-btn--export {
	background: linear-gradient(135deg, rgba(110,203,255,0.9), rgba(200,155,255,0.9));
	color: #0f1b2b;
	box-shadow: 0 8rpx 24rpx rgba(110,203,255,0.3);
}

.backup-btn--export:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 12rpx rgba(110,203,255,0.3);
}

.backup-btn--import {
	background: rgba(255,255,255,0.1);
	color: rgba(255,255,255,0.9);
	border: 1rpx solid rgba(255,255,255,0.2);
}

.backup-btn--import:active {
	background: rgba(255,255,255,0.15);
	transform: scale(0.98);
}

.backup-btn--copy {
	background: rgba(255,255,255,0.08);
	color: rgba(255,255,255,0.8);
	border: 1rpx solid rgba(255,255,255,0.15);
	font-size: 26rpx;
	height: 72rpx;
}

.backup-btn--copy:active {
	background: rgba(255,255,255,0.12);
	transform: scale(0.98);
}

.backup-json-view {
	max-height: 400rpx;
	background: rgba(0,0,0,0.3);
	border-radius: 16rpx;
	padding: 24rpx;
	border: 1rpx solid rgba(255,255,255,0.1);
	margin-top: 16rpx;
}

.backup-json-text {
	font-size: 22rpx;
	color: rgba(255,255,255,0.8);
	font-family: 'Courier New', monospace;
	line-height: 1.6;
	white-space: pre-wrap;
	word-break: break-all;
}

/* 反馈建议样式 */
.feedback-content {
	padding: 60rpx 40rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 300rpx;
}

.feedback-email-section {
	width: 100%;
	padding: 40rpx;
	background: rgba(255,255,255,0.04);
	border-radius: 24rpx;
	border: 1rpx solid rgba(255,255,255,0.08);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 24rpx;
}

.feedback-email-label {
	font-size: 28rpx;
	color: rgba(255,255,255,0.8);
	text-align: center;
}

.feedback-email-value {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 20rpx 24rpx;
	background: rgba(110,203,255,0.1);
	border-radius: 16rpx;
	border: 1rpx solid rgba(110,203,255,0.2);
	transition: all 0.3s ease;
	width: 100%;
}

.feedback-email-value:active {
	background: rgba(110,203,255,0.15);
	transform: scale(0.98);
}

.feedback-email-text {
	font-size: 28rpx;
	color: #6ecbff;
	font-weight: 500;
	flex: 1;
}

.feedback-email-copy {
	font-size: 32rpx;
	margin-left: 16rpx;
	opacity: 0.8;
}


/* 关于应用样式 */
.about-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: 20rpx;
}

.about-logo {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 50rpx;
}

.about-logo__text {
	font-size: 48rpx;
	font-weight: 600;
	color: rgba(255,255,255,0.95);
	margin-bottom: 12rpx;
	letter-spacing: 4rpx;
}

.about-logo__subtitle {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}

.about-info {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	margin-bottom: 40rpx;
}

.about-info__item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: 24rpx 0;
	border-bottom: 1rpx solid rgba(255,255,255,0.1);
}

.about-info__label {
	font-size: 28rpx;
	color: rgba(255,255,255,0.7);
}

.about-info__value {
	font-size: 28rpx;
	color: rgba(255,255,255,0.9);
	font-weight: 500;
}

.about-desc {
	padding: 30rpx;
	background: rgba(255,255,255,0.04);
	border-radius: 20rpx;
	border: 1rpx solid rgba(255,255,255,0.08);
}

.about-desc__text {
	font-size: 26rpx;
	line-height: 1.8;
	color: rgba(255,255,255,0.7);
	text-align: center;
}

.about-links {
	width: 100%;
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-top: 40rpx;
}

.about-link {
	display: flex;
	align-items: center;
	padding: 28rpx 32rpx;
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.1);
	border-radius: 20rpx;
	transition: all 0.3s ease;
}

.about-link:active {
	background: rgba(255,255,255,0.1);
	transform: scale(0.98);
}

.about-link__icon {
	font-size: 36rpx;
	margin-right: 24rpx;
}

.about-link__text {
	flex: 1;
	font-size: 28rpx;
	color: rgba(255,255,255,0.9);
	font-weight: 500;
}

.about-link__arrow {
	font-size: 32rpx;
	color: rgba(255,255,255,0.5);
}

/* 引导内容 */
.guide-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 40rpx;
	min-height: 400rpx;
	padding: 20rpx 0;
}

.guide-video-container {
	width: 100%;
	height: 400rpx;
	border-radius: 24rpx;
	overflow: hidden;
	background: rgba(255,255,255,0.05);
}

.guide-video {
	width: 100%;
	height: 100%;
	object-fit: contain;
}

.guide-placeholder {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 40rpx;
	width: 100%;
	padding: 60rpx 0;
}

.guide-icon {
	width: 200rpx;
	height: 200rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, rgba(110,203,255,0.9), rgba(200,155,255,0.9));
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 20rpx 60rpx rgba(110,203,255,0.4);
}

.guide-icon-text {
	font-size: 120rpx;
}

.guide-description {
	font-size: 28rpx;
	color: rgba(255,255,255,0.8);
	line-height: 1.8;
	text-align: center;
	padding: 0 40rpx;
}

.guide-indicators {
	display: flex;
	gap: 16rpx;
	justify-content: center;
	margin-top: 20rpx;
}

.guide-indicator {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: rgba(255,255,255,0.3);
	transition: all 0.3s ease;
}

.guide-indicator--active {
	width: 32rpx;
	background: rgba(110,203,255,0.9);
	border-radius: 6rpx;
}

.guide-actions {
	display: flex;
	gap: 20rpx;
	margin-top: 40rpx;
	padding-top: 30rpx;
	border-top: 1rpx solid rgba(255,255,255,0.1);
}

.guide-btn {
	flex: 1;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 24rpx;
	font-size: 30rpx;
	font-weight: 600;
	border: none;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	transition: all 0.3s ease;
}

.guide-btn::after {
	border: none;
}

.guide-btn--prev {
	background: rgba(255,255,255,0.1);
	color: rgba(255,255,255,0.8);
	border: 1rpx solid rgba(255,255,255,0.2);
}

.guide-btn--prev:active {
	background: rgba(255,255,255,0.15);
	transform: scale(0.98);
}

.guide-btn--next {
	background: linear-gradient(135deg, rgba(110,203,255,0.9), rgba(200,155,255,0.9));
	color: #0f1b2b;
	box-shadow: 0 8rpx 24rpx rgba(110,203,255,0.3);
}

.guide-btn--next:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 12rpx rgba(110,203,255,0.3);
}

.guide-btn-icon {
	font-size: 32rpx;
	font-weight: 700;
}
</style>