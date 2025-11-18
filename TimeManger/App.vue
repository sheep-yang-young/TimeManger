<script>
	export default {
		globalData: {
			preloadStarted: false
		},
		onLaunch: function() {
			console.log('App Launch')
			// 预加载逻辑已移至启动页面，这里不再执行
			// 启动页面会在显示时自动开始预加载
			// 将预加载方法暴露到 app 实例上，方便外部调用
			const app = this
			// 延迟绑定，确保 methods 已初始化
			this.$nextTick(() => {
				if (this.preloadAllPages) {
					app.preloadAllPages = this.preloadAllPages.bind(app)
					console.log('✓ 预加载方法已暴露到 app 实例')
				}
			})
		},
		onShow: function() {
			console.log('App Show')
		},
		onHide: function() {
			console.log('App Hide')
			// 在应用进入后台时，确保番茄钟状态已保存
			// 这个钩子会在应用切换到后台时触发
		},
		methods: {
			/**
			 * 预加载所有页面
			 * 在应用启动时预加载所有页面，提升页面切换性能
			 */
			preloadAllPages() {
				// 需要预加载的页面列表
				const tabBarPages = [
					'pages/calendar/index',   // 日历 (tabBar)
					'pages/pomodoro/index',   // 番茄钟 (tabBar)
					'pages/habit/index'       // 习惯 (tabBar)
				]
				
				const normalPages = [
					// 没有普通页面需要预加载
				]
				
				console.log('开始预加载页面...')
				
				// 检查 uni.preloadPage 是否可用（App 和 H5 平台支持）
				if (typeof uni !== 'undefined' && typeof uni.preloadPage === 'function') {
					// 使用官方 API 预加载，延迟执行避免影响启动体验
					const allPages = [...tabBarPages, ...normalPages]
					// 延迟预加载，等待首页渲染完成后再开始
					setTimeout(() => {
						allPages.forEach((page, index) => {
							setTimeout(() => {
								try {
									uni.preloadPage({
										url: `/${page}`,
										success: () => {
											console.log(`✓ 页面预加载成功: ${page}`)
										},
										fail: (err) => {
											console.warn(`✗ 页面预加载失败: ${page}`, err)
										}
									})
								} catch (error) {
									console.warn(`预加载页面异常: ${page}`, error)
								}
							}, index * 200) // 增加间隔时间，避免同时加载
						})
					}, 1000) // 延迟1秒，确保首页完全渲染后再预加载
				} else {
					// HarmonyOS 等平台不支持 preloadPage
					// 不再使用导航方式预加载，避免屏幕闪烁
					// 应使用 pages.json 中的 preloadRule 配置进行预加载
					console.log('当前平台不支持 uni.preloadPage')
					console.log('HarmonyOS 平台请使用 pages.json 中的 preloadRule 配置进行预加载')
					console.log('已禁用导航方式预加载，避免屏幕闪烁')
				}
			},
			
			/**
			 * 通过静默导航预加载页面（适用于不支持 preloadPage 的平台）
			 * 注意：此方法会导致页面切换闪烁，已禁用
			 * HarmonyOS 平台应使用 pages.json 中的 preloadRule 配置
			 * @param {Array} tabBarPages - tabBar 页面列表
			 * @param {Array} normalPages - 普通页面列表
			 */
			preloadPagesByNavigation(tabBarPages, normalPages) {
				// 禁用导航方式的预加载，避免屏幕闪烁
				// HarmonyOS 平台应使用 pages.json 中的 preloadRule 配置进行预加载
				console.log('已禁用导航方式预加载，避免屏幕闪烁。请使用 pages.json 中的 preloadRule 配置')
				return
				
				// 以下代码已禁用，保留作为参考
				/*
				const startPreload = () => {
					let currentIndex = 0
					const preloadNext = () => {
						if (currentIndex < tabBarPages.length) {
							const page = tabBarPages[currentIndex]
							this.preloadTabBarPage(page, () => {
								currentIndex++
								setTimeout(() => {
									preloadNext()
								}, 200)
							})
						} else {
							if (normalPages.length > 0) {
								let normalIndex = 0
								const preloadNormalNext = () => {
									if (normalIndex < normalPages.length) {
										const page = normalPages[normalIndex]
										this.preloadNormalPage(page, () => {
											normalIndex++
											setTimeout(() => {
												preloadNormalNext()
											}, 200)
										})
									} else {
										console.log('✓ 所有页面预加载完成')
									}
								}
								preloadNormalNext()
							} else {
								console.log('✓ 所有页面预加载完成')
							}
						}
					}
					preloadNext()
				}
				
				if (typeof requestAnimationFrame !== 'undefined') {
					requestAnimationFrame(() => {
						setTimeout(startPreload, 100)
					})
				} else {
					setTimeout(startPreload, 100)
				}
				*/
			},
			
			/**
			 * 预加载 tabBar 页面
			 */
			preloadTabBarPage(pagePath, callback) {
				try {
					// 获取当前页面栈
					const pages = getCurrentPages()
					const currentPage = pages[pages.length - 1]
					const currentRoute = currentPage ? currentPage.route : ''
					
					// 如果已经在目标页面，跳过
					if (currentRoute === pagePath) {
						console.log(`✓ TabBar页面已在当前页面: ${pagePath}`)
						callback && callback()
						return
					}
					
					console.log(`开始预加载 TabBar 页面: ${pagePath}`)
					
					// 静默切换到目标页面
					uni.switchTab({
						url: `/${pagePath}`,
						success: () => {
							console.log(`✓ TabBar页面导航成功: ${pagePath}`)
							// 等待页面加载完成后再返回首页
							setTimeout(() => {
								// 检查页面是否已加载
								const currentPages = getCurrentPages()
								const targetPage = currentPages[currentPages.length - 1]
								if (targetPage && targetPage.$vm) {
									console.log(`✓ TabBar页面实例已创建: ${pagePath}`)
								}
								
								// 切换回首页
								uni.switchTab({
									url: '/pages/index/index',
									success: () => {
										console.log(`✓ TabBar页面预加载完成: ${pagePath}`)
										callback && callback()
									},
									fail: (err) => {
										console.warn(`✗ 返回首页失败: ${pagePath}`, err)
										callback && callback()
									}
								})
							}, 300) // 增加等待时间，确保页面完全加载
						},
						fail: (err) => {
							console.warn(`✗ TabBar页面预加载失败: ${pagePath}`, err)
							callback && callback()
						}
					})
				} catch (error) {
					console.warn(`预加载TabBar页面异常: ${pagePath}`, error)
					callback && callback()
				}
			},
			
			/**
			 * 预加载普通页面
			 * 注意：在 HarmonyOS 平台上，navigateBack 可能会销毁页面
			 * 这里我们仍然尝试预加载，但实际效果可能有限
			 */
			preloadNormalPage(pagePath, callback) {
				try {
					// 检查页面是否已经在页面栈中
					const pages = getCurrentPages()
					const existingPage = pages.find(page => {
						const route = page.route || ''
						const pageName = pagePath.split('/').pop()
						return route === pagePath || route.endsWith(pageName)
					})
					
					if (existingPage) {
						console.log(`✓ 普通页面已在页面栈中: ${pagePath}`)
						callback && callback()
						return
					}
					
					console.log(`开始预加载普通页面: ${pagePath}`)
					
					// 静默导航到目标页面
					uni.navigateTo({
						url: `/${pagePath}`,
						success: () => {
							console.log(`✓ 普通页面导航成功: ${pagePath}`)
							
							// 等待页面完全加载（包括 onLoad 执行完成）
							setTimeout(() => {
								const currentPages = getCurrentPages()
								const targetPage = currentPages[currentPages.length - 1]
								
								if (targetPage) {
									console.log(`✓ 页面实例已创建: ${pagePath}`)
									
									// 检查页面是否已经加载完成
									if (targetPage.$vm) {
										console.log(`✓ 页面 Vue 实例已创建: ${pagePath}`)
										if (targetPage.$vm.pageLoaded) {
											console.log(`✓ 页面加载状态确认: ${pagePath}`)
										}
									}
								}
								
								// 等待更长时间确保页面渲染完成
								setTimeout(() => {
									// 返回首页（页面可能被保留在内存中）
									uni.navigateBack({
										delta: 1,
										success: () => {
											console.log(`✓ 普通页面预加载完成: ${pagePath}`)
											callback && callback()
										},
										fail: (err) => {
											console.warn(`✗ 返回首页失败: ${pagePath}`, err)
											callback && callback()
										}
									})
								}, 200) // 额外等待时间
							}, 500) // 等待页面加载和渲染完成
						},
						fail: (err) => {
							console.warn(`✗ 普通页面预加载失败: ${pagePath}`, err)
							callback && callback()
						}
					})
				} catch (error) {
					console.warn(`预加载普通页面异常: ${pagePath}`, error)
					callback && callback()
				}
			}
		}
	}
</script>

<style>
	/*每个页面公共css */
</style>
