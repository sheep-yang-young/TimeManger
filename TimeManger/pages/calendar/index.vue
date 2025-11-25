<template>
	<view class="page">
		<view class="top-bar glass" :class="{ 'glass--active': pageLoaded }">
			<view class="top-bar__left" @tap="goBack">
				<text class="top-bar__back">◉</text>
			</view>
			<text class="top-bar__title">日历</text>
			<view class="top-bar__right"></view>
		</view>

		<view class="main-container">
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

			<view class="tabs glass" :class="{ 'glass--active': pageLoaded }">
				<view 
					class="tab-item" 
					:class="{ 'tab-item--active': currentTab === 'tasks' }"
					@tap="currentTab = 'tasks'"
				>
					<text class="tab-item__text">📝 任务</text>
					<view class="tab-item__indicator"></view>
				</view>
				<view 
					class="tab-item" 
					:class="{ 'tab-item--active': currentTab === 'mood' }"
					@tap="currentTab = 'mood'"
				>
					<text class="tab-item__text">🎨 心情</text>
					<view class="tab-item__indicator"></view>
				</view>
				<view 
					class="tab-item" 
					:class="{ 'tab-item--active': currentTab === 'anniversary' }"
					@tap="currentTab = 'anniversary'"
				>
					<text class="tab-item__text">📅 纪念日</text>
					<view class="tab-item__indicator"></view>
				</view>
			</view>

			<scroll-view scroll-y class="content-area">
				
				<view v-if="currentTab === 'tasks'" class="tab-content tasks-view">
					<view class="section-header">
						<text class="section-title">{{ selectedDateLabel }}</text>
						<text class="section-sub">{{ tasksSummary }}</text>
					</view>
					
					<view v-if="selectedDateTasks.length">
						<view v-for="task in selectedDateTasks" :key="task.id" class="task glass-lite" :class="{ 'task--done': task.done }">
							<view class="task__info">
								<text class="task__title" :class="{ 'task__title--strikethrough': task.done }">{{ task.title }}</text>
								<text class="task__deadline" :class="{ 'task__deadline--strikethrough': task.done }">{{ task.deadline }}</text>
							</view>
							<view v-if="task.done" class="task__check">✓</view>
						</view>
					</view>
					<view v-else class="empty-state">
						<text class="empty-icon">📭</text>
						<text class="empty-text">该日期暂无任务</text>
					</view>
				</view>

				<view v-if="currentTab === 'mood'" class="tab-content mood-view">
					<view class="section-header">
						<text class="section-title">像素心情</text>
						<text class="section-sub">{{ hasMoodToday ? '点击画布编辑' : '记录此刻的心情' }}</text>
					</view>
					
					<view class="pixel-card glass-lite" @tap="openPixelEditor">
						<view class="pixel-card__content">
							<view v-if="hasMoodToday" class="pixel-preview" :style="previewGridStyle">
								<view 
									v-for="(color, index) in currentMoodPixels" 
									:key="index" 
									class="pixel-dot"
									:style="{ backgroundColor: color }"
								></view>
							</view>
							<view v-else class="pixel-placeholder">
								<text class="pixel-plus">+</text>
								<text class="pixel-hint">点击绘制 16x16 像素画</text>
							</view>
						</view>
					</view>
				</view>

				<view v-if="currentTab === 'anniversary'" class="tab-content anni-view">
					<view class="section-header">
						<text class="section-title">重要日子</text>
						<view class="add-btn-mini" @tap="openAnniversaryManager">
							<text>+ 添加/管理</text>
						</view>
					</view>
					
					<view v-if="anniversaries.length">
						<view v-for="item in anniversaries" :key="item.id" class="anni-card glass-lite" @tap="openSharePreview(item)">
							<view class="anni-card__main">
								<text class="anni-card__title">{{ item.title }}</text>
								<text class="anni-card__date">{{ item.date }}</text>
							</view>
							<view class="anni-card__badge" :class="item.days >= 0 ? 'future' : 'past'">
								<text class="anni-num">{{ Math.abs(item.days) }}</text>
								<text class="anni-unit">天</text>
								<text class="anni-label">{{ item.days >= 0 ? '还有' : '已过' }}</text>
							</view>
						</view>
					</view>
					<view v-else class="empty-state" @tap="openAnniversaryManager">
						<text class="empty-icon">✨</text>
						<text class="empty-text">记录第一个纪念日</text>
					</view>
				</view>
				
				<view style="height: 160rpx;"></view>
			</scroll-view>
		</view>

		<view class="sheet-mask" v-if="showPixelSheet" @tap="closePixelEditor"></view>
		<view class="sheet pixel-sheet" :class="{ 'sheet--open': showPixelSheet }" v-if="showPixelSheet" @touchmove.stop.prevent>
			<view class="sheet__handle"></view>
			<view class="sheet__header">
				<text class="sheet__title">心情画板</text>
				<view class="sheet__actions">
					<view class="sheet__btn sheet__btn--clear" @tap.stop="clearCanvas">清空</view>
					<view class="sheet__close" @tap.stop="closePixelEditor">✕</view>
				</view>
			</view>
			<view class="pixel-editor">
				<view class="pixel-grid" 
					@touchstart="handleTouchDrawStart"
					@touchmove="handleTouchDrawMove"
					@touchend="handleTouchDrawEnd"
				>
					<view v-for="(color, index) in editingPixels" :key="index"
						class="pixel-cell"
						:class="{ 'pixel-cell--active': color !== 'transparent' }"
						:style="{ backgroundColor: color }"
						:data-index="index"
						@tap="drawOnePixel(index)"
					></view>
				</view>
				<view class="palette">
					<view v-for="color in palette" :key="color"
						class="palette-color"
						:class="{ 'palette-color--selected': selectedColor === color, 'palette-color--eraser': color === 'transparent' }"
						:style="{ backgroundColor: color === 'transparent' ? '' : color }"
						@tap="selectColor(color)"
					>
						<text v-if="color === 'transparent'" class="eraser-icon">✕</text>
					</view>
				</view>
				<button class="action-btn" @tap="savePixelArt">保存心情</button>
			</view>
		</view>

		<view class="sheet-mask" v-if="showAnniversarySheet" @tap="closeAnniversaryManager"></view>
		<view class="sheet glass-sheet" :class="{ 'sheet--open': showAnniversarySheet }" v-if="showAnniversarySheet">
			<view class="sheet__handle"></view>
			<view class="sheet__header">
				<text class="sheet__title">管理纪念日</text>
				<view class="sheet__close" @tap.stop="closeAnniversaryManager">✕</view>
			</view>
			
			<view class="anni-form">
				<input class="anni-input" placeholder="事件名称 (如: 恋人生日)" v-model="newAnni.title" />
				<picker mode="date" :value="newAnni.date" @change="onAnniDateChange">
					<view class="anni-input anni-input--date">
						{{ newAnni.date || '选择日期' }}
					</view>
				</picker>
				<button class="action-btn action-btn--small" @tap="addAnniversary" :disabled="!newAnni.title || !newAnni.date">添加</button>
			</view>
			
			<scroll-view scroll-y class="anni-list-scroll">
				<view v-for="item in anniversaries" :key="item.id" class="anni-item-row">
					<view class="anni-row__info">
						<text class="anni-row__title">{{ item.title }}</text>
						<text class="anni-row__date">{{ item.date }}</text>
					</view>
					<view class="anni-row__del" @tap.stop="deleteAnniversary(item.id)">删除</view>
				</view>
			</scroll-view>
		</view>

		<view class="sheet-mask" v-if="showShareSheet" @tap="closeShareSheet"></view>
		<view class="sheet glass-sheet share-sheet" :class="{ 'sheet--open': showShareSheet }" v-if="showShareSheet">
			<view class="sheet__header">
				<text class="sheet__title">分享卡片</text>
				<view class="sheet__close" @tap.stop="closeShareSheet">✕</view>
			</view>
			<view class="canvas-wrapper">
				<canvas canvas-id="shareCanvas" class="share-canvas"></canvas>
			</view>
			<button class="action-btn" @tap="saveImageToPhotos">保存到相册</button>
		</view>

		<view class="bottom-bar glass" :class="{ 'glass--active': pageLoaded }">
			<view class="bottom-bar__item" v-for="item in bottomNavItems" :key="item.key"
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
	data() {
		return {
			pageLoaded: false,
			currentTab: 'tasks', // 当前选中的 Tab: 'tasks', 'mood', 'anniversary'
			currentYear: 0,
			currentMonth: 0,
			selectedDate: null,
			weekdays: ['日', '一', '二', '三', '四', '五', '六'],
			
			// 数据
			allTasks: {},
			moodHistory: {},
			anniversaries: [],
			newAnni: { title: '', date: '' },
			
			// 像素画编辑器状态
			showPixelSheet: false,
			gridSize: 16,
			editingPixels: [],
			selectedColor: '#FF6B6B',
			palette: [
				'#FF6B6B', '#FF9F43', '#FECA57', '#1DD1A1', 
				'#48DBFB', '#54A0FF', '#5F27CD', '#FF9FF3',
				'#C8D6E5', '#576574', '#222F3E', 'transparent'
			],
			isDrawing: false,
			gridRect: null,
			
			// 弹窗状态
			showAnniversarySheet: false,
			showShareSheet: false,
			
			bottomNavItems: [
				{ key: 'today', label: '今日', icon: '◎', target: '/pages/index/index' },
				{ key: 'calendar', label: '日历', icon: '◉', target: '/pages/calendar/index' },
				{ key: 'tracking', label: '番茄钟', icon: '◴', target: '/pages/pomodoro/index' },
				{ key: 'habit', label: '习惯', icon: '△', target: '/pages/habit/index' }
			],
			activeNav: 'calendar',
			_isInitialized: false,
			revealTimer: null,
		};
	},
	computed: {
		currentMonthLabel() {
			return `${this.currentYear}年${this.currentMonth + 1}月`;
		},
		selectedDateLabel() {
			if (!this.selectedDate) return '未选择日期';
			return `${this.selectedDate.year}年${this.selectedDate.month + 1}月${this.selectedDate.day}日`;
		},
		tasksSummary() {
			const tasks = this.selectedDateTasks;
			const completed = tasks.filter(t => t.done).length;
			return `${completed} / ${tasks.length} 已完成`;
		},
		selectedDateTasks() {
			if (!this.selectedDate) return [];
			const dateKey = this.getDateKey(this.selectedDate.year, this.selectedDate.month, this.selectedDate.day);
			return this.getTasksForDate(dateKey);
		},
		currentMoodPixels() {
			if (!this.selectedDate) return null;
			const dateKey = this.getDateKey(this.selectedDate.year, this.selectedDate.month, this.selectedDate.day);
			return this.moodHistory[dateKey] || null;
		},
		hasMoodToday() {
			return !!this.currentMoodPixels;
		},
		previewGridStyle() {
			if (!this.currentMoodPixels) return '';
			const size = Math.sqrt(this.currentMoodPixels.length);
			return `grid-template-columns: repeat(${size}, 1fr)`;
		},
		calendarDates() {
			const dates = [];
			const firstDay = new Date(this.currentYear, this.currentMonth, 1);
			const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
			const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
			const firstDayOfWeek = firstDay.getDay();
			
			const today = new Date();
			
			// 上月
			for (let i = firstDayOfWeek - 1; i >= 0; i--) {
				const day = daysInPrevMonth - i;
				const year = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
				const month = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
				dates.push(this.createDateObj(year, month, day, false, today));
			}
			// 当月
			for (let day = 1; day <= daysInMonth; day++) {
				dates.push(this.createDateObj(this.currentYear, this.currentMonth, day, true, today));
			}
			// 下月
			const remainingDays = 42 - dates.length;
			for (let day = 1; day <= remainingDays; day++) {
				const year = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
				const month = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
				dates.push(this.createDateObj(year, month, day, false, today));
			}
			return dates;
		}
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
			this.loadMoodHistory();
			this.loadAnniversaries();
			this._isInitialized = true;
		}
		this.triggerPageReveal();
	},
	onShow() {
		this.activeNav = 'calendar';
		this.loadAllTasks();
		this.loadMoodHistory();
		this.loadAnniversaries();
		this.triggerPageReveal();
	},
	methods: {
		createDateObj(year, month, day, current, today) {
			const key = this.getDateKey(year, month, day);
			const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
			const selected = this.selectedDate && this.selectedDate.year === year && this.selectedDate.month === month && this.selectedDate.day === day;
			
			return {
				day, year, month, current, isToday, selected,
				hasTasks: this.hasTasksForDate(key),
				hasMood: !!this.moodHistory[key],
				moodColor: this.getMainMoodColor(key)
			};
		},
		triggerPageReveal() {
			if (this.revealTimer) clearTimeout(this.revealTimer);
			this.pageLoaded = false;
			this.$nextTick(() => {
				this.revealTimer = setTimeout(() => {
					this.pageLoaded = true;
					this.revealTimer = null;
				}, 30);
			});
		},
		goBack() { uni.switchTab({ url: '/pages/index/index' }); },
		onBottomNavTap(item) {
			if (item.key === this.activeNav) return;
			if (item.target) uni.switchTab({ url: item.target });
		},
		prevMonth() {
			if (this.currentMonth === 0) { this.currentMonth = 11; this.currentYear -= 1; } 
			else { this.currentMonth -= 1; }
		},
		nextMonth() {
			if (this.currentMonth === 11) { this.currentMonth = 0; this.currentYear += 1; } 
			else { this.currentMonth += 1; }
		},
		selectDate(date) {
			if (!date.current) { this.currentYear = date.year; this.currentMonth = date.month; }
			this.selectedDate = { year: date.year, month: date.month, day: date.day };
		},
		getDateKey(year, month, day) {
			const m = String(month + 1).padStart(2, '0');
			const d = String(day).padStart(2, '0');
			return `${year}-${m}-${d}`;
		},

		// --- 纪念日逻辑 ---
		loadAnniversaries() {
			const data = uni.getStorageSync('anniversaries') || [];
			this.anniversaries = data.map(item => ({
				...item,
				days: this.calculateDays(item.date)
			})).sort((a, b) => Math.abs(a.days) - Math.abs(b.days));
		},
		calculateDays(dateStr) {
			const target = new Date(dateStr.replace(/-/g, '/'));
			const today = new Date();
			today.setHours(0,0,0,0); target.setHours(0,0,0,0);
			return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
		},
		openAnniversaryManager() { this.newAnni = { title: '', date: '' }; this.showAnniversarySheet = true; },
		closeAnniversaryManager() { this.showAnniversarySheet = false; },
		onAnniDateChange(e) { this.newAnni.date = e.detail.value; },
		addAnniversary() {
			const item = { id: Date.now(), title: this.newAnni.title, date: this.newAnni.date };
			const list = uni.getStorageSync('anniversaries') || [];
			list.push(item);
			uni.setStorageSync('anniversaries', list);
			this.loadAnniversaries();
			this.newAnni = { title: '', date: '' };
			uni.showToast({ title: '已添加', icon: 'success' });
		},
		deleteAnniversary(id) {
			const list = uni.getStorageSync('anniversaries') || [];
			const newList = list.filter(item => item.id !== id);
			uni.setStorageSync('anniversaries', newList);
			this.loadAnniversaries();
		},
		
		// --- 海报分享 (高颜值优化版) ---
		openSharePreview(item) {
			this.showAnniversarySheet = false;
			this.showShareSheet = true;
			setTimeout(() => { this.drawShareImage(item); }, 200);
		},
		closeShareSheet() { this.showShareSheet = false; },
		drawShareImage(item) {
			const ctx = uni.createCanvasContext('shareCanvas', this);
			const W = 300, H = 400;
			const isFuture = item.days >= 0;
			const days = Math.abs(item.days);
			const label = isFuture ? 'DAYS LEFT' : 'DAYS SINCE';
			
			// 1. 背景: 使用更柔和的深色渐变
			const grd = ctx.createLinearGradient(0, 0, W, H);
			if (isFuture) {
				grd.addColorStop(0, '#1c2b4a'); // 蓝黑
				grd.addColorStop(1, '#2a4b6a'); // 稍亮蓝
			} else {
				grd.addColorStop(0, '#2b1c2d'); // 紫黑
				grd.addColorStop(1, '#4a2a3a'); // 稍亮紫
			}
			ctx.fillStyle = grd;
			ctx.fillRect(0, 0, W, H);
			
			// 2. 噪点纹理 (模拟)
			ctx.setFillStyle('rgba(255,255,255,0.03)');
			for(let i=0; i<50; i++) {
				const x = Math.random() * W;
				const y = Math.random() * H;
				const r = Math.random() * 2;
				ctx.beginPath();
				ctx.arc(x, y, r, 0, 2*Math.PI);
				ctx.fill();
			}
			
			// 3. 装饰圆环
			ctx.beginPath();
			ctx.arc(W/2, H/2 - 40, 100, 0, 2*Math.PI);
			ctx.setStrokeStyle('rgba(255,255,255,0.1)');
			ctx.setLineWidth(1);
			ctx.stroke();
			
			ctx.beginPath();
			ctx.arc(W/2, H/2 - 40, 90, 0, 2*Math.PI);
			ctx.setStrokeStyle('rgba(255,255,255,0.05)');
			ctx.setLineWidth(8);
			ctx.stroke();
			
			// 4. 巨大数字
			ctx.setTextAlign('center');
			ctx.setFillStyle('#ffffff');
			ctx.setFontSize(80);
			// 模拟阴影
			ctx.setShadow(0, 4, 10, 'rgba(0,0,0,0.3)');
			ctx.fillText(days.toString(), W/2, H/2 - 10);
			ctx.setShadow(0, 0, 0, 'transparent'); // 重置阴影
			
			// 5. 上方标签
			ctx.setFontSize(14);
			ctx.setSpacing && ctx.setSpacing(4); // 如果支持
			ctx.setFillStyle(isFuture ? '#6ecbff' : '#ff9f1f');
			ctx.fillText(label, W/2, H/2 - 80);
			
			// 6. 分割线
			ctx.setStrokeStyle('rgba(255,255,255,0.2)');
			ctx.setLineWidth(1);
			ctx.beginPath();
			ctx.moveTo(W/2 - 20, H/2 + 30);
			ctx.lineTo(W/2 + 20, H/2 + 30);
			ctx.stroke();
			
			// 7. 标题与日期
			ctx.setFontSize(22);
			ctx.setFillStyle('#ffffff');
			ctx.fillText(item.title, W/2, H/2 + 70);
			
			ctx.setFontSize(14);
			ctx.setFillStyle('rgba(255,255,255,0.6)');
			ctx.fillText(item.date, W/2, H/2 + 96);
			
			// 8. 底部品牌
			ctx.setFontSize(12);
			ctx.setFillStyle('rgba(255,255,255,0.25)');
			ctx.fillText('TimeManager · 记录美好', W/2, H - 24);
			
			ctx.draw();
		},
		saveImageToPhotos() {
			uni.canvasToTempFilePath({
				canvasId: 'shareCanvas',
				success: (res) => {
					uni.saveImageToPhotosAlbum({
						filePath: res.tempFilePath,
						success: () => { uni.showToast({ title: '已保存', icon: 'success' }); this.closeShareSheet(); },
						fail: () => { uni.showToast({ title: '保存失败', icon: 'none' }); }
					});
				}
			}, this);
		},

		// --- 像素画逻辑 ---
		loadMoodHistory() { try { this.moodHistory = uni.getStorageSync('moodHistory') || {}; } catch(e){} },
		getMainMoodColor(k) { 
			const p = this.moodHistory[k]; 
			return (p && Array.isArray(p)) ? (p.find(c => c!=='transparent') || '') : ''; 
		},
		openPixelEditor() {
			const total = this.gridSize * this.gridSize;
			if (this.hasMoodToday) {
				if (this.currentMoodPixels.length === 64) {
					const n = Array(total).fill('transparent');
					for(let i=0; i<64; i++) {
						const c = this.currentMoodPixels[i], r=Math.floor(i/8), col=i%8, b=(r*2)*16+(col*2);
						n[b]=c; n[b+1]=c; n[b+16]=c; n[b+17]=c;
					}
					this.editingPixels = n;
				} else this.editingPixels = [...this.currentMoodPixels];
			} else this.editingPixels = Array(total).fill('transparent');
			this.showPixelSheet = true;
			this.$nextTick(() => {
				setTimeout(() => {
					const q = uni.createSelectorQuery().in(this);
					q.select('.pixel-grid').boundingClientRect(d => { if(d) this.gridRect = d; }).exec();
				}, 300);
			});
		},
		closePixelEditor() { this.showPixelSheet = false; this.isDrawing = false; },
		clearCanvas() { this.editingPixels = Array(this.gridSize * this.gridSize).fill('transparent'); },
		selectColor(c) { this.selectedColor = c; },
		handleTouchDrawStart(e) { this.isDrawing = true; this.paintPixelByEvent(e); },
		handleTouchDrawMove(e) { if(this.isDrawing) this.paintPixelByEvent(e); },
		handleTouchDrawEnd() { this.isDrawing = false; },
		paintPixelByEvent(e) {
			if(!this.gridRect) return;
			const t = e.touches[0] || e.changedTouches[0]; if(!t) return;
			const x = t.clientX - this.gridRect.left, y = t.clientY - this.gridRect.top;
			const cell = this.gridRect.width / this.gridSize;
			if(x>=0 && x<=this.gridRect.width && y>=0 && y<=this.gridRect.height) {
				const c = Math.floor(x/cell), r = Math.floor(y/cell), i = r*this.gridSize+c;
				if(i>=0 && i<this.editingPixels.length && this.editingPixels[i]!==this.selectedColor) {
					this.editingPixels.splice(i, 1, this.selectedColor);
				}
			}
		},
		drawOnePixel(i) { this.editingPixels.splice(i, 1, this.selectedColor); },
		savePixelArt() {
			if(!this.selectedDate) return;
			const k = this.getDateKey(this.selectedDate.year, this.selectedDate.month, this.selectedDate.day);
			const empty = this.editingPixels.every(c => c==='transparent');
			if(empty) { if(this.moodHistory[k]) delete this.moodHistory[k]; }
			else this.$set(this.moodHistory, k, [...this.editingPixels]);
			uni.setStorageSync('moodHistory', this.moodHistory);
			this.closePixelEditor();
			uni.showToast({ title: '已保存', icon: 'success' });
		},

		// --- 任务逻辑 ---
		normalizeTaskHistory(h) {
			const n = {};
			for(const k in h) if(h[k]) n[k] = h[k].map(t => {
				if(!t) return null;
				const o = {...t};
				if(!o.createdDate) o.createdDate = k;
				if(!o.targetDate) o.targetDate = this.deriveTargetDateFromDeadline(o.deadline, k);
				return o;
			}).filter(Boolean);
			return n;
		},
		deriveTargetDateFromDeadline(txt, k) {
			if(!txt || txt==='无截止时间') return null;
			const ref = k ? new Date(k) : new Date(); ref.setHours(0,0,0,0);
			const s = String(txt).trim();
			const m1 = s.match(/(\d{4})-(\d{2})-(\d{2})/); if(m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
			if(s.includes('明天')) { ref.setDate(ref.getDate()+1); return this.getDateKey(ref.getFullYear(), ref.getMonth(), ref.getDate()); }
			if(s.includes('今天')) return this.getDateKey(ref.getFullYear(), ref.getMonth(), ref.getDate());
			return null;
		},
		getTasksForDate(k) {
			const res = [], tgt = new Date(k); tgt.setHours(0,0,0,0);
			for(const hk in this.allTasks) {
				const tasks = this.allTasks[hk] || [];
				const hDate = new Date(hk); hDate.setHours(0,0,0,0);
				for(const t of tasks) {
					if(t.targetDate === k) res.push(t);
					else if(!t.targetDate) {
						let cDate = t.createdDate ? new Date(t.createdDate) : hDate; cDate.setHours(0,0,0,0);
						if(t.done) {
							const doneKey = this.getDateKey(cDate.getFullYear(), cDate.getMonth(), cDate.getDate());
							if(doneKey === k && !res.find(x=>x.id===t.id)) res.push(t);
						} else if(cDate <= tgt && !res.find(x=>x.id===t.id)) res.push(t);
					}
				}
			}
			return res;
		},
		hasTasksForDate(k) { return this.getTasksForDate(k).length > 0; },
		loadAllTasks() {
			const s = uni.getStorageSync('taskHistory');
			if(s) { this.allTasks = this.normalizeTaskHistory(s); uni.setStorageSync('taskHistory', this.allTasks); }
			else {
				const t = uni.getStorageSync('todayTasks');
				if(t && t.length) {
					const n = new Date();
					this.allTasks = this.normalizeTaskHistory({ [this.getDateKey(n.getFullYear(), n.getMonth(), n.getDate())]: t });
					uni.setStorageSync('taskHistory', this.allTasks);
				} else this.allTasks = {};
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
						if (moodDot && date.moodColor) moodDot.style.background = date.moodColor;
					}
				});
			});
		}
	}
};
</script>

