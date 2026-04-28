FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001

# Railway передает порт через переменную окружения PORT.
CMD ["npm", "start"]
