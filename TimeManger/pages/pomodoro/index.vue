<template>
	<view class="page">
		<view class="page__frost"></view>

		<view class="top-bar glass" :class="{ 'glass--active': pageLoaded }">
			<view class="top-bar__left" @tap="goBackToToday">
				<text class="top-bar__back">◀</text>
			</view>
			<view class="top-bar__center" @longpress="toggleTesterPanel">
				<text class="top-bar__title">番茄钟</text>
				<text class="top-bar__subtitle">保持专注的小助手</text>
			</view>
			<view class="top-bar__right">
				<text class="top-bar__streak">累计番茄 {{ sessionsCompleted }} 颗</text>
			</view>
		</view>

		<scroll-view class="main" scroll-y>
			<view class="timer glass" :class="{ 'glass--active': pageLoaded }">

				<view class="timer__display">
					<view class="timer__ring">
						<view class="timer__ring-progress" :style="{ width: progressPercent, backgroundImage: currentMode.gradient }"></view>
					</view>
					<text class="timer__time">{{ formattedTime }}</text>
					<text class="timer__hint">目标 {{ targetTomatoes }} 颗 · {{ planProgressLabel }} · {{ currentMode.label }}</text>
					<text class="timer__state" :class="{ 'timer__state--break': currentModeKey === 'break' }">{{ currentStateLabel }}</text>
				</view>

				<view class="timer__controls">
					<button class="timer__button timer__button--primary" type="primary" @tap="toggleTimer">
						{{ timerRunning ? '暂停' : '开始' }}
					</button>
					<button class="timer__button" @tap="resetTimer" :disabled="timerState === 'idle'">重置</button>
				</view>

				<view class="timer__footer">
					<text class="timer__status">{{ statusText }}</text>
					<button class="timer__button timer__button--ghost" @tap="finishPlanEarly" :disabled="!canFinishPlan">
						结束计划
					</button>
				</view>
			</view>

			<view class="settings glass" :class="{ 'glass--active': pageLoaded }">
				<view class="settings__header">
					<text class="settings__title">自定义番茄节奏</text>
					<text class="settings__subtitle">设定专注与休息时长，打造自己的节奏</text>
				</view>
				<view class="settings__field">
					<view class="settings__label-row">
						<text class="settings__label">专注时长</text>
						<text class="settings__value">{{ focusMinutes }} 分钟</text>
					</view>
					<slider
						class="settings__slider"
						min="10"
						max="90"
						step="5"
						:value="focusMinutes"
						activeColor="#6ecbff"
						backgroundColor="rgba(255,255,255,0.12)"
						:disabled="settingsLocked"
						@change="onFocusDurationChange"
					></slider>
				</view>
				<view class="settings__field">
					<view class="settings__label-row">
						<text class="settings__label">休息时长</text>
						<text class="settings__value">{{ breakMinutes }} 分钟</text>
					</view>
					<slider
						class="settings__slider"
						min="3"
						max="30"
						step="1"
						:value="breakMinutes"
						activeColor="#ff9f1f"
						backgroundColor="rgba(255,255,255,0.12)"
						:disabled="settingsLocked"
						@change="onBreakDurationChange"
					></slider>
				</view>
				<view class="settings__field">
					<view class="settings__label-row">
						<text class="settings__label">番茄目标</text>
						<text class="settings__value">{{ targetTomatoes }} 颗</text>
					</view>
					<slider
						class="settings__slider"
						min="1"
						max="12"
						step="1"
						:value="targetTomatoes"
						activeColor="#74f7ca"
						backgroundColor="rgba(255,255,255,0.12)"
						:disabled="settingsLocked"
						@change="onTargetTomatoesChange"
					></slider>
				</view>
			</view>

			<view class="insights glass" :class="{ 'glass--active': pageLoaded }">
				<view class="insights__header">
					<text class="insights__title">专注小贴士</text>
					<text class="insights__subtitle">掌握节奏，保持高效</text>
				</view>
				<view class="tips">
					<view class="tip" v-for="tip in tips" :key="tip.title">
						<text class="tip__title">{{ tip.title }}</text>
						<text class="tip__desc">{{ tip.desc }}</text>
					</view>
				</view>
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

		<view v-if="testPanelVisible" class="tester-panel glass glass--active" @tap.stop>
			<view class="tester-panel__header">
				<text class="tester-panel__title">调试工具</text>
				<text class="tester-panel__close" @tap="hideTesterPanel">✕</text>
			</view>
			<view class="tester-panel__actions">
				<button class="tester-panel__action" @tap="triggerTesterAction('mock-focus')">模拟完成一颗</button>
				<button class="tester-panel__action" @tap="triggerTesterAction('mock-break')">模拟进入休息阶段</button>
				<button class="tester-panel__action" @tap="triggerTesterAction('finish-plan')">直接完成计划</button>
				<button class="tester-panel__action" @tap="triggerTesterAction('reset-data')">清空今日数据</button>
			</view>
		</view>

		<view class="report-mask" v-if="reportVisible" @tap="closeReport">
			<view class="report glass glass--active" @tap.stop>
				<view class="report__header">
					<text class="report__title">专注完成</text>
					<text class="report__subtitle">刚刚的专注表现一览</text>
				</view>
				<view class="report__stats">
					<view class="report__stat">
						<text class="report__stat-label">专注时长</text>
						<text class="report__stat-value">{{ reportData.duration }}</text>
					</view>
					<view class="report__stat">
						<text class="report__stat-label">获番茄</text>
						<text class="report__stat-value">{{ reportData.gained }} / {{ reportData.target }}</text>
					</view>
					<view class="report__stat">
						<text class="report__stat-label">总番茄</text>
						<text class="report__stat-value">{{ reportData.total }}</text>
					</view>
				</view>
				<button class="report__action" @tap="closeReport">继续下一轮</button>
			</view>
		</view>
	</view>
