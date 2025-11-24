<template>
	<view class="page">
		<view class="top-bar glass" :class="{ 'glass--active': pageLoaded }">
			<view class="top-bar__left" @tap="goBack">
				<text class="top-bar__back">◉</text>
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

				<view class="calendar__dates" :prop="calendarDates" :change:prop="renderjs.updateCalendar">
					<view 
						v-for="(date, index) in calendarDates" 
						:key="index"
						class="calendar__date"
						:class="{
							'calendar__date--disabled': !date.current,
							'calendar__date--today': date.isToday,
							'calendar__date--selected': date.selected,
							'calendar__date--has-tasks': date.hasTasks,
							'calendar__date--has-mood': date.hasMood
						}"
						@tap="selectDate(date)"
						:data-index="index"
					>
						<text class="calendar__date-text">{{ date.day }}</text>
						<view v-show="date.hasTasks" class="calendar__date-dot"></view>
						<view v-show="date.hasMood" class="calendar__mood-dot" :style="{ background: date.moodColor }"></view>
					</view>
				</view>
			</view>

			<view class="mood-section glass" :class="{ 'glass--active': pageLoaded }">
				<view class="card-header">
					<text class="card-title">每日心情</text>
					<text class="card-sub">{{ hasMoodToday ? '点击像素画编辑' : '记录此刻的心情' }}</text>
				</view>
				
				<view class="pixel-preview-container" @tap="openPixelEditor">
					<view v-if="hasMoodToday" class="pixel-preview">
						<view 
							v-for="(color, index) in currentMoodPixels" 
							:key="index" 
							class="pixel-dot"
							:style="{ backgroundColor: color }"
						></view>
					</view>
					<view v-else class="pixel-empty">
						<text class="pixel-empty-icon">🎨</text>
						<text class="pixel-empty-text">绘制今日像素画</text>
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

		<view class="sheet-mask" v-if="showPixelSheet" @tap="closePixelEditor"></view>
		<view class="sheet pixel-sheet" :class="{ 'sheet--open': showPixelSheet }" v-if="showPixelSheet" @touchmove.stop.prevent>
			<view class="sheet__handle"></view>
			<view class="sheet__header">
				<text class="sheet__title">心情画板</text>
				<view class="sheet__actions">
					<view class="sheet__btn sheet__btn--clear" @tap.stop="clearCanvas">清空</view>
					<view class="sheet__close" @tap.stop="closePixelEditor">
						<text class="sheet__close-icon">✕</text>
					</view>
				</view>
			</view>
			
			<view class="pixel-editor">
				<view 
					class="pixel-grid" 
					@touchstart="handleTouchDrawStart"
					@touchmove="handleTouchDrawMove"
					@touchend="handleTouchDrawEnd"
				>
					<view 
						v-for="(color, index) in editingPixels" 
						:key="index"
						class="pixel-cell"
						:class="{ 'pixel-cell--active': color !== 'transparent' }"
						:style="{ backgroundColor: color }"
						:data-index="index"
						@tap="drawOnePixel(index)"
					></view>
				</view>
				
				<view class="palette">
					<view 
						v-for="color in palette" 
						:key="color"
						class="palette-color"
						:class="{ 
							'palette-color--selected': selectedColor === color,
							'palette-color--eraser': color === 'transparent'
						}"
						:style="{ backgroundColor: color === 'transparent' ? '' : color }"
						@tap="selectColor(color)"
					>
						<text v-if="color === 'transparent'" class="eraser-icon">✕</text>
					</view>
				</view>
				
				<button class="save-btn" @tap="savePixelArt">保存心情</button>
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
	</view>
</template>

