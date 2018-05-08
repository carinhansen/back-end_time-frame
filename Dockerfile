FROM node:9-alpine
ADD . /code
WORKDIR /code
RUN npm install
CMD ["npm", "start"]