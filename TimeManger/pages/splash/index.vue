<template>
	<view class="splash-page" :class="{ 'splash-page--fadeout': isFadingOut }">
		<!-- 用户协议和隐私政策弹窗（分两步） -->
		<view class="sheet-mask" v-if="showAgreement" @tap.stop></view>
		<view class="sheet glass" :class="{ 'sheet--open': showAgreement }" v-if="showAgreement" @touchmove.stop.prevent>
			<view class="sheet__handle"></view>
			<view class="sheet__header">
				<text class="sheet__title">{{ currentAgreementStep.title }}</text>
				<view class="sheet__close" @tap.stop="rejectAgreement" v-if="currentAgreementStepIndex === 0">
					<text class="sheet__close-icon">✕</text>
				</view>
			</view>
			
			<scroll-view class="agreement-content" scroll-y>
				<view class="agreement-text">
					<template v-for="(para, index) in currentAgreementStep.content" :key="index">
						<text 
							class="agreement-section-title" 
							v-if="para.match(/^[一二三四五六七八九十]+、/)"
						>
							{{ para }}
						</text>
						<text 
							class="agreement-paragraph" 
							v-else
						>
							{{ para }}
						</text>
					</template>
				</view>
			</scroll-view>
			
			<!-- 操作按钮 -->
			<view class="agreement-actions">
				<button 
					class="agreement-btn agreement-btn--prev" 
					v-if="currentAgreementStepIndex > 0"
					@tap.stop="prevAgreementStep"
				>
					<text>上一步</text>
				</button>
				<button 
					class="agreement-btn agreement-btn--cancel" 
					v-if="currentAgreementStepIndex === 0"
					@tap.stop="rejectAgreement"
				>
					不同意
				</button>
				<button 
					class="agreement-btn agreement-btn--confirm" 
					@tap.stop="nextAgreementStep"
				>
					{{ currentAgreementStepIndex === agreementSteps.length - 1 ? '同意并继续' : '下一步' }}
				</button>
			</view>
		</view>
		
		<!-- 应用介绍引导弹窗 -->
		<view class="sheet-mask" v-if="showGuide" @tap.stop></view>
		<view class="sheet glass" :class="{ 'sheet--open': showGuide }" v-if="showGuide" @touchmove.stop.prevent>
			<view class="sheet__handle"></view>
			<view class="sheet__header">
				<text class="sheet__title">{{ currentGuideStep.title }}</text>
				<view class="sheet__close" @tap.stop="skipGuide" v-if="currentGuideStepIndex < guideSteps.length - 1">
					<text class="sheet__close-icon">✕</text>
				</view>
			</view>
			
			<!-- 引导内容区域 -->
			<view class="guide-content">
				<!-- 视频播放区域（预留接口） -->
				<view class="guide-video-container" v-if="currentGuideStep.videoPath">
					<!-- #ifdef APP-PLUS -->
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
					<!-- #endif -->
				</view>
				
				<!-- 占位内容（当没有视频时显示） -->
				<view class="guide-placeholder" v-if="!currentGuideStep.videoPath">
					<view class="guide-icon">
						<text class="guide-icon-text">{{ currentGuideStep.icon }}</text>
					</view>
					<text class="guide-description">{{ currentGuideStep.description }}</text>
				</view>
				
				<!-- 步骤指示器 -->
				<view class="guide-indicators">
					<view 
						class="guide-indicator" 
						v-for="(step, index) in guideSteps" 
						:key="index"
						:class="{ 'guide-indicator--active': index === currentGuideStepIndex }"
					></view>
				</view>
			</view>
			
			<!-- 操作按钮 -->
			<view class="guide-actions">
				<button 
					class="guide-btn guide-btn--prev" 
					v-if="currentGuideStepIndex > 0"
					@tap.stop="prevStep"
				>
					<text class="guide-btn-icon">←</text>
					<text>上一步</text>
				</button>
				<button 
					class="guide-btn guide-btn--next" 
					@tap.stop="nextStep"
				>
					<text>{{ currentGuideStepIndex === guideSteps.length - 1 ? '开始使用' : '下一步' }}</text>
					<text class="guide-btn-icon" v-if="currentGuideStepIndex < guideSteps.length - 1">→</text>
				</button>
			</view>
		</view>
		
		<!-- 常规启动页面 -->
		<view class="splash-content" v-if="!showAgreement && !showGuide">
			<!-- 应用名称 - 立即显示 -->
			<view class="splash-title splash-title--active">
				<text class="title-text">TimeManager</text>
				<text class="title-subtitle">时间管理，高效生活</text>
			</view>
			
			<!-- 加载进度 - 立即显示 -->
			<view class="splash-progress splash-progress--active">
				<view class="progress-bar">
					<view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
				</view>
				<text class="progress-text">{{ progressText }}</text>
			</view>
			
			<!-- 加载动画 - 立即显示 -->
			<view class="splash-dots splash-dots--active">
				<view class="dot" v-for="i in 3" :key="i" :style="{ animationDelay: (i - 1) * 0.2 + 's' }"></view>
			</view>
		</view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			progressPercent: 0,
			progressText: '正在启动...',
			preloadStarted: false,
			isFadingOut: false,
			isNewUser: false, // 是否是新用户
			showAgreement: false, // 是否显示用户协议弹窗
			currentAgreementStepIndex: 0, // 当前协议步骤索引
			agreementSteps: [
				{
					title: '用户协议',
					content: [
						'欢迎使用 TimeManager',
						'在使用本应用前，请您仔细阅读并充分理解以下用户协议。使用本应用即表示您同意遵守以下条款。',
						'一、服务条款',
						'1. 本应用提供时间管理相关功能，包括但不限于番茄钟、习惯养成、任务管理等服务。',
						'2. 您在使用本应用时，应当遵守相关法律法规，不得利用本应用从事违法违规活动。',
						'3. 我们保留随时修改或中断服务的权利，无需对您或任何第三方负责。',
						'二、用户责任',
						'1. 您应当妥善保管账户信息，对账户下的所有行为负责。',
						'2. 您不得利用本应用进行任何可能损害他人权益或违反法律法规的行为。',
						'三、免责声明',
						'1. 本应用提供的服务"按现状"提供，我们不保证服务的及时性、准确性、完整性。',
						'2. 因使用或无法使用本应用而产生的任何损失，我们不承担责任。',
						'四、协议修改',
						'我们有权随时修改本协议，修改后的协议将在应用内公布。继续使用本应用即视为接受修改后的协议。'
					]
				},
				{
					title: '隐私政策',
					content: [
						'隐私政策',
						'我们重视您的隐私保护，请您仔细阅读以下隐私政策。',
						'一、数据收集',
						'1. 我们重视您的隐私保护，您的个人数据将仅用于提供和改进服务。',
						'2. 本应用会在本地存储您的使用数据（如习惯记录、任务数据等），这些数据仅存储在您的设备上。',
						'二、数据使用',
						'1. 您的数据主要用于提供个性化服务，如任务管理、习惯追踪等功能。',
						'2. 我们不会收集您的个人身份信息，如姓名、手机号、邮箱等。',
						'三、数据分享',
						'1. 未经您同意，我们不会向第三方分享您的个人信息。',
						'2. 您的所有数据都存储在本地设备上，不会上传到服务器。',
						'四、数据安全',
						'1. 我们采用本地存储方式，确保您的数据安全。',
						'2. 您可以随时通过应用内的数据备份功能导出您的数据。',
						'五、隐私政策修改',
						'我们有权随时修改本隐私政策，修改后的政策将在应用内公布。继续使用本应用即视为接受修改后的隐私政策。',
						'如果您不同意以上条款，请退出应用。点击"同意并继续"即表示您已阅读、理解并同意遵守本隐私政策。'
					]
				}
			],
			showGuide: false, // 是否显示应用介绍引导
			currentGuideStepIndex: 0, // 当前引导步骤索引
			guideSteps: [
				{
					title: '欢迎使用 TimeManager',
					icon: '⏱',
					description: '一款专注于时间管理的应用，帮助您高效管理每一天',
					videoPath: '' // 预留：'/static/guide/step1.mp4'
				},
				{
					title: '今日任务',
					icon: '📋',
					description: '创建和管理您的每日任务，设置截止时间，让工作更有条理',
					videoPath: '' // 预留：'/static/guide/step2.mp4'
				},
				{
					title: '番茄钟',
					icon: '🍅',
					description: '使用番茄工作法，专注工作25分钟，休息5分钟，提高工作效率',
					videoPath: '' // 预留：'/static/guide/step3.mp4'
				},
				{
					title: '习惯养成',
					icon: '🌱',
					description: '记录每日习惯，坚持打卡，养成好习惯，成就更好的自己',
					videoPath: '' // 预留：'/static/guide/step4.mp4'
				},
				{
					title: '感谢选择',
					icon: '✨',
					description: '感谢您选择 TimeManager，让我们一起开启高效的时间管理之旅！',
					videoPath: '' // 预留：'/static/guide/step5.mp4'
				}
			]
		};
	},
	computed: {
		/**
		 * 获取当前协议步骤
		 */
		currentAgreementStep() {
			return this.agreementSteps[this.currentAgreementStepIndex] || {};
		},
		/**
		 * 获取当前引导步骤
		 */
		currentGuideStep() {
			return this.guideSteps[this.currentGuideStepIndex] || {};
		}
	},
	onLoad() {
		// 检测是否是新用户
		this.checkIsNewUser();
		
		// 立即关闭原生启动屏（如果还在显示）
		// #ifdef APP-PLUS
		try {
			if (typeof plus !== 'undefined' && plus.navigator) {
				// 延迟关闭，确保启动页面已经渲染
				setTimeout(() => {
					plus.navigator.closeSplashscreen();
				}, 100);
			}
		} catch (e) {
			console.warn('关闭原生启动屏失败', e);
		}
		// #endif
		
		// 启动页只负责预加载，协议和引导在主页显示
		this.startPreload();
	},
	methods: {
		/**
		 * 检测是否是新用户
		 */
		checkIsNewUser() {
			// 开发模式：每次进入都视为新用户
			this.isNewUser = true;
			console.log('开发模式：每次进入都视为新用户');
			
			// 如果需要恢复正常检测，取消下面的注释，并注释掉上面的代码
			// try {
			// 	// 检查存储中是否有用户协议同意标记
			// 	const hasAgreed = uni.getStorageSync('hasAgreedUserAgreement');
			// 	this.isNewUser = !hasAgreed;
			// 	console.log('是否是新用户:', this.isNewUser);
			// } catch (e) {
			// 	console.warn('检测新用户状态失败', e);
			// 	// 如果检测失败，默认认为是新用户
			// 	this.isNewUser = true;
			// }
		},
		
		/**
		 * 上一步（协议步骤）
		 */
		prevAgreementStep() {
			if (this.currentAgreementStepIndex > 0) {
				this.currentAgreementStepIndex--;
			}
		},
		
		/**
		 * 下一步（协议步骤）
		 */
		nextAgreementStep() {
			if (this.currentAgreementStepIndex < this.agreementSteps.length - 1) {
				this.currentAgreementStepIndex++;
			} else {
				// 最后一步，完成协议同意
				this.acceptAgreement();
			}
		},
		
		/**
		 * 同意用户协议和隐私政策
		 */
		acceptAgreement() {
			try {
				// 保存用户协议同意状态
				uni.setStorageSync('hasAgreedUserAgreement', true);
				console.log('用户已同意协议和隐私政策');
			} catch (e) {
				console.warn('保存协议状态失败', e);
			}
			
			// 隐藏协议弹窗
			this.showAgreement = false;
			
			// 如果是新用户，显示应用介绍引导
			if (this.isNewUser) {
				// 检查是否已经完成过引导
				const hasCompletedGuide = uni.getStorageSync('hasCompletedGuide');
				if (!hasCompletedGuide) {
					this.showGuide = true;
					this.currentGuideStepIndex = 0;
				} else {
					// 已经完成过引导，直接开始预加载
					this.startPreload();
				}
			} else {
				// 老用户直接开始预加载
				this.startPreload();
			}
		},
		
		/**
		 * 拒绝用户协议，退出应用
		 */
		rejectAgreement() {
			uni.showModal({
				title: '提示',
				content: '您需要同意用户协议才能使用本应用。确定要退出吗？',
				confirmText: '退出',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						// 退出应用
						// #ifdef APP-PLUS
						try {
							if (typeof plus !== 'undefined') {
								plus.runtime.quit();
							} else {
								// 如果无法退出，至少关闭当前页面
								uni.navigateBack({
									delta: 999
								});
							}
						} catch (e) {
							console.warn('退出应用失败', e);
							// 备用方案：关闭所有页面
							uni.reLaunch({
								url: '/pages/index/index'
							});
						}
						// #endif
						
						// #ifndef APP-PLUS
						// H5或其他平台的处理
						uni.showToast({
							title: '请同意用户协议',
							icon: 'none',
							duration: 2000
						});
						// #endif
					}
				}
			});
		},
		
		
		/**
		 * 上一步
		 */
		prevStep() {
			if (this.currentGuideStepIndex > 0) {
				this.currentGuideStepIndex--;
			}
		},
		
		/**
		 * 下一步
		 */
		nextStep() {
			if (this.currentGuideStepIndex < this.guideSteps.length - 1) {
				this.currentGuideStepIndex++;
			} else {
				// 最后一步，完成引导
				this.completeGuide();
			}
		},
		
		/**
		 * 完成引导
		 */
		completeGuide() {
			// 保存完成标记
			try {
				uni.setStorageSync('hasCompletedGuide', true);
				console.log('引导已完成');
			} catch (e) {
				console.warn('保存引导状态失败', e);
			}
			
			// 隐藏引导弹窗
			this.showGuide = false;
			
			// 开始正常的预加载流程
			this.startPreload();
		},
		
		/**
		 * 跳过引导
		 */
		skipGuide() {
			uni.showModal({
				title: '提示',
				content: '确定要跳过应用介绍吗？',
				confirmText: '跳过',
				cancelText: '继续',
				success: (res) => {
					if (res.confirm) {
						this.completeGuide();
					}
				}
			});
		},
		
		/**
		 * 引导视频播放完成
		 */
		onGuideVideoEnded() {
			console.log('引导视频播放完成');
			// 视频播放完成后，可以自动进入下一步（可选）
			// this.nextStep();
		},
		
		/**
		 * 引导视频播放错误
		 */
		onGuideVideoError(e) {
			console.warn('引导视频播放失败', e);
			// 播放失败时，继续显示占位内容
		},
		
		startPreload() {
			if (this.preloadStarted) return;
			this.preloadStarted = true;
			
			// 获取 app 实例
			let app = null;
			try {
				app = getApp();
			} catch (e) {
				console.warn('获取 app 实例失败', e);
			}
			
			// 立即更新进度
			this.updateProgress(10, '初始化应用...');
			
			// 快速更新进度，让用户感觉应用在快速加载
			setTimeout(() => {
				this.updateProgress(30, '加载页面资源...');
			}, 100);
			
			setTimeout(() => {
				// 尝试调用预加载方法
				let preloadCalled = false;
				if (app && typeof app.preloadAllPages === 'function') {
					try {
						this.updateProgress(50, '预加载页面中...');
						app.preloadAllPages();
						preloadCalled = true;
					} catch (e) {
						console.warn('调用预加载方法失败', e);
					}
				}
				
				// 继续快速更新进度
				setTimeout(() => {
					this.updateProgress(preloadCalled ? 70 : 60, '准备就绪...');
				}, 400);
				
				setTimeout(() => {
					this.updateProgress(preloadCalled ? 90 : 80, '即将完成...');
				}, 700);
				
				// 确保至少显示1.5秒的启动画面
				const minDisplayTime = 1500;
				const startTime = Date.now();
				
				setTimeout(() => {
					const elapsed = Date.now() - startTime;
					const remaining = Math.max(0, minDisplayTime - elapsed);
					
					setTimeout(() => {
						this.updateProgress(100, '完成！');
						// 短暂延迟后跳转
						setTimeout(() => {
							this.navigateToHome();
						}, 200);
					}, remaining);
				}, 1000);
			}, 200);
		},
		
		updateProgress(percent, text) {
			this.progressPercent = percent;
			this.progressText = text;
		},
		
		navigateToHome() {
			// 先预加载主页，确保它已经准备好
			// 使用 requestAnimationFrame 确保在下一帧执行
			requestAnimationFrame(() => {
				// 先跳转，但不显示（在后台准备）
				uni.switchTab({
					url: '/pages/index/index',
					success: () => {
						console.log('✓ 已切换到主页，等待渲染完成');
						
						// 等待主页渲染完成
						this.$nextTick(() => {
							// 使用多个 requestAnimationFrame 确保主页完全渲染
							requestAnimationFrame(() => {
								requestAnimationFrame(() => {
									// 确保主页已经准备好
									const currentPages = getCurrentPages();
									const homePage = currentPages[currentPages.length - 1];
									
									if (homePage && homePage.$vm) {
										// 确保主页立即显示内容
										homePage.$vm.pageLoaded = true;
										
										// 再等待一帧，确保 DOM 更新完成
										requestAnimationFrame(() => {
											// 现在触发启动页淡出
											this.isFadingOut = true;
											
											// 淡出完成后，启动页会被隐藏
											setTimeout(() => {
												console.log('✓ 启动完成，主页已显示');
											}, 400);
										});
									} else {
										// 如果主页还没准备好，等待一下再淡出
										setTimeout(() => {
											this.isFadingOut = true;
										}, 200);
									}
								});
							});
						});
					},
					fail: (err) => {
						console.warn('跳转失败，尝试使用 navigateTo', err);
						// 如果 switchTab 失败，尝试使用 navigateTo
						uni.navigateTo({
							url: '/pages/index/index',
							success: () => {
								setTimeout(() => {
									this.isFadingOut = true;
								}, 100);
							},
							fail: () => {
								console.error('导航失败');
								this.isFadingOut = true;
							}
						});
					}
				});
			});
		}
	}
};
</script>