<style scoped>
.page {
	position: relative; min-height: 100vh;
	background: linear-gradient(160deg, #0f1b2b 0%, #1b2d45 55%, #18323e 100%);
	color: #f6f7fb; overflow: hidden;
}

/* 假高斯模糊基础类 */
.glass {
	background: rgba(255, 255, 255, 0.12);
	border: 1rpx solid rgba(255, 255, 255, 0.18);
	border-radius: 32rpx;
	box-shadow: 0 26rpx 70rpx rgba(9, 20, 35, 0.55), inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
	/* 移除 backdrop-filter 以使用假模糊 */
	transition: transform 0.6s, opacity 0.6s;
	opacity: 0; transform: translateY(30rpx);
}
.glass--active { opacity: 1; transform: translateY(0); }

/* 轻量化玻璃卡片 */
.glass-lite {
	background: rgba(255, 255, 255, 0.06);
	border: 1rpx solid rgba(255, 255, 255, 0.1);
	border-radius: 24rpx;
}

.top-bar {
	margin: 60rpx 40rpx 24rpx; height: 120rpx;
	display: flex; align-items: center; justify-content: space-between; padding: 0 30rpx; z-index: 3;
}
.top-bar__back { font-size: 48rpx; color: rgba(255,255,255,0.88); }
.top-bar__title { font-size: 42rpx; font-weight: 600; letter-spacing: 6rpx; }
.top-bar__right { width: 40rpx; }

.main-container { padding: 0 40rpx; height: 100vh; box-sizing: border-box; }

/* 日历 */
.calendar { padding: 42rpx 32rpx; margin-bottom: 30rpx; }
.calendar__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30rpx; }
.calendar__title { font-size: 36rpx; font-weight: 600; }
.calendar__nav { width: 60rpx; height: 60rpx; border-radius: 30rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08); border: 1rpx solid rgba(255,255,255,0.12); }
.calendar__nav-icon { font-size: 40rpx; color: rgba(255,255,255,0.88); }
.calendar__weekdays { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8rpx; margin-bottom: 16rpx; }
.calendar__weekday { text-align: center; font-size: 24rpx; color: rgba(255,255,255,0.6); padding: 12rpx 0; }
.calendar__dates { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8rpx; }
.calendar__date { position: relative; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; border-radius: 16rpx; background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.1); }
.calendar__date--disabled { opacity: 0.3; }
.calendar__date--today { background: rgba(110,203,255,0.15); border-color: rgba(110,203,255,0.35); }
.calendar__date--selected { background: rgba(110,203,255,0.25); border-color: rgba(110,203,255,0.5); transform: scale(1.05); }
.calendar__date--has-tasks { border-color: rgba(200,155,255,0.4); }
.calendar__date-text { font-size: 28rpx; color: #f6f7fb; }
.calendar__date-dot { position: absolute; bottom: 8rpx; width: 6rpx; height: 6rpx; border-radius: 50%; background: rgba(200,155,255,0.9); }
.calendar__mood-dot { position: absolute; top: 8rpx; right: 8rpx; width: 8rpx; height: 8rpx; border-radius: 50%; }

/* Tabs 切换栏 */
.tabs {
	display: flex; padding: 12rpx; margin-bottom: 30rpx;
	justify-content: space-between;
}
.tab-item {
	flex: 1; height: 70rpx; display: flex; flex-direction: column;
	align-items: center; justify-content: center; position: relative;
	border-radius: 16rpx; transition: all 0.3s;
}
.tab-item--active { background: rgba(255,255,255,0.1); }
.tab-item__text { font-size: 28rpx; font-weight: 500; color: rgba(255,255,255,0.7); }
.tab-item--active .tab-item__text { color: #fff; font-weight: 600; }
.tab-item__indicator {
	width: 8rpx; height: 8rpx; background: #6ecbff; border-radius: 50%;
	position: absolute; bottom: 6rpx; opacity: 0; transition: opacity 0.3s;
}
.tab-item--active .tab-item__indicator { opacity: 1; }

/* 内容区域 */
.content-area { height: calc(100vh - 850rpx); } /* 动态高度，适配不同屏幕 */
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24rpx; padding: 0 8rpx; }
.section-title { font-size: 32rpx; font-weight: 600; }
.section-sub { font-size: 24rpx; color: rgba(255,255,255,0.6); }

/* 任务列表样式 */
.task { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; margin-bottom: 20rpx; transition: transform 0.2s; }
.task:active { transform: scale(0.98); }
.task--done { opacity: 0.6; }
.task__title { font-size: 28rpx; margin-bottom: 4rpx; display: block; }
.task__title--strikethrough { text-decoration: line-through; }
.task__deadline { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.task__check { color: #6ecbff; font-size: 32rpx; }

/* 心情像素画样式 */
.pixel-card { padding: 30rpx; display: flex; justify-content: center; }
.pixel-preview { display: grid; gap: 2rpx; width: 400rpx; height: 400rpx; padding: 4rpx; background: #1e272e; border-radius: 12rpx; }
.pixel-dot { width: 100%; height: 100%; }
.pixel-placeholder { height: 400rpx; width: 400rpx; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 2rpx dashed rgba(255,255,255,0.2); border-radius: 12rpx; }
.pixel-plus { font-size: 60rpx; color: rgba(255,255,255,0.5); }
.pixel-hint { font-size: 24rpx; color: rgba(255,255,255,0.5); margin-top: 10rpx; }

/* 纪念日样式 */
.add-btn-mini { padding: 8rpx 20rpx; background: rgba(110,203,255,0.15); border-radius: 20rpx; font-size: 22rpx; color: #6ecbff; }
.anni-card { padding: 24rpx; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; transition: transform 0.2s; }
.anni-card:active { transform: scale(0.98); }
.anni-card__title { font-size: 30rpx; font-weight: 600; margin-bottom: 6rpx; display: block; }
.anni-card__date { font-size: 22rpx; color: rgba(255,255,255,0.5); }
.anni-card__badge { text-align: right; }
.anni-num { font-size: 40rpx; font-weight: 700; margin-right: 6rpx; }
.anni-unit { font-size: 22rpx; margin-right: 10rpx; }
.anni-label { font-size: 20rpx; padding: 4rpx 8rpx; border-radius: 8rpx; background: rgba(255,255,255,0.1); }
.future .anni-num { color: #6ecbff; }
.past .anni-num { color: #ff9f1f; }

/* 空状态 */
.empty-state { padding: 60rpx 0; text-align: center; opacity: 0.6; }
.empty-icon { font-size: 60rpx; margin-bottom: 10rpx; display: block; }
.empty-text { font-size: 26rpx; }

/* 弹窗通用 */
.sheet-mask { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(10,17,28,0.85); z-index: 10; animation: fade-in 0.3s; }
.sheet {
	position: fixed; left: 0; right: 0; bottom: 0; padding: 40rpx 40rpx 60rpx;
	border-radius: 46rpx 46rpx 0 0; z-index: 11;
	transform: translateY(120%); transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
	opacity: 1; /* 强制不透明 */
}
.glass-sheet { background: rgba(20, 30, 45, 0.98); box-shadow: 0 -10rpx 40rpx rgba(0,0,0,0.4); border-top: 1rpx solid rgba(255,255,255,0.1); }
.pixel-sheet { background: rgba(20, 30, 45, 0.98); }
.sheet--open { transform: translateY(0); }
.sheet__handle { width: 80rpx; height: 8rpx; background: rgba(255,255,255,0.2); border-radius: 4rpx; margin: -20rpx auto 30rpx; }
.sheet__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40rpx; }
.sheet__title { font-size: 34rpx; font-weight: 600; }
.sheet__close { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08); border-radius: 50%; font-size: 28rpx; color: rgba(255,255,255,0.7); }
.sheet__btn--clear { padding: 8rpx 24rpx; font-size: 24rpx; color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.1); border-radius: 12rpx; }

/* 像素编辑器 */
.pixel-editor { display: flex; flex-direction: column; align-items: center; gap: 30rpx; }
.pixel-grid { display: grid; grid-template-columns: repeat(16, 1fr) !important; gap: 1rpx; width: 560rpx; height: 560rpx; background: #2f3640; padding: 4rpx; border-radius: 12rpx; }
.pixel-cell { background: #1e272e; border-radius: 2rpx; }
.pixel-cell--active { box-shadow: inset 0 0 4rpx rgba(0,0,0,0.1); }
.palette { display: flex; flex-wrap: wrap; justify-content: center; gap: 20rpx; width: 100%; }
.palette-color { width: 60rpx; height: 60rpx; border-radius: 50%; border: 3rpx solid rgba(255,255,255,0.1); display: flex; align-items: center; justify-content: center; }
.palette-color--selected { transform: scale(1.1); border-color: #fff; box-shadow: 0 0 10rpx rgba(255,255,255,0.3); }
.palette-color--eraser { background: #353b48; }
.eraser-icon { font-size: 24rpx; color: rgba(255,255,255,0.5); }

/* 纪念日表单 */
.anni-form { display: flex; gap: 16rpx; margin-bottom: 30rpx; }
.anni-input { flex: 1; height: 80rpx; background: rgba(255,255,255,0.06); border-radius: 16rpx; padding: 0 24rpx; font-size: 28rpx; color: #fff; border: 1rpx solid rgba(255,255,255,0.1); }
.anni-input--date { display: flex; align-items: center; justify-content: center; }
.anni-list-scroll { max-height: 400rpx; }
.anni-item-row { display: flex; justify-content: space-between; align-items: center; padding: 24rpx 0; border-bottom: 1rpx solid rgba(255,255,255,0.05); }
.anni-row__title { font-size: 30rpx; color: #fff; margin-right: 20rpx; }
.anni-row__date { font-size: 24rpx; color: rgba(255,255,255,0.5); }
.anni-row__del { font-size: 24rpx; color: #ff7b8a; padding: 10rpx; }

/* 海报分享 */
.canvas-wrapper { display: flex; justify-content: center; margin-bottom: 40rpx; }
.share-canvas { width: 300px; height: 400px; border-radius: 20rpx; box-shadow: 0 20rpx 60rpx rgba(0,0,0,0.4); }

/* 通用按钮 */
.action-btn { width: 100%; height: 90rpx; line-height: 90rpx; background: linear-gradient(135deg, #1dd1a1, #10ac84); color: #fff; font-weight: 600; border-radius: 24rpx; font-size: 32rpx; }
.action-btn:active { opacity: 0.9; transform: scale(0.98); }
.action-btn--small { width: 140rpx; height: 80rpx; line-height: 80rpx; font-size: 28rpx; background: #6ecbff; color: #0f1b2b; }

.bottom-bar {
	position: fixed; left: 40rpx; right: 40rpx; bottom: 40rpx; height: 120rpx; border-radius: 60rpx;
	display: flex; align-items: center; justify-content: space-around; z-index: 3;
	background: rgba(255, 255, 255, 0.08); border: 1rpx solid rgba(255, 255, 255, 0.12);
	/* 假模糊：用纯色半透明代替 backdrop-filter */
}
.bottom-bar__item { display: flex; flex-direction: column; align-items: center; gap: 10rpx; color: rgba(255,255,255,0.62); transition: all 0.2s; }
.bottom-bar__item--active { color: #ffffff; transform: translateY(-6rpx); }
.bottom-bar__icon { font-size: 32rpx; }
.bottom-bar__label { font-size: 24rpx; }

@keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
</style>