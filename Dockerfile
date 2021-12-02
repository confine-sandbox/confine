# syntax=docker/dockerfile:1
FROM debian:bullseye

RUN apt-get update
RUN apt-get install systemd curl python make automake libtool g++ libseccomp-dev git strace -y
RUN curl -fs https://raw.githubusercontent.com/mafintosh/node-install/master/install | sh
RUN node-install 16.8.0

RUN mkdir /cores
WORKDIR /app
COPY . .
RUN npm i