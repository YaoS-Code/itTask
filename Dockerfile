# -----------------------------
# 阶段1：编译阶段 (build)
# -----------------------------
FROM node:21.5.0 AS build

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install


# 复制源代码
COPY . .

# 如果你还没有在本地执行过 next build，需要在此执行:
RUN npm run build

# -----------------------------
# 阶段2：生产环境镜像 (production)
# -----------------------------
FROM node:21.5.0 AS production

# 设置工作目录
WORKDIR /app

# 复制 package.json & package-lock.json 方便在运行时查看依赖版本
COPY --from=build /app/package*.json ./

# 复制构建产物 & node_modules
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

# 如果有其他需要用到的文件 (如 .env)
# COPY --from=build /app/.env ./

# 暴露5580端口（与 start 脚本 -p 5580 保持一致）
EXPOSE 5580

# 容器启动时执行的命令
CMD ["npm", "run", "start"]
