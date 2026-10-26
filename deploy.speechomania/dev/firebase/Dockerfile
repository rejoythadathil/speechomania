FROM node:22-alpine
RUN npm install -g firebase-tools@15.34.1
WORKDIR /srv
COPY firebase.json .firebaserc start.sh ./
EXPOSE 9099 4000
CMD ["sh", "/srv/start.sh"]
