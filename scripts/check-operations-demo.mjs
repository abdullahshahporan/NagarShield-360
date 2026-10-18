import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { chromium } from 'playwright-core'

const baseUrl = process.env.DEMO_BASE_URL || 'http://localhost:3000'
const accounts = JSON.parse(await readFile(process.env.DEMO_ACCOUNTS_FILE || 'demo-accounts.local.json', 'utf8'))
const executive = accounts.find(item => item.role === 'executive')
if (!executive) throw new Error('Executive demo account is required')

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true,
})
try {
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } })
  await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' })
  await page.locator('input[name="email"]').fill(executive.email)
  await page.locator('input[name="password"]').fill(executive.password)
  await page.getByRole('button', { name: /সাইন ইন করুন/ }).click()
  try { await page.waitForURL('**/dashboard', { timeout: 20000 }) }
  catch {
    const message = await page.locator('.signin-error').textContent().catch(() => null)
    throw new Error(`Demo sign-in failed (${message || page.url()}); check the local account and Supabase project`)
  }
  await page.goto(`${baseUrl}/operations`, { waitUntil: 'networkidle' })
  await page.locator('.ops-case-picker button').last().click()
  await page.locator('.ops-steps button').nth(1).click()
  await page.locator('.ops-options button').last().click()
  await page.locator('.ops-steps button').nth(2).click()
  await page.getByRole('button', { name: /নমুনা mission অনুমোদন/ }).click()
  const tasks = page.locator('.ops-task-list button')
  for (let index = 0; index < await tasks.count(); index++) await tasks.nth(index).click()
  await page.locator('.ops-steps button').nth(3).click()
  await page.getByRole('button', { name: /ভারী বৃষ্টির পূর্বাভাস/ }).click()
  await page.getByRole('button', { name: /জরুরি অবস্থার অনুশীলন/ }).click()
  const checks = page.locator('.ops-task-list button')
  for (let index = 0; index < await checks.count(); index++) await checks.nth(index).click()
  for (const [name, width, height] of [['desktop', 1366, 768], ['mobile', 390, 844]]) {
    await page.setViewportSize({ width, height })
    const metrics = await page.evaluate(() => ({
      viewport: innerWidth,
      document: document.documentElement.scrollWidth,
      caseCount: document.querySelectorAll('.ops-case-picker button').length,
      verified: document.querySelectorAll('.ops-task-list button.done').length,
    }))
    const path = join(tmpdir(), `nagarshield-operations-${name}.png`)
    await page.screenshot({ path, fullPage: true })
    process.stdout.write(`${name}: ${JSON.stringify(metrics)}\n${path}\n`)
    if (metrics.document > metrics.viewport || metrics.caseCount !== 3 || metrics.verified !== 4) process.exitCode = 1
  }
} finally {
  await browser.close()
}
