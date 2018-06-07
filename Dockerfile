FROM node:8-alpine
ADD . /code
WORKDIR /code
RUN npm install
CMD ["npm", "start"]