<style scoped>
.splash-page {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	width: 100%;
	height: 100vh;
	background: linear-gradient(160deg, #0f1b2b 0%, #1b2d45 55%, #18323e 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	opacity: 1;
	transition: opacity 0.4s ease;
	pointer-events: auto;
}

.splash-page--fadeout {
	opacity: 0;
	pointer-events: none;
	visibility: hidden;
	transition: opacity 0.4s ease, visibility 0.4s ease;
}

.splash-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 60rpx;
	width: 100%;
	padding: 0 80rpx;
}

/* 标题区域 */
.splash-title {
	opacity: 1;
	transform: translateY(0);
	/* 移除过渡，立即显示 */
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
}

.title-text {
	font-size: 56rpx;
	font-weight: 700;
	color: #ffffff;
	letter-spacing: 8rpx;
	text-shadow: 0 4rpx 20rpx rgba(110,203,255,0.5);
}

.title-subtitle {
	font-size: 28rpx;
	color: rgba(255,255,255,0.7);
	letter-spacing: 4rpx;
}

/* 进度条区域 */
.splash-progress {
	opacity: 1;
	transform: translateY(0);
	/* 移除过渡，立即显示 */
	width: 100%;
	max-width: 500rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 20rpx;
}

.progress-bar {
	width: 100%;
	height: 8rpx;
	background: rgba(255,255,255,0.1);
	border-radius: 4rpx;
	overflow: hidden;
	position: relative;
}

