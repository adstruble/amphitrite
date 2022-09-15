FROM arm64v8/python:3.9.14

RUN useradd amphitrite
WORKDIR /home/amphitrite

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app app
COPY amphitrite.py boot.sh ./
RUN chmod +x boot.sh

RUN chown -R amphitrite:amphitrite ./

USER amphitrite

EXPOSE 5000
ENV FLASK_APP amphitrite.py

#CMD ["flask", "run"]
CMD ["./boot.sh"]
