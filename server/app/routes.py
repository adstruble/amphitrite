from app import app

import math
import random


@app.route('/')
@app.route('/index')
def index():
	return "Hello, World!"


@app.route('/getPerson')
def get_person():
	people = ["Evan", "Mandi", "Katherine"]
	return {"person": people[math.floor((random.random() * 1000) % 3)]}

