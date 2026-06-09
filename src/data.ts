import { CrowdfundingItem, NewsItem, StartupItem } from './types';

export const CROWDFUNDING_DATA: CrowdfundingItem[] = [
  {
    id: 1,
    platform: 'Indiegogo',
    image: 'https://picsum.photos/seed/pocket4/600/400',
    name: 'Snapmaker Artisan 3-in-1',
    name_zh: 'Snapmaker Artisan • 三合一桌面工厂',
    founder: 'Snapmaker Tech',
    location: '中国深圳',
    raised: 4200000,
    currency: 'JPY',
    currencySymbol: '¥',
    progress_pct: 420,
    backers: 3120,
    price: '¥2999',
    campaign_url: 'https://www.kickstarter.com/projects/snapmaker/snapmaker-20-modular-3-in-1-3d-printers',
    category_tag_zh: '#3D打印',
    summary_zh: [
      '配备革命性模块化插拔核心，可在3D打印、雷雕剪裁与CNC打孔间秒级热切换。',
      '全新设计高刚性全金属龙门架构，搭配工业级高精度直线导轨与坚固闭环热床。',
      '预载智能校准传感器组，支持全自动高密度床面网格调准与首层精度深度补偿。'
    ]
  },
  {
    id: 2,
    platform: 'Kickstarter',
    image: 'https://picsum.photos/seed/rabbit1/600/400',
    name: 'rabbit r1 Pocket Assistant',
    name_zh: 'rabbit r1 • AI 口袋智能助手',
    founder: 'Rabbit Inc.',
    location: '洛杉矶, 美国',
    raised: 2354100,
    currency: 'USD',
    currencySymbol: '$',
    progress_pct: 1250,
    backers: 11200,
    price: '$199',
    campaign_url: 'https://www.rabbit.tech/',
    category_tag_zh: '#人工智能',
    summary_zh: [
      '搭载独家 LAM 动作基底算法结构，支持自然语言跨应用代操作多项复杂指令。',
      '大师联合设计亮橙流线外壳，配备多方向滚轴、独立对话物理按键及旋转镜头。',
      '支持高密云端极速计算反馈，全面打通打车餐饮娱乐等第三方API服务底层。'
    ]
  },
  {
    id: 3,
    platform: 'Makuake',
    image: 'https://picsum.photos/seed/moflin/600/400',
    name: 'Moflin Robot Companion',
    name_zh: 'Moflin • 情感抚慰仿生宠物',
    founder: 'Vanguard Industry',
    location: '东京, 日本',
    raised: 64500000,
    currency: 'JPY',
    currencySymbol: '¥',
    progress_pct: 820,
    backers: 1540,
    price: '¥48,000',
    campaign_url: 'https://www.kickstarter.com/projects/moflin/moflin-an-ai-pet-penguin-with-emotional-capabilities',
    category_tag_zh: '#智能陪伴',
    summary_zh: [
      '集成高级情绪感知模型，通过环境声音度、触感振荡深度自适应迭代进化性格。',
      '模拟极具疗愈感的呜呜叫哼与娇羞微小颤动，完美演绎真实小动物温顺情绪。',
      '特配鸟巢形状智能云感化无线充底座，充放电如入睡深睡睡眠状态一般温润。'
    ]
  },
  {
    id: 4,
    platform: 'Crowd Supply',
    image: 'https://picsum.photos/seed/pinephone/600/400',
    name: 'PinePhone Pro Linux Mobile',
    name_zh: 'PinePhone Pro • 极客开源黑客手机',
    founder: 'PINE64 Store',
    location: '俄勒冈, 美国',
    raised: 820000,
    currency: 'USD',
    currencySymbol: '$',
    progress_pct: 320,
    backers: 2450,
    price: '$399',
    campaign_url: 'https://www.pine64.org/pinephone-pro/',
    category_tag_zh: '#开源极客',
    summary_zh: [
      '完全自主掌握的开源Linux软硬架构设计，预留原生极客探针调试接口。',
      '背板设有多路物理拨码开关，一键物理切断摄像头、扬声器、移动基带供电。',
      '全面支持运行纯净 Arch Linux ARM / Mobian / Postmarket 应用开发系统。'
    ]
  },
  {
    id: 5,
    platform: 'Kickstarter',
    image: 'https://picsum.photos/seed/focals/600/400',
    name: 'Vue Smart Glasses',
    name_zh: 'Vue • 极简日常骨传导智能眼镜',
    founder: 'Vue Devices Co.',
    location: '旧金山, 美国',
    raised: 1540000,
    currency: 'USD',
    currencySymbol: '$',
    progress_pct: 610,
    backers: 4500,
    price: '$299',
    campaign_url: 'https://www.kickstarter.com/projects/vue/vue-your-everyday-smart-glasses',
    category_tag_zh: '#AR眼镜',
    summary_zh: [
      '首创超小型骨传导声音传输模块，无需塞耳即可实现私人高清音频信息流回放。',
      '通过蓝牙搭配精密侧边手势镜腿，轻轻一划就能接听电话、唤醒智能助理。',
      '原厂支持轻度数日常处方镜片快速定制，长效数天续航陪伴，融入普通生活。'
    ]
  },
  {
    id: 6,
    platform: 'Indiegogo',
    image: 'https://picsum.photos/seed/superbook/600/400',
    name: 'The Superbook: Turn Phone Into Laptop',
    name_zh: 'The Superbook • 智能手机变身轻翼笔电',
    founder: 'Sentio Group',
    location: '旧金山, 美国',
    raised: 2800000,
    currency: 'USD',
    currencySymbol: '$',
    progress_pct: 1400,
    backers: 18000,
    price: '$129',
    campaign_url: 'https://www.kickstarter.com/projects/sentio/the-superbook-turn-your-smartphone-into-a-laptop',
    category_tag_zh: '#数码外设',
    summary_zh: [
      '革命性智能拓展终端架构，依靠连线多平台系统即刻享有全键盘与触控大屏。',
      '集成高容量复合电芯，兼顾充沛续航之余还可反向输送为手机回满电力。',
      '自研云端自适应全屏化扩展 UI 框架，满足极速编写代码、码字或观看电影。'
    ]
  },
  {
    id: 7,
    platform: 'Makuake',
    image: 'https://picsum.photos/seed/aladdin/600/400',
    name: 'Sengoku Aladdin Portable Boiler',
    name_zh: '千石阿拉丁 • 便携智能电炉',
    founder: 'Aladdin Co., Ltd.',
    location: '兵库县, 日本',
    raised: 35000000,
    currency: 'JPY',
    currencySymbol: '¥',
    progress_pct: 700,
    backers: 2100,
    price: '¥22,000',
    campaign_url: 'https://www.makuake.com/project/sengoku-aladdin/',
    category_tag_zh: '#户外美学',
    summary_zh: [
      '经典怀旧复古防风炉风貌，完美将电气传导热量加热与安全防爆智能回路整合。',
      '内嵌气阀气流、重力倾斜异常全自动极速断电监测，极大增强室内与野营保障。',
      '极简流线型收折式握柄，轻量化铝合金框架，轻松放进双肩包说走就走。'
    ]
  },
  {
    id: 8,
    platform: 'Crowd Supply',
    image: 'https://picsum.photos/seed/anavit/600/400',
    name: 'Precursor: Mobile Hardware Platform',
    name_zh: 'Precursor • 指掌开源黑客主板外设',
    founder: 'Sutajio Kosagi',
    location: '旧金山, 美国',
    raised: 450000,
    currency: 'USD',
    currencySymbol: '$',
    progress_pct: 220,
    backers: 1600,
    price: '$349',
    campaign_url: 'https://www.crowdsupply.com/sutajio-kosagi/precursor',
    category_tag_zh: '#开源极客',
    summary_zh: [
      '专门面向高安全性信息流通及硬件黑客调试研发，搭载实体晶圆触探引脚。',
      '内置FPGA可重塑安全物理内核，从软件指令层彻底绝源常规逻辑固件劫持。',
      '配备单色高精省墨水显示屏幕和全实体物理按键，打造完全自主控制数字终端。'
    ]
  }
];

