FROM python:3.11.1

RUN useradd amphitrite
WORKDIR /home/amphitrite

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY src src
RUN chmod +x src/app/boot.sh

RUN chown -R amphitrite:amphitrite ./

USER amphitrite

EXPOSE 5001

#CMD ["flask", "run"]
CMD ["src/app/boot.sh"]
