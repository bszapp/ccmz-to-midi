const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 1234;
const BASE_DIR = path.resolve(__dirname);

// MIME类型映射
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
    '.otf': 'font/otf',
    '.mp3': 'audio/mpeg',
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.ogg': 'audio/ogg',
    '.wav': 'audio/wav',
    '.pdf': 'application/pdf',
    '.zip': 'application/zip',
    '.gz': 'application/gzip',
    '.txt': 'text/plain; charset=utf-8',
    '.xml': 'application/xml',
    '.ccmz': 'application/octet-stream'
};

function getMimeType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return mimeTypes[ext] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
    // 解析URL
    let pathname = req.url.split('?')[0]; // 移除查询字符串

    try {
        pathname = decodeURIComponent(pathname);
    } catch (e) {
        pathname = req.url.split('?')[0];
    }

    // 移除末尾斜杠（除了根路径）
    if (pathname !== '/' && pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
    }

    // 构造完整的文件路径
    let filePath = path.join(BASE_DIR, pathname);

    // 安全检查：防止目录遍历攻击
    if (!filePath.startsWith(BASE_DIR)) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404');
        return;
    }

    try {
        const stats = fs.statSync(filePath);

        // 如果是目录
        if (stats.isDirectory()) {
            const indexPath = path.join(filePath, 'index.html');
            try {
                const indexStats = fs.statSync(indexPath);
                if (indexStats.isFile()) {
                    // 返回index.html
                    const content = fs.readFileSync(indexPath);
                    res.writeHead(200, { 'Content-Type': getMimeType(indexPath) });
                    res.end(content);
                    return;
                }
            } catch (e) {
                // index.html不存在
            }
            // 返回404
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404');
            return;
        }

        // 如果是文件
        if (stats.isFile()) {
            const content = fs.readFileSync(filePath);
            const mimeType = getMimeType(filePath);

            // 检查查询参数是否要求下载
            const queryString = req.url.split('?')[1] || '';
            const contentDisposition = queryString.includes('download=1')
                ? `attachment; filename="${path.basename(filePath)}"`
                : 'inline';

            res.writeHead(200, {
                'Content-Type': mimeType,
                'Content-Length': content.length,
                'Content-Disposition': contentDisposition,
                'Cache-Control': 'no-cache'
            });
            res.end(content);
            return;
        }

    } catch (e) {
        // 文件不存在
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('404');
        return;
    }
});

server.listen(PORT, 'localhost', () => {
    console.log(`http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ 端口 ${PORT} 已被占用，请更换端口或关闭占用程序`);
    } else {
        console.error('❌ 服务器错误:', err);
    }
    process.exit(1);
});