export const NEWS_DATA: NewsItem[] = [
  {
    id: 1,
    source: 'The Verge',
    image: 'https://picsum.photos/seed/applear/600/400',
    title: 'Apple Unveils Vision SE Lightweight AR Headset to Compete with Normal Glasses',
    title_zh: '苹果发布轻量化 Vision SE 眼镜，正面阻击日常偏光AR眼罩',
    publishedAt: new Date(Date.now() - 2*3600000).toISOString(),
    snippet: 'Apple surprised developers today by dropping Vision SE, a lightweight version of its spatial computing headsets designed with standard style lens.',
    snippet_zh: [
      '相比前代暴减70%物理重量，镜片和普通眼镜相差无几，大幅缩窄前屏幕黑影。',
      '搭载低发热高性能 R2 协处理单元，实现全天候超低延迟全眼部光流指向捕捉。',
      '支持无缝跨主机虚拟大屏幕协同，在数码潮玩、在线会议与极客调试间自由切换。'
    ],
    url: 'https://www.theverge.com',
    category_tag_zh: 'AR/VR眼镜'
  },
  {
    id: 2,
    source: 'TechCrunch',
    image: 'https://picsum.photos/seed/openaigrid/600/400',
    title: 'OpenAI Launches Operator Agent for Autonomous Handheld Hardware Control',
    title_zh: 'OpenAI 揭晓多源算力代理体系，接管手持 AI 智能微端',
    publishedAt: new Date(Date.now() - 5*3600000).toISOString(),
    snippet: 'OpenAI officially entered the robotic application race by announcing its Operator agent capable of controlling system inputs directly with natural languages.',
    snippet_zh: [
      '支持用户输入极低复杂指令，自动进行意图分解并执行长时间任务调用。',
      '深度适配多款新出厂智能终端芯片，免除高时延云端传输，响应极其丝滑。',
      '预留强逻辑安全审计控制锁条，一旦发现潜在侵害风险，瞬间静默脱网安全停摆。'
    ],
    url: 'https://techcrunch.com',
    category_tag_zh: 'AI硬件'
  },
  {
    id: 3,
    source: 'Gizchina',
    image: 'https://picsum.photos/seed/gpdduo/600/400',
    title: 'GPD Duo OLED Dual-Screen laptop is a modular beast for cyber geeks',
    title_zh: 'GPD Duo 双面 OLED 笔记本成极客新宠，主打便携堆叠生产力',
    publishedAt: new Date(Date.now() - 12*3600000).toISOString(),
    snippet: 'The newly launched portable dual display computer from GPD delivers true productivity with double stacked OLED and desktop level connections.',
    snippet_zh: [
      '上下双置折叠 OLED 超极炫彩高刷新屏幕，能够合并全屏或多开任务副屏工作。',
      '整机内部集成完整拓展接口套件，配备多功能 KVM 系统和精密物理机械触轴。',
      '轻约 1.3kg 易于塞入常备工具包中，是运维人员和独立黑客的随访得力助手。'
    ],
    url: 'https://www.gizchina.com',
    category_tag_zh: '便携生产力'
  },
  {
    id: 4,
    source: 'Ventureburn',
    image: 'https://picsum.photos/seed/iotpower/600/400',
    title: 'Cape Town Hardware startup power-up IoT nodes using wireless solar rays',
    title_zh: '开普敦创企推出长续航物联网微芯片，搭载微光太阳能能捕获结构',
    publishedAt: new Date(Date.now() - 18*3600000).toISOString(),
    snippet: 'Africa hardware innovation rises as Cape Town based teams design ambient light energy harvesting systems for global smart homes.',
    snippet_zh: [
      '内置纳米级高效光伏贴片感应网，依靠常态环境反射灯光即可完成稳定储能。',
      '采用低压漏电精省指令总线设计，极大拓宽各种温湿度探针传感器长效待命。',
      '通过蓝牙最新免配对免连线网状协议，自动融入家居中枢极速上报安全状态。'
    ],
    url: 'https://ventureburn.com',
    category_tag_zh: '极客硬件'
  },
  {
    id: 5,
    source: 'The Verge',
    image: 'https://picsum.photos/seed/logikey/600/400',
    title: 'Logitech Unveils MX Ergo Master: A Modular Trackball for Dynamic Splitting',
    title_zh: '罗技发布 MX Ergo Master：支持人体工学机械分裂设计的轨迹球鼠标',
    publishedAt: new Date(Date.now() - 24*3600000).toISOString(),
    snippet: 'Logitech’s latest mechanical keyboard paired with MX trackball splits apart seamlessly to match absolute alignment comfort.',
    snippet_zh: [
      '左右底盘模块通过高密磁吸扣快速分离，中间支持加装自定义快捷旋钮。',
      '精密光学轨迹球结合霍尔压感按键设计，实现更舒缓的肩颈操作手部疲劳。',
      '板载高性能快联多路存储芯片，可在手机、平板和主机开发端一键畅联。'
    ],
    url: 'https://www.theverge.com',
    category_tag_zh: '数码外设'
  },
  {
    id: 6,
    source: 'TechCrunch',
    image: 'https://picsum.photos/seed/aihear/600/400',
    title: 'AI Companion Hearables Take Center Stage with On-Device Multi languages Translation',
    title_zh: 'AI 翻译耳机全方位落地：支持完全不连网离线高精度多国同传译',
    publishedAt: new Date(Date.now() - 36*3600000).toISOString(),
    snippet: 'A wave of voice-first startups are shipping audio devices which can translate live speech offline without active cellular data.',
    snippet_zh: [
      '集成本地极精简声学语义模型层，覆盖主流近24种日常会话和工作讨论场景。',
      '自研低噪声高采样数字麦克风阵列，即便处在喧闹集市仍能精准剔除噪声。',
      '支持通过物理磁吸快速共享耳机盒为对讲棒，满足当面轻松流畅自如对话。'
    ],
    url: 'https://techcrunch.com',
    category_tag_zh: 'AI硬件'
  },
  {
    id: 7,
    source: 'Gizchina',
    image: 'https://picsum.photos/seed/heatwatch/600/400',
    title: 'HeatWatch: Solar-Charging Smartwatch Outlasts Any Battery Competitors',
    title_zh: 'HeatWatch 智能运动手表搭载热能充电架构，终结日常充电繁杂',
    publishedAt: new Date(Date.now() - 48*3600000).toISOString(),
    snippet: 'The newly introduced smartwatch runs indefinitely utilizing the temperature difference between human skin and ambient air.',
    snippet_zh: [
      '背壳应用高效半导体温差发电纳米模块，紧贴肌肤源源不断转换生物能。',
      '表面采用光能微传感器，复合全息反射显示屏，可在强光直射下清晰显示。',
      '专为荒野探险野营、远途长跑、海底潜泳定位设计，全程保障多定位寻迹。'
    ],
    url: 'https://www.gizchina.com',
    category_tag_zh: '数码外设'
  },
  {
    id: 8,
    source: 'Ventureburn',
    image: 'https://picsum.photos/seed/soundtech/600/400',
    title: 'Aura Sound Labs ships innovative directional dynamic dome speakers',
    title_zh: 'Aura Sound Labs 成功推出定向穹顶扬声器，构建尊享私人声场圈',
    publishedAt: new Date(Date.now() - 72*3600000).toISOString(),
    snippet: 'South African based sound tech teams are rolling out directional audio shields which keep your sound from bleeding into neighbor ears.',
    snippet_zh: [
      '使用相干声波束物理干涉阵列，成功将清晰悦耳声压束缚在 30 度的狭长区域。',
      '无需佩戴挂耳耳机，仅需置于头枕上方即可畅享如同全息包围的声临其境感。',
      '为未来现代化联合办公隔间、车载多媒体隐私声学独立空间提供优质方案。'
    ],
    url: 'https://ventureburn.com',
    category_tag_zh: '极客硬件'
  }
];

