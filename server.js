import { createServer } from "vite";
import { BLOG_HOST, DEV_SERVER_PORT } from "./blog.config.js";

// `npm start -- example.hatenablog.com` で開発用ブログを一時的に切り替えられる
const blogHost = process.argv[2] ?? BLOG_HOST;

const server = await createServer({
  server: {
    port: DEV_SERVER_PORT,
    // 別のテーマの開発サーバーがポートを使っていると、ブログには別テーマのCSSが読み込まれてしまう。
    // 別のポートへ逃げずに起動を失敗させて気づけるようにする
    strictPort: true,
    cors: {
      origin: `https://${blogHost}`,
    },
  },
  plugins: [
    {
      name: "configure-server",
      configureServer: (server) => {
        server.middlewares.use((_req, res, next) => {
          res.setHeader("access-control-allow-private-network", "true");
          next();
        });
      },
    },
  ],
});

await server.listen();
console.log(`  開発用ブログ: https://${blogHost}`);
server.printUrls();
server.bindCLIShortcuts({ print: true });
