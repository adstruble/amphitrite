#!/usr/bin/env python3

import click
import docker
import os

components = {'client': {'home_dir': 'client'},
              'server': {'home_dir': 'amphitrite'},
              'datastore': {'home_dir': 'datastore'}}


@click.group()
def cli():
    pass


@cli.command()
def build_all():
    click.echo("Building...")
    for component, config in components.items():
        print(component)
        _build_component(component)


@cli.command()
@click.option('--component', '-c', help="Component to be build")
def build_component(component):
    click.echo(f"Building component: {component}... ")
    _build_component(component)


def _build_component(component):
    try:
        config = components[component]
    except KeyError:
        click.echo(f'Component: {component} does not exist. Exiting.')
        exit(1)

    client = docker.from_env()
    version = _get_version_tag()
    dockerfile_path = os.path.join(os.path.dirname(__file__), config['home_dir'])
    print(dockerfile_path)
    client.images.build(path=dockerfile_path, tag=f"amphitrite/{component}:{version}")


def _get_version_tag():
    with open('VERSION', 'r') as version_file:
        return version_file.read()


if __name__ == '__main__':
    cli()
