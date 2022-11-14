#!/usr/bin/env python3

import click
import docker
import os

from docker.errors import BuildError

components = {'client': {'home_dir': 'client'},
              'server': {'home_dir': 'amphitrite'},
              'datastore': {'home_dir': 'datastore'}}


@click.group()
def cli():
    pass


@cli.command()
@click.option('--forcerm', default=True, help="Force removal of all containers even with build failure")
def build_all(forcerm):
    click.echo("Building...")
    for component, config in components.items():
        print(component)
        _build_component(component, forcerm)


@cli.command()
@click.option('--component', '-c', help="Component to be build")
@click.option('--forcerm', default=True, help="Force removal of all containers even with build failure")
def build_component(component, forcerm):
    click.echo(f"Building component: {component}... ")
    _build_component(component, forcerm)


def _build_component(component, forcerm: bool):
    try:
        config = components[component]
    except KeyError:
        click.echo(f'Component: {component} does not exist. Exiting.')
        exit(1)

    client = docker.from_env()
    version = _get_version_tag()
    dockerfile_path = os.path.join(os.path.dirname(__file__), config['home_dir'])
    print(dockerfile_path)
    try:
        client.images.build(path=dockerfile_path, tag=f"amphitrite/{component}:{version}", rm=True, forcerm=forcerm)
    except BuildError as e:
        print(e)


def _get_version_tag():
    with open('VERSION', 'r') as version_file:
        return version_file.read()


if __name__ == '__main__':
    cli()
