import { useMemo, useState } from 'react'
import { demoResumeSource, getSelectedDemoResumes } from './demoResume'
import {
  ArrowDown,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  FileCheck2,
  Github,
  LockKeyhole,
  MessageSquareText,
  MousePointerClick,
  RefreshCcw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react'

type DemoStep = 'intro' | 'ranked' | 'confirmed' | 'resume'

type DemoJob = {
  id: string
  company: string
  title: string
  salary: string
  city: string
  quickScore: number
  score: number
  status: 'recommended' | 'review' | 'filtered'
  tags: string[]
  jd: string
  reason: string
  risks: string[]
  greeting: string
}

const jobs: DemoJob[] = [
  {
    id: 'demo-01',
    company: '星河协作（示例）',
    title: 'AI 产品工程师',
    salary: '28–40K',
    city: '上海',
    quickScore: 92,
    score: 93,
    status: 'recommended',
    tags: ['AI Agent', 'Python', '产品落地'],
    jd: '负责 AI Agent 产品的原型、评测与工程落地；与产品、设计团队协作，把模糊需求拆成可验证的工作流。要求熟悉 Python、LLM 应用开发和用户研究。',
    reason: '核心能力高度重合：候选人有 AI Agent、Python 与端到端产品落地经验；“把模糊需求拆成可验证工作流”与两个项目经历直接对应。',
    risks: ['岗位偏工程，需要在沟通中补充线上服务稳定性经验'],
    greeting: '你好，我关注到这个岗位同时需要 AI Agent 工程能力和产品判断。我最近做过从需求拆解、模型调用到可用工作流落地的完整项目，也持续用真实任务验证效果。很想具体聊聊团队目前最希望 Agent 解决的业务环节。',
  },
  {
    id: 'demo-02',
    company: '北斗数据（示例）',
    title: '大模型应用产品经理',
    salary: '25–35K',
    city: '上海',
    quickScore: 88,
    score: 89,
    status: 'recommended',
    tags: ['LLM 应用', '需求分析', '数据产品'],
    jd: '面向企业客户设计大模型应用方案，负责场景调研、需求分析、原型设计和交付验证；有数据产品或技术背景优先。',
    reason: '产品能力与技术理解匹配，简历中的企业工作流项目可证明从调研到交付验证的完整性。缺少明确的售前经历，但不是硬性条件。',
    risks: ['企业客户沟通经验需要在面试中进一步确认'],
    greeting: '你好，这个岗位强调的不只是做功能，而是把企业场景真正跑通。我有技术背景，也做过从用户问题、原型到交付验证的 AI 工作流，希望了解团队现在主要服务哪些业务场景，以及衡量落地效果的标准。',
  },
  {
    id: 'demo-03',
    company: '纸飞机科技（示例）',
    title: 'AI 创新产品负责人',
    salary: '30–45K',
    city: '杭州',
    quickScore: 84,
    score: 82,
    status: 'review',
    tags: ['0→1', '产品策略', '跨团队'],
    jd: '负责生成式 AI 新产品 0 到 1，定义产品方向并推动跨团队交付。要求 5 年以上产品经验，有团队管理经验优先。',
    reason: '0 到 1 与跨团队交付能力匹配；但“负责人”和团队管理是明显的层级风险，建议谨慎沟通，不应自动投递。',
    risks: ['团队管理经历在匿名简历中没有充分证据', '岗位层级可能高于当前目标'],
    greeting: '你好，我对生成式 AI 从 0 到 1 的产品机会很感兴趣。过去的项目里，我一直同时负责问题定义、技术方案与交付验证。想先了解这个岗位对团队管理和亲自下场做产品的时间比例，再判断双方是否真正匹配。',
  },
  {
    id: 'demo-04',
    company: '像素工场（示例）',
    title: '智能工具产品经理',
    salary: '22–32K',
    city: '上海',
    quickScore: 76,
    score: 78,
    status: 'review',
    tags: ['效率工具', '用户研究', '原型'],
    jd: '负责面向创作者的智能效率工具，开展用户研究、竞品分析、产品设计和版本迭代。熟悉 AIGC 工具优先。',
    reason: '用户研究、产品原型和 AIGC 工具经验匹配；行业经验不完全一致，但能力可迁移。',
    risks: ['创作者工具行业经验较少'],
    greeting: '你好，我很认同用 AI 减少创作者重复劳动这个方向。我做产品时习惯先找到高频但低价值的步骤，再用原型快速验证，而不是先堆功能。想了解团队当前验证得最扎实的创作环节是什么。',
  },
  {
    id: 'demo-05',
    company: '远山咨询（示例）',
    title: 'AI 解决方案顾问',
    salary: '20–30K',
    city: '北京',
    quickScore: 58,
    score: 55,
    status: 'filtered',
    tags: ['售前', '高频出差', '方案咨询'],
    jd: '负责重点客户售前咨询与解决方案编写，可接受每月两周以上出差；有大型政企项目经验。',
    reason: '技术理解可迁移，但工作方式与目标偏差明显：高频出差命中示例简历的一票否决条件，且缺少大型政企售前证据。',
    risks: ['命中一票否决：高频出差', '缺少政企售前经历'],
    greeting: '',
  },
  {
    id: 'demo-06',
    company: '云帆网络（示例）',
    title: '高级后端开发工程师',
    salary: '30–50K',
    city: '深圳',
    quickScore: 42,
    score: 38,
    status: 'filtered',
    tags: ['Java', '微服务', '高并发'],
    jd: '负责 Java 微服务架构与高并发系统优化，要求 5 年以上 Java 后端经验，熟悉 JVM 调优和分布式中间件。',
    reason: '岗位核心是 Java 后端深度，与候选人的 Python、AI 应用和产品工程方向不一致。标题相近不代表真正匹配。',
    risks: ['核心技术栈不匹配', '职业方向不匹配'],
    greeting: '',
  },
]

const stepLabels = [
  { id: 'ranked', label: 'AI 预筛与排序', icon: SearchCheck },
  { id: 'confirmed', label: '人工确认与招呼语', icon: UserCheck },
  { id: 'resume', label: '跟进与定制简历', icon: FileCheck2 },
]

function scoreTone(score: number) {
  if (score >= 85) return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  if (score >= 70) return 'bg-amber-50 text-amber-700 ring-amber-200'
  return 'bg-stone-100 text-stone-500 ring-stone-200'
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ff5a1f] text-sm font-black text-white shadow-lg shadow-orange-200">BH</div>
      <div>
        <div className="text-sm font-black tracking-tight text-stone-950">BossHunter</div>
        <div className="text-[10px] font-bold tracking-[0.14em] text-stone-400">JUDGE SANDBOX</div>
      </div>
    </div>
  )
}

