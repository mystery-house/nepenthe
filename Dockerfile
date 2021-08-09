FROM node:14-buster-slim
ENV NODE_ENV=production
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN apt-get update && apt install -y lilypond && npm install --production --silent && mv node_modules ../
COPY . .
CMD ["/bin/bash"]

