FROM node:alpine
RUN mkdir -p /code/tmp
COPY . /code
WORKDIR /code
RUN npm install

#increase heap size to 2 GB
ENV NODE_OPTIONS=--max_old_space_size=2048

#EXPOSE 8086
CMD ["npm", "start"]
