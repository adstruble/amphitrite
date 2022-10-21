import math
import random

from flask import Blueprint

tests = Blueprint('tests', __name__)


@tests.route('/')
def index():
	return "Hello, World!"


@tests.route('/getPerson')
def get_person():
	people = ["Evan", "Mandi", "Katherine"]
	return {"person": people[math.floor((random.random() * 1000) % 3)]}
