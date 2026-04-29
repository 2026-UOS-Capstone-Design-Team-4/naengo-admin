# 1. Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# 의존성 설치를 위해 package.json 복사
COPY package*.json ./
RUN npm install

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 2. Production Stage (Nginx)
FROM nginx:stable-alpine

# 빌드 결과물을 Nginx 기본 경로로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 커스텀 Nginx 설정 적용
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
