FROM postgres:16.3-alpine
ENV POSTGRES_PASSWORD postgres

COPY postgres_config/psqlrc    /tmp/psqlrc
RUN chmod +r /tmp/psqlrc
COPY postgres_config/postgresql.conf      /tmp/postgresql.conf
RUN chmod +r /tmp/postgresql.conf
COPY postgres_config/pg_hba.conf      /tmp/pg_hba.conf
RUN chmod +r /tmp/pg_hba.conf

RUN mkdir -p /usr/local/etc/postgresql && chown postgres:postgres /usr/local/etc/postgresql
COPY postgres_config/psqlrc /usr/local/etc/postgresql/psqlrc
RUN chown postgres:postgres /usr/local/etc/postgresql/psqlrc

COPY postgres_config/update_configs.sh      /docker-entrypoint-initdb.d/_updateConfig.sh


EXPOSE 5432
