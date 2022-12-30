#!/usr/bin/env python3
import os

from flask import Flask

from blueprints import test
from blueprints import login
from exceptions.exceptions import AmphitriteEnvironmentError

app = Flask(__name__)

app.config['SECRET_KEY'] = os.getenv('AMPHI_JWT_SECRET_KEY', 'my_precious')
if app.config['SECRET_KEY'] is None:
    raise AmphitriteEnvironmentError("AMPHI_JWT_SECRET_KEY environment variable must be set on host. "
                                     "Exiting amphitrite server start.")

app.register_blueprint(test.tests)
app.register_blueprint(login.login)

if app.config['DEBUG']:
    APPLICATION_ROOT = '/amphitrite'
    # Relevant documents:
    # http://werkzeug.pocoo.org/docs/middlewares/
    # http://flask.pocoo.org/docs/patterns/appdispatch/
    from werkzeug.serving import run_simple
    from werkzeug.middleware.dispatcher import DispatcherMiddleware
    # Load a dummy app at the root URL to give 404 errors.
    # Serve app at APPLICATION_ROOT for localhost development.
    application = DispatcherMiddleware(Flask('dummy_app'), {
        "/amphitrite": app,
    })
    run_simple('localhost', 5001, application, use_reloader=True)

