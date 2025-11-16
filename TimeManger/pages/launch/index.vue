<template>
	<view class="launch-page">
		<view class="launch-content">
			<view class="logo-container">
				<text class="logo-text">TimeManager</text>
				<text class="logo-subtitle">时间管理，成就更好的自己</text>
			</view>
			
			<view class="loading-container">
				<view class="loading-dots">
					<view class="dot" :class="{ 'dot--active': loadingStep >= 1 }"></view>
					<view class="dot" :class="{ 'dot--active': loadingStep >= 2 }"></view>
					<view class="dot" :class="{ 'dot--active': loadingStep >= 3 }"></view>
				</view>
				<text class="loading-text">{{ loadingText }}</text>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			loadingStep: 0,
			loadingText: '正在初始化...',
			preloadComplete: false
		};
	},
	onLoad() {
		console.log('启动页面加载')
		// 立即开始预加载
		this.startPreload()
	},
	methods: {
		startPreload() {
			// 需要预加载的页面列表
			const tabBarPages = [
				'pages/calendar/index',   // 日历 (tabBar)
				'pages/pomodoro/index',   // 番茄钟 (tabBar)
				'pages/habit/index'       // 习惯 (tabBar)
			]
			
			this.loadingText = '正在加载页面...'
			this.loadingStep = 1
			
			// 检查 uni.preloadPage 是否可用
			if (typeof uni !== 'undefined' && typeof uni.preloadPage === 'function') {
				// 使用官方 API 预加载
				this.preloadWithAPI(tabBarPages)
			} else {
				// HarmonyOS 等平台，使用静默导航方式预加载
				console.log('当前平台不支持 uni.preloadPage，使用静默导航方式预加载')
				this.preloadWithNavigation(tabBarPages)
			}
		},
		
		preloadWithAPI(tabBarPages) {
			let completed = 0
			const total = tabBarPages.length
			
			tabBarPages.forEach((page, index) => {
				setTimeout(() => {
					try {
						uni.preloadPage({
							url: `/${page}`,
							success: () => {
								console.log(`✓ 页面预加载成功: ${page}`)
								completed++
								this.updateProgress(completed, total)
								if (completed === total) {
									this.onPreloadComplete()
								}
							},
							fail: (err) => {
								console.warn(`✗ 页面预加载失败: ${page}`, err)
								completed++
								if (completed === total) {
									this.onPreloadComplete()
								}
							}
						})
					} catch (error) {
						console.warn(`预加载页面异常: ${page}`, error)
						completed++
						if (completed === total) {
							this.onPreloadComplete()
						}
					}
				}, index * 100)
			})
		},
		
		preloadWithNavigation(tabBarPages) {
			// 对于 HarmonyOS 平台，由于启动页不是 tabBar，无法直接 switchTab
			// 我们显示加载动画，然后跳转到首页，让首页在后台完成预加载
			this.loadingText = '正在准备...'
			this.loadingStep = 2
			
			// 模拟加载过程，给用户良好的体验
			setTimeout(() => {
				this.loadingText = '即将完成...'
				this.loadingStep = 3
			}, 300)
			
			// 等待一段时间后跳转到首页
			// 首页会延迟显示内容，等待预加载完成
			setTimeout(() => {
				this.loadingText = '加载完成'
				setTimeout(() => {
					this.navigateToHome()
				}, 200)
			}, 600)
		},
		
		updateProgress(completed, total) {
			const progress = completed / total
			if (progress >= 0.33 && this.loadingStep < 2) {
				this.loadingStep = 2
				this.loadingText = '正在优化性能...'
			}
			if (progress >= 0.66 && this.loadingStep < 3) {
				this.loadingStep = 3
				this.loadingText = '即将完成...'
			}
		},
		
		onPreloadComplete() {
			this.loadingStep = 3
			this.loadingText = '加载完成'
			this.preloadComplete = true
			
			// 延迟一小段时间让用户看到完成状态，然后跳转到首页
			setTimeout(() => {
				this.navigateToHome()
			}, 300)
		},
		
		navigateToHome() {
			// 跳转到首页（使用 reLaunch 确保清除启动页）
			uni.reLaunch({
				url: '/pages/index/index',
				success: () => {
					console.log('✓ 已跳转到首页')
				},
				fail: (err) => {
					console.warn('✗ 跳转首页失败', err)
					// 如果 reLaunch 失败，尝试 switchTab
					uni.switchTab({
						url: '/pages/index/index'
					})
				}
			})
		}
	}
};
</script>

<style scoped>
.launch-page {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	width: 100vw;
	height: 100vh;
	background: linear-gradient(160deg, #0f1b2b 0%, #1b2d45 55%, #18323e 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
}

.launch-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 80rpx;
}

.logo-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
}

.logo-text {
	font-size: 64rpx;
	font-weight: 700;
	color: #ffffff;
	letter-spacing: 8rpx;
	text-shadow: 0 4rpx 20rpx rgba(110, 203, 255, 0.3);
}

.logo-subtitle {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.7);
	letter-spacing: 2rpx;
}

.loading-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 40rpx;
}

.loading-dots {
	display: flex;
	gap: 20rpx;
	align-items: center;
}

.dot {
	width: 16rpx;
	height: 16rpx;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.3);
	transition: all 0.3s ease;
}

.dot--active {
	background: rgba(110, 203, 255, 0.9);
	transform: scale(1.2);
	box-shadow: 0 0 20rpx rgba(110, 203, 255, 0.5);
}

.loading-text {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.6);
	letter-spacing: 2rpx;
}
</style>