.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, rgba(110,203,255,0.9), rgba(200,155,255,0.9));
	border-radius: 4rpx;
	transition: width 0.3s ease;
	box-shadow: 0 0 20rpx rgba(110,203,255,0.6);
}

.progress-text {
	font-size: 24rpx;
	color: rgba(255,255,255,0.6);
	letter-spacing: 2rpx;
}

/* 加载动画点 */
.splash-dots {
	opacity: 1;
	/* 移除过渡，立即显示 */
	display: flex;
	gap: 16rpx;
	align-items: center;
	justify-content: center;
}

.splash-dots .dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: rgba(255,255,255,0.5);
	animation: dot-bounce 1.4s ease-in-out infinite;
}

@keyframes dot-bounce {
	0%, 80%, 100% {
		transform: scale(0.8);
		opacity: 0.5;
	}
	40% {
		transform: scale(1.2);
		opacity: 1;
	}
}

/* 用户协议弹窗样式（使用sheet样式） */
.agreement-content {
	flex: 1;
	max-height: calc(85vh - 200rpx);
	padding: 30rpx 40rpx;
	overflow-y: auto;
}

.agreement-text {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.agreement-section-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #6ecbff;
	margin-top: 32rpx;
	margin-bottom: 16rpx;
	display: block;
}

