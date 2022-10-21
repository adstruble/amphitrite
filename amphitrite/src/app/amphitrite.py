#!/usr/bin/env python3
from flask import Flask

from blueprints import test

app = Flask(__name__)

app.register_blueprint(test.tests)

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
    run_simple('localhost', 5000, application, use_reloader=True)

