FROM node:24-alpine3.22

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

EXPOSE 7000

CMD ["npm", "run", "start:prod"]
