FROM node:18

WORKDIR /app

COPY . .

RUN npm install
RUN npx nest build

EXPOSE 5000

CMD ["node", "dist/main"]