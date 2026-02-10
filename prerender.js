import puppeteer from 'puppeteer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import http from 'node:http';
import handler from 'serve-handler';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5000;

// 1. 启动一个临时静态服务器来读取 dist 目录
const server = http.createServer((request, response) => {
    return handler(request, response, { public: 'dist' });
});

server.listen(PORT, async () => {
    console.log(`🚀 临时服务器已启动: http://localhost:${PORT}`);

    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // 2. 访问临时服务器
        await page.goto(`http://localhost:${PORT}`, { waitUntil: 'networkidle0' });

        // 3. 等待 React 渲染完成（检查 root 里面是否有内容）
        await page.waitForSelector('#root > *', { timeout: 10000 });

        // 4. 获取抓取到的 HTML
        const content = await page.content();

        // 5. 写回 dist/index.html
        fs.writeFileSync(path.join(__dirname, 'dist/index.html'), content);

        console.log('✅ 预渲染成功！React 界面已写入 index.html');

        await browser.close();
    } catch (err) {
        console.error('❌ 预渲染出错:', err);
    } finally {
        server.close();
        console.log('👋 临时服务器已关闭');
        process.exit(0);
    }
});