export const STARTUP_DATA: StartupItem[] = [
  {
    id: 1,
    source: 'Y Combinator',
    name: 'Kinergize Technology',
    name_zh: 'Kinergize • 纳米动能发电机芯片',
    intro: 'Next-generation solid state energy harvesting chips that capture ambient kinetic vibratory energy for ultra low-power smart nodes.',
    intro_zh: [
      '自主设计极高转换率的微机电悬臂式传感器，捕获高低频环境震动电荷。',
      '致力于替代未来上百亿节点中的碱性化学纽扣电池，摆脱传统充电维护。',
      '广泛应用在跨大洋集装箱卫星运输跟踪、大体量工业设备温度传感器中。'
    ],
    founders: 'Alex Mercer, Dr. Zhao Wei',
    location: '波士顿, 美国',
    batch: 'W25',
    url: 'https://www.ycombinator.com'
  },
  {
    id: 2,
    source: 'Y Combinator',
    name: 'OctoOptics AI',
    name_zh: 'OctoOptics • 自动硅光互联感知芯片',
    intro: 'Building hyper-miniature co-packaged optical links for consumer camera and smart glasses to bypass conventional heat-intensive wires.',
    intro_zh: [
      '开发出低损耗微型硅光调制组件，将消费类硬件内部传输频宽瞬间放大十倍。',
      '功耗仅占经典高频铜导线的一成左右，彻底根治AR眼镜等贴面终端热发热。',
      '未来可实现数码相机全景无码高清实时回传、无感眼动智能渲染。'
    ],
    founders: 'Emily Rostova, Julian Barnes',
    location: '圣何塞, 美国',
    batch: 'S24',
    url: 'https://www.ycombinator.com'
  },
  {
    id: 3,
    source: 'Y Combinator',
    name: 'Sentient Shell',
    name_zh: 'Sentient Shell • 软体微电机人机交互外设',
    intro: 'Pioneering tactile soft electro-active polymers which warp under low voltages to recreate ultra-realistic virtual textures dynamically.',
    intro_zh: [
      '专利自研快速响应电活性活性凝胶，可在数毫秒内模拟颗粒、阻尼与弹性。',
      '开发面向高真实触屏和特种外科手套的力反馈外设，复现自然物理触觉。',
      '为未来空间混合计算终端带来颠覆性的轻巧无摩擦双向输入震动力学。'
    ],
    founders: 'Leo Tanaka, Sarah Lin',
    location: '东京都, 日本',
    batch: 'S25',
    url: 'https://www.ycombinator.com'
  },
  {
    id: 4,
    source: 'Y Combinator',
    name: 'NueroScribe Wearables',
    name_zh: 'NueroScribe • 无感肌电输入手环',
    intro: 'High-density wristband EMG sensors which translate wrist/finger flick signals into generic wireless keystroke commands instantly.',
    intro_zh: [
      '利用微弱表面肌电探测探针，捕捉哪怕数十微米级的微弱指关节动向。',
      '支持单手微调，在跑步、下厨、骑行等户外全场景无感操作任何AR视镜。',
      '开放全部SDK，全平台极度轻巧底层协议极低系统延迟，仅需单节干电池。'
    ],
    founders: 'Zack Thorne, Maya Patil',
    location: '西雅图, 美国',
    batch: 'W25',
    url: 'https://www.ycombinator.com'
  },
  {
    id: 5,
    source: 'Y Combinator',
    name: 'CoreBreathe Tech',
    name_zh: 'CoreBreathe • 微型智能主动呼吸面罩',
    intro: 'A sleek respiratory wearable with integrated mini turbines and PM0.1 dust laser analyzers for urban cyber runners.',
    intro_zh: [
      '融合了动态高压轴汽轮风扇，系统根据运动心率频率算法自动调整进气气流。',
      '极轻量仅重60g，结合多层定制纳米微孔滤片自适应吸附绝大多数粉尘油烟。',
      '配备正面隐藏式高反度运动反光灯条和精密无线空气质量蓝牙数据记录。'
    ],
    founders: 'Kenji Sato, Robert Miller',
    location: '横滨市, 日本',
    batch: 'S24',
    url: 'https://www.ycombinator.com'
  },
  {
    id: 6,
    source: 'Y Combinator',
    name: 'EchoLogic Audio',
    name_zh: 'EchoLogic • 助眠超声骨传导睡枕',
    intro: 'High-frequency bone conduction sonic transducers embedded in custom memory foams to lull you to sleep without headphones.',
    intro_zh: [
      '依靠枕芯内深嵌的多通道超声骨传导发生单元，声音直接安全传入脑内。',
      '不泄露一丝噪音，即便躺在枕边亦完全听不到，完美契合伴侣双人安眠。',
      '与本地科学助眠白噪音、睡眠阶段检测智能传感器结合，全程健康呵护。'
    ],
    founders: 'Dmitri Vanko, Helen Carter',
    location: '斯德哥尔摩, 瑞典',
    batch: 'S25',
    url: 'https://www.ycombinator.com'
  },
  {
    id: 7,
    source: 'Y Combinator',
    name: 'GrapheneHeal Band',
    name_zh: 'GrapheneHeal • 智能石墨烯热敷复健带',
    intro: 'Developing smart recovery body straps utilizing graphene mesh sheets and integrated biofeedback muscle tension sensors.',
    intro_zh: [
      '采用多层高导热性石墨烯温控网层，实现1秒速热并保持均匀理疗红外波。',
      '内置微型肌张力传感器，自动读取腰颈部劳累度自适应调节热敷阶梯输出。',
      '柔软超薄富有弹性可完美隐藏扣于西装内衬，蓝牙连接随时物理控制理疗。'
    ],
    founders: 'Carlo Rossi, Dr. Fiona Gallagher',
    location: '米兰, 意大利',
    batch: 'W25',
    url: 'https://www.ycombinator.com'
  },
  {
    id: 8,
    source: 'Y Combinator',
    name: 'CryoCore Chill',
    name_zh: 'CryoCore • 微型穿戴半导体制冷颈环',
    intro: 'A rugged dynamic neckwear band featuring thermo-electric chip layers to actively chill/warm sports players on field.',
    intro_zh: [
      '内置高性能大尺寸制冷晶片，能在高热户外5秒内将颈部物理速降10度。',
      '集成了动态闭环温感监测模块，一旦侦测到体温调节恢复正常即刻调低占空比。',
      '专为越野、极限速降、野外勘探矿工选手设计的极简紧凑人体工程学构架。'
    ],
    founders: 'Tomás Silva, Lucas Bennett',
    location: '奥斯汀, 美国',
    batch: 'S24',
    url: 'https://www.ycombinator.com'
  }
];
