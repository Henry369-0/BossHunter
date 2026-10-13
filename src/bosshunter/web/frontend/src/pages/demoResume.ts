export type DemoResumeJob = { id: string; title: string; company: string; city: string }
export type DemoResumeProject = { id: string; title: string; facts: readonly string[] }

// These facts come from powerycy's original fictional judge demo, never from a real applicant.
export const demoResumeSource = {
  name: '林小满',
  fictional: true,
  projects: [
    {
      id: 'workflow',
      title: '多步骤 AI 工作流产品',
      facts: [
        '将模糊业务问题拆成可验证的 Agent 工作流和人工确认点',
        '使用 Python 完成模型调用、状态管理与错误恢复',
        '通过任务回放发现失败环节，迭代提示词与交互反馈',
      ],
    },
    {
      id: 'job-tool',
      title: '求职流程自动化工具',
      facts: ['完成岗位预筛、深度评分、沟通草稿、人工确认和状态跟进的端到端产品设计。'],
    },
  ] satisfies DemoResumeProject[],
}

export type DemoResumePreview = {
  job: DemoResumeJob
  supported: boolean
  fileName: string | null
  summary: string
  keywords: string[]
  projects: DemoResumeProject[]
  mappingReason: string
  limitation: string | null
}

export function getDemoResume(job: DemoResumeJob): DemoResumePreview {
  const engineer = job.id === 'demo-01'
  const productManager = job.id === 'demo-02' || job.id === 'demo-04'
  const [workflow, jobTool] = demoResumeSource.projects
  if (!engineer && !productManager) {
    return {
      job, supported: false, fileName: null, summary: '', keywords: [], projects: [],
      mappingReason: '示例资料只覆盖产品设计与技术实现，不扩写成未提供的岗位经历。',
      limitation: job.id === 'demo-03'
        ? '负责人岗位需要团队管理经历，虚构示例资料没有这项证据，因此暂不生成该岗位的简历草稿。'
        : '虚构示例资料尚未覆盖此类岗位，因此暂不生成简历草稿。',
    }
  }
  return {
    job,
    supported: true,
    fileName: `${demoResumeSource.name}_${job.title.replace(/\s/g, '')}_虚构示例.pdf`,
    summary: engineer
      ? 'AI 产品工程方向：重点展示 Python、模型调用、状态管理与错误恢复，使用已有项目说明工作流如何落地。'
      : '产品经理方向：重点展示岗位预筛、沟通草稿、人工确认和状态跟进的端到端产品设计，技术实现项目作为补充。',
    keywords: engineer
      ? ['AI Agent', 'Python', '模型调用', '状态管理', '错误恢复', '工作流']
      : ['产品设计', '岗位预筛', '人工确认', '状态跟进', '用户研究'],
    projects: engineer ? [workflow, jobTool] : [jobTool, workflow],
    mappingReason: engineer
      ? '岗位要求 Python 与 Agent 工程，前置现有工作流项目中的技术实现事实。'
      : '岗位侧重产品与流程设计，前置已有求职流程产品项目；原技术项目仍保留，事实句不改写为新成果。',
    limitation: productManager
      ? job.id === 'demo-04'
        ? '示例资料没有创作者工具行业经历，不补写行业经验。'
        : '示例资料没有企业客户或售前经历，不补写客户交付经验。'
      : null,
  }
}

export function getSelectedDemoResumes(jobs: readonly DemoResumeJob[]): DemoResumePreview[] {
  return jobs.map(getDemoResume)
}
