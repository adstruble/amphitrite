#!/usr/bin/env python3
import glob

import click
import docker
import os
from string import Template

from docker.errors import BuildError

components = {'client': {'home_dir': 'client', 'base_image': 'amphitrite/client'},
              'server': {'home_dir': 'amphitrite', 'base_image': 'amphitrite/server'},
              'datastore': {'home_dir': 'datastore', 'base_image': 'amphitrite/datastore'}}


@click.group()
def cli():
    pass


@cli.command()
@click.option('--forcerm', default=True, help="Force removal of all containers even with build failure")
def build_all(forcerm):
    click.echo("Building...")
    version = _get_version_tag()
    for component, config in components.items():
        print(component)
        _build_component(component, forcerm, version)
    generate_compose_files(version)


@cli.command()
@click.option('--component', '-c', help="Component to be build")
@click.option('--forcerm', default=True, help="Force removal of all containers even with build failure")
def build_component(component, forcerm):
    click.echo(f"Building component: {component}... ")
    version = _get_version_tag()
    _build_component(component, forcerm, version)
    generate_compose_files(version)


def generate_compose_files(version: str):
    compose_templates = os.listdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dockerfiles'))
    for template in compose_templates:
        generate_compose_file(template, version)


def _build_component(component, forcerm: bool, version: str):
    try:
        config = components[component]
    except KeyError:
        click.echo(f'Component: {component} does not exist. Exiting.')
        exit(1)

    client = docker.from_env()
    dockerfile_path = os.path.join(os.path.dirname(__file__), config['home_dir'])

    try:
        client.images.build(path=dockerfile_path, tag=f"amphitrite/{component}:{version}", rm=True, forcerm=forcerm)
    except BuildError as e:
        build_log = ""
        for log in e.build_log:
            build_log += log.get('stream', '')
        print(build_log)


def generate_compose_file(template_file: str, version: str):
    """
    Generate a Docker Compose file from template with version-tagged images

    Args:
        template_file: Name of the template file
        version: Version number to append to image tags
    """
    output_file = template_file.replace(".template.", ".")
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), output_file)
    template_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dockerfiles', template_file)

    # Create variables dictionary with versioned images
    variables = {}
    for service in components:
        variables[f'{service.upper()}_IMAGE'] = f'{components[service]["base_image"]}:{version}'

    # Read and substitute template
    with open(template_path, 'r') as f:
        template_content = f.read()

    template = Template(template_content)
    output_content = template.substitute(variables)

    # Write output file
    with open(output_path, 'w') as f:
        f.write(output_content)

    print(f"Generated {output_file} with version {version}")
    return output_path


def _get_version_tag():
    with open('VERSION', 'r') as version_file:
        return version_file.read().rstrip('\r\n')


if __name__ == '__main__':
    cli()
