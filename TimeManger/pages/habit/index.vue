<template>
	<view class="page">
		<view class="top-bar glass" :class="{ 'glass--active': pageLoaded }">
			<view class="top-bar__left" @tap="goBackToHome">
				<text class="top-bar__back">◉</text>
			</view>
			<view class="top-bar__center">
				<text class="top-bar__title">习惯冒险</text>
			</view>
			<view class="top-bar__right">
				<view class="energy-badge">
					<text class="energy-icon">🪙</text>
					<text class="energy-value">{{ gold }}</text>
				</view>
			</view>
		</view>

		<view class="main">
			<view class="hero-card glass" :class="{ 'glass--active': pageLoaded }">
				<view class="hero-info">
					<view class="hero-avatar-box" @tap="activeTab = 'shop'">
						<text class="hero-avatar">{{ currentAvatar }}</text>
						<view class="hero-level-badge">Lv.{{ currentLevel }}</view>
					</view>
					<view class="hero-stats">
						<view class="hero-name-row">
							<text class="hero-name">冒险者</text>
							<text class="hero-title" v-if="currentTitle">{{ currentTitle }}</text>
						</view>
						<view class="progress-row">
							<text class="progress-label">EXP</text>
							<view class="progress-track">
								<view class="progress-bar" :style="{ width: expPercent + '%' }"></view>
							</view>
							<text class="progress-text">{{ currentExp }}/{{ nextLevelExp }}</text>
						</view>
						<view class="hero-pet" v-if="currentPet">
							<text>伙伴: {{ currentPet }}</text>
						</view>
					</view>
				</view>
			</view>

			<view class="game-tabs glass" :class="{ 'glass--active': pageLoaded }">
				<view 
					class="g-tab" 
					:class="{ 'g-tab--active': activeTab === 'habits' }"
					@tap="activeTab = 'habits'"
				>
					<text>📜 任务书</text>
				</view>
				<view 
					class="g-tab" 
					:class="{ 'g-tab--active': activeTab === 'shop' }"
					@tap="activeTab = 'shop'"
				>
					<text>⛺ 补给站</text>
				</view>
				<view 
					class="g-tab" 
					:class="{ 'g-tab--active': activeTab === 'achievements' }"
					@tap="activeTab = 'achievements'"
				>
					<text>🏆 荣誉室</text>
				</view>
			</view>

			<scroll-view scroll-y class="tab-content">
				
				<view v-if="activeTab === 'habits'" class="habit-list">
					<view class="card-header">
						<text class="card-title">每日委托</text>
						<text class="card-sub">{{ todayCheckinCount }}/{{ habits.length }} 完成</text>
					</view>

					<view v-if="habits.length">
						<view v-for="habit in habits" :key="habit.id" class="habit-card" :class="getHabitCardClass(habit)">
							<view class="habit-card__main" @tap="toggleHabit(habit)">
								<view class="habit-card__left">
									<view class="habit-checkbox" :class="{ 'habit-checkbox--checked': habit.checkedToday }">
										<text class="habit-checkbox__icon">{{ habit.checkedToday ? '✓' : '' }}</text>
									</view>
									<view class="habit-info">
										<text class="habit-title">{{ habit.title }}</text>
										<view class="habit-meta">
											<text class="habit-meta__time">{{ habit.time }}</text>
											<text class="habit-meta__energy">+{{ habit.energy }} EXP</text>
											<text class="habit-meta__gold" style="color:#ffd700; margin-left:10rpx;">+{{ habit.goldReward || 5 }} 🪙</text>
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
							<view class="habit-actions">
								<button class="habit-action-btn habit-action-btn--edit" @tap.stop="editHabit(habit)">✎</button>
								<button class="habit-action-btn habit-action-btn--delete" @tap.stop="deleteHabit(habit)">×</button>
							</view>
						</view>
					</view>
					
					<view v-else class="empty">
						<text class="empty__icon">📜</text>
						<text class="empty__tip">冒险日志是空的，去接点委托吧！</text>
					</view>
				</view>

				<view v-if="activeTab === 'shop'" class="shop-grid">
					<view class="card-header">
						<text class="card-title">宠物伙伴</text>
						<text class="card-sub">打卡赚金币，寻找你的搭档</text>
					</view>
					<view class="shop-items">
						<view 
							v-for="item in shopPets" 
							:key="item.id" 
							class="shop-item glass-lite"
							:class="{ 'shop-item--owned': item.owned }"
							@tap="buyOrEquip(item, 'pet')"
						>
							<text class="shop-icon">{{ item.icon }}</text>
							<text class="shop-name">{{ item.name }}</text>
							<view class="shop-btn" :class="item.owned ? 'shop-btn--owned' : ''">
								{{ item.owned ? (currentPet === item.icon ? '休息' : '携带') : `🪙 ${item.price}` }}
							</view>
						</view>
					</view>

					<view class="card-header" style="margin-top: 40rpx;">
						<text class="card-title">称号徽章</text>
					</view>
					<view class="shop-items">
						<view 
							v-for="item in shopTitles" 
							:key="item.id" 
							class="shop-item glass-lite"
							:class="{ 'shop-item--owned': item.owned }"
							@tap="buyOrEquip(item, 'title')"
						>
							<text class="shop-icon">{{ item.icon }}</text>
							<text class="shop-name">{{ item.name }}</text>
							<view class="shop-btn" :class="item.owned ? 'shop-btn--owned' : ''">
								{{ item.owned ? (currentTitle === item.name ? '卸下' : '佩戴') : `🪙 ${item.price}` }}
							</view>
						</view>
					</view>
				</view>

				<view v-if="activeTab === 'achievements'" class="achieve-list">
					<view class="card-header">
						<text class="card-title">生涯成就</text>
						<text class="card-sub">累计打卡 {{ totalCheckins }} 次</text>
					</view>
					
					<view 
						v-for="ach in achievements" 
						:key="ach.id" 
						class="achieve-card glass-lite" 
						:class="{ 'achieve-card--locked': !ach.unlocked }"
					>
						<view class="achieve-icon-box">
							<text class="achieve-icon">{{ ach.unlocked ? ach.icon : '🔒' }}</text>
						</view>
						<view class="achieve-info">
							<view class="achieve-top">
								<text class="achieve-name">{{ ach.name }}</text>
								<text class="achieve-status" v-if="!ach.unlocked">{{ totalCheckins }}/{{ ach.target }}</text>
							</view>
							<text class="achieve-desc">{{ ach.desc }}</text>
							<view class="achieve-progress-bar">
								<view class="achieve-fill" :style="{ width: Math.min(100, (totalCheckins / ach.target) * 100) + '%' }"></view>
							</view>
						</view>
					</view>
				</view>
				
				<view style="height: 200rpx;"></view>
			</scroll-view>
		</view>

		<view class="fab" :class="{ 'fab--pulse': showAddSheet, 'fab--hidden': hideFab }" @tap.stop="toggleAddSheet">
			<text class="fab__icon">+</text>
		</view>

		<view class="sheet-mask" v-if="showAddSheet" @tap="closeAddSheet"></view>
		<view class="sheet glass" :class="{ 'sheet--open': showAddSheet }" @touchmove.stop>
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
						<text class="time-slot__range">{{ slot.range }}</text>
					</view>
				</view>
			</view>
			<button class="sheet__action" type="primary" :disabled="!canSubmit" @tap.stop="confirmHabit">
				{{ isEditing ? '保存修改' : '创建习惯' }}
			</button>
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
import { getAllAppData, saveAllAppData, updateModuleData } from '@/utils/dataManager.js';