.agreement-section-title:first-child {
	margin-top: 0;
}

.agreement-paragraph {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.8);
	line-height: 1.8;
	display: block;
	text-align: justify;
	margin-bottom: 16rpx;
}

.agreement-actions {
	display: flex;
	gap: 20rpx;
	padding: 30rpx 40rpx 40rpx;
	border-top: 1rpx solid rgba(255, 255, 255, 0.1);
}

.agreement-btn {
	flex: 1;
	height: 88rpx;
	line-height: 88rpx;
	border-radius: 24rpx;
	font-size: 30rpx;
	font-weight: 600;
	border: none;
	transition: all 0.3s ease;
}

.agreement-btn::after {
	border: none;
}

.agreement-btn--cancel {
	background: rgba(255, 255, 255, 0.1);
	color: rgba(255, 255, 255, 0.8);
	border: 1rpx solid rgba(255, 255, 255, 0.2);
}

.agreement-btn--cancel:active {
	background: rgba(255, 255, 255, 0.15);
	transform: scale(0.98);
}

.agreement-btn--confirm {
	background: linear-gradient(135deg, rgba(110,203,255,0.9), rgba(200,155,255,0.9));
	color: #0f1b2b;
	box-shadow: 0 8rpx 24rpx rgba(110,203,255,0.3);
}

