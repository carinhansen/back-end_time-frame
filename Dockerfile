FROM node:10-alpine
ADD . /code
WORKDIR /code
RUN npm install
CMD ["npm", "start"]