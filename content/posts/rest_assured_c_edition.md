+++
author = "Bart van Keersop"
title = "REST Assured: C# Edition – Making Web API communication fun again!"
featuredImage = "images/rest_assured_c_edition/banner.png"
featuredImagePreview = "images/rest_assured_c_edition/banner.png"
date = 2023-09-28
draft = false
tags = ["Web development", "C#", "REST API", "HTTP", "NSwag", "Flurl", "RestEase", "RestSharp", "Refit"]
categories = ["Tutorials", "Programming"]
summary = "Learn how to create or generate clients for RESTful communication"
+++

## Introduction

In today's world of software development, communication between services is more important than ever. As we move away from monolithic architectures towards microservices, RESTful communication over HTTP has become one of the standards. If you're working with C#, this often means dealing with the challenges of setting up HTTP clients, ensuring correct URIs, and handling payload serialization and deserialization.

In this blog post, we'll explore a variety of solutions to simplify and streamline REST communication in C#. Whether you're building a new web API or connecting to existing services, we'll show you different approaches to make this process not just easier but also enjoyable.

From manual client creation to using popular libraries like NSwag, Flurl, RestEase, Refit, and even automated client generation through NSwag, I'll provide insights into each method's pros and cons. By the end, you'll have a clear understanding of which approach suits your specific project requirements, saving you time and effort. So, let's dive in and make web API communication fun again!

## Manually creating a client

### Introduction

.NET offers its own HttpClient implementation, which serves as a versatile tool for sending HTTP requests. It boasts an array of configuration options and supports various usage patterns. To ensure the smooth and resilient handling of HttpClients, it is advisable to leverage Microsoft's HttpClientFactory, as neglecting to do so can lead to potential issues. Fortunately, you can simplify the registration of an HttpClient, which utilizes HttpClientFactory under the covers, in your dependency injection container using readily available extension methods.

If you're curious about the inner workings and need in-depth information, you can refer to the [official documentation](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/implement-resilient-applications/use-httpclientfactory-to-implement-resilient-http-requests). For this example, I will be employing the [Typed Client](https://learn.microsoft.com/en-us/dotnet/architecture/microservices/implement-resilient-applications/use-httpclientfactory-to-implement-resilient-http-requests#how-to-use-typed-clients-with-ihttpclientfactory) approach, as it offers a clean and efficient method of implementation.

### Code example

So first off, let's start by looking at how you can manually create an HTTP client. Like in all the other examples, I implemented the `GetAsync()` and `PostAsync()` methods, which make a call to the WeatherForecast controller. 
Both methods use manually created extension methods to make the code more concise. `GetDeserializedContent()` is used for deserializing and `ToJsonHttpContent()` for serializing. This logic can be re-used across different clients.

```C#
public class ManualWeatherForecastClient : IManualWeatherForecastClient
{
    private readonly string _weatherForecast = "WeatherForecast";
    private readonly HttpClient _httpClient;

    public ManualWeatherForecastClient(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public async Task<IEnumerable<WeatherForecast>> GetAsync(string location)
    {
        var subUrl = $"{_weatherForecast}/GetWeatherForecasts?location={location}";
        var response = await _httpClient.GetAsync(subUrl);
        response.EnsureSuccessStatusCode();
        var deserializedContent = await response.GetDeserializedContent<IEnumerable<WeatherForecast>>();

        if (deserializedContent is null)
        {
            return Enumerable.Empty<WeatherForecast>();
        }

        return deserializedContent;
    }

    public async Task PostAsync(WeatherReport weatherReport)
    {
        var subUrl = $"{_weatherForecast}/CreateWeatherReport";
        var httpContent = weatherReport.ToJsonHttpContent();
        var response = await _httpClient.PostAsync(subUrl, httpContent);
        response.EnsureSuccessStatusCode();
    }
}
```

The dependency injection is straightforward. Call `AddHttpClient()` on your servicecollection, and provide the interface and the implementation as generic parameters. You can then call this method by passing in an action that takes an HttpClient as a parameter, and configures it.

```C#
public static IServiceCollection AddManualWeatherForecastClient(
    this IServiceCollection services, Action<HttpClient> configureClient)
{
    services.AddHttpClient<IManualWeatherForecastClient, ManualWeatherForecastClient>(configureClient);
    return services;
}
```

### Verdict

Creating a client manually may not be all that bad; it provides the highest degree of control, although it requires more effort on your part. Fortunately, once you've established the necessary extension methods, the amount of code you need to write becomes considerably less. While manual creation does grant you maximum control, we wouldn't be discussing these alternatives in this blog if there weren't faster and more efficient approaches available!

