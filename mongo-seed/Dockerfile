FROM mongo:4.0
COPY *.json ./
COPY schema.js .
COPY seed-entrypoint.sh .
ENTRYPOINT [ "./seed-entrypoint.sh" ]