.agreement-btn--confirm:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 12rpx rgba(110,203,255,0.3);
}

.agreement-btn--prev {
	background: rgba(255,255,255,0.1);
	color: rgba(255,255,255,0.8);
	border: 1rpx solid rgba(255,255,255,0.2);
}

.agreement-btn--prev:active {
	background: rgba(255,255,255,0.15);
	transform: scale(0.98);
}

/* 应用介绍引导弹窗样式 */
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
	max-height: 85vh;
	overflow-y: auto;
	transition: transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease;
	transform: translateY(120%);
	pointer-events: none;
	opacity: 0;
}

.sheet.glass {
	background: rgba(18, 30, 45, 0.95);
	box-shadow: 0 26rpx 70rpx rgba(9, 20, 35, 0.55),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.1);
}

.sheet--open {
	transform: translateY(0);
	pointer-events: auto;
	opacity: 1;
}

.sheet__handle {
	width: 80rpx;
	height: 8rpx;
	background: rgba(255,255,255,0.3);
	border-radius: 4rpx;
	margin: 0 auto 32rpx;
}

.sheet__header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 40rpx;
}

.sheet__title {
	font-size: 36rpx;
	font-weight: 600;
	color: #ffffff;
}

.sheet__close {
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: rgba(255,255,255,0.1);
}

.sheet__close:active {
	background: rgba(255,255,255,0.2);
}

.sheet__close-icon {
	font-size: 32rpx;
	color: rgba(255,255,255,0.8);
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

/* 响应式优化 */
@media (prefers-reduced-motion: reduce) {
	.splash-title,
	.splash-progress,
	.splash-dots {
		animation: none !important;
		transition-duration: 0.01ms !important;
	}
}
</style>

