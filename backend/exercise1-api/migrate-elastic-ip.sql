-- 数据库迁移脚本：为submissions表添加弹性IP字段
-- 如果表已经存在但缺少elastic_ip_address字段，运行此脚本

-- 检查并添加弹性IP字段
DO $$ 
BEGIN
    -- 检查elastic_ip_address字段是否存在
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'submissions' 
        AND column_name = 'elastic_ip_address'
    ) THEN
        -- 添加弹性IP字段
        ALTER TABLE submissions ADD COLUMN elastic_ip_address INET;
        RAISE NOTICE '已添加 elastic_ip_address 字段到 submissions 表';
    ELSE
        RAISE NOTICE 'elastic_ip_address 字段已存在于 submissions 表中';
    END IF;
END $$;

-- 验证字段是否添加成功
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'submissions' 
AND column_name IN ('elastic_ip_address', 'internal_ip_address', 'screenshot_data')
ORDER BY column_name;