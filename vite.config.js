import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
// 端口可修改：设环境变量 PORT 即可，例如 PORT=8080 npm run dev；默认 6633
const PORT = Number(process.env.PORT) || 6633

export default defineConfig({
  plugins: [vue()],
  // host: '0.0.0.0' = 监听所有网卡，局域网内其他设备才能通过 http://本机IP:6633 访问
  // （Vite 默认只监听 localhost，局域网是连不进来的）
  server: { host: '0.0.0.0', port: PORT },
})
