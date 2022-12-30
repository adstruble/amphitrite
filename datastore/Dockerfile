FROM postgres:14.6-alpine
ENV POSTGRES_PASSWORD postgres

COPY postgres_config/postgresql.conf      /tmp/postgresql.conf
RUN chmod +r /tmp/postgresql.conf
COPY postgres_config/pg_hba.conf      /tmp/pg_hba.conf
RUN chmod +r /tmp/pg_hba.conf

COPY postgres_config/update_configs.sh      /docker-entrypoint-initdb.d/_updateConfig.sh

EXPOSE 5432
