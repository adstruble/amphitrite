FROM node:24.0.0 as build-stage

ENV PATH /app/node_modules/.bin:$PATH

WORKDIR /app

COPY package.json yarn.lock /app/
RUN yarn install

RUN yarn global add react-scripts@5.0.1

RUN yarn global add sass-embedded@1.56.1
RUN yarn global add reactstrap@9.1.5
RUN yarn global add classnames@2.3.2

COPY . ./

RUN yarn build

FROM nginx:1.15

COPY --from=build-stage /app/build/ /usr/share/nginx/html

COPY ./nginx_prod.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
