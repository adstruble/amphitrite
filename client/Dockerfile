FROM node:18.9.0

ENV PATH /app/node_modules/.bin:$PATH


WORKDIR /app
COPY . ./

RUN yarn install
RUN yarn global add react-scripts@5.0.1 


CMD ["yarn", "start"]
