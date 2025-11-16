<template>
	<view class="page">
		<view class="page__frost"></view>

		<view class="top-bar glass" :class="{ 'glass--active': pageLoaded }">
			<view class="top-bar__left" @tap="goBack">
				<text class="top-bar__back">←</text>
			</view>
			<text class="top-bar__title">日历</text>
			<view class="top-bar__right"></view>
		</view>

		<view class="main">
			<view class="calendar glass" :class="{ 'glass--active': pageLoaded }">
				<view class="calendar__header">
					<view class="calendar__nav" @tap="prevMonth">
						<text class="calendar__nav-icon">‹</text>
					</view>
					<text class="calendar__title">{{ currentMonthLabel }}</text>
					<view class="calendar__nav" @tap="nextMonth">
						<text class="calendar__nav-icon">›</text>
					</view>
				</view>

				<view class="calendar__weekdays">
					<text v-for="day in weekdays" :key="day" class="calendar__weekday">{{ day }}</text>
				</view>

				<view class="calendar__dates">
					<view 
						v-for="(date, index) in calendarDates" 
						:key="index"
						class="calendar__date"
						:class="{
							'calendar__date--disabled': !date.current,
							'calendar__date--today': date.isToday,
							'calendar__date--selected': date.selected,
							'calendar__date--has-tasks': date.hasTasks
						}"
						@tap="selectDate(date)"
					>
						<text class="calendar__date-text">{{ date.day }}</text>
						<view v-if="date.hasTasks" class="calendar__date-dot"></view>
					</view>
				</view>
			</view>

			<view class="tasks glass" :class="{ 'glass--active': pageLoaded }">
				<view class="card-header">
					<text class="card-title">{{ selectedDateLabel }}</text>
					<text class="card-sub">{{ tasksSummary }}</text>
				</view>
				<view v-for="task in selectedDateTasks" :key="task.id" class="task" :class="{ 'task--done': task.done }">
					<view class="task__info">
						<text class="task__title" :class="{ 'task__title--strikethrough': task.done }">{{ task.title }}</text>
						<text class="task__deadline" :class="{ 'task__deadline--strikethrough': task.done }">{{ task.deadline }}</text>
					</view>
					<view v-if="task.done" class="task__check">✓</view>
				</view>
				<view v-if="!selectedDateTasks.length" class="empty">
					<text class="empty__tip">该日期没有任务记录</text>
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
			currentYear: 0,
			currentMonth: 0,
			selectedDate: null,
			weekdays: ['日', '一', '二', '三', '四', '五', '六'],
			allTasks: {}
		};
	},
	computed: {
		currentMonthLabel() {
			return `${this.currentYear}年${this.currentMonth + 1}月`;
		},
		selectedDateLabel() {
			if (!this.selectedDate) {
				return '未选择日期';
			}
			const date = this.selectedDate;
			return `${date.year}年${date.month + 1}月${date.day}日`;
		},
		tasksSummary() {
			const tasks = this.selectedDateTasks;
			const completed = tasks.filter(t => t.done).length;
			return `${completed} / ${tasks.length} 已完成`;
		},
		selectedDateTasks() {
			if (!this.selectedDate) {
				return [];
			}
			const dateKey = this.getDateKey(this.selectedDate.year, this.selectedDate.month, this.selectedDate.day);
			return this.getTasksForDate(dateKey);
		},
		calendarDates() {
			const dates = [];
			const firstDay = new Date(this.currentYear, this.currentMonth, 1);
			const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
			const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0);
			
			const firstDayOfWeek = firstDay.getDay();
			const daysInMonth = lastDay.getDate();
			const daysInPrevMonth = prevMonthLastDay.getDate();
			
			const today = new Date();
			const todayYear = today.getFullYear();
			const todayMonth = today.getMonth();
			const todayDay = today.getDate();
			
			// Previous month dates
			for (let i = firstDayOfWeek - 1; i >= 0; i--) {
				const day = daysInPrevMonth - i;
				const year = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
				const month = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
				const key = this.getDateKey(year, month, day);
				dates.push({
					day,
					year,
					month,
					current: false,
					isToday: false,
					selected: false,
					hasTasks: this.hasTasksForDate(key)
				});
			}
			
			// Current month dates
			for (let day = 1; day <= daysInMonth; day++) {
				const key = this.getDateKey(this.currentYear, this.currentMonth, day);
				const isToday = this.currentYear === todayYear && 
								this.currentMonth === todayMonth && 
								day === todayDay;
				const selected = this.selectedDate && 
								 this.selectedDate.year === this.currentYear &&
								 this.selectedDate.month === this.currentMonth &&
								 this.selectedDate.day === day;
				dates.push({
					day,
					year: this.currentYear,
					month: this.currentMonth,
					current: true,
					isToday,
					selected,
					hasTasks: this.hasTasksForDate(key)
				});
			}
			
			// Next month dates
			const remainingDays = 42 - dates.length;
			for (let day = 1; day <= remainingDays; day++) {
				const year = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
				const month = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
				const key = this.getDateKey(year, month, day);
				dates.push({
					day,
					year,
					month,
					current: false,
					isToday: false,
					selected: false,
					hasTasks: this.hasTasksForDate(key)
				});
			}
			
			return dates;
		}
	},
	onLoad() {
		const today = new Date();
		this.currentYear = today.getFullYear();
		this.currentMonth = today.getMonth();
		this.selectedDate = {
			year: today.getFullYear(),
			month: today.getMonth(),
			day: today.getDate()
		};
		
		this.loadAllTasks();
		
		setTimeout(() => {
			this.pageLoaded = true;
		}, 80);
	},
	onShow() {
		// Reload tasks when the page becomes visible
		this.loadAllTasks();
	},
	methods: {
		goBack() {
			uni.switchTab({ url: '/pages/index/index' });
		},
		prevMonth() {
			if (this.currentMonth === 0) {
				this.currentMonth = 11;
				this.currentYear -= 1;
			} else {
				this.currentMonth -= 1;
			}
		},
		nextMonth() {
			if (this.currentMonth === 11) {
				this.currentMonth = 0;
				this.currentYear += 1;
			} else {
				this.currentMonth += 1;
			}
		},
		selectDate(date) {
			if (!date.current) {
				// Switch to the month of the clicked date
				this.currentYear = date.year;
				this.currentMonth = date.month;
			}
			this.selectedDate = {
				year: date.year,
				month: date.month,
				day: date.day
			};
		},
		getDateKey(year, month, day) {
			const m = String(month + 1).padStart(2, '0');
			const d = String(day).padStart(2, '0');
			return `${year}-${m}-${d}`;
		},
		getTasksForDate(dateKey) {
			const result = [];
			const targetDate = new Date(dateKey);
			
			// Iterate through all dates in taskHistory
			for (const historyDateKey in this.allTasks) {
				const tasksOnDate = this.allTasks[historyDateKey];
				if (!Array.isArray(tasksOnDate)) continue;
				
				const historyDate = new Date(historyDateKey);
				
				for (const task of tasksOnDate) {
					// Include task if:
					// 1. Task has a targetDate matching this date
					// 2. Task has no targetDate (no deadline) and was created on or before this date
					// 3. Task has no targetDate and no createdDate, but was saved on or before this date (fallback)
					
					if (task.targetDate === dateKey) {
						// Task has deadline for this specific date
						result.push(task);
					} else if (!task.targetDate) {
						// Task has no specific target date
						let effectiveCreatedDate = historyDate;
						
						if (task.createdDate) {
							effectiveCreatedDate = new Date(task.createdDate);
						}
						
						// Task should appear on all dates from creation onwards
						if (effectiveCreatedDate <= targetDate) {
							// Check if we already added this task (avoid duplicates)
							if (!result.find(t => t.id === task.id)) {
								result.push(task);
							}
						}
					}
				}
			}
			
			return result;
		},
		hasTasksForDate(dateKey) {
			const tasks = this.getTasksForDate(dateKey);
			return tasks.length > 0;
		},
		loadAllTasks() {
			try {
				const stored = uni.getStorageSync('taskHistory');
				if (stored && typeof stored === 'object') {
					this.allTasks = stored;
				} else {
					// Migrate today's tasks if they exist
					const todayTasks = uni.getStorageSync('todayTasks');
					if (todayTasks && Array.isArray(todayTasks)) {
						const today = new Date();
						const key = this.getDateKey(today.getFullYear(), today.getMonth(), today.getDate());
						this.allTasks[key] = todayTasks;
					}
				}
			} catch (err) {
				console.error('加载任务历史失败:', err);
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
	padding-bottom: 100rpx;
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

.top-bar__back {
	font-size: 48rpx;
	color: rgba(255,255,255,0.88);
	cursor: pointer;
}

.main {
	position: relative;
	padding: 0 40rpx;
	padding-bottom: 100rpx;
	box-sizing: border-box;
	z-index: 2;
}

.calendar {
	padding: 42rpx 32rpx;
	margin-bottom: 40rpx;
}

.calendar__header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 38rpx;
}

.calendar__title {
	font-size: 36rpx;
	font-weight: 600;
}

.calendar__nav {
	width: 60rpx;
	height: 60rpx;
	border-radius: 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255,255,255,0.08);
	border: 1rpx solid rgba(255,255,255,0.12);
	transition: all 0.25s ease;
	cursor: pointer;
}

.calendar__nav:active {
	background: rgba(110,203,255,0.2);
	transform: scale(0.9);
}

.calendar__nav-icon {
	font-size: 40rpx;
	color: rgba(255,255,255,0.88);
	font-weight: 300;
}

.calendar__weekdays {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 8rpx;
	margin-bottom: 16rpx;
}

.calendar__weekday {
	text-align: center;
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
	padding: 12rpx 0;
}

.calendar__dates {
	display: grid;
	grid-template-columns: repeat(7, 1fr);
	gap: 8rpx;
}

.calendar__date {
	position: relative;
	aspect-ratio: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 16rpx;
	background: rgba(255,255,255,0.06);
	border: 1rpx solid rgba(255,255,255,0.1);
	transition: all 0.25s ease;
	cursor: pointer;
}

.calendar__date--disabled {
	opacity: 0.3;
}

.calendar__date--today {
	background: rgba(110,203,255,0.15);
	border-color: rgba(110,203,255,0.35);
}

.calendar__date--selected {
	background: rgba(110,203,255,0.25);
	border-color: rgba(110,203,255,0.5);
	transform: scale(1.05);
}

.calendar__date--has-tasks {
	border-color: rgba(200,155,255,0.4);
}

.calendar__date:active:not(.calendar__date--disabled) {
	transform: scale(0.95);
}

.calendar__date-text {
	font-size: 28rpx;
	color: #f6f7fb;
}

.calendar__date-dot {
	position: absolute;
	bottom: 8rpx;
	width: 6rpx;
	height: 6rpx;
	border-radius: 50%;
	background: rgba(200,155,255,0.9);
}

.tasks {
	padding: 40rpx 32rpx 32rpx;
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

.task__info {
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	flex: 1;
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

.task__check {
	width: 60rpx;
	height: 60rpx;
	border-radius: 30rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 32rpx;
	background: rgba(110,203,255,0.2);
	color: #6ecbff;
}

.empty {
	padding: 80rpx 0;
	text-align: center;
}

.empty__tip {
	font-size: 26rpx;
	color: rgba(255,255,255,0.6);
}
</style>
