# syntax=docker/dockerfile:1
FROM debian:bullseye

RUN apt-get update
RUN apt-get install systemd curl python make automake libtool g++ libseccomp-dev git strace openssh-server -y
RUN curl -fs https://raw.githubusercontent.com/mafintosh/node-install/master/install | sh
RUN node-install 16.8.0

# Add the keys and set permissions (uncomment this if cloning from a private repo)
#RUN mkdir -p /root/.ssh
#ADD id_rsa /root/.ssh/id_rsa
#ADD id_rsa.pub /root/.ssh/id_rsa.pub
#RUN chmod 700 /root/.ssh/id_rsa && \
#    chmod 700 /root/.ssh/id_rsa.pub

WORKDIR /app
COPY . .
RUN npm i