import inspect
import threading
import uuid
from enum import Enum
from multiprocessing.managers import BaseManager, NamespaceProxy
from typing import Dict

from amphi_logging.logger import get_logger
from exceptions.exceptions import SharedStateManagerError

logger = get_logger()


class JobState(Enum):
    InProgress = 1
    Complete = 2
    Failed = 3
    NotFound = 4


class ServerJob(object):

    def __init__(self, state=JobState.InProgress.name):
        self.result: str = ""
        self.state: str = state

    def get_result(self):
        return self.result

    def get_state(self) -> str:
        return self.state


server_jobs: Dict[uuid.UUID, ServerJob] = dict()
server_jobs_pinged: Dict[uuid.UUID, bool] = dict()


def clean_jobs():
    logger.info("Clean jobs outer")
    get_client_manager().clean_jobs()


def clean_jobs_internal():
    global server_jobs
    global server_jobs_pinged
    logger.info("Server jobs pinged: " + str(server_jobs_pinged))

    to_remove = []
    for job_id in server_jobs:
        if job_id not in server_jobs_pinged:
            logger.info(f"Removing job: {job_id}")
            to_remove.append(job_id)
    for remove_id in to_remove:
        server_jobs.pop(remove_id)
    logger.info("Reset server jobs pinged")
    server_jobs_pinged = dict()
    job_cleaner_timer = threading.Timer(300, clean_jobs)
    job_cleaner_timer.start()


def add_server_job(job_id):
    get_client_manager().add_server_job(job_id)


def add_server_job_internal(job_id):
    global server_jobs
    global server_jobs_pinged

    # Add the jobs to pinged first so it doesn't get cleaned
    server_jobs_pinged[job_id] = True
    server_jobs[job_id] = ServerJob()
    logger.info("Added job internal:" + job_id + " " + str(server_jobs))
    logger.info("Server jobs pinged: " + str(server_jobs_pinged))


def check_job(job_id) -> (JobState, [str, dict]):
    job = get_client_manager().check_job(job_id)
    return job.get_state(), job.get_result()


def check_job_internal(job_id):
    """
    Checks status of given job_id if, state is Complete, also removes this job from the
    server_jobs dict.
    :param job_id:
    :return: state and result of job
    """
    global server_jobs
    global server_jobs_pinged
    logger.info("checking job internal:" + job_id + " " + str(server_jobs) + " " + str(server_jobs_pinged))

    job = server_jobs.get(job_id)
    if job is None:
        job = ServerJob(JobState.NotFound.name)
    else:
        server_jobs_pinged[job_id] = True
    if job.get_state() != JobState.InProgress.name:
        try:
            logger.info(f"Removing job: {job_id} with status {job.state}")
            server_jobs.pop(job_id)
        except KeyError:
            logger.info(f"Expected to find job: {job_id} with status {job.state}, but didn't")
    return job


def complete_job(job_id, job_state, result):
    get_client_manager().complete_job(job_id, job_state, result)


def complete_job_internal(job_id, job_state, result):
    try:
        job = server_jobs[job_id]
        job.state = job_state
        job.result = result
        logger.info(f"Completed job: {job_id} with state: {job.state}")
    except KeyError:
        logger.warning(f"Completed job with state {job_state} that is not in server jobs. (job_id = {job_id}")


class SharedStateManager(BaseManager):
    pass


class ProxyBase(NamespaceProxy):
    _exposed_ = ('__getattribute__', '__setattr__', '__delattr__')


class ServerJobProxy(ProxyBase):
    pass


def register_proxy(name, cls, proxy):
    for attr in dir(cls):
        if inspect.ismethod(getattr(cls, attr)) and not attr.startswith("__"):
            proxy._exposed_ += (attr,)
            setattr(proxy, attr,
                    lambda s: object.__getattribute__(s, '_callmethod')(attr))
    SharedStateManager.register(name, cls, proxy)


register_proxy('serverjob', ServerJob, ServerJobProxy)
SharedStateManager.register('add_server_job', add_server_job_internal)
SharedStateManager.register('check_job', check_job_internal, ServerJobProxy)
SharedStateManager.register('complete_job', complete_job_internal)
SharedStateManager.register('clean_jobs', clean_jobs_internal)


def get_client_manager() -> BaseManager:
    """
    Internal helper method to register a new remote manager and connect to it
    :return: Manager instance
    """

    ssm = SharedStateManager(address=('localhost', 54315), authkey=b'authsecret')
    try:
        ssm.connect()
        return ssm
    except Exception as e:
        raise SharedStateManagerError(f"Failed trying to connect to the remote manager: {str(e)}")


def get_server_manager():
    """
    Called by main process to start up the remote Manager
    :return: None
    """
    mm = SharedStateManager(address=('localhost', 54315), authkey=b'authsecret')
    try:
        mm.get_server().serve_forever()
    except OSError as e:
        raise SharedStateManagerError(f"Failed starting LockSchedulerManager server: {str(e)}")