<script>
export default {
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
		// 获取当前选中日期的像素画数据
		currentMoodPixels() {
			if (!this.selectedDate) return null;
			const dateKey = this.getDateKey(this.selectedDate.year, this.selectedDate.month, this.selectedDate.day);
			return this.moodHistory[dateKey] || null;
		},
		hasMoodToday() {
			return !!this.currentMoodPixels;
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
					hasTasks: this.hasTasksForDate(key),
					hasMood: !!this.moodHistory[key],
					moodColor: this.getMainMoodColor(key)
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
					hasTasks: this.hasTasksForDate(key),
					hasMood: !!this.moodHistory[key],
					moodColor: this.getMainMoodColor(key)
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
					hasTasks: this.hasTasksForDate(key),
					hasMood: !!this.moodHistory[key],
					moodColor: this.getMainMoodColor(key)
				});
			}
			
			return dates;
		}
	},
	data() {
		return {
			pageLoaded: false,
			currentYear: 0,
			currentMonth: 0,
			selectedDate: null,
			weekdays: ['日', '一', '二', '三', '四', '五', '六'],
			allTasks: {},
			moodHistory: {}, // 存储所有像素画数据 { '2023-10-01': ['#fff', ...] }
			_isInitialized: false,
			scrollTimer: null,
			revealTimer: null,
			bottomNavItems: [
				{ key: 'today', label: '今日', icon: '◎', target: '/pages/index/index' },
				{ key: 'calendar', label: '日历', icon: '◉', target: '/pages/calendar/index' },
				{ key: 'tracking', label: '番茄钟', icon: '◴', target: '/pages/pomodoro/index' },
				{ key: 'habit', label: '习惯', icon: '△', target: '/pages/habit/index' }
			],
			activeNav: 'calendar',
			
			// 像素画相关
			showPixelSheet: false,
			editingPixels: [], // 当前编辑中的 8x8 数组 (64个颜色字符串)
			selectedColor: '#FF6B6B',
			palette: [
				'#FF6B6B', '#FF9F43', '#FECA57', '#1DD1A1', 
				'#48DBFB', '#54A0FF', '#5F27CD', '#FF9FF3',
				'#C8D6E5', '#576574', '#222F3E', 'transparent'
			],
			isDrawing: false, // 标记是否正在触摸绘制中
			gridRect: null // 缓存grid位置信息
		};
	},
	onLoad() {
		if (!this._isInitialized) {
			const today = new Date();
			this.currentYear = today.getFullYear();
			this.currentMonth = today.getMonth();
			this.selectedDate = {
				year: today.getFullYear(),
				month: today.getMonth(),
				day: today.getDate()
			};
			
			this.loadAllTasks();
			this.loadMoodHistory(); // 加载心情数据
			this._isInitialized = true;
		}
		this.triggerPageReveal();
	},
	onShow() {
		this.activeNav = 'calendar';
		this.loadAllTasks();
		this.loadMoodHistory();
		this.triggerPageReveal();
	},
	onPageScroll(e) {
		if (!e) return;
		if (this.scrollTimer) {
			return;
		}
		this.scrollTimer = setTimeout(() => {
			this.scrollTimer = null;
		}, 16);
	},
	onUnload() {
		if (this.scrollTimer) {
			clearTimeout(this.scrollTimer);
			this.scrollTimer = null;
		}
		if (this.revealTimer) {
			clearTimeout(this.revealTimer);
			this.revealTimer = null;
		}
	},
	methods: {
		triggerPageReveal() {
			if (this.revealTimer) {
				clearTimeout(this.revealTimer);
				this.revealTimer = null;
			}
			this.pageLoaded = false;
			this.$nextTick(() => {
				this.revealTimer = setTimeout(() => {
					this.pageLoaded = true;
					this.revealTimer = null;
				}, 30);
			});
		},
		goBack() {
			uni.switchTab({ url: '/pages/index/index' });
		},
		onBottomNavTap(item) {
			if (item.key === this.activeNav) return;
			if (item.target) uni.switchTab({ url: item.target });
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
		
		// --- 像素画相关逻辑 ---
		
		loadMoodHistory() {
			try {
				const stored = uni.getStorageSync('moodHistory');
				if (stored && typeof stored === 'object') {
					this.moodHistory = stored;
				} else {
					this.moodHistory = {};
				}
			} catch (err) {
				console.error('加载心情历史失败:', err);
			}
		},
		
		// 获取某天心情的主色调（用于日历上的小点）
		getMainMoodColor(dateKey) {
			const pixels = this.moodHistory[dateKey];
			if (!pixels || !Array.isArray(pixels)) return '';
			
			// 取中心点颜色作为代表色
			const centerColor = pixels[27] || pixels[36]; 
			if (centerColor && centerColor !== 'transparent') return centerColor;
			
			return pixels.find(c => c !== 'transparent') || '';
		},
		
		openPixelEditor() {
			// 初始化画布
			if (this.hasMoodToday) {
				// 复制一份数据，避免直接修改
				this.editingPixels = [...this.currentMoodPixels];
			} else {
				// 创建 8x8 = 64 个空像素
				this.editingPixels = Array(64).fill('transparent');
			}
			this.showPixelSheet = true;
			
			// 延迟获取grid位置，用于滑动绘制
			this.$nextTick(() => {
				setTimeout(() => {
					const query = uni.createSelectorQuery().in(this);
					query.select('.pixel-grid').boundingClientRect(data => {
						if (data) {
							this.gridRect = data;
						}
					}).exec();
				}, 300); // 等待动画完成
			});
		},
		
		closePixelEditor() {
			this.showPixelSheet = false;
			this.isDrawing = false;
		},
		
		clearCanvas() {
			this.editingPixels = Array(64).fill('transparent');
		},
		
		selectColor(color) {
			this.selectedColor = color;
		},
		
		// 触摸绘制逻辑
		handleTouchDrawStart(e) {
			this.isDrawing = true;
			this.paintPixelByEvent(e);
		},
		
		handleTouchDrawMove(e) {
			if (this.isDrawing) {
				this.paintPixelByEvent(e);
			}
		},
		
		handleTouchDrawEnd() {
			this.isDrawing = false;
		},
		
		paintPixelByEvent(e) {
			// 如果没有获取到布局信息，或者是点击事件(tap已经处理)，则跳过
			if (!this.gridRect) return;

			const touch = e.touches[0] || e.changedTouches[0];
			if (!touch) return;
			
			// 计算触摸点相对于 Grid 的位置
			const x = touch.clientX - this.gridRect.left;
			const y = touch.clientY - this.gridRect.top;
			
			// 计算所在的格子索引 (8x8)
			const cellSize = this.gridRect.width / 8;
			
			if (x >= 0 && x <= this.gridRect.width && y >= 0 && y <= this.gridRect.height) {
				const col = Math.floor(x / cellSize);
				const row = Math.floor(y / cellSize);
				const index = row * 8 + col;
				
				if (index >= 0 && index < 64) {
					// 仅当颜色不同时才更新，减少渲染
					if (this.editingPixels[index] !== this.selectedColor) {
						this.editingPixels.splice(index, 1, this.selectedColor);
					}
				}
			}
		},
		
		// 单个像素点击（作为滑动绘制的补充）
		drawOnePixel(index) {
			this.editingPixels.splice(index, 1, this.selectedColor);
		},
		
		savePixelArt() {
			if (!this.selectedDate) return;
			const dateKey = this.getDateKey(this.selectedDate.year, this.selectedDate.month, this.selectedDate.day);
			
			// 检查是否全是透明（空的）
			const isEmpty = this.editingPixels.every(c => c === 'transparent');
			
			if (isEmpty) {
				// 如果清空了，则删除记录
				if (this.moodHistory[dateKey]) {
					delete this.moodHistory[dateKey];
				}
			} else {
				// 保存
				this.$set(this.moodHistory, dateKey, [...this.editingPixels]);
			}
			
			try {
				uni.setStorageSync('moodHistory', this.moodHistory);
				uni.showToast({ title: '心情已保存', icon: 'success' });
			} catch (err) {
				console.error('保存失败', err);
			}
			
			this.closePixelEditor();
		},

		// --- 任务相关逻辑 (保持原样) ---
		normalizeTaskRecord(task, fallbackDateKey) {
			if (!task || typeof task !== 'object') return null;
			const normalized = { ...task };
			if (!normalized.createdDate) normalized.createdDate = fallbackDateKey;
			const needsTarget = !normalized.targetDate || typeof normalized.targetDate !== 'string';
			if (needsTarget) normalized.targetDate = this.deriveTargetDateFromDeadline(normalized.deadline, fallbackDateKey);
			if (!normalized.targetDate) normalized.targetDate = null;
			return normalized;
		},
		normalizeTaskHistory(rawHistory) {
			const normalized = {};
			const hasOwn = Object.prototype.hasOwnProperty;
			for (const key in rawHistory) {
				if (!hasOwn.call(rawHistory, key)) continue;
				const tasks = Array.isArray(rawHistory[key]) ? rawHistory[key] : [];
				normalized[key] = tasks.map(task => this.normalizeTaskRecord(task, key)).filter(Boolean);
			}
			return normalized;
		},
		deriveTargetDateFromDeadline(deadlineText, referenceDateKey) {
			if (!deadlineText || deadlineText === '无截止时间') return null;
			const referenceDate = referenceDateKey ? new Date(referenceDateKey) : new Date();
			referenceDate.setHours(0, 0, 0, 0);
			const normalizedText = String(deadlineText).trim();
			const isoMatch = normalizedText.match(/(\d{4})-(\d{2})-(\d{2})/);
			if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
			const relativeOffsets = [
				{ keyword: '今天', offset: 0 },
				{ keyword: '明天', offset: 1 },
				{ keyword: '后天', offset: 2 },
				{ keyword: '昨天', offset: -1 }
			];
			for (const item of relativeOffsets) {
				if (normalizedText.includes(item.keyword)) {
					const date = new Date(referenceDate);
					date.setDate(date.getDate() + item.offset);
					return this.getDateKey(date.getFullYear(), date.getMonth(), date.getDate());
				}
			}
			const monthDayMatch = normalizedText.match(/(\d{1,2})月(\d{1,2})日/);
			if (monthDayMatch) {
				const year = referenceDate.getFullYear();
				const month = parseInt(monthDayMatch[1], 10) - 1;
				const day = parseInt(monthDayMatch[2], 10);
				const date = new Date(year, month, day);
				return this.getDateKey(date.getFullYear(), date.getMonth(), date.getDate());
			}
			return null;
		},
		getTasksForDate(dateKey) {
			const result = [];
			const targetDate = new Date(dateKey);
			targetDate.setHours(0, 0, 0, 0);
			for (const historyDateKey in this.allTasks) {
				const tasksOnDate = this.allTasks[historyDateKey];
				if (!Array.isArray(tasksOnDate)) continue;
				const historyDate = new Date(historyDateKey);
				historyDate.setHours(0, 0, 0, 0);
				for (const task of tasksOnDate) {
					if (task.targetDate === dateKey) {
						result.push(task);
					} else if (!task.targetDate) {
						let effectiveCreatedDate = historyDate;
						if (task.createdDate) {
							effectiveCreatedDate = new Date(task.createdDate);
							effectiveCreatedDate.setHours(0, 0, 0, 0);
						}
						if (task.done) {
							const createdDateKey = this.getDateKey(
								effectiveCreatedDate.getFullYear(),
								effectiveCreatedDate.getMonth(),
								effectiveCreatedDate.getDate()
							);
							if (createdDateKey === dateKey) {
								if (!result.find(t => t.id === task.id)) result.push(task);
							}
						} else {
							if (effectiveCreatedDate <= targetDate) {
								if (!result.find(t => t.id === task.id)) result.push(task);
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
					const normalized = this.normalizeTaskHistory(stored);
					this.allTasks = normalized;
					uni.setStorageSync('taskHistory', normalized);
				} else {
					const todayTasks = uni.getStorageSync('todayTasks');
					if (todayTasks && Array.isArray(todayTasks)) {
						const today = new Date();
						const key = this.getDateKey(today.getFullYear(), today.getMonth(), today.getDate());
						const normalized = this.normalizeTaskHistory({ [key]: todayTasks });
						this.allTasks = normalized;
						uni.setStorageSync('taskHistory', normalized);
					} else {
						this.allTasks = {};
					}
				}
			} catch (err) {
				console.error('加载任务历史失败:', err);
			}
		}
	}
};
</script>

<script module="renderjs" lang="renderjs">
export default {
	methods: {
		updateCalendar(newValue, oldValue, ownerInstance, instance) {
			if (!newValue || !Array.isArray(newValue)) return;
			requestAnimationFrame(() => {
				newValue.forEach((date, index) => {
					const dateEl = ownerInstance.$el.querySelector(`[data-index="${index}"]`);
					if (dateEl) {
						dateEl.classList.toggle('calendar__date--disabled', !date.current);
						dateEl.classList.toggle('calendar__date--today', date.isToday);
						dateEl.classList.toggle('calendar__date--selected', date.selected);
						dateEl.classList.toggle('calendar__date--has-tasks', date.hasTasks);
						dateEl.classList.toggle('calendar__date--has-mood', date.hasMood);
						
						const moodDot = dateEl.querySelector('.calendar__mood-dot');
						if (moodDot && date.moodColor) {
							moodDot.style.background = date.moodColor;
						}
					}
				});
			});
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
	padding-bottom: 200rpx;
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

.top-bar__back {
	font-size: 48rpx;
	color: rgba(255,255,255,0.88);
	cursor: pointer;
}

.main {
	position: relative;
	padding: 0 40rpx;
	padding-bottom: calc(240rpx + env(safe-area-inset-bottom));
	box-sizing: border-box;
	z-index: 2;
	display: flex;
	flex-direction: column;
	gap: 40rpx;
}

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

.calendar {
	padding: 42rpx 32rpx;
}

.calendar.glass--active .calendar__header,
.calendar.glass--active .calendar__weekdays {
	animation: fade-slide 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	animation-delay: 0.05s;
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

.calendar.glass--active .calendar__date {
	animation: calendar-pop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
}

.calendar.glass--active .calendar__date:nth-child(7n + 1) { animation-delay: 0.02s; }
.calendar.glass--active .calendar__date:nth-child(7n + 2) { animation-delay: 0.06s; }
.calendar.glass--active .calendar__date:nth-child(7n + 3) { animation-delay: 0.1s; }
.calendar.glass--active .calendar__date:nth-child(7n + 4) { animation-delay: 0.14s; }
.calendar.glass--active .calendar__date:nth-child(7n + 5) { animation-delay: 0.18s; }
.calendar.glass--active .calendar__date:nth-child(7n + 6) { animation-delay: 0.22s; }
.calendar.glass--active .calendar__date:nth-child(7n + 7) { animation-delay: 0.26s; }

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

/* 像素画心情标记点 */
.calendar__mood-dot {
	position: absolute;
	top: 8rpx;
	right: 8rpx;
	width: 8rpx;
	height: 8rpx;
	border-radius: 50%;
}

/* 心情卡片样式 */
.mood-section {
	padding: 40rpx 32rpx;
}

.pixel-preview-container {
	margin-top: 10rpx;
	background: rgba(0,0,0,0.2);
	border-radius: 20rpx;
	padding: 24rpx;
	display: flex;
	justify-content: center;
	align-items: center;
	min-height: 200rpx;
	border: 1rpx solid rgba(255,255,255,0.05);
}

.pixel-preview {
	display: grid;
	grid-template-columns: repeat(8, 1fr);
	gap: 2rpx;
	width: 200rpx;
	height: 200rpx;
	padding: 4rpx;
	background: #1e272e;
	border-radius: 8rpx;
}

.pixel-dot {
	width: 100%;
	height: 100%;
}

.pixel-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
	opacity: 0.6;
}

.pixel-empty-icon {
	font-size: 48rpx;
}

.pixel-empty-text {
	font-size: 24rpx;
	color: rgba(255,255,255,0.7);
}

/* 像素画弹窗样式 - 独立于 glass，强制不透明 */
.sheet {
	position: fixed;
	left: 0;
	right: 0;
	bottom: 0;
	padding: 42rpx 40rpx 60rpx;
	border-radius: 46rpx 46rpx 0 0;
	z-index: 11;
	transform: translateY(120%);
	transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	opacity: 1; /* 强制不透明，修复继承glass的问题 */
}

/* 专门为像素画弹窗定义的样式，复用 glass 的视觉效果但避免其副作用 */
.pixel-sheet {
	background: rgba(18, 30, 45, 0.95);
	box-shadow: 0 26rpx 70rpx rgba(9, 20, 35, 0.55),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
}

.sheet-mask {
	position: fixed;
	left: 0;
	top: 0;
	width: 100%;
	height: 100%;
	background: rgba(10,17,28,0.85);
	z-index: 10;
	animation: fade-in 0.3s ease;
}

.sheet--open {
	transform: translateY(0);
}

.sheet__header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 40rpx;
}

.sheet__handle {
	width: 80rpx;
	height: 8rpx;
	background: rgba(255,255,255,0.2);
	border-radius: 4rpx;
	margin: -20rpx auto 30rpx;
}

.sheet__actions {
	display: flex;
	align-items: center;
	gap: 20rpx;
}

.sheet__btn {
	padding: 8rpx 20rpx;
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
	background: rgba(255,255,255,0.1);
	border-radius: 12rpx;
}

.sheet__close {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255,255,255,0.08);
	border-radius: 50%;
}

.sheet__close-icon {
	font-size: 32rpx;
	color: rgba(255,255,255,0.8);
}

/* 像素编辑器样式 */
.pixel-editor {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 40rpx;
}

.pixel-grid {
	display: grid;
	grid-template-columns: repeat(8, 1fr);
	gap: 2rpx;
	width: 560rpx;
	height: 560rpx;
	background: #2f3640;
	padding: 4rpx;
	border-radius: 12rpx;
	box-shadow: 0 10rpx 30rpx rgba(0,0,0,0.3);
}

.pixel-cell {
	background: #1e272e;
	transition: background 0.1s;
	border-radius: 2rpx;
}

.pixel-cell--active {
	box-shadow: inset 0 0 4rpx rgba(0,0,0,0.1);
}

.palette {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 24rpx;
	width: 100%;
}

.palette-color {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	border: 4rpx solid rgba(255,255,255,0.1);
	transition: transform 0.2s, border-color 0.2s;
	display: flex;
	align-items: center;
	justify-content: center;
}

.palette-color--selected {
	transform: scale(1.15);
	border-color: #ffffff;
	box-shadow: 0 0 16rpx rgba(255,255,255,0.2);
}

.palette-color--eraser {
	background: repeating-linear-gradient(
		45deg,
		#353b48,
		#353b48 10rpx,
		#2f3640 10rpx,
		#2f3640 20rpx
	);
	border-color: rgba(255,255,255,0.2);
}

.eraser-icon {
	font-size: 28rpx;
	color: rgba(255,255,255,0.6);
}

.save-btn {
	width: 100%;
	height: 90rpx;
	line-height: 90rpx;
	background: linear-gradient(135deg, #1dd1a1, #10ac84);
	color: #fff;
	font-weight: 600;
	border-radius: 24rpx;
	font-size: 32rpx;
	margin-top: 20rpx;
}

.tasks {
	padding: 40rpx 32rpx 32rpx;
}

.tasks.glass--active .task {
	animation: list-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

.tasks.glass--active .task:nth-child(1) { animation-delay: 0.05s; }
.tasks.glass--active .task:nth-child(2) { animation-delay: 0.1s; }
.tasks.glass--active .task:nth-child(3) { animation-delay: 0.15s; }
.tasks.glass--active .task:nth-child(4) { animation-delay: 0.2s; }
.tasks.glass--active .task:nth-child(5) { animation-delay: 0.25s; }

.tasks.glass--active .empty {
	animation: list-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
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

.bottom-bar__label {
	font-size: 24rpx;
}

@keyframes fade-slide {
	0% {
		opacity: 0;
		transform: translateY(40rpx);
	}
	100% {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes fade-in {
	0% { opacity: 0; }
	100% { opacity: 1; }
}

@keyframes calendar-pop {
	0% {
		opacity: 0;
		transform: scale(0.85) translateY(30rpx);
	}
	70% {
		opacity: 1;
		transform: scale(1.05) translateY(0);
	}
	100% {
		transform: scale(1) translateY(0);
	}
}

@keyframes list-in {
	0% {
		opacity: 0;
		transform: translateY(35rpx) scale(0.98);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

@media (prefers-reduced-motion: reduce) {
	.calendar.glass--active .calendar__header,
	.calendar.glass--active .calendar__weekdays,
	.calendar.glass--active .calendar__date,
	.tasks.glass--active .task,
	.tasks.glass--active .empty {
		animation: none !important;
	}
	.glass,
	.task,
	.calendar__nav,
	.bottom-bar,
	.sheet {
		transition-duration: 0.01ms !important;
	}
}
</style>