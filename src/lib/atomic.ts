import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * 原子写入：先写临时文件再改名，避免读到写了一半的内容。
 * 临时文件放在项目根目录的 .tmp/ 下，不能放进内容目录，
 * 否则 Astro 的内容监听器会把它当成一篇文章并报警告。
 */
export async function writeAtomic(filePath: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });

  const tempDir = path.resolve(process.cwd(), '.tmp');
  const tempPath = path.join(
    tempDir,
    `${path.basename(filePath)}.${process.pid}.${Date.now()}.tmp`,
  );

  try {
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(tempPath, content, 'utf8');
    await fs.rename(tempPath, filePath);
    return;
  } catch {
    // 跨磁盘或目标被占用时退回下一步
    await fs.rm(tempPath, { force: true }).catch(() => {});
  }

  try {
    await fs.rm(filePath, { force: true });
    await fs.rename(tempPath, filePath);
  } catch {
    await fs.writeFile(filePath, content, 'utf8');
  }
}

