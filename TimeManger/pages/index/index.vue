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
				<view class="side-menu__item" v-for="item in sideMenuItems" :key="item.label">
					<text class="side-menu__item-label">{{ item.label }}</text>
					<text class="side-menu__item-tip">{{ item.tip }}</text>
				</view>
			</view>
		</view>
		<view class="side-menu__mask" v-if="showSideMenu" @tap="toggleSideMenu"></view>

		<scroll-view class="main" scroll-y>
			<view class="efficiency glass" :class="{ 'glass--active': pageLoaded }">
				<view class="card-header">
					<text class="card-title">效率三环</text>
					<text class="card-sub">高效、专注、可控的每日状态</text>
				</view>
				<view class="rings">
					<svg class="rings__canvas" viewBox="0 0 120 120">
						<defs>
							<linearGradient v-for="spec in ringSpecs" :key="spec.gradientId" :id="spec.gradientId" x1="1" y1="0" x2="0" y2="1">
								<stop v-for="(color, idx) in spec.colors" :key="`${spec.id}-stop-${idx}`" :offset="`${(idx / (spec.colors.length - 1)) * 100}%`" :stop-color="color"></stop>
							</linearGradient>
						</defs>
						<circle v-for="spec in ringSpecs" :key="`${spec.id}-track`" class="rings__track" cx="60" cy="60" :r="spec.radius" :stroke-width="spec.strokeWidth" :stroke="spec.trackColor"></circle>
						<circle v-for="spec in ringSpecs" :key="spec.id" class="rings__progress" cx="60" cy="60" :r="spec.radius" :stroke-width="spec.strokeWidth" :stroke="`url(#${spec.gradientId})`" stroke-linecap="round" :stroke-dasharray="spec.dashArray" :stroke-dashoffset="spec.dashOffset" :transform="`rotate(${spec.rotation} 60 60)`"></circle>
					</svg>
				</view>
				<view class="ring-legend">
					<view class="ring-legend__item" v-for="metric in ringMetrics" :key="metric.label">
						<view class="ring-legend__dot" :style="{ backgroundImage: metric.gradient }"></view>
						<view class="ring-legend__texts">
							<text class="ring-legend__label">{{ metric.label }}</text>
							<text class="ring-legend__value">{{ metric.value }}</text>
							<text class="ring-legend__extra">{{ metric.extra }}</text>
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
					<view class="task__info">
						<text class="task__title">{{ task.title }}</text>
						<text class="task__deadline">{{ task.deadline }}</text>
					</view>
					<switch :checked="task.done" @change="onTaskToggle(task, $event)"></switch>
				</view>
				<view v-if="!tasks.length" class="empty">
					<text class="empty__tip">还没有任务，点击右下角添加吧</text>
				</view>
			</view>
		</scroll-view>

		<view class="bottom-bar glass" :class="{ 'glass--active': pageLoaded }">
			<view
				class="bottom-bar__item"
				v-for="item in bottomNavItems"
				:key="item.key"
				:class="{ 'bottom-bar__item--active': activeNav === item.key, 'bottom-bar__item--disabled': !item.available }"
				@tap="onBottomNavTap(item)"
			>
				<text class="bottom-bar__icon">{{ item.icon }}</text>
				<text class="bottom-bar__label">{{ item.label }}</text>
			</view>
		</view>

		<view class="fab" :class="{ 'fab--pulse': showAddSheet }" @tap="toggleAddSheet">
			<text class="fab__icon">+</text>
		</view>

		<view class="sheet-mask" v-if="showAddSheet" @tap="closeAddSheet"></view>
		<view class="sheet glass" :class="{ 'sheet--open': showAddSheet }" @touchmove.stop.prevent>
			<view class="sheet__handle"></view>
			<text class="sheet__title">添加今日任务</text>
			<view class="form-field">
				<text class="form-label">任务名称</text>
				<input class="form-input" placeholder="输入任务标题" v-model="form.title" />
			</view>
			<view class="form-field form-field--select" @tap="openDeadlinePicker">
				<text class="form-label">截止时间</text>
				<view class="form-value">
					<text>{{ form.deadline || '请选择截止时间' }}</text>
					<text class="form-arrow">></text>
				</view>
			</view>
			<view class="form-field">
				<text class="form-label">番茄数量</text>
				<slider class="form-slider" min="1" max="12" step="1" :value="form.tomatoes" activeColor="#6ecbff" backgroundColor="rgba(255,255,255,0.15)" @change="onTomatoChange"></slider>
				<text class="slider-value">{{ form.tomatoes }} 个</text>
			</view>
			<button class="sheet__action" type="primary" :disabled="!canSubmit" @tap="confirmTask">添加任务</button>
		</view>

		<view class="deadline" :class="{ 'deadline--open': showDeadlinePicker }" @touchmove.stop.prevent>
			<view class="deadline__header">
				<text class="deadline__title">选择截止时间</text>
				<text class="deadline__close" @tap="closeDeadlinePicker">完成</text>
			</view>
			<scroll-view class="deadline__body" scroll-y>
				<view class="deadline-group" v-for="group in deadlineOptions" :key="group.label">
					<text class="deadline-group__label">{{ group.label }}</text>
					<view class="deadline-group__items">
						<view class="deadline-option" v-for="option in group.items" :key="option.value" :class="{ 'deadline-option--active': form.deadline === option.value }" @tap="selectDeadline(option)">
							<text class="deadline-option__text">{{ option.value }}</text>
							<text class="deadline-option__sub">{{ option.tip }}</text>
						</view>
					</view>
				</view>
			</scroll-view>
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
			showDeadlinePicker: false,
			dailyStats: {
				completed: 5,
				active: 9,
				pomodoro: 7,
				pomodoroGoal: 12,
				expired: 1,
				expiredGoal: 4
			},
			tasks: [
				{ id: 1, title: '整理会议纪要', deadline: '今天 18:30', done: false, expired: false },
				{ id: 2, title: '晚间冥想 20 分钟', deadline: '今天 21:00', done: true, expired: false },
				{ id: 3, title: '复盘项目进度', deadline: '明天 09:00', done: false, expired: false }
			],
			form: {
				title: '',
				deadline: '',
				tomatoes: 3
			},
			deadlineOptions: [
				{ label: '今天', items: [
					{ value: '今天 17:00', tip: '收尾工作前完成' },
					{ value: '今天 20:00', tip: '晚间复盘时间' },
					{ value: '今天 22:00', tip: '睡前检查' }
				] },
				{ label: '明天', items: [
					{ value: '明天 09:00', tip: '晨间优先事项' },
					{ value: '明天 14:00', tip: '午后空档' },
					{ value: '明天 19:00', tip: '下班前完成' }
				] },
				{ label: '本周', items: [
					{ value: '周三 10:00', tip: '周中推进' },
					{ value: '周五 18:00', tip: '周末前收官' },
					{ value: '周日 21:00', tip: '周总结' }
				] }
			],
			sideMenuItems: [
				{ label: '效率洞察', tip: '查看长期趋势' },
				{ label: '任务模板', tip: '复用高频计划' },
				{ label: '专注计时', tip: '开启番茄钟' },
				{ label: '数据同步', tip: 'HarmonyOS 多端共享' }
			],
			bottomNavItems: [
				{ key: 'today', label: '今日', icon: '◎', available: true },
				{ key: 'tracking', label: '追踪', icon: '◇', available: false },
				{ key: 'mine', label: '我的', icon: '△', available: false }
			],
			activeNav: 'today'
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
		ringSpecs() {
			const rotation = -210;
			const maxRatio = 0.9;
			const specs = [
				{ id: 'outer', radius: 52, strokeWidth: 12, ratio: this.completionRatio, colors: this.ringColors.outer },
				{ id: 'middle', radius: 36, strokeWidth: 12, ratio: this.pomodoroRatio, colors: this.ringColors.middle },
				{ id: 'inner', radius: 20, strokeWidth: 12, ratio: this.expiredRatio, colors: this.ringColors.inner }
			];
			return specs.map(spec => {
				const circumference = 2 * Math.PI * spec.radius;
				const adjusted = this.safeRatio(spec.ratio, 1) * maxRatio;
				return {
					...spec,
					circumference,
					dashArray: circumference,
					dashOffset: circumference * (1 - adjusted),
					rotation,
					gradientId: `ringGradient-${spec.id}`,
					trackColor: this.withAlpha(spec.colors[spec.colors.length - 1], 0.18)
				};
			});
		},
		ringMetrics() {
			const gradients = {
				outer: this.buildGradientCSS(this.ringColors.outer),
				middle: this.buildGradientCSS(this.ringColors.middle),
				inner: this.buildGradientCSS(this.ringColors.inner)
			};
			return [
				{
					label: '任务完成度',
					gradient: gradients.outer,
					value: `${(this.completionRatio * 100).toFixed(0)}%`,
					extra: `${this.dailyStats.completed}/${this.dailyStats.active} 未过期`
				},
				{
					label: '番茄进度',
					gradient: gradients.middle,
					value: `${(this.pomodoroRatio * 100).toFixed(0)}%`,
					extra: `${this.dailyStats.pomodoro}/${this.dailyStats.pomodoroGoal} 目标`
				},
				{
					label: '过期控制',
					gradient: gradients.inner,
					value: `${(this.expiredRatio * 100).toFixed(0)}%`,
					extra: `${this.dailyStats.expired}/${this.dailyStats.expiredGoal} 目标`
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
		ringColors() {
			return {
				outer: ['#ff5a5f', '#ff7d4f', '#ffb349'],
				middle: ['#ffcf52', '#ffb63a', '#ff9f1f'],
				inner: ['#4db2ff', '#3f8cff', '#2962ff']
			};
		},
		canSubmit() {
			return this.form.title && this.form.deadline;
		}
	},
	onLoad() {
		uni.hideTabBar({ animation: false });
		setTimeout(() => {
			this.pageLoaded = true;
		}, 80);
	},
	methods: {
		buildGradientCSS(colors) {
			const stops = colors.map((color, index) => {
				const percent = colors.length === 1 ? 0 : (index / (colors.length - 1)) * 100;
				return `${color} ${percent}%`;
			}).join(', ');
			return `linear-gradient(135deg, ${stops})`;
		},
		activateNav(key) {
			if (this.activeNav === key) {
				return;
			}
			this.activeNav = key;
		},
		withAlpha(color, alpha = 1) {
			if (!color || typeof color !== 'string') {
				return `rgba(255,255,255,${alpha})`;
			}
			const hex = color.replace('#', '');
			if (hex.length !== 6) {
				return `rgba(255,255,255,${alpha})`;
			}
			const value = parseInt(hex, 16);
			if (Number.isNaN(value)) {
				return `rgba(255,255,255,${alpha})`;
			}
			const r = (value >> 16) & 255;
			const g = (value >> 8) & 255;
			const b = value & 255;
			return `rgba(${r},${g},${b},${alpha})`;
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
		toggleAddSheet() {
			this.showAddSheet = !this.showAddSheet;
			if (!this.showAddSheet) {
				this.showDeadlinePicker = false;
			}
		},
		closeAddSheet() {
			this.showAddSheet = false;
			this.showDeadlinePicker = false;
		},
		openDeadlinePicker() {
			this.showDeadlinePicker = true;
		},
		closeDeadlinePicker() {
			this.showDeadlinePicker = false;
		},
		selectDeadline(option) {
			this.form.deadline = option.value;
		},
		onTomatoChange(event) {
			this.form.tomatoes = event.detail.value;
		},
		onBottomNavTap(item) {
			if (!item.available) {
				uni.showToast({
					title: '敬请期待',
					icon: 'none'
				});
				return;
			}
			this.activateNav(item.key);
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
		confirmTask() {
			if (!this.canSubmit) {
				return;
			}
			const newTask = {
				id: Date.now(),
				title: this.form.title,
				deadline: this.form.deadline,
				done: false,
				expired: false
			};
			this.tasks.unshift(newTask);
			this.dailyStats.active += 1;
			this.form.title = '';
			this.form.deadline = '';
			this.form.tomatoes = 3;
			this.closeAddSheet();
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
	padding: 0 40rpx 220rpx;
	box-sizing: border-box;
	z-index: 2;
	padding-bottom: calc(240rpx + env(safe-area-inset-bottom));
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

.rings {
	position: relative;
	width: 520rpx;
	height: 520rpx;
	margin: 0 auto;
	display: flex;
	align-items: center;
	justify-content: center;
}

.rings__canvas {
	width: 100%;
	height: 100%;
}

.rings__track,
.rings__progress {
	fill: none;
	transition: stroke-dashoffset 0.9s cubic-bezier(0.16, 1, 0.3, 1),
		stroke 0.6s ease;
}

.rings__track {
	stroke-linecap: round;
	opacity: 0.35;
}

.rings__progress {
	stroke-linecap: round;
	filter: drop-shadow(0 8rpx 24rpx rgba(0,0,0,0.35));
}

.rings__center {
	position: absolute;
	left: 50%;
	top: 50%;
	transform: translate(-50%, -50%);
	text-align: center;
	display: flex;
	flex-direction: column;
	gap: 10rpx;
	padding: 28rpx 22rpx;
	border-radius: 26rpx;
	background: rgba(15, 27, 43, 0.32);
	backdrop-filter: blur(18rpx);
	border: 1rpx solid rgba(255,255,255,0.1);
	box-shadow: 0 28rpx 60rpx rgba(6, 14, 26, 0.55);
}

.rings__value {
	font-size: 62rpx;
	font-weight: 700;
	letter-spacing: 4rpx;
	color: #fefefe;
	text-shadow: 0 12rpx 28rpx rgba(0,0,0,0.35);
}

.rings__desc {
	font-size: 28rpx;
	color: rgba(255,255,255,0.85);
}

.rings__extra {
	font-size: 22rpx;
	color: rgba(255,255,255,0.62);
}

.ring-legend {
	margin-top: 36rpx;
	display: flex;
	flex-wrap: wrap;
	justify-content: space-between;
	gap: 18rpx;
}

.ring-legend__item {
	flex: 1 1 30%;
	display: flex;
	align-items: center;
	gap: 16rpx;
	justify-content: center;
	text-align: left;
}

.ring-legend__dot {
	width: 20rpx;
	height: 20rpx;
	border-radius: 50%;
	box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.25);
}

.ring-legend__texts {
	display: flex;
	flex-direction: column;
	gap: 6rpx;
	align-items: flex-start;
}

.ring-legend__label {
	font-size: 26rpx;
	color: rgba(255,255,255,0.82);
}

.ring-legend__value {
	font-size: 32rpx;
	font-weight: 600;
}

.ring-legend__extra {
	font-size: 22rpx;
	color: rgba(255,255,255,0.58);
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
}

.task__title {
	font-size: 30rpx;
	font-weight: 500;
}

.task__deadline {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
}

.empty {
	padding: 80rpx 0;
	text-align: center;
}

.empty__tip {
	font-size: 26rpx;
	color: rgba(255,255,255,0.6);
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

.bottom-bar__item--disabled {
	color: rgba(255,255,255,0.35);
}

.fab {
	position: fixed;
	width: 140rpx;
	height: 140rpx;
	border-radius: 70rpx;
	background: linear-gradient(135deg, rgba(110,203,255,0.9), rgba(200,155,255,0.9));
	box-shadow: 0 28rpx 46rpx rgba(10, 20, 35, 0.55);
	bottom: 180rpx;
	right: 70rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #101828;
	font-size: 90rpx;
	font-weight: 400;
	z-index: 4;
	transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1),
		box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.fab--pulse {
	transform: scale(1.06);
	box-shadow: 0 32rpx 56rpx rgba(8, 16, 30, 0.55);
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
	z-index: 4;
	animation: fade-in 0.4s ease;
}

.sheet {
	position: fixed;
	left: 0;
	right: 0;
	bottom: -120%;
	padding: 42rpx 40rpx 90rpx;
	border-radius: 46rpx 46rpx 0 0;
	z-index: 5;
	transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), bottom 0s;
	transform: translateY(0);
}

.sheet--open {
	bottom: 0;
	transform: translateY(0);
}

.sheet__handle {
	width: 120rpx;
	height: 10rpx;
	border-radius: 999rpx;
	background: rgba(255,255,255,0.35);
	margin: 0 auto 30rpx;
}

.sheet__title {
	font-size: 34rpx;
	font-weight: 600;
	margin-bottom: 40rpx;
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

.form-arrow {
	font-size: 36rpx;
	color: rgba(255,255,255,0.45);
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
	bottom: -120%;
	background: rgba(18, 30, 45, 0.95);
	border-radius: 46rpx 46rpx 0 0;
	padding: 34rpx 36rpx 120rpx;
	z-index: 6;
	transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), bottom 0s;
	transform: translateY(0);
}

.deadline--open {
	bottom: 0;
	transform: translateY(0);
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
