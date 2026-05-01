FROM nginx:alpine
COPY deployment/nginx/cms.conf /etc/nginx/conf.d/default.conf