export default {
	data() {
		return {
			pageLoaded: false,
			activeTab: 'habits', // 默认为习惯列表
			showAddSheet: false,
			isEditing: false,
			editingHabit: null,
			hideFab: false,
			scrollTop: 0,
			lastScrollTop: 0,
			scrollTimer: null,
			
			// RPG 数据
			currentLevel: 1,
			currentExp: 0,
			nextLevelExp: 100,
			gold: 0,
			currentAvatar: '🧙‍♂️',
			currentPet: null,
			currentTitle: null,
			
			habits: [],
			
			// 商店数据
			shopPets: [
				{ id: 'pet_cat', name: '像素猫', icon: '🐱', price: 50, owned: false },
				{ id: 'pet_dog', name: '忠诚犬', icon: '🐶', price: 50, owned: false },
				{ id: 'pet_dragon', name: '喷火龙', icon: '🐲', price: 200, owned: false },
				{ id: 'pet_robot', name: '罗伯特', icon: '🤖', price: 150, owned: false },
				{ id: 'pet_alien', name: 'ET', icon: '👽', price: 300, owned: false }
			],
			shopTitles: [
				{ id: 'title_newbie', name: '见习生', icon: '🌱', price: 20, owned: false },
				{ id: 'title_warrior', name: '自律战士', icon: '⚔️', price: 100, owned: false },
				{ id: 'title_king', name: '习惯之王', icon: '👑', price: 500, owned: false }
			],
			
			// 成就数据
			achievements: [
				{ id: 'ach_7', name: '坚持一周', desc: '累计打卡7次', target: 7, icon: '🥉', unlocked: false },
				{ id: 'ach_21', name: '习惯养成', desc: '累计打卡21次', target: 21, icon: '🥈', unlocked: false },
				{ id: 'ach_100', name: '百日筑基', desc: '累计打卡100次', target: 100, icon: '🥇', unlocked: false },
				{ id: 'ach_king', name: '传奇', desc: '累计打卡365次', target: 365, icon: '🏆', unlocked: false }
			],

			// 原有表单数据
			form: {
				title: '',
				time: '早晨'
			},
			timeSlots: [
				{ value: '早晨', label: '早晨', icon: '🌅', range: '06:00-09:00' },
				{ value: '上午', label: '上午', icon: '☀️', range: '09:00-12:00' },
				{ value: '下午', label: '下午', icon: '🌤', range: '12:00-18:00' },
				{ value: '晚间', label: '晚间', icon: '🌙', range: '18:00-22:00' },
				{ value: '全天', label: '全天', icon: '⏰', range: '全天' }
			],
			inspirationalQuotes: [
				'坚持，是通往成功最短的路',
				'每一次打卡，都在遇见更好的自己',
			],
			bottomNavItems: [
				{ key: 'today', label: '今日', icon: '◎', target: '/pages/index/index' },
				{ key: 'calendar', label: '日历', icon: '◉', target: '/pages/calendar/index' },
				{ key: 'tracking', label: '番茄钟', icon: '◴', target: '/pages/pomodoro/index' },
				{ key: 'habit', label: '习惯', icon: '△', target: '/pages/habit/index' }
			],
			activeNav: 'habit'
		};
	},
	computed: {
		expPercent() {
			return Math.min((this.currentExp / this.nextLevelExp) * 100, 100);
		},
		activeHabits() {
			return this.habits.length;
		},
		longestStreak() {
			if (!this.habits.length) return 0;
			return Math.max(...this.habits.map(h => h.streak));
		},
		totalCheckins() {
			return this.habits.reduce((sum, h) => sum + (h.streak || 0), 0);
		},
		levelProgress() {
			const percent = (this.currentExp / this.nextLevelExp) * 100;
			return `${Math.min(percent, 100)}%`;
		},
		todayCheckinCount() {
			return this.habits.filter(h => h.checkedToday).length;
		},
		canSubmit() {
			return this.form.title.trim().length > 0;
		},
		inspirationalQuote() {
			const index = Math.floor(Math.random() * this.inspirationalQuotes.length);
			return this.inspirationalQuotes[index];
		}
	},
	onLoad() {
		this.loadData();
		this.resetDailyCheckins();
		this.pageLoaded = true;
	},
	onShow() {
		this.activeNav = 'habit';
		this.loadData();
		this.pageLoaded = true;
	},
	onPageScroll(e) {
		if (!e) return;
		if (this.scrollTimer) return;
		this.scrollTimer = setTimeout(() => {
			const currentScrollTop = e.scrollTop || 0;
			const delta = currentScrollTop - this.lastScrollTop;
			if (Math.abs(delta) < 1) {
				this.scrollTimer = null;
				return;
			}
			if (currentScrollTop > 150 && delta > 0) {
				this.hideFab = true;
			} else if (delta < 0 || currentScrollTop < 100) {
				this.hideFab = false;
			}
			this.lastScrollTop = currentScrollTop;
			this.scrollTimer = null;
		}, 16);
	},
	methods: {
		// --- 数据加载与保存 ---
		loadData() {
			const allData = getAllAppData();
			const hData = allData.habits || {};
			
			// 基础数据
			this.habits = Array.isArray(hData.list) ? hData.list : [];
			this.currentLevel = hData.level || 1;
			this.currentExp = hData.exp || 0;
			this.nextLevelExp = hData.nextLevelExp || 100;
			this.gold = hData.gold || 0;
			
			// RPG 装备数据
			this.currentPet = hData.currentPet || null;
			this.currentTitle = hData.currentTitle || null;
			const ownedItems = hData.inventory || []; 
			
			// 同步商店状态
			this.shopPets.forEach(p => p.owned = ownedItems.includes(p.id));
			this.shopTitles.forEach(t => t.owned = ownedItems.includes(t.id));
			
			// 检查成就
			this.checkAchievements();
		},
		saveData() {
			const inventory = [
				...this.shopPets.filter(p => p.owned).map(p => p.id),
				...this.shopTitles.filter(t => t.owned).map(t => t.id)
			];
			
			updateModuleData('habits', {
				list: this.habits,
				level: this.currentLevel,
				exp: this.currentExp,
				nextLevelExp: this.nextLevelExp,
				gold: this.gold,
				currentPet: this.currentPet,
				currentTitle: this.currentTitle,
				inventory: inventory
			});
		},
		saveLocalData() {
			this.saveData(); // Alias for compatibility
		},

		// --- RPG 逻辑 ---
		buyOrEquip(item, type) {
			if (item.owned) {
				if (type === 'pet') {
					this.currentPet = this.currentPet === item.icon ? null : item.icon;
					uni.showToast({ title: this.currentPet ? '宠物已跟随' : '宠物已休息', icon: 'none' });
				} else {
					this.currentTitle = this.currentTitle === item.name ? null : item.name;
					uni.showToast({ title: this.currentTitle ? '称号已佩戴' : '称号已卸下', icon: 'none' });
				}
				this.saveData();
			} else {
				if (this.gold >= item.price) {
					uni.showModal({
						title: '补给站',
						content: `确定花费 ${item.price} 金币购买 "${item.name}" 吗？`,
						success: (res) => {
							if (res.confirm) {
								this.gold -= item.price;
								item.owned = true;
								this.saveData();
								uni.showToast({ title: '购买成功！', icon: 'success' });
							}
						}
					});
				} else {
					uni.showToast({ title: '金币不足，快去完成委托吧！', icon: 'none' });
				}
			}
		},
		checkAchievements() {
			const total = this.totalCheckins;
			this.achievements.forEach(ach => {
				if (!ach.unlocked && total >= ach.target) {
					ach.unlocked = true;
					uni.showToast({ title: `🏆 解锁成就: ${ach.name}`, icon: 'none', duration: 3000 });
				}
			});
		},
		gainExp(amount) {
			this.currentExp += amount;
			if (this.currentExp >= this.nextLevelExp) {
				this.currentLevel++;
				this.currentExp -= this.nextLevelExp;
				this.nextLevelExp = Math.floor(this.nextLevelExp * 1.2);
				uni.showModal({
					title: '🎉 恭喜升级！',
					content: `你已经升到了 Lv.${this.currentLevel}！`,
					showCancel: false
				});
			}
		},

		// --- 习惯列表交互 ---
		getHabitCardClass(habit) {
			return habit.checkedToday ? 'habit-card--checked' : '';
		},
		toggleHabit(habit) {
			const todayKey = this.buildTodayKey();
			const goldReward = habit.goldReward || 5;
			const expReward = habit.energy || 10;
			
			if (habit.checkedToday) {
				habit.checkedToday = false;
				habit.streak = Math.max(0, habit.streak - 1);
				this.gold = Math.max(0, this.gold - goldReward);
				this.currentExp = Math.max(0, this.currentExp - expReward);
				
				let checkins = uni.getStorageSync('habitCheckins') || {};
				if (checkins[habit.id]) delete checkins[habit.id][todayKey];
				uni.setStorageSync('habitCheckins', checkins);
			} else {
				habit.checkedToday = true;
				habit.streak++;
				this.gold += goldReward;
				this.gainExp(expReward);
				
				let checkins = uni.getStorageSync('habitCheckins') || {};
				if (!checkins[habit.id]) checkins[habit.id] = {};
				checkins[habit.id][todayKey] = true;
				uni.setStorageSync('habitCheckins', checkins);
				
				this.checkAchievements();
				uni.showToast({ title: `+${goldReward}金币 +${expReward}经验`, icon: 'none' });
			}
			this.saveData();
		},
		
		// --- 表单操作 (保留原有逻辑) ---
		toggleAddSheet() {
			this.showAddSheet = !this.showAddSheet;
			if (!this.showAddSheet) this.resetForm();
		},
		closeAddSheet() {
			this.showAddSheet = false;
			this.resetForm();
		},
		resetForm() {
			this.form.title = '';
			this.form.time = '早晨';
			this.isEditing = false;
			this.editingHabit = null;
		},
		selectTimeSlot(value) {
			this.form.time = value;
		},
		editHabit(habit) {
			this.isEditing = true;
			this.editingHabit = habit;
			this.form.title = habit.title;
			this.form.time = habit.time;
			this.showAddSheet = true;
		},
		deleteHabit(habit) {
			uni.showModal({
				title: '确认删除',
				content: '确定要放弃这个习惯吗？',
				success: (res) => {
					if (res.confirm) {
						const idx = this.habits.findIndex(h => h.id === habit.id);
						if (idx > -1) this.habits.splice(idx, 1);
						this.saveData();
					}
				}
			});
		},
		confirmHabit() {
			if (!this.canSubmit) return;
			const defaultEnergy = 15; 
			
			if (this.isEditing && this.editingHabit) {
				this.editingHabit.title = this.form.title;
				this.editingHabit.time = this.form.time;
				uni.showToast({ title: '修改成功', icon: 'success' });
			} else {
				const newHabit = {
					id: Date.now(),
					title: this.form.title,
					time: this.form.time,
					energy: defaultEnergy,
					goldReward: 5,
					streak: 0,
					checkedToday: false
				};
				this.habits.push(newHabit);
				uni.showToast({ title: '创建成功！', icon: 'success' });
			}
			this.saveData();
			this.closeAddSheet();
		},

		// --- 辅助方法 ---
		onBottomNavTap(item) { if (item.target) uni.switchTab({ url: item.target }); },
		goBackToHome() { uni.switchTab({ url: '/pages/index/index' }); },
		getCurrentDate() { return new Date(); },
		buildTodayKey() {
			const d = new Date();
			return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
		},
		resetDailyCheckins() {
			const today = this.buildTodayKey();
			const last = uni.getStorageSync('lastCheckinDate');
			let checkins = uni.getStorageSync('habitCheckins') || {};
			
			if (last !== today) {
				this.habits.forEach(h => {
					const hCheckins = checkins[h.id] || {};
					h.checkedToday = !!hCheckins[today];
				});
				uni.setStorageSync('lastCheckinDate', today);
				this.saveData();
			} else {
				this.habits.forEach(h => {
					const hCheckins = checkins[h.id] || {};
					h.checkedToday = !!hCheckins[today];
				});
			}
		},
		// 保留链条动画相关
		getChainDotClass(index, streak) { return ['chain-dot--filled']; },
		getNextMilestone(streak) { return null; }
	}
};
</script>