</template>

<script>
const STORAGE_SETTINGS_KEY = 'pomodoroSettings';
const STORAGE_COUNT_KEY = 'pomodoroCounts';

export default {
	data() {
		return {
			pageLoaded: false,
			currentModeKey: 'focus',
			timerState: 'idle',
			timerInterval: null,
			elapsedSeconds: 0,
			sessionsCompleted: 0,
			focusMinutes: 25,
			breakMinutes: 5,
			targetTomatoes: 4,
			planActive: false,
			planEarnedTomatoes: 0,
			planFocusSeconds: 0,
			bottomNavItems: [
				{ key: 'today', label: '今日', icon: '◎', target: '/pages/index/index' },
				{ key: 'tracking', label: '番茄钟', icon: '◴', target: '/pages/pomodoro/index' },
				{ key: 'mine', label: '我的', icon: '△', target: '' }
			],
			activeNav: 'tracking',
			tips: [
				{ title: '规划你的番茄', desc: '开始之前先列出 3 个最想完成的任务，明确优先级。' },
				{ title: '保持节奏', desc: '一次番茄专注完成一件事，中途尽量避免切换任务。' },
				{ title: '善用休息', desc: '休息时完全离开工作区，做伸展或喝水，避免继续看屏幕。' }
			],
			reportVisible: false,
			reportData: {
				duration: '00:00:00',
				gained: 0,
				target: 0,
				total: 0,
				completed: false
			},
			testPanelVisible: false
		};
	},
	computed: {
		modeList() {
			return [
				{
					key: 'focus',
					label: `专注 ${this.focusMinutes}′`,
					desc: '全情投入，保持高效',
					gradient: 'linear-gradient(135deg, #6ecbff 0%, #3a7bff 100%)'
				},
				{
					key: 'break',
					label: `休息 ${this.breakMinutes}′`,
					desc: '短暂放松，补充能量',
					gradient: 'linear-gradient(135deg, #ffe066 0%, #ffba42 100%)'
				}
			];
		},
		currentMode() {
			return this.modeList.find(mode => mode.key === this.currentModeKey) || this.modeList[0];
		},
		timerRunning() {
			return this.timerState === 'running';
		},
		formattedTime() {
			const total = Math.max(0, this.elapsedSeconds);
			const hours = Math.floor(total / 3600)
				.toString()
				.padStart(2, '0');
			const minutes = Math.floor((total % 3600) / 60)
				.toString()
				.padStart(2, '0');
			const seconds = Math.floor(total % 60)
				.toString()
				.padStart(2, '0');
			return `${hours}:${minutes}:${seconds}`;
		},
		currentDurationSeconds() {
			const minutes = this.currentModeKey === 'focus' ? this.focusMinutes : this.breakMinutes;
			return Math.max(0, Math.round(minutes * 60));
		},
		progressPercent() {
			const total = this.currentDurationSeconds;
			if (!total) {
				return '0%';
			}
			const ratio = Math.min(this.elapsedSeconds / total, 1);
			return `${Math.round(ratio * 100)}%`;
		},
		statusText() {
			if (this.currentModeKey === 'focus') {
				if (this.timerState === 'running') {
					return '专注进行中，保持节奏';
				}
				if (this.timerState === 'paused') {
					return '专注暂停，可随时继续';
				}
				return '准备开始下一颗番茄';
			}
			if (this.timerState === 'running') {
				return '休息中，放松一下';
			}
			if (this.timerState === 'paused') {
				return '休息暂停，可随时继续';
			}
			return '准备开始休息时间';
		},
		currentStateLabel() {
			if (this.currentModeKey === 'focus') {
				if (this.timerState === 'running') {
					return '当前状态：专注进行中';
				}
				if (this.timerState === 'paused') {
					return '当前状态：专注已暂停';
				}
				return '当前状态：准备开始专注';
			}
			if (this.timerState === 'running') {
				return '当前状态：休息恢复中';
			}
			if (this.timerState === 'paused') {
				return '当前状态：休息已暂停';
			}
			return '当前状态：准备开始休息';
		},
		planProgressLabel() {
			const target = Math.max(1, this.targetTomatoes || 1);
			const completed = Math.min(this.planEarnedTomatoes, target);
			return `已完成 ${completed}/${target} 颗`;
		},
		settingsLocked() {
			return this.planActive || this.timerState !== 'idle';
		},
		canFinishPlan() {
			if (this.planActive) {
				return true;
			}
			return this.planEarnedTomatoes > 0 || this.elapsedSeconds > 0;
		}
	},
	onLoad() {
		uni.hideTabBar({ animation: false });
		this.restoreSettings();
		this.restoreSessions();
		setTimeout(() => {
			this.pageLoaded = true;
		}, 80);
	},
	onShow() {
		this.restoreSessions();
		this.activeNav = 'tracking';
	},
	onHide() {
		this.clearTimer();
	},
	onUnload() {
		this.clearTimer();
	},
	methods: {
		goBackToToday() {
			if (this.activeNav === 'today') {
				return;
			}
			uni.switchTab({ url: '/pages/index/index' });
		},
		toggleTesterPanel() {
			this.testPanelVisible = !this.testPanelVisible;
			if (this.testPanelVisible) {
				uni.showToast({ title: '测试面板已开启', icon: 'none' });
			}
		},
		hideTesterPanel() {
			if (!this.testPanelVisible) {
				return;
			}
			this.testPanelVisible = false;
		},
		triggerTesterAction(action) {
			switch (action) {
				case 'mock-focus': {
					this.beginPlanIfNeeded();
					const focusSeconds = Math.max(60, this.focusMinutes * 60);
					this.planFocusSeconds += focusSeconds;
					this.planEarnedTomatoes += 1;
					this.sessionsCompleted += 1;
					this.saveSessions();
					uni.showToast({ title: '模拟完成 1 颗', icon: 'none' });
					break;
				}
				case 'mock-break': {
					this.beginPlanIfNeeded();
					if (this.reportVisible) {
						this.reportVisible = false;
					}
					this.switchMode('break', { silent: true, autoStart: true, force: true, preserveReport: true });
					uni.showToast({ title: '已进入休息阶段', icon: 'none' });
					break;
				}
				case 'finish-plan': {
					this.beginPlanIfNeeded();
					const target = Math.max(1, this.targetTomatoes);
					this.planEarnedTomatoes = target;
					this.planFocusSeconds = target * Math.max(60, this.focusMinutes * 60);
					this.finalizePlan({ completed: true });
					break;
				}
				case 'reset-data': {
					this.resetTimer(true);
					this.resetPlanState();
					this.sessionsCompleted = 0;
					try {
						uni.removeStorageSync(STORAGE_COUNT_KEY);
					} catch (err) {
						console.warn('清除番茄统计失败', err);
					}
					this.saveSessions();
					this.hideTesterPanel();
					uni.showToast({ title: '今日数据已清空', icon: 'none' });
					break;
				}
				default:
					uni.showToast({ title: '未知操作', icon: 'none' });
			}
		},
		switchMode(modeKey, options = {}) {
			const { silent = false, autoStart = false, force = false, preserveReport = false } = options;
			if (!force && modeKey === this.currentModeKey) {
				return;
			}
			this.clearTimer();
			this.currentModeKey = modeKey;
			this.elapsedSeconds = 0;
			this.timerState = 'idle';
			if (this.reportVisible && !preserveReport) {
				this.reportVisible = false;
			}
			if (!silent) {
				const title = modeKey === 'focus' ? '已切换到专注模式' : '已切换到休息模式';
				uni.showToast({ title, icon: 'none' });
			}
			if (autoStart) {
				this.startTimer();
			}
		},
		toggleTimer() {
			if (this.timerRunning) {
				this.pauseTimer();
				return;
			}
			if (this.reportVisible) {
				this.reportVisible = false;
			}
			this.beginPlanIfNeeded();
			this.startTimer();
		},
		startTimer() {
			if (this.timerRunning) {
				return;
			}
			if (!this.currentDurationSeconds) {
				uni.showToast({ title: '请先设置专注与休息时长', icon: 'none' });
				return;
			}
			this.beginPlanIfNeeded();
			if (!this.timerInterval) {
				this.timerInterval = setInterval(() => {
					this.elapsedSeconds += 1;
					if (this.currentDurationSeconds && this.elapsedSeconds >= this.currentDurationSeconds) {
						this.handleTimerComplete({ reason: 'auto' });
					}
				}, 1000);
			}
			this.timerState = 'running';
		},
		pauseTimer() {
			if (!this.timerRunning) {
				return;
			}
			this.clearTimer();
			this.timerState = 'paused';
		},
		resetTimer(silent = false) {
			this.clearTimer();
			this.elapsedSeconds = 0;
			this.timerState = 'idle';
			if (this.reportVisible) {
				this.reportVisible = false;
			}
			this.resetPlanState();
			if (!silent) {
				uni.showToast({ title: '已重置计时', icon: 'none' });
			}
		},
		handleTimerComplete(options = {}) {
			const { reason = 'auto' } = options;
			const spentSeconds = this.elapsedSeconds;
			const prevMode = this.currentModeKey;
			this.clearTimer();
			this.elapsedSeconds = 0;
			this.timerState = 'idle';
			if (prevMode === 'focus') {
				const focusDurationSeconds = spentSeconds > 0 ? spentSeconds : this.currentDurationSeconds;
				this.planFocusSeconds += focusDurationSeconds;
				this.planEarnedTomatoes += 1;
				this.sessionsCompleted += 1;
				this.saveSessions();
				const planFinished = this.planEarnedTomatoes >= this.targetTomatoes;
				if (planFinished) {
					this.finalizePlan({ completed: true, reason });
					return;
				}
				uni.showToast({ title: '完成专注，开始休息', icon: 'none' });
				this.switchMode('break', { silent: true, autoStart: true, force: true });
				return;
			}
			if (!this.planActive) {
				this.switchMode('focus', { silent: true, force: true });
				return;
			}
			uni.showToast({ title: '休息完成，继续加油', icon: 'none' });
			this.switchMode('focus', { silent: true, autoStart: true, force: true });
		},
		finishPlanEarly() {
			if (!this.canFinishPlan) {
				return;
			}
			if (this.currentModeKey === 'focus' && this.elapsedSeconds > 0) {
				this.planFocusSeconds += this.elapsedSeconds;
			}
			this.finalizePlan({ completed: false, reason: 'manual' });
		},
		onBottomNavTap(item) {
			if (item.key === this.activeNav) {
				return;
			}
			if (item.key === 'mine') {
				uni.showToast({ title: '敬请期待', icon: 'none' });
				return;
			}
			if (item.target) {
				uni.switchTab({ url: item.target });
			}
		},
		clearTimer() {
			if (this.timerInterval) {
				clearInterval(this.timerInterval);
				this.timerInterval = null;
			}
		},
		onFocusDurationChange(event) {
			if (!this.ensureSettingsEditable()) {
				return;
			}
			const value = Number(event.detail.value) || this.focusMinutes;
			const minutes = Math.max(1, Math.min(180, value));
			if (minutes === this.focusMinutes) {
				return;
			}
			this.focusMinutes = minutes;
			this.persistSettings();
			if (this.currentModeKey === 'focus') {
				this.resetTimer(true);
			}
		},
		onBreakDurationChange(event) {
			if (!this.ensureSettingsEditable()) {
				return;
			}
			const value = Number(event.detail.value) || this.breakMinutes;
			const minutes = Math.max(1, Math.min(60, value));
			if (minutes === this.breakMinutes) {
				return;
			}
			this.breakMinutes = minutes;
			this.persistSettings();
			if (this.currentModeKey === 'break') {
				this.resetTimer(true);
			}
		},
		onTargetTomatoesChange(event) {
			if (!this.ensureSettingsEditable()) {
				return;
			}
			const value = Number(event.detail.value) || this.targetTomatoes;
			const target = Math.max(1, Math.min(20, Math.round(value)));
			if (target === this.targetTomatoes) {
				return;
			}
			this.targetTomatoes = target;
			this.persistSettings();
			if (this.planActive || this.planEarnedTomatoes > 0 || this.elapsedSeconds > 0) {
				this.resetTimer(true);
				uni.showToast({ title: '目标已更新，重新开始', icon: 'none' });
			}
		},
		beginPlanIfNeeded() {
			if (this.planActive) {
				return;
			}
			this.planActive = true;
			this.planEarnedTomatoes = 0;
			this.planFocusSeconds = 0;
		},
		resetPlanState() {
			this.planActive = false;
			this.planEarnedTomatoes = 0;
			this.planFocusSeconds = 0;
		},
		ensureSettingsEditable() {
			if (!this.settingsLocked) {
				return true;
			}
			uni.showToast({ title: '进行中的番茄不可修改节奏', icon: 'none' });
			return false;
		},
		finalizePlan({ completed }) {
			this.hideTesterPanel();
			this.clearTimer();
			this.timerState = 'idle';
			this.elapsedSeconds = 0;
			this.currentModeKey = 'focus';
			const summarySeconds = this.planFocusSeconds;
			const durationLabel = this.formatSecondsToLabel(summarySeconds);
			this.reportData = {
				duration: durationLabel,
				gained: this.planEarnedTomatoes,
				target: this.targetTomatoes,
				total: this.sessionsCompleted,
				completed
			};
			this.reportVisible = true;
			this.resetPlanState();
		},
		persistSettings() {
			const payload = {
				focusMinutes: this.focusMinutes,
				breakMinutes: this.breakMinutes,
				targetTomatoes: this.targetTomatoes
			};
			try {
				uni.setStorageSync(STORAGE_SETTINGS_KEY, payload);
			} catch (err) {
				console.warn('保存番茄设定失败', err);
			}
		},
		restoreSettings() {
			try {
				const stored = uni.getStorageSync(STORAGE_SETTINGS_KEY);
				if (stored && typeof stored === 'object') {
					if (stored.focusMinutes) {
						this.focusMinutes = Number(stored.focusMinutes) || this.focusMinutes;
					}
					if (stored.breakMinutes) {
						this.breakMinutes = Number(stored.breakMinutes) || this.breakMinutes;
					}
					if (stored.targetTomatoes) {
						this.targetTomatoes = Number(stored.targetTomatoes) || this.targetTomatoes;
					}
				}
			} catch (err) {
				console.warn('读取番茄设定失败', err);
			}
		},
		saveSessions() {
			const store = this.readSessionStore();
			store[this.buildTodayKey()] = this.sessionsCompleted;
			try {
				uni.setStorageSync(STORAGE_COUNT_KEY, store);
				uni.$emit('pomodoro-updated', { count: this.sessionsCompleted });
			} catch (err) {
				console.warn('保存番茄统计失败', err);
			}
		},
		restoreSessions() {
			const store = this.readSessionStore();
			const key = this.buildTodayKey();
			const value = store[key];
			this.sessionsCompleted = typeof value === 'number' ? value : 0;
		},
		readSessionStore() {
			try {
				const stored = uni.getStorageSync(STORAGE_COUNT_KEY);
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
		showFocusReport(spentSeconds, reward) {
			const effectiveSeconds = Math.max(0, Math.round(spentSeconds || 0));
			const durationLabel = this.formatSecondsToLabel(effectiveSeconds);
			this.reportData = {
				duration: durationLabel,
				reward,
				total: this.sessionsCompleted
			};
			this.reportVisible = true;
			this.lastFocusSummary = null;
		},
		closeReport() {
			this.reportVisible = false;
			this.hideTesterPanel();
		},
		formatSecondsToLabel(seconds) {
			const safeSeconds = Math.max(0, Math.round(seconds || 0));
			const hours = Math.floor(safeSeconds / 3600)
				.toString()
				.padStart(2, '0');
			const minutes = Math.floor((safeSeconds % 3600) / 60)
				.toString()
				.padStart(2, '0');
			const secs = Math.floor(safeSeconds % 60)
				.toString()
				.padStart(2, '0');
			return `${hours}:${minutes}:${secs}`;
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

.page__frost {
	position: absolute;
	left: -40vw;
	top: -40vh;
	width: 120vw;
	height: 120vh;
	background: radial-gradient(circle at 20% 30%, rgba(110,203,255,0.45), transparent 55%),
		radial-gradient(circle at 75% 25%, rgba(200,155,255,0.4), transparent 60%),
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
	z-index: 2;
}

.glass--active {
	opacity: 1;
	transform: translateY(0);
}

.top-bar {
	position: relative;
	margin: 60rpx 40rpx 28rpx;
	height: 140rpx;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 30rpx;
	z-index: 3;
}

.top-bar__left {
	width: 120rpx;
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.top-bar__center {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 10rpx;
	text-align: center;
	width: 320rpx;
	pointer-events: auto;
}

.top-bar__right {
	min-width: 200rpx;
	display: flex;
	justify-content: flex-end;
	font-size: 22rpx;
	color: rgba(255,255,255,0.65);
}

.top-bar__back {
	font-size: 46rpx;
	color: rgba(255,255,255,0.8);
}

.top-bar__title {
	font-size: 40rpx;
	font-weight: 600;
}

.top-bar__subtitle {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}

.main {
	position: relative;
	padding: 0 40rpx 220rpx;
	box-sizing: border-box;
	z-index: 2;
	padding-bottom: calc(240rpx + env(safe-area-inset-bottom));
}

.timer {
	padding: 48rpx 36rpx 54rpx;
	margin-bottom: 40rpx;
	display: flex;
	flex-direction: column;
	gap: 34rpx;
}

.timer__display {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 18rpx;
}

.timer__ring {
	position: relative;
	width: 360rpx;
	height: 24rpx;
	border-radius: 12rpx;
	background: rgba(255,255,255,0.12);
	overflow: hidden;
}

.timer__ring-progress {
	position: absolute;
	left: 0;
	top: 0;
	height: 100%;
	border-radius: 12rpx;
	transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.timer__time {
	font-size: 82rpx;
	font-weight: 700;
	letter-spacing: 4rpx;
}

.timer__hint {
	font-size: 26rpx;
	color: rgba(255,255,255,0.65);
}

.timer__state {
	font-size: 26rpx;
	color: rgba(255,255,255,0.8);
	letter-spacing: 1rpx;
}

.timer__state--break {
	color: #ffdf68;
}

.timer__controls {
	display: flex;
	gap: 24rpx;
	justify-content: center;
}

.timer__button {
	min-width: 180rpx;
	height: 80rpx;
	line-height: 80rpx;
	border-radius: 24rpx;
	border: none;
	background: rgba(255,255,255,0.1);
	color: #ffffff;
	font-size: 28rpx;
}

.timer__button--primary {
	background: linear-gradient(135deg, rgba(110,203,255,0.9), rgba(200,155,255,0.9));
	color: #101828;
	font-weight: 600;
}

.timer__button--ghost {
	background: rgba(255,255,255,0.08);
	color: rgba(255,255,255,0.85);
}

.timer__button[disabled] {
	opacity: 0.5;
}

.timer__footer {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}

.settings {
	padding: 40rpx 36rpx 46rpx;
	margin-bottom: 40rpx;
	display: flex;
	flex-direction: column;
	gap: 34rpx;
}

.settings__header {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.settings__title {
	font-size: 34rpx;
	font-weight: 600;
}

.settings__subtitle {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}

.settings__field {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.settings__label-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.settings__label {
	font-size: 28rpx;
	font-weight: 500;
}

.settings__value {
	font-size: 24rpx;
	color: rgba(255,255,255,0.7);
}

.settings__slider {
	margin: 0;
}


.insights {
	padding: 40rpx 36rpx;
	margin-bottom: 40rpx;
}

.insights__header {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	margin-bottom: 32rpx;
}

.insights__title {
	font-size: 34rpx;
	font-weight: 600;
}

.insights__subtitle {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}

.tips {
	display: flex;
	flex-direction: column;
	gap: 24rpx;
}

.tip {
	padding: 30rpx 26rpx;
	border-radius: 24rpx;
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.1);
}

.tip__title {
	font-size: 28rpx;
	font-weight: 600;
	margin-bottom: 12rpx;
}

.tip__desc {
	font-size: 24rpx;
	color: rgba(255,255,255,0.62);
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

.report-mask {
	position: fixed;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	background: rgba(10,17,28,0.55);
	backdrop-filter: blur(6rpx);
	z-index: 20;
	display: grid;
	place-items: center;
	padding: 40rpx;
	box-sizing: border-box;
}

.report {
	width: min(660rpx, calc(100% - 80rpx));
	padding: 48rpx 40rpx 56rpx;
	border-radius: 36rpx;
	box-sizing: border-box;
	max-height: calc(100% - 80rpx);
	display: flex;
	flex-direction: column;
	gap: 32rpx;
}

.report__header {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.report__title {
	font-size: 36rpx;
	font-weight: 600;
}

.report__subtitle {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}

.report__stats {
	display: flex;
	justify-content: space-between;
	gap: 20rpx;
}

.report__stat {
	flex: 1;
	padding: 28rpx 24rpx;
	border-radius: 24rpx;
	background: rgba(255,255,255,0.05);
	border: 1rpx solid rgba(255,255,255,0.12);
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.report__stat-label {
	font-size: 24rpx;
	color: rgba(255,255,255,0.65);
}

.report__stat-value {
	font-size: 32rpx;
	font-weight: 600;
	color: #ffffff;
}

.report__action {
	height: 96rpx;
	line-height: 96rpx;
	border-radius: 24rpx;
	background: linear-gradient(135deg, rgba(110,203,255,0.9), rgba(200,155,255,0.9));
	color: #101828;
	font-size: 32rpx;
	font-weight: 600;
	border: none;
}

.tester-panel {
	position: fixed;
	right: 40rpx;
	top: 200rpx;
	width: 320rpx;
	padding: 28rpx 24rpx 32rpx;
	display: flex;
	flex-direction: column;
	gap: 24rpx;
	z-index: 11;
}

.tester-panel__header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.tester-panel__title {
	font-size: 26rpx;
	font-weight: 600;
}

.tester-panel__close {
	font-size: 28rpx;
	color: rgba(255,255,255,0.7);
	padding: 6rpx 10rpx;
}

.tester-panel__actions {
	display: flex;
	flex-direction: column;
	gap: 18rpx;
}

.tester-panel__action {
	width: 100%;
	height: 72rpx;
	line-height: 72rpx;
	border-radius: 20rpx;
	background: rgba(255,255,255,0.14);
	color: #ffffff;
	font-size: 26rpx;
	border: 1rpx solid rgba(255,255,255,0.16);
}

.tester-panel__action:active {
	background: rgba(110,203,255,0.35);
	color: #0f1421;
}
</style>
