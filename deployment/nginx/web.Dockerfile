FROM nginx:alpine
COPY deployment/nginx/web.conf /etc/nginx/conf.d/default.conf