<script module="renderjs" lang="renderjs">
export default {
	methods: {
		updateLevelProgress(newValue, oldValue, ownerInstance, instance) {
			const fill = ownerInstance.$el.querySelector('#levelProgressFill');
			if (fill && newValue) {
				requestAnimationFrame(() => {
					const percentNum = parseFloat(newValue) || 0;
					fill.style.width = '100%';
					fill.style.transform = `scaleX(${percentNum / 100})`;
					fill.style.transformOrigin = 'left';
				});
			}
		}
	}
};
</script>

<style scoped>
.page {
	position: relative; min-height: 100vh;
	background: linear-gradient(160deg, #0f1b2b 0%, #1b2d45 55%, #18323e 100%);
	color: #f6f7fb; overflow: hidden; padding-bottom: 200rpx;
}

.glass {
	background: rgba(255, 255, 255, 0.12);
	border: 1rpx solid rgba(255, 255, 255, 0.18);
	border-radius: 32rpx;
	box-shadow: 0 26rpx 70rpx rgba(9, 20, 35, 0.55);
	opacity: 0; transform: translateY(30rpx);
	transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.glass--active { opacity: 1; transform: translateY(0); }
.glass-lite { background: rgba(255, 255, 255, 0.06); border: 1rpx solid rgba(255, 255, 255, 0.1); border-radius: 24rpx; }

/* 顶部栏 */
.top-bar {
	margin: 60rpx 40rpx 24rpx; height: 120rpx;
	display: flex; align-items: center; justify-content: space-between; padding: 0 30rpx;
}
.top-bar__back { font-size: 44rpx; color: rgba(255,255,255,0.8); }
.top-bar__title { font-size: 36rpx; font-weight: 600; letter-spacing: 4rpx; }
.energy-badge {
	display: flex; align-items: center; gap: 8rpx; padding: 12rpx 20rpx;
	background: rgba(255,215,0,0.15); border: 1rpx solid rgba(255,215,0,0.3); border-radius: 999rpx;
}
.energy-icon { font-size: 28rpx; }
.energy-value { font-size: 26rpx; font-weight: 600; color: #ffd700; }

.main { padding: 0 40rpx; box-sizing: border-box; }

/* 1. RPG 角色卡片 */
.hero-card { padding: 30rpx; margin-bottom: 30rpx; }
.hero-info { display: flex; align-items: center; gap: 30rpx; }
.hero-avatar-box { position: relative; width: 120rpx; height: 120rpx; background: rgba(255,255,255,0.1); border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 4rpx solid rgba(255,255,255,0.2); }
.hero-avatar { font-size: 64rpx; }
.hero-level-badge { position: absolute; bottom: -10rpx; background: #6ecbff; color: #0f1b2b; font-size: 20rpx; font-weight: 700; padding: 4rpx 12rpx; border-radius: 20rpx; }
.hero-stats { flex: 1; display: flex; flex-direction: column; gap: 12rpx; }
.hero-name-row { display: flex; align-items: center; gap: 12rpx; }
.hero-name { font-size: 32rpx; font-weight: 600; }
.hero-title { font-size: 20rpx; color: #ffd700; background: rgba(255,215,0,0.1); padding: 2rpx 8rpx; border-radius: 8rpx; }
.progress-row { display: flex; align-items: center; gap: 12rpx; }
.progress-label { font-size: 20rpx; font-weight: 700; color: #a8b8d0; }
.progress-track { flex: 1; height: 16rpx; background: rgba(0,0,0,0.3); border-radius: 8rpx; overflow: hidden; }
.progress-bar { height: 100%; background: linear-gradient(90deg, #6ecbff, #5affd0); border-radius: 8rpx; transition: width 0.5s ease; }
.progress-text { font-size: 20rpx; color: rgba(255,255,255,0.6); min-width: 80rpx; text-align: right; }
.hero-pet { font-size: 22rpx; color: #ffd700; margin-top: 4rpx; }

/* 2. 游戏 Tab 栏 */
.game-tabs { display: flex; padding: 10rpx; margin-bottom: 30rpx; justify-content: space-between; }
.g-tab { flex: 1; text-align: center; padding: 16rpx 0; font-size: 26rpx; color: rgba(255,255,255,0.6); border-radius: 16rpx; transition: all 0.3s; }
.g-tab--active { background: rgba(255,255,255,0.1); color: #fff; font-weight: 600; }

/* 3. 列表区域 */
.tab-content { height: calc(100vh - 500rpx); }
.card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20rpx; }
.card-title { font-size: 32rpx; font-weight: 600; }
.card-sub { font-size: 24rpx; color: rgba(255,255,255,0.6); }

/* 习惯卡片 (保留原有样式) */
.habit-card { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; margin-bottom: 20rpx; transition: all 0.3s; border: 1rpx solid rgba(255,255,255,0.1); }
.habit-card--checked { border-color: rgba(90,255,208,0.4); background: rgba(90,255,208,0.08); }
.habit-card__main { flex: 1; display: flex; justify-content: space-between; align-items: center; }
.habit-card__left { display: flex; align-items: center; gap: 24rpx; }
.habit-checkbox { width: 44rpx; height: 44rpx; border-radius: 50%; border: 3rpx solid rgba(255,255,255,0.3); display: flex; align-items: center; justify-content: center; font-size: 24rpx; }
.habit-checkbox--checked { background: #5affd0; border-color: #5affd0; color: #000; }
.habit-details { display: flex; flex-direction: column; }
.habit-title { font-size: 30rpx; font-weight: 500; }
.habit-meta { display: flex; align-items: center; font-size: 22rpx; color: rgba(255,255,255,0.5); gap: 10rpx; }
.habit-meta__energy { color: #6ecbff; }
.habit-card__right { display: flex; align-items: center; gap: 10rpx; }
.habit-streak { text-align: center; padding: 8rpx 16rpx; background: rgba(255,255,255,0.1); border-radius: 12rpx; }
.habit-streak__value { font-size: 32rpx; font-weight: 700; color: #ffd700; display: block; }
.habit-streak__label { font-size: 18rpx; color: rgba(255,255,255,0.6); }
.habit-actions { display: flex; flex-direction: column; gap: 10rpx; margin-left: 20rpx; }
.habit-action-btn { width: 60rpx; height: 60rpx; line-height: 60rpx; text-align: center; font-size: 24rpx; background: rgba(255,255,255,0.1); border-radius: 12rpx; color: rgba(255,255,255,0.6); padding: 0; }

/* 商店样式 */
.shop-grid { padding-bottom: 40rpx; }
.shop-items { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20rpx; }
.shop-item { padding: 20rpx; display: flex; flex-direction: column; align-items: center; gap: 10rpx; transition: transform 0.2s; border: 1rpx solid rgba(255,255,255,0.1); }
.shop-item:active { transform: scale(0.96); }
.shop-item--owned { border-color: #ffd700; background: rgba(255,215,0,0.05); }
.shop-icon { font-size: 50rpx; }
.shop-name { font-size: 24rpx; color: rgba(255,255,255,0.9); }
.shop-btn { font-size: 20rpx; padding: 6rpx 16rpx; background: rgba(255,255,255,0.1); border-radius: 20rpx; margin-top: 6rpx; }
.shop-btn--owned { background: #ffd700; color: #0f1b2b; font-weight: 600; }

/* 成就样式 */
.achieve-list { display: flex; flex-direction: column; gap: 20rpx; }
.achieve-card { display: flex; align-items: center; padding: 24rpx; gap: 24rpx; }
.achieve-card--locked { opacity: 0.5; filter: grayscale(100%); }
.achieve-icon-box { font-size: 50rpx; }
.achieve-info { flex: 1; }
.achieve-top { display: flex; justify-content: space-between; }
.achieve-name { font-size: 28rpx; font-weight: 600; margin-bottom: 4rpx; }
.achieve-status { font-size: 20rpx; color: rgba(255,255,255,0.5); }
.achieve-desc { font-size: 22rpx; color: rgba(255,255,255,0.6); display: block; margin-bottom: 12rpx; }
.achieve-progress-bar { height: 8rpx; background: rgba(255,255,255,0.1); border-radius: 4rpx; margin-bottom: 4rpx; overflow: hidden; }
.achieve-fill { height: 100%; background: #ffd700; }

/* 空状态 */
.empty { padding: 100rpx 0; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 20rpx; opacity: 0.6; }
.empty__icon { font-size: 80rpx; }
.empty__tip { font-size: 26rpx; }

/* FAB */
.fab { position: fixed; width: 140rpx; height: 140rpx; border-radius: 70rpx; background: linear-gradient(135deg, rgba(90,255,208,0.9), rgba(110,203,255,0.9)); box-shadow: 0 28rpx 46rpx rgba(10, 20, 35, 0.55); bottom: 200rpx; right: 60rpx; display: flex; align-items: center; justify-content: center; color: #0f1b2b; font-size: 90rpx; z-index: 10; }
.fab__icon { margin-top: -6rpx; }

/* === 弹窗样式 (保留原始 v-if, glass) === 
    关键修改：去掉 .prevent 
*/
.sheet-mask { position: fixed; left: 0; top: 0; width: 100%; height: 100%; background: rgba(10,17,28,0.85); z-index: 11; animation: fade-in 0.4s ease; }

.sheet {
	position: fixed; left: 0; right: 0; bottom: 0; padding: 42rpx 40rpx 90rpx; border-radius: 46rpx 46rpx 0 0; z-index: 12;
	transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
	transform: translateY(120%); opacity: 0; pointer-events: none;
}
/* 原始 glass 类 + 强制不透明度修复 */
.sheet.glass {
	background: rgba(18, 30, 45, 0.95);
	box-shadow: 0 26rpx 70rpx rgba(9, 20, 35, 0.55), inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
}
.sheet--open { transform: translateY(0); opacity: 1; pointer-events: auto; }

.sheet__handle { width: 120rpx; height: 10rpx; border-radius: 999rpx; background: rgba(255,255,255,0.35); margin: 0 auto 30rpx; }
.sheet__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40rpx; }
.sheet__title { font-size: 34rpx; font-weight: 600; }
.sheet__close { width: 60rpx; height: 60rpx; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.08); border-radius: 50%; }
.sheet__close-icon { font-size: 36rpx; color: rgba(255,255,255,0.8); }

.form-field { margin-bottom: 40rpx; display: flex; flex-direction: column; gap: 18rpx; }
.form-label { font-size: 26rpx; color: rgba(255,255,255,0.7); }
.form-input { background: rgba(255,255,255,0.06); border: 1rpx solid rgba(255,255,255,0.08); border-radius: 24rpx; padding: 24rpx 28rpx; color: #ffffff; font-size: 30rpx; }

.time-slots { display: flex; flex-wrap: wrap; gap: 16rpx; }
.time-slot { flex: 0 0 calc(33.333% - 12rpx); display: flex; flex-direction: column; align-items: center; gap: 8rpx; padding: 20rpx 12rpx; background: rgba(255,255,255,0.06); border: 2rpx solid rgba(255,255,255,0.1); border-radius: 20rpx; transition: all 0.3s ease; }
.time-slot--active { background: rgba(110,203,255,0.2); border-color: #6ecbff; }
.time-slot__icon { font-size: 40rpx; }
.time-slot__label { font-size: 24rpx; color: rgba(255,255,255,0.9); }
.time-slot__range { font-size: 20rpx; color: rgba(255,255,255,0.5); }

.sheet__action { margin-top: 20rpx; background: linear-gradient(135deg, rgba(90,255,208,0.85), rgba(110,203,255,0.9)); color: #0f1b2b; font-size: 32rpx; font-weight: 600; border: none; border-radius: 24rpx; height: 96rpx; line-height: 96rpx; }
.sheet__action[disabled] { background: rgba(255,255,255,0.12); color: rgba(255,255,255,0.4); }

/* 底部导航栏 */
.bottom-bar { position: fixed; left: 40rpx; right: 40rpx; bottom: 40rpx; height: 120rpx; border-radius: 60rpx; display: flex; align-items: center; justify-content: space-around; z-index: 3; background: rgba(255, 255, 255, 0.08); border: 1rpx solid rgba(255, 255, 255, 0.12); backdrop-filter: blur(50rpx); }
.bottom-bar__item { display: flex; flex-direction: column; align-items: center; gap: 10rpx; color: rgba(255,255,255,0.62); transition: all 0.2s; }
.bottom-bar__item--active { color: #ffffff; transform: translateY(-6rpx); }
.bottom-bar__icon { font-size: 32rpx; }
.bottom-bar__label { font-size: 24rpx; }

@keyframes fade-in { 0% { opacity: 0; } 100% { opacity: 1; } }
</style>