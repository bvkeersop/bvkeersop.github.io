+++
author = "Bart van Keersop"
title = 'Managing secrets for local development'
featuredImage = "images/managing_secrets_for_local_development/banner.png"
featuredImagePreview = "images/managing_secrets_for_local_development/banner_thumb.png"
date = 2023-05-10
draft = true
tags = ["C#", "Configuration", "Secrets"]
categories = ["Tutorials", "Programming"]
summary = "A guide to manage your local secrets"
+++

## Introduction

When working on applications you often need to connect to other applications. In order to do this in a safe way, we use secrets. When deploying an application to production, these secrets are passed to the application in the form of configuration. When automated in a pipeline, this is often done by pulling the secrets from a keyvault and setting them as environmental variables. This works great! But how do we access these secrets in a safe way when developing locally? We can't check them, or the credentials to a keyvault in to source control, and we don't want to paste them into our configuration, appsettings or code everytime we work on an application!

Luckily for us, there's multiple ways to go about this. Microsoft provides some out of the box options that with a little tweaking, can be used quite easily!

## Using the secret manager tool

### Introduction

https://learn.microsoft.com/en-us/aspnet/core/security/app-secrets?view=aspnetcore-7.0&tabs=windows

Managing your secrets with the secret manager tool is the recommended approach. It hides implementation details, such as where and how the values are stored. You can use the tool without knowing these implementation details. The values are stored in a JSON file in the local machine's user profile.

You can use the command line to manage your secrets quite easily:

```powershell

dotnet user-secrets init

dotnet user-secrets set "Movies:ServiceApiKey" "12345" --project "C:\apps\WebApp1\src\WebApp1"

```

That's it! But if that's all there is to it? Why did I feel the need to write a blog post about it? Well, just using the above implementation works great, but there's a few caveats.

1. When onboarding a new member, you don't know what secrets you have to set using above command for the application to work.
2. Everytime you want to set a new secret, you have to run a command.
3. I have to do this for multiple projects.

### Implementation

Let's make what I explained above easier by scripting it. In order to give new developers an idea of what secrets need to be set, I'd like to provide them with a template file. This file will contain the keys that can be expanded with the secret values.
Every project can use a different template file, making the script re-usable across projects. I also want to automate the execution of this script, so whenever the application is deployed locally, the secrets are updated.

DO NOT CHECK YOUR SECRETS FILE INTO SOURCE CONTROL!!!

## Creation a secrets configuration provider

An other option is to create a secret configuration provider yourself. I wouldn't recommend this approach since this is basically what the secret manager tool abstracts away for you. I wanted to demonstrate it regardless to give you a better understanding of what actually happens. This approach can also be used if you need to fetch configuration from another place aswell! For more information, check the microsoft documentation on [Configuration Providers](https://learn.microsoft.com/en-us/dotnet/core/extensions/configuration-providers).


### Conclusion

Use the secret manager tool when dealing with secrets, and don't check your secrets into source control! You won't be 