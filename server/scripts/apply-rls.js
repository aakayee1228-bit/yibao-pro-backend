/**
 * 执行 RLS 策略到 Supabase 数据库
 * 运行命令: node server/scripts/apply-rls.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.COZE_SUPABASE_URL
const supabaseKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY || process.env.COZE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function executeSQL(sql) {
  console.log('执行 SQL:', sql.substring(0, 50) + '...')

  try {
    // 使用 rpc 执行 SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error('SQL 执行失败:', error)
      return false
    }

    console.log('✅ SQL 执行成功')
    return true
  } catch (error) {
    console.error('SQL 执行异常:', error)

    // 如果 rpc 不可用，尝试直接查询
    try {
      // 这种方法可能不适用于所有 Supabase 实例
      console.log('尝试直接执行...')
      return false
    } catch (e) {
      console.error('直接执行也失败:', e)
      return false
    }
  }
}

async function main() {
  console.log('开始应用 RLS 策略...')

  // 1. 添加 user_id 字段
  const tables = ['quotes', 'customers', 'products', 'merchants']

  for (const table of tables) {
    console.log(`\n处理表: ${table}`)

    // 添加 user_id 字段
    const addColumnSQL = `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS user_id TEXT`
    await executeSQL(addColumnSQL)

    // 启用 RLS
    const enableRLSSQL = `ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`
    await executeSQL(enableRLSSQL)

    // 创建 SELECT 策略
    const selectPolicySQL = `DROP POLICY IF EXISTS "Users can view own ${table}" ON ${table}; CREATE POLICY "Users can view own ${table}" ON ${table} FOR SELECT USING (user_id = auth.uid()::text)`
    await executeSQL(selectPolicySQL)

    // 创建 INSERT 策略
    const insertPolicySQL = `DROP POLICY IF EXISTS "Users can insert own ${table}" ON ${table}; CREATE POLICY "Users can insert own ${table}" ON ${table} FOR INSERT WITH CHECK (user_id = auth.uid()::text)`
    await executeSQL(insertPolicySQL)

    // 创建 UPDATE 策略
    const updatePolicySQL = `DROP POLICY IF EXISTS "Users can update own ${table}" ON ${table}; CREATE POLICY "Users can update own ${table}" ON ${table} FOR UPDATE USING (user_id = auth.uid()::text)`
    await executeSQL(updatePolicySQL)

    // 创建 DELETE 策略（merchants 不需要 delete）
    if (table !== 'merchants') {
      const deletePolicySQL = `DROP POLICY IF EXISTS "Users can delete own ${table}" ON ${table}; CREATE POLICY "Users can delete own ${table}" ON ${table} FOR DELETE USING (user_id = auth.uid()::text)`
      await executeSQL(deletePolicySQL)
    }
  }

  console.log('\n✅ RLS 策略应用完成')
  console.log('\n⚠️ 重要提示:')
  console.log('1. 由于 Supabase 限制，上述 SQL 可能无法直接通过 RPC 执行')
  console.log('2. 请手动在 Supabase SQL Editor 中执行以下命令：')
  console.log('3. 或者使用 psql 命令行工具连接数据库执行')
}

main().catch(console.error)
