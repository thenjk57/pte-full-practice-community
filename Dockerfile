FROM node:22-alpine AS builder

RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js server_transport.js evaluator.js pte_scoring.js site_access.js ./
COPY database ./database
COPY content ./content
COPY public ./public
COPY scripts/audio_receipt.py scripts/generate_audio_bulk.py ./scripts/

# Always create a clean template, never copy a candidate's database.
ARG INCLUDE_FULL_BANK=false
RUN node database/seed.js \
    && case "$INCLUDE_FULL_BANK" in \
         true) node database/generate_mock_bank.js \
           && python3 -m venv /tmp/tts \
           && /tmp/tts/bin/pip install --no-cache-dir edge-tts==7.2.3 \
           && /tmp/tts/bin/python -u scripts/generate_audio_bulk.py \
           && node database/generate_mock_bank.js --verify-media ;; \
         false) ;; \
         *) echo "INCLUDE_FULL_BANK must be true or false" >&2; exit 1 ;; \
       esac \
    && mkdir -p bootstrap \
    && mv database/practice.db bootstrap/practice.db \
    && rm -f database/practice.db-*

FROM node:22-alpine AS runtime
ENV NODE_ENV=production \
    PTE_HOST=0.0.0.0 \
    PORT=3000 \
    PTE_DATA_DIR=/data
WORKDIR /app
COPY --from=builder --chown=node:node /app /app
RUN mkdir -p /data/uploads/audio && chown -R node:node /data
USER node
EXPOSE 3000
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e 'const headers = process.env.PTE_SITE_PASSWORD ? {Authorization: "Basic " + Buffer.from("practice:" + process.env.PTE_SITE_PASSWORD).toString("base64")} : {}; require("http").get({host: "127.0.0.1", port: process.env.PORT || 3000, path: "/api/tests", headers}, r => {r.resume(); process.exit(r.statusCode === 200 ? 0 : 1);}).on("error", () => process.exit(1));'
CMD ["node", "server.js"]
