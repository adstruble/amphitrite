#!/usr/bin/env python

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
    client = docker.from_env()
    version = _get_version_tag()
    for component, config in components.items():
        dockerfile_path = os.path.join(os.path.dirname(__file__), config['home_dir'])
        print(dockerfile_path)
        client.images.build(path=dockerfile_path, tag=f"amphitrite/{component}:{version}")


def _get_version_tag():
    with open('VERSION', 'r') as version_file:
        return version_file.read()


if __name__ == '__main__':
    cli()