:(far fa-face-smile): The most control, flexibility, and configuration options.

:(far fa-face-frown): You have to write everything yourself.

## Creating a client using RestSharp

### Introduction

As of the time of writing, [RestSharp](https://Github.com/restsharp/RestSharp) boasts 9.2k stars on Github, the most of all the libraries we discuss here. With its repository having been initiated in November 2009. It experienced a period of inactivity from 2015 to 2020, but in recent years, the project has seen renewed maintenance efforts. Notably, the library has been updated to utilize Microsoft's HttpClient internally, addressing a previous concern that deterred some users. Originally, RestSharp was created quite some time ago to simplify interactions with [WebClient](https://learn.microsoft.com/en-us/dotnet/api/system.net.webclient?view=net-7.0). However, with the availability of Microsoft's HttpClient, is RestSharp still a worthwhile choice today?

### Code example

Instead of injecting an `HttpClient`, you inject RestSharp's own `RestClient`. You then use the `RestRequest` class to build your request, and receive RestSharp's `RestResponse`.

```C#
public class RestSharpWeatherForecastClient : IRestSharpWeatherForecastClient
{
    private readonly string _weatherForecast = "WeatherForecast";
    private readonly RestClient _restClient;

    public RestSharpWeatherForecastClient(RestClient restClient)
    {
        _restClient = restClient;
    }

    public async Task<IEnumerable<WeatherForecast>> GetAsync(string location)
    {
        var subUrl = $"{_weatherForecast}/GetWeatherForecasts";
        var request = new RestRequest(subUrl)
            .AddParameter("location", location);

        var response = await _restClient.ExecuteGetAsync<IEnumerable<WeatherForecast>>(request);

        if (!response.IsSuccessful)
        {
            throw new HttpRequestException(
                "Something went wrong while retrieving weather forecasts", 
                null, 
                statusCode: response.StatusCode);
        }

        if (response.Data is null)
        {
            return Enumerable.Empty<WeatherForecast>();
        }

        return response.Data;
    }

    public async Task PostAsync(WeatherReport weatherForecast)
    {
        var subUrl = $"{_weatherForecast}/CreateWeatherReport";
        var json = JsonSerializer.Serialize(weatherForecast);
        var request = new RestRequest(subUrl).AddJsonBody(json);

        var response = await _restClient.ExecutePostAsync(request);

        if (!response.IsSuccessful)
        {
            throw new HttpRequestException("Something went wrong while creating a weather report", 
            null,
            statusCode: response.StatusCode);
        }
    }
}
```

Configuring the Dependency injection container works a bit differently as RestSharp depends on RestClient instead of HttpClient. Restclient takes a ConfigureRestClient delegate, that we pass our configureClient action. 

```C#
 public static IServiceCollection AddRestSharpWeatherForecastClient(
    this IServiceCollection services, 
    Action<RestClientOptions> configureClient)
{
    var configure = new ConfigureRestClient(configureClient);
    var restClient = new RestClient(configure);

    services
        .AddScoped<IRestSharpWeatherForecastClient, RestSharpWeatherForecastClient>()
        .AddScoped(sp => restClient);

    return services;
}
```

### Verdict

Despite its longevity and high star rating, I'm not particularly fond of it. I find myself writing more code compared to when I manually create a Typed Client. Setting up the calls didn't strike me as intuitive, leading me to consult the documentation repeatedly. It's worth noting that they do offer some features to simplify authentication, so perhaps I'm not fully realizing its potential here.

:(far fa-face-smile): Simplifies some of the work like serialization, deserialization, and authentication.

:(far fa-face-frown): API wasn't always clear to me, I found myself having to look at the docs for simple things.

:(far fa-face-frown): I feel like it's more work than writing a typed client.

:(far fa-face-frown): Every time a new endpoint gets added, I have to update my client.

## Creating a client using Flurl

### Introduction

As of the time of writing, [Flurl](https://Github.com/tmenier/Flurl) has 3.7k stars on Github, the repository was created at February, 2014. Flurl, short for Fluent URL, lives up to its name. Through the use of extension methods, you can seamlessly chain together an HttpRequest, and it works like a charm!

### Code example

You can simply define a URL as a string, and call extension methods on it such as `AppendPathSegment()` and `SetQueryParam()`. When you're done you can send the request with methods such as `GetJsonAsync()` or `PostJsonAsync()`.

```C#
public class FlurlWeatherForecastClient : IFlurlWeatherForecastClient
{
    private readonly FlurlWeatherForecastClientOptions _options;

    public FlurlWeatherForecastClient(IOptions<FlurlWeatherForecastClientOptions> options)
    {
        _options = options.Value;
    }

    public async Task<IEnumerable<WeatherForecast>> GetAsync(string location)
    {
        var result = await _options.WeatherControllerUri
            .AppendPathSegment("GetWeatherForecasts")
            .SetQueryParam("location", location)
            .GetJsonAsync<IEnumerable<WeatherForecast>>();

        if (result is null)
        {
            return Enumerable.Empty<WeatherForecast>();
        }

        return result;
    }

    public async Task PostAsync(WeatherReport weatherReport)
    {
        var result = await _options.WeatherControllerUri
            .AppendPathSegment("CreateWeatherReport")
            .PostJsonAsync(weatherReport);

        if (result.StatusCode != (int)HttpStatusCode.OK)
        {
            throw new HttpRequestException(
                "Something went wrong while creating a weather report", 
                null,
                statusCode: (HttpStatusCode)result.StatusCode);
        }
    }
}
```

As Flurl doesn't depend on injecting an HttpClient, but on building up the request fluently on an URI, we have to make sure the URI is available in the client class. If we want to make this configurable, I chose to use the [Options Pattern](https://learn.microsoft.com/en-us/aspnet/core/fundamentals/configuration/options?view=aspnetcore-7). I also added an options validation class, so we can make sure the URI is provided on startup.


```C#
public static IServiceCollection AddFlurlWeatherForecastClient(
    this IServiceCollection services,
    Action<FlurlWeatherForecastClientOptions> configureOptions)
{
    services.AddScoped<IFlurlWeatherForecastClient, FlurlWeatherForecastClient>();

    return services
        .Configure(configureOptions)
        .AddSingleton<
            IValidateOptions<FlurlWeatherForecastClientOptions>, 
            FlurlWeatherForecastClientOptionsValidator>();
}
```

### Verdict

The code is quite concise, and the library's fluent syntax, coupled with Intellisense support, renders it user-friendly. We're writing even less code compared to the other options we've looked at. Can we make it even simpler?

:(far fa-face-smile): The fluent API looks very clean and is self-explanatory to use.

:(far fa-face-frown): There's still a lot of manual work involved.

:(far fa-face-frown): Every time a new endpoint gets added, I have to update my client.

## Creating a client using Refit

### Introduction

As of the current writing, [Refit](https://Github.com/reactiveui/refit) has 7.5k stars on GitHub, and the repository was created in July 2013. Refit takes a distinctive approach compared to the alternatives we've examined thus far. Instead of writing code directly, we express our intentions using an interface and attributes. Refit then leverages these declarations to automatically generate a client.

### Code examples

Refit operates quite simple: you craft an interface and annotate it with some attributes. This approach substantially reduces the effort required because you're spared from crafting the implementation yourself, Refit steps in to generate it for you. The primary task on your end involves annotating the methods within your interface with the appropriate HttpVerb (Get/Post/Put/Delete). These attributes accept parameters for the suburl, which, in turn, employ templating to replace specific segments of the URL with parameters drawn from the method. For instance, you can observe how the 'location' parameter is employed within the `GetAsync()` method.
 
```C#
public interface IRefitWeatherForecastClient
{
    [Get("/WeatherForecast/GetWeatherForecasts?location={location}")]
    Task<IEnumerable<WeatherForecast>> GetAsync(string location);

    [Post("/WeatherForecast/CreateWeatherReport")]
    Task PostAsync(WeatherReport weatherForecast);
}
```

Setting up the dependency injection container is also rather easy, as refit provides an `AddRefitClient()` extension method. Configuring the HttpClient works through the `ConfigureHttpClient()` extension method which Refit also provides.

```C#
public static IServiceCollection AddRefitWeatherForecastClient(
    this IServiceCollection services, 
    Action<HttpClient> configureClient)
{
    services
        .AddRefitClient<IRefitWeatherForecastClient>()
        .ConfigureHttpClient(configureClient);
    return services;
}
```

### Verdict

Refit is super user-friendly and will definitely speed up your development. Instead of manually coding everything, we just tell it what we need, and Refit handles all the heavy lifting!

:(far fa-face-smile): Clients get mostly automatically generated!

:(far fa-face-frown): Still have to define an interface and expand it every time you need to call a new endpoint.

## Creating a client using RestEase

### Introduction

At the time of writing this [RestEase](https://Github.com/canton7/RestEase) has 1k stars on Github, the repository was created in May, 2015.

### Code example

RestEase is inspired by Refit, and the influence is evident. To be honest, I had trouble pinpointing significant distinctions between the two libraries, they essentially fulfill the same role. One notable difference is that RestEase requires the use of attributes for parameters, which seems rather trivial.

```C#
public interface IRestEaseWeatherForecastClient
{
    [Get("/WeatherForecast/GetWeatherForecasts?location={location}")]
    Task<IEnumerable<WeatherForecast>> GetAsync([Path] string location);

    [Post("/WeatherForecast/CreateWeatherReport")]
    Task PostAsync([Body] WeatherReport weatherForecast);
}
```

RestEase works similarly to Refit here as well, just call the provided `AddRestEaseClient()` method. Note that we're only passing in the baseUri rather than a configureClient action, as that's the only thing we currently want to configure. If you want more control over the HttpClient configuration, RestEase also provides a `ConfigureHttpClient()` extension method just like Refit.

```C#
public static IServiceCollection AddRestEaseWeatherForecastClient(
    this IServiceCollection services, string baseUri)
{
    services.AddRestEaseClient<IRestEaseWeatherForecastClient>(baseUri);
    return services;
}
```

### Verdict

RestEase is pretty much in the same ballpark as Refit; they cater to the same needs. Both libraries appear to be feature-packed, making it a bit of a toss-up when it comes to recommending one over the other!

:(far fa-face-smile): Clients get mostly automatically generated!

:(far fa-face-frown): Still have to define an interface and expand it every time you need to call a new endpoint.

## Generating a client through NSwag

### Introduction

At the time of writing this [NSwag](https://Github.com/restsharp/RestSharp) has 6.1k stars on Github, and was created in November, 2015.

Nswag works a bit differently from what we've talked about so far. To create clients with NSwag you don't have to write any code at all! NSwag uses the [OpenAPI](https://swagger.io/specification/) (formerly known as swagger) of your application to generate a client. This means that when you expand your controller with a new endpoint, you don't have to write any code at all... just generate a new OpenAPI specification and a client from that!

While this is by far the quickest method, it does have its downsides. While you don't have to code to generate a client, you do need to set up the NSwag toolchain in your solution. While NSwag offers plenty of ways to configure your generated clients to your needs, it can take a while to find the correct option to tweak.

### Code example

So how do you set up client generation in NSwag? Let me guide you through it!

#### Step 1: Generate an OpenAPI specification.

NSwag generates it's client based on an OpenAPI specification that it receives as input. So to generate a client, we need to generate an OpenAPI specification first. You could do this by manually running a CLI tool, but we're going to automate it so that our OpenAPI specification automatically gets updated when we build our project.

##### 1.1 Enable the use of Swashbuckle.AspNetCore.Cli

This is the CLI tool that reads your controllers and generates an OpenAPI specification.

To use this tool in our build, we need to first create a new tool manifest. The command below creates a `.config` directory with a `dotnet-tools.json` file.

```powershell
dotnet new tool-manifest
```

Next up, we install the `dotnet cli tool`, enabling the swagger command inside our solution.

```powershell
dotnet tool install Swashbuckle.AspNetCore.Cli
```

Finally, perform a dotnet tool restore to make the tool available.

```powershell
dotnet tool restore
```

##### 1.2 Add an MSBuild Task to generate an OpenAPI specification

To automatically execute a CLI command when building a project, we can use a [MSBuild task](https://learn.microsoft.com/en-us/visualstudio/msbuild/msbuild-task?view=vs-2022). Add the code below to your Api project's csproj file. This MSBuild task executes `dotnet tool run swagger tofile`, which scans your controllers and generates an OpenAPI specification, by using the tool we installed in the previous step.

```xml
<Target Name="GenerateOpenApiSpec" AfterTargets="Build">
	<Exec 
        Command="dotnet tool run swagger tofile --output openapi3.json $(OutputPath)$(AssemblyName).dll v1" 
        WorkingDirectory="$(ProjectDir)" />
</Target>
```

#### Step 2: Enable NSwag

Now that we automatically generate the OpenAPI specification that NSwag needs to generate a client, we need to set up the actual generation of this client. This is done in a similarly.

##### 2.1: Install the NSwag.MSBuild NuGet package

To start using NSwag, you're going to need to install the `NSwag.MSBuild` NuGet package. This enables you to run the `nswag run` CLI command in a MsBuild task. You can use the NuGet package manager to install `NSwag.MSBuild`, or add the following to your csproj file. Be sure the select a compatible version!

```xml
<PackageReference Include="NSwag.MSBuild" Version="13.20.0">
```

##### 2.2: Add an MSBuild Task to generate the NSwag Client

As we did for the generation of the OpenAPI specification, add this MSBuild task to generate a client when building the project. This MSBuild task executes the `nswag run` command, accepting a json configuration file called `nswag.json` which we will add in the last step.

```xml
<Target Name="GenerateNSwagClients" BeforeTargets="Build">
    <Exec Command="$(NSwagExe_Net60) run nswag.json" />
</Target>
```

#### 2.3: Add the nswag.json configuration file

NSwag requires a json configuration file to generate a client. Inside this file are multiple options you can configure to influence the generation of your client. It's quite a long file, so I'll leave it out for brevity, but here is a [link to the file in my Github repository](https://Github.com/bvkeersop/RestClientExamples/blob/main/src/RestClientExamples.NSwag/nswag.json). You can use this file as a starting point for your client.

#### Step 4: Build your solution!

Since we have added MSBuild tasks to generate the OpenApi specification and generate a client based on the generated specification. Building your solution will automatically generate the client! If you have separate project files for your API and your Client (which I would recommend if you want to package the client), make sure the API project is built first, so the OpenApi specification is generated. NSwag needs this file to generate a client. The client should now be generated and written to a `GeneratedClient.cs` file.

If you have some trouble getting this to work, be sure to check out my [RestClientExamples Github repository](https://Github.com/bvkeersop/RestClientExamples/tree/main) as it contains a working example.

### Verdict

The setup is definitely more difficult than the other options out there, but once it's done, you don't have to do any coding anymore! NSwag will automatically update your client when you add new endpoints to your controller. Pack your client as a NuGet package and publish it, and everyone will be able to easily connect to your API.

:(far fa-face-smile): Clients get fully automatically generated and updated! No manual work!

:(far fa-face-smile): Tons of configuration options, including options to override the generation templates when needed.

:(far fa-face-smile): Make a NuGet Package out of your generated client, and services can easily communicate with your service!

:(far fa-face-smile): Also supports the generation of typescript clients (although I haven't tested this!)

:(far fa-face-frown): The initial setup and configuration can be difficult.

:(far fa-face-frown): Only supports JSON (No XML support).

## Investigated alternatives

There are alternative packages that offer similar functionalities to the ones previously discussed, but they either lack essential features or have fallen out of active maintenance. This is why I have chosen to focus on the aforementioned options. One alternative provided by Microsoft for client generation is [AutoRest](https://Github.com/Azure/autorest). However, I do not recommend its use for a couple of reasons. Firstly, client generation with AutoRest is significantly slower when compared to NSwag. Secondly, it relies on JavaScript in addition to .NET, which can be less convenient. If you are considering a code generation approach, NSwag is the preferable choice over AutoRest.

## Performance Test

I executed a performance test to see how the various clients stack up against each other, and the test results are displayed below:
![Client performance test](images/rest_assured_c_edition/performance-test.png)
Interestingly, the manual client appears to be the fastest for both GET and POST calls. This could be attributed to its non-generic nature, which results in more concise code. It's worth noting that I didn't specifically optimize the manual client for performance, so there may still be room for further enhancements if necessary.

Both NSwag and Flurl also deliver great performance. The remaining clients are somewhat slower, with RestSharp notably trailing behind by approximately 20% to 30%.

## Conclusion

In conclusion, selecting the right approach for implementing REST communication between your services in C# is not a one-size-fits-all decision. Your choice should be guided by the specific context and your personal preferences.

For those looking for a streamlined solution with automatic client generation, NSwag, along with NuGet publishing, can be a time-saving choice. It's particularly advantageous when working in an environment with multiple APIs that require intercommunication. Additionally, it can be handy when dealing with external applications that provide OpenAPI specifications for client generation.

If your use case involves calling a single endpoint or lacks an OpenAPI specification, Refit and RestEase are both excellent alternatives with similar functionality. They offer simplicity and ease of use.

For rapid MVP or demo development, Flurl stands out for its user-friendly fluent syntax.

On the other hand, RestSharp, despite being the oldest and highly starred, may not be the most intuitive or performant choice, often requiring a substantial amount of code, even compared to the manual implementation.

Finally, don't overlook creating a client manually and developing reusable extension methods! is a valid option for those who require fine-grained control.

To summarize, asess your specific situation and consider factors such as the environment and personal preferences when selecting the most suitable approach. Share your preferred tools and any plans to explore other options after exploring this blog post!

## Github repository

All the code used in the examples is available in my [Github repository](https://Github.com/bvkeersop/RestClientExamples).