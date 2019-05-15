# Github Pom Version Scanner

https://timothyr.github.io/github-pom-version-scanner/ 

A website to scan `pom.xml` files of entire GitHub organizations.  
Intended to check if dependency versions are up-to-date at scale.

![Pom Version Scan Results](docs/screenshot.png?raw=true "Pom Version Scan Results")

## What is a Pom file

A `pom.xml` file describes the configuration and dependencies of a Maven project.  
Maven is a popular build tool for Java applications.  
Read more about Pom files here: https://maven.apache.org/guides/introduction/introduction-to-the-pom.html

## How to use GitHub Pom Version Scanner

1. Go to https://timothyr.github.io/github-pom-version-scanner/  
2. Type in a GitHub org (Specifically one with Java repositories - otherwise there will not be any `pom.xml` file
3. Click scan and all `pom.xml` dependencies and their versions are listed

## Project structure

GitHub API logic is in file `src\pom-version-scanner\scanner.ts`  

This module calls for list of repositories in an org, then scans all of the repositories for `pom.xml` files

## Built with Angular 7

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.3.6.

## Deploy

`./deploy.sh`
