import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import ts from 'typescript'

const path = new URL('../src/pages/demoResume.ts', import.meta.url)
const source = await readFile(path, 'utf8').catch(() => null)
const model = source ? await import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText).toString('base64')}`) : null

const engineer = { id: 'demo-01', title: 'AI 产品工程师', company: '星河协作（示例）', city: '上海' }
const manager = { id: 'demo-02', title: '大模型应用产品经理', company: '北斗数据（示例）', city: '上海' }
const leader = { id: 'demo-03', title: 'AI 创新产品负责人', company: '纸飞机科技（示例）', city: '杭州' }
const toolManager = { id: 'demo-04', title: '智能工具产品经理', company: '像素工场（示例）', city: '上海' }

function requireModel() {
  assert.ok(model, 'A role-aware demo resume model is required instead of the fixed engineer preview')
  return model
}

test('engineer preview foregrounds the existing Python workflow facts', () => {
  const { getDemoResume } = requireModel()
  const preview = getDemoResume(engineer)
  assert.equal(preview.supported, true)
  assert.equal(preview.projects[0].id, 'workflow')
  assert.match(preview.summary, /Python/)
  assert.ok(preview.keywords.includes('错误恢复'))
  assert.equal(preview.fileName, '林小满_AI产品工程师_虚构示例.pdf')
})

test('product-manager preview changes the body, project order, and keywords', () => {
  const { getDemoResume } = requireModel()
  const preview = getDemoResume(manager)
  assert.equal(preview.supported, true)
  assert.equal(preview.projects[0].id, 'job-tool')
  assert.match(preview.summary, /产品设计/)
  assert.ok(preview.keywords.includes('人工确认'))
  assert.ok(preview.keywords.includes('状态跟进'))
  assert.equal(preview.fileName, '林小满_大模型应用产品经理_虚构示例.pdf')
  assert.notEqual(preview.summary, getDemoResume(engineer).summary)
})

test('every role reuses original fictional facts without new achievements', () => {
  const { demoResumeSource, getDemoResume } = requireModel()
  const originalFacts = [
    '将模糊业务问题拆成可验证的 Agent 工作流和人工确认点',
    '使用 Python 完成模型调用、状态管理与错误恢复',
    '通过任务回放发现失败环节，迭代提示词与交互反馈',
    '完成岗位预筛、深度评分、沟通草稿、人工确认和状态跟进的端到端产品设计。',
  ]
  assert.equal(demoResumeSource.name, '林小满')
  assert.equal(demoResumeSource.fictional, true)
  assert.deepEqual(demoResumeSource.projects.flatMap(project => project.facts), originalFacts)
  for (const job of [engineer, manager, toolManager]) {
    for (const project of getDemoResume(job).projects) {
      assert.ok(demoResumeSource.projects.includes(project), 'Preview must reference existing example material')
    }
  }
})

test('leadership and unknown roles expose missing material instead of invented resumes', () => {
  const { getDemoResume } = requireModel()
  const preview = getDemoResume(leader)
  assert.equal(preview.supported, false)
  assert.equal(preview.fileName, null)
  assert.deepEqual(preview.projects, [])
  assert.match(preview.limitation, /团队管理/)
  assert.equal(getDemoResume({ ...engineer, id: 'unknown' }).supported, false)
})

test('zero selections return no fallback resume and multiple selections retain every job', () => {
  const { getSelectedDemoResumes } = requireModel()
  assert.deepEqual(getSelectedDemoResumes([]), [])
  const previews = getSelectedDemoResumes([engineer, manager, leader])
  assert.deepEqual(previews.map(preview => preview.job.id), ['demo-01', 'demo-02', 'demo-03'])
  assert.deepEqual(previews.map(preview => preview.supported), [true, true, false])
})
