FROM node:16

RUN apt-get update
RUN apt-get install -y libgd-dev
RUN apt-get install -y groff

WORKDIR /npiet

ADD https://www.bertnase.de/npiet/npiet-1.3f.tar.gz ./
RUN tar -xf npiet-1.3f.tar.gz
WORKDIR npiet-1.3f
RUN ./configure
RUN make
RUN make install

WORKDIR /piet-executor

ENV NODE_ENV=production

COPY ["package.json", "package-lock.json", "./"]

RUN npm ci

COPY . .

EXPOSE 3000

CMD [ "npm", "start" ]