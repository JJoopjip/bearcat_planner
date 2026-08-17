# Dev container for the web build only. There's no Docker path for the real
# iOS app (react-native-health is a native module and prebuild/run:ios needs
# Xcode on a Mac) — see README.md for that. This exists to run `expo start
# --web` without Node installed on the host, since no session working on
# this repo so far has had Node available locally.
FROM node:20-bookworm-slim

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

ENV EXPO_NO_TELEMETRY=1

EXPOSE 8081

CMD ["npx", "expo", "start", "--web", "--port", "8081"]
