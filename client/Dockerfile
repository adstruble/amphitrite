FROM node:24.0.0 as build-stage

ENV PATH /app/node_modules/.bin:$PATH

WORKDIR /app

COPY package.json yarn.lock /app/
RUN yarn install

COPY . ./

RUN yarn build

FROM nginx:1.15

COPY --from=build-stage /app/build/ /usr/share/nginx/html

COPY ./nginx_prod.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