function Stepper({ step }: { step: DemoStep }) {
  const progress = step === 'intro' ? 0 : step === 'ranked' ? 1 : step === 'confirmed' ? 2 : 3
  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {stepLabels.map((item, index) => {
        const active = progress >= index + 1
        const Icon = item.icon
        return (
          <div key={item.id} className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${active ? 'border-orange-200 bg-orange-50' : 'border-stone-200 bg-white'}`}>
            <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-xl ${active ? 'bg-[#ff5a1f] text-white' : 'bg-stone-100 text-stone-400'}`}>
              {progress > index + 1 ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-400">Step {index + 1}</div>
              <div className={`text-xs font-black ${active ? 'text-stone-950' : 'text-stone-500'}`}>{item.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Intro({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <section className="relative overflow-hidden rounded-[2rem] bg-stone-950 px-6 py-8 text-white shadow-2xl shadow-stone-300 sm:px-10 sm:py-12">
        <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-orange-500/30 blur-3xl" />
        <div className="absolute -bottom-28 left-24 h-64 w-64 rounded-full bg-amber-300/10 blur-3xl" />
        <div className="relative">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black text-orange-200">
            <Sparkles className="h-3.5 w-3.5" /> 2026 外滩黑客松 · 评委演示模式
          </div>
          <h1 className="max-w-3xl text-4xl font-black leading-[1.08] tracking-[-0.04em] sm:text-5xl">
            把岗位筛选、沟通和跟进交给 AI，<span className="text-[#ff7643]">把投递决定留给人。</span>
          </h1>
          <p className="mt-6 max-w-2xl text-base font-medium leading-7 text-stone-300">
            不登录招聘平台，不上传真实简历。用一份匿名示例简历和 6 条模拟 JD，亲自跑完 BossHunter 的关键闭环。
          </p>
          <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-stone-300">
            <span className="rounded-full bg-white/10 px-3 py-2">匿名示例数据</span>
            <span className="rounded-full bg-white/10 px-3 py-2">不调用真实招聘平台</span>
            <span className="rounded-full bg-white/10 px-3 py-2">不会发送任何消息</span>
          </div>
          <button
            type="button"
            onClick={onStart}
            className="mt-9 inline-flex h-12 items-center gap-3 rounded-2xl bg-[#ff5a1f] px-6 text-sm font-black text-white shadow-xl shadow-orange-950/30 transition hover:-translate-y-0.5 hover:bg-[#ff6a32] focus:outline-none focus:ring-4 focus:ring-orange-300/40"
          >
            开始 3 分钟演示 <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <aside className="grid gap-4">
        <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-500">Anonymous resume</div>
              <h2 className="mt-1 text-xl font-black text-stone-950">林小满 · AI 产品工程师</h2>
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-orange-50 text-orange-600"><LockKeyhole className="h-5 w-5" /></div>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl bg-stone-50 px-2 py-3"><div className="text-lg font-black">5 年</div><div className="text-[10px] font-bold text-stone-400">产品经验</div></div>
            <div className="rounded-2xl bg-stone-50 px-2 py-3"><div className="text-lg font-black">3 个</div><div className="text-[10px] font-bold text-stone-400">AI 项目</div></div>
            <div className="rounded-2xl bg-stone-50 px-2 py-3"><div className="text-lg font-black">上海</div><div className="text-[10px] font-bold text-stone-400">目标城市</div></div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {['Python', 'AI Agent', '用户研究', '0→1 产品'].map(tag => <span key={tag} className="rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-black text-orange-700">{tag}</span>)}
          </div>
          <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-bold leading-5 text-red-700">
            一票否决：高频出差、纯外包驻场
          </div>
        </div>
        <div className="flex items-start gap-3 rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="font-bold leading-6">公开演示是隔离沙盒。真实版本坚持本地运行、低频操作和发送前人工确认。</p>
        </div>
      </aside>
    </div>
  )
}

function RankedJobs({
  selected,
  onToggle,
  onConfirm,
  focusJob,
  setFocusJob,
}: {
  selected: string[]
  onToggle: (id: string) => void
  onConfirm: () => void
  focusJob: DemoJob
  setFocusJob: (job: DemoJob) => void
}) {
  const recommended = jobs.filter(job => job.status !== 'filtered')
  const filtered = jobs.filter(job => job.status === 'filtered')

  return (
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
      <section className="min-w-0 rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-500">Two-stage ranking</div>
            <h2 className="mt-1 text-2xl font-black tracking-tight text-stone-950">6 个岗位，4 个值得你看</h2>
            <p className="mt-2 text-xs font-bold text-stone-500">先用硬条件预筛，再结合完整 JD 与简历做深度评分。</p>
          </div>
          <div className="flex gap-2 text-center">
            <div className="rounded-xl bg-emerald-50 px-3 py-2"><div className="text-lg font-black text-emerald-700">4</div><div className="text-[9px] font-black text-emerald-600">进入人工确认</div></div>
            <div className="rounded-xl bg-stone-100 px-3 py-2"><div className="text-lg font-black text-stone-600">2</div><div className="text-[9px] font-black text-stone-500">自动过滤</div></div>
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {recommended.map((job, index) => {
            const checked = selected.includes(job.id)
            const focused = focusJob.id === job.id
            return (
              <div
                key={job.id}
                className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition ${focused ? 'border-orange-300 bg-orange-50/60 shadow-sm' : 'border-stone-200 hover:border-orange-200'}`}
              >
                <button
                  type="button"
                  aria-label={`${checked ? '取消选择' : '选择'}${job.title}`}
                  aria-pressed={checked}
                  onClick={() => onToggle(job.id)}
                  className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-lg border ${checked ? 'border-orange-500 bg-[#ff5a1f] text-white' : 'border-stone-300 bg-white'}`}
                >
                  {checked && <Check className="h-3.5 w-3.5" />}
                </button>
                <button type="button" onClick={() => setFocusJob(job)} className="flex min-w-0 flex-1 items-start gap-3 text-left">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black text-stone-400">#{index + 1}</span>
                      <h3 className="font-black text-stone-950">{job.title}</h3>
                      {job.status === 'review' && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-black text-amber-700">建议谨慎</span>}
                    </div>
                    <p className="mt-1 truncate text-xs font-bold text-stone-500">{job.company} · {job.city} · {job.salary}</p>
                  </div>
                  <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-lg font-black ring-1 ${scoreTone(job.score)}`}>{job.score}</div>
                </button>
              </div>
            )
          })}
        </div>

        <details className="mt-4 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
          <summary className="cursor-pointer text-xs font-black text-stone-600">查看 2 个被过滤岗位与具体原因</summary>
          <div className="mt-3 space-y-2">
            {filtered.map(job => (
              <button key={job.id} type="button" onClick={() => setFocusJob(job)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-white px-3 py-3 text-left">
                <div className="min-w-0 flex-1 break-words"><div className="text-xs font-black text-stone-700">{job.title}</div><div className="mt-1 text-[10px] font-bold text-stone-400">{job.risks.join(' · ')}</div></div>
                <span className="shrink-0 text-sm font-black text-stone-400">{job.score}</span>
              </button>
            ))}
          </div>
        </details>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-stone-950 px-5 py-4 text-white">
          <div><div className="text-sm font-black">已选 {selected.length} 个岗位</div><div className="mt-1 text-[10px] font-bold text-stone-400">只有这里确认后，真实模式才会进入沟通准备</div></div>
          <button type="button" disabled={!selected.length} onClick={onConfirm} className="inline-flex h-10 items-center gap-2 rounded-xl bg-[#ff5a1f] px-4 text-xs font-black transition hover:bg-[#ff6a32] disabled:cursor-not-allowed disabled:opacity-40">
            人工确认并继续 <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <JobDetail job={focusJob} />
    </div>
  )
}

function JobDetail({ job }: { job: DemoJob }) {
  return (
    <aside className="min-w-0 self-start rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm sm:sticky sm:top-24 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-500">AI decision brief</div>
          <h2 className="mt-1 text-xl font-black text-stone-950">{job.title}</h2>
          <p className="mt-1 text-xs font-bold text-stone-500">{job.company} · {job.salary}</p>
        </div>
        <div className={`shrink-0 rounded-xl px-3 py-2 text-center ring-1 ${scoreTone(job.score)}`}><div className="text-xl font-black">{job.score}</div><div className="text-[8px] font-black">MATCH</div></div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-[10px] font-black text-stone-500">
        <span className="rounded-full bg-stone-100 px-2.5 py-1.5">预筛 {job.quickScore}</span><ArrowRight className="h-3 w-3" /><span className="rounded-full bg-orange-100 px-2.5 py-1.5 text-orange-700">深度评分 {job.score}</span>
      </div>
      <div className="mt-5 space-y-4">
        <div><h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-400">JD 摘要</h3><p className="mt-2 text-xs font-medium leading-6 text-stone-600">{job.jd}</p></div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4"><h3 className="flex items-center gap-2 text-xs font-black text-emerald-800"><Sparkles className="h-3.5 w-3.5" />为什么是这个分数</h3><p className="mt-2 text-xs font-medium leading-5 text-emerald-900/80">{job.reason}</p></div>
        <div><h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-400">需要人判断的风险</h3><div className="mt-2 space-y-2">{job.risks.map(risk => <div key={risk} className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[11px] font-bold leading-5 text-amber-800"><CircleDashed className="mt-1 h-3 w-3 shrink-0" />{risk}</div>)}</div></div>
        {job.greeting && <div><h3 className="text-[10px] font-black uppercase tracking-[0.12em] text-stone-400">个性化招呼语预览</h3><p className="mt-2 rounded-2xl bg-stone-950 p-4 text-xs font-medium leading-6 text-stone-200">{job.greeting}</p></div>}
      </div>
    </aside>
  )
}

function Confirmation({ selectedJobs, onSimulateReply }: { selectedJobs: DemoJob[]; onSimulateReply: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,.9fr)_minmax(0,1.1fr)]">
      <section className="min-w-0 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 className="h-6 w-6" /></div>
        <div className="mt-5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">Human checkpoint passed</div>
        <h2 className="mt-1 text-2xl font-black text-stone-950">最终决定仍然在你手里</h2>
        <p className="mt-3 text-sm font-medium leading-6 text-stone-500">你确认了 {selectedJobs.length} 个岗位。演示模式只更新沙盒状态，不打开招聘网站，也不会发送招呼语。</p>
        <div className="mt-6 space-y-3">
          {selectedJobs.map(job => <div key={job.id} className="flex items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3"><div className="min-w-0 flex-1"><div className="text-sm font-black">{job.title}</div><div className="mt-1 text-[10px] font-bold text-stone-400">{job.company}</div></div><span className="shrink-0 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700">已人工确认</span></div>)}
        </div>
        <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-xs font-bold leading-5 text-orange-900">真实模式：生成招呼语后仍受发送时间窗、每日上限、随机间隔与本地 Chrome 会话约束。</div>
      </section>

      <section className="min-w-0 rounded-[2rem] bg-stone-950 p-6 text-white shadow-2xl shadow-stone-300">
        <div className="flex items-center justify-between"><div><div className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-400">Live funnel</div><h2 className="mt-1 text-2xl font-black">状态不是“已投递/没投递”两格</h2></div><BriefcaseBusiness className="h-7 w-7 text-orange-400" /></div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[['6', '采集'], ['4', '评分通过'], [String(selectedJobs.length), '人工确认'], ['0', '真实发送']].map(([value, label], index) => <div key={label} className={`rounded-2xl p-4 ${index === 2 ? 'bg-orange-500' : 'bg-white/10'}`}><div className="text-3xl font-black">{value}</div><div className="mt-1 text-[10px] font-black text-white/60">{label}</div></div>)}
        </div>
        <div className="mt-7 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-orange-500 text-white"><MessageSquareText className="h-5 w-5" /></div><div><div className="text-sm font-black">模拟下一步：HR 请求简历</div><div className="mt-1 text-[10px] font-bold text-stone-400">看看 BossHunter 如何把回复事件变成可处理任务</div></div></div>
          <button type="button" onClick={onSimulateReply} className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white text-xs font-black text-stone-950 transition hover:bg-orange-50">模拟收到 HR 消息 <ArrowRight className="h-4 w-4" /></button>
        </div>
      </section>
    </div>
  )
}

function ResumeResult({ selectedJobs }: { selectedJobs: DemoJob[] }) {
  const previews = getSelectedDemoResumes(selectedJobs)
  const [previewJobId, setPreviewJobId] = useState(selectedJobs[0]?.id)
  const preview = previews.find(item => item.job.id === previewJobId) || previews[0]
  if (!preview) {
    return <section className="rounded-[2rem] border border-stone-200 bg-white p-6"><h2 className="text-xl font-black">尚未确认岗位</h2><p className="mt-3 text-sm text-stone-600">请重新演示并选择岗位，再查看对应的虚构简历示例。</p></section>
  }
  const primary = preview.job
  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-black">查看已确认岗位的简历示例</h2>
        <p className="mt-2 text-xs leading-5 text-stone-500">每个岗位单独预览。内容来自原有虚构示例资料，按岗位重排，不新增经历或结果。</p>
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="已确认岗位的简历预览">
          {previews.map(item => <button key={item.job.id} type="button" aria-pressed={primary.id === item.job.id} aria-controls="demo-resume-preview" onClick={() => setPreviewJobId(item.job.id)} className={`max-w-full rounded-xl border px-3 py-2 text-left text-xs font-bold ${primary.id === item.job.id ? 'border-orange-300 bg-orange-50 text-orange-800' : 'border-stone-200 text-stone-600'}`}>{item.job.title} · {item.job.company}</button>)}
        </div>
      </section>
      <div id="demo-resume-preview" role="region" aria-label={`${primary.title}的虚构简历示例`} className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,.72fr)_minmax(0,1.28fr)]">
      <section className="min-w-0 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
        <div className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-500">Reply detected</div>
        <h2 className="mt-1 text-2xl font-black text-stone-950">“方便发一份简历吗？”</h2>
        <div className="mt-5 rounded-2xl bg-stone-100 p-4 text-xs font-medium leading-6 text-stone-700">
          <div className="mb-2 font-black text-stone-950">{primary.company} · 招聘负责人</div>
          你好，方便发一份更贴近“{primary.title}”岗位的简历吗？这是一条虚构的 HR 请求。
        </div>
        <div className="my-5 flex justify-center"><ArrowDown className="h-5 w-5 text-stone-300" /></div>
        <div className="space-y-3">
          {[
            ['识别意图', '检测到明确的附件简历请求'],
            ['提取重点', preview.supported ? preview.keywords.join('、') : '此岗位缺少对应示例资料'],
            ['生成草稿', preview.supported ? '只重排和改写已有事实，不新增经历' : '缺少示例资料，暂停生成草稿'],
            ['等待确认', preview.supported ? '文件不自动发给 HR' : '没有文件，不发送消息'],
          ].map(([title, detail], index) => <div key={title} className="flex gap-3"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-orange-100 text-[10px] font-black text-orange-700">{index + 1}</div><div><div className="text-xs font-black text-stone-900">{title}</div><div className="mt-1 text-[10px] font-bold text-stone-400">{detail}</div></div></div>)}
        </div>
        <div className="mt-6 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-xs leading-5 text-orange-900"><div className="font-black">{preview.supported ? '为什么这样重排' : '为什么暂不生成'}</div><p className="mt-2">{preview.mappingReason}</p></div>
        {preview.limitation && <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">{preview.limitation}</p>}
      </section>

      <section className="min-w-0 overflow-hidden rounded-[2rem] border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-200 bg-stone-50 px-6 py-4"><div className="min-w-0"><div className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600">Tailored resume preview</div><h2 className="mt-1 break-words text-lg font-black text-stone-950">{preview.fileName || '该岗位暂不生成简历草稿'}</h2></div><span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black text-emerald-700"><BadgeCheck className="h-3.5 w-3.5" />虚构示例资料</span></div>
        {preview.supported ? <>
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b-2 border-stone-900 pb-4"><div className="min-w-0"><h3 className="text-2xl font-black tracking-tight">{demoResumeSource.name}</h3><p className="mt-1 text-xs font-bold text-stone-500">求职意向：{primary.title} · {primary.city} · 联系方式已隐藏</p></div><div className="text-right text-[10px] font-bold leading-5 text-stone-400">虚构评委演示简历<br />所有人物与公司均为虚构</div></div>
          <p className="mt-5 text-xs leading-6 text-stone-600">{preview.summary}</p>
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.45fr)_minmax(0,.55fr)]">
            <div className="min-w-0">
              <h4 className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">与岗位最相关的项目</h4>
              {preview.projects.map((project, index) => <div key={project.id} className={`mt-4 rounded-2xl p-4 ${index === 0 ? 'border-2 border-orange-200 bg-orange-50/50' : 'bg-stone-50'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0 text-sm font-black">{project.title}</div>{index === 0 && <span className="shrink-0 rounded-full bg-orange-500 px-2 py-1 text-[9px] font-black text-white">重点前置</span>}</div><ul className="mt-3 space-y-2 text-xs font-medium leading-5 text-stone-700">{project.facts.map(fact => <li key={fact}>• {fact}</li>)}</ul></div>)}
            </div>
            <div className="min-w-0">
              <h4 className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-600">关键词对齐</h4>
              <div className="mt-3 flex flex-wrap gap-2">{preview.keywords.map(tag => <span key={tag} className="rounded-lg bg-stone-950 px-2.5 py-1.5 text-[10px] font-black text-white">{tag}</span>)}</div>
              <div className="mt-5 rounded-2xl border border-stone-200 p-4"><div className="flex items-center gap-2 text-xs font-black"><ShieldCheck className="h-4 w-4 text-emerald-600" />没有新增事实</div><p className="mt-2 text-[10px] font-bold leading-5 text-stone-400">只调整项目顺序、摘要表达和关键词；原始经历、年限、公司与结果不被扩写。</p></div>
            </div>
          </div>
        </div>
        </> : <div className="p-6 sm:p-8"><h3 className="text-xl font-black">示例资料不足</h3><p className="mt-4 text-sm leading-6 text-stone-600">{preview.limitation}</p><p className="mt-4 text-xs leading-5 text-stone-500">不会把技术或产品项目扩写为团队管理、行业或客户经历。你可以切换其他已确认岗位查看可用示例。</p></div>}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-stone-950 px-6 py-4 text-white"><div className="text-xs font-black">虚构示例预览：不会生成文件或发送给 HR</div><div className="flex items-center gap-2 text-[10px] font-bold text-stone-400"><MousePointerClick className="h-3.5 w-3.5" />不自动发送</div></div>
      </section>
      </div>
    </div>
  )
}

export default function JudgeDemoPage() {
  const [step, setStep] = useState<DemoStep>('intro')
  const [selected, setSelected] = useState<string[]>(['demo-01', 'demo-02'])
  const [focusJob, setFocusJob] = useState<DemoJob>(jobs[0])
  const selectedJobs = useMemo(() => jobs.filter(job => selected.includes(job.id)), [selected])

  const toggle = (id: string) => setSelected(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id])
  const reset = () => { setStep('intro'); setSelected(['demo-01', 'demo-02']); setFocusJob(jobs[0]); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const go = (next: DemoStep) => { setStep(next); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="min-h-screen bg-[#f7f5f2] text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-200/80 bg-[#f7f5f2]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-2">
            <a href="https://github.com/powerycy/BossHunter" target="_blank" rel="noreferrer" className="hidden h-9 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-700 transition hover:border-orange-300 sm:inline-flex"><Github className="h-3.5 w-3.5" />源代码</a>
            {step !== 'intro' && <button type="button" onClick={reset} className="inline-flex h-9 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-xs font-black text-stone-700 transition hover:border-orange-300"><RefreshCcw className="h-3.5 w-3.5" />重新演示</button>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-stone-200 bg-white px-4 py-3 text-[11px] font-bold text-stone-500">
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-600" />安全沙盒：全部人物、公司、岗位与结果均为匿名模拟数据</span>
          <span className="inline-flex items-center gap-2 text-stone-400"><X className="h-3.5 w-3.5" />不抓取 · 不登录 · 不真实发送</span>
        </div>
        {step !== 'intro' && <div className="mb-5"><Stepper step={step} /></div>}
        {step === 'intro' && <Intro onStart={() => go('ranked')} />}
        {step === 'ranked' && <RankedJobs selected={selected} onToggle={toggle} onConfirm={() => go('confirmed')} focusJob={focusJob} setFocusJob={setFocusJob} />}
        {step === 'confirmed' && <Confirmation selectedJobs={selectedJobs} onSimulateReply={() => go('resume')} />}
        {step === 'resume' && <ResumeResult selectedJobs={selectedJobs} />}
      </main>

      <footer className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-8 text-[10px] font-bold text-stone-400 sm:px-6 lg:px-8">
        <span>BossHunter · 评委演示模式 · v2.2</span>
        <span>真实产品默认本地运行，敏感动作保留人工确认</span>
      </footer>
    </div>
  )
}
