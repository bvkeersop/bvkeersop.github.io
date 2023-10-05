+++
author = "Bart van Keersop"
title = 'Assert Mappings With FluentAssertions'
featuredImage = "images/validate_mappings_with_fluent_assertions/banner.png"
featuredImagePreview = "images/validate_mappings_with_fluent_assertions/banner_thumb.png"
date = 2023-05-10
draft = false
tags = ["C#", "Testing", "FluentAssertions", "Mapping", "UnitTest"]
categories = ["Tutorials", "Programming"]
summary = "Easily validate your mappings using FluentAssertions"
+++

## Introduction

Mapping internal objects to those shared externally through an API is a common practice. The primary goal is to prevent the exposure of sensitive or unnecessary data, thereby reducing payload size. This necessitates the utilization of various techniques, such as mapping classes, methods, or leveraging mapping libraries.

During my time at a client's project, we initially relied on AutoMapper for this purpose but eventually decided to transition away from it. Setting aside my personal concerns about AutoMapper's usefulness, the reasoning behind this decision deserves its own dedicated blog post, a topic I won't explore further here. However, when this choice was made, a member of our development team expressed concerns about ensuring the accuracy of our mappings.

AutoMapper offers a method to address this concern, ensuring that every member of the destination type has a corresponding member in the source type. This can be achieved using the following code snippet:

```C#
var configuration = new MapperConfiguration(cfg =>
  cfg.CreateMap<Source, Destination>());

configuration.AssertConfigurationIsValid();
```

Given these considerations, I embarked on a journey to explore alternative methods for easily ensuring the accuracy of our mappings. The insights and conclusions drawn from this investigation are detailed in this blog post.

## Introducing: Fluent Assertions

The challenge we face with this client is their use of [Shouldly](https://github.com/shouldly/shouldly) in their Unit Tests for writing assertions. While Shouldly is a respectable choice, it falls short in terms of features when compared to [FluentAssertions](https://github.com/fluentassertions/fluentassertions) library. This limitation becomes apparent in various scenarios, particularly when dealing with comparisons involving collections. To illustrate the advantages of using FluentAssertions for your mapping validation, I've prepared two demonstrations.

### Simple mappings

To illustrate how to verify scenarios that use simple mapping, I prepared a very simple demo. This demo contains the exact scenario where AutoMapper's `AssertConfigurationIsValid()` would be used for. We have a `SimpleObject` that we use internally, and a `SimpleObjectDto` that we map to. For demo purposes, this is done by the `SimpleObjectMapper` class. This is the simplest scenario out there. **All** properties are mapped, and they have the **same** property name.

```C#
public class SimpleObject
{
    public string Shape { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}
```

```C#
public class SimpleObjectDto
{
    public string Shape { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
}
```

```C#
public class SimpleObjectMapper
{
    public static SimpleObjectDto Map(SimpleObject simpleObject) => new()
    {
        Shape = simpleObject.Shape,
        Color = simpleObject.Color,
    };
}
```

We can validate the mapping is done correctly by writing a unit test.
When we use Shouldly, the following test fails:

```C#
[TestMethod] // This test will fail, done for demo purposes
public void Map_Shouldly_AssertWithEquivalentTo()
{
    // Act
    var result = SimpleObjectMapper.Map(_simpleObject);

    // Assert
    // This does not work, as Shouldly expecteds the objects to be of the same type
    result.ShouldBeEquivalentTo(_simpleObject);
}
```

According to Shouldly, the two objects aren't equivalent to each other, as they're not of the same type!
We could use the following work around:

```C#
[TestMethod]
public void Map_Shouldly_AssertEverythingManually()
{
    // Act
    var result = SimpleObjectMapper.Map(_simpleObject);

    // Assert
    result.Shape.Should().Be(_simpleObject.Shape);
    result.Color.Should().Be(_simpleObject.Color);
}
```

This is acceptable as we only have two properties, but in real-life scenarios, there's often alot more.

According to FluentAssertions, the objects aren't equal, but they are equivalents. This makes asserting straight-forward mappings much easier.

```C#
[TestMethod]
public void Map_FluentAssertions_AssertWithEquivalentTo()
{
    // Act
    var result = SimpleObjectMapper.Map(_simpleObject);

    // Assert
    result.Should().BeEquivalentTo(_simpleObject);
}
```

### Complex mappings

Mapping scenarios often aren't as straight-forward as the example provided earlier. Some properties may have different names, while others might undergo data transformation. So, how do we approach such situations? It turns out that FluentAssertions offers excellent support in such cases as well.

To illustrate this, consider a scenario where we have a `User` object used internally and a corresponding `UserDto` object intended for API exposure. Naturally, we want to shield the Password property from exposure. Additionally, the Username property is actually referred to as `DisplayName` on the Dto. Furthermore, we choose not to expose the `FirstName` and `LastName` properties on the `UserDto` but instead present a consolidated `FullName` property.

```C#
public class User
{
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateOnly DateOfBirth { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Country { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string FavoriteAssertionFramework { get; set; } = string.Empty;
}
```

```C#
public class UserDto
{
    public string Username { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public DateOnly BirthDay { get; set; }
    public string Country { get; set; } = string.Empty;
    public string Gender { get; set; } = string.Empty;
    public string FavoriteAssertionFramework { get; set; } = string.Empty;
}
```

```C#
public class UserMapper
{
    public static UserDto Map(User user) => new()
    {
        Username =  user.Username,
        FullName = $"{user.FirstName} {user.LastName}",
        Email = user.Email,
        BirthDay = user.DateOfBirth,
        Country = user.Country,
        Gender = user.Gender,
        FavoriteAssertionFramework = user.FavoriteAssertionFramework,
    };
}
```

We could assert every property manually again. There's nothing inherently wrong with this approach, but it's quite verbose.

```C#
[TestMethod]
public void Map_FluentAssertions_AssertEverythingManually()
{
    // Act
    var result = UserMapper.Map(_user);

    // Assert
    result.DisplayName.Should().Be(_user.Username);
    result.FullName.Should().Be($"{_user.FirstName} {_user.LastName}");
    result.Email.Should().Be(_user.Email);
    result.DateOfBirth.Should().Be(_user.DateOfBirth);
    result.Country.Should().Be(_user.Country);
    result.Gender.Should().Be(_user.Gender);
    result.FavoriteAssertionFramework.Should().Be(_user.FavoriteAssertionFramework);
}
```

An easier way to do this is to use `.Should().BeEquivalentTo()` like in the simple mapping, but provide a lambda to configure to neccesary options.
`ExcludingMissingMembers()` makes sure the `.Should().BeEquivalentTo()` doesn't throw an exception because `FirstName`, `LastName` and `Fullname` are not present on both objects.
`.WithMapping()` tells FluentAssertions that the `Username` property is actually mapped to the `DisplayName` property. Properties that are completely different, like `Fullname` are the only ones required to be asserted manually.
This can save you quite some time if you're dealing with large classes with alot of properties. For even more options, check out the [Object Graphs](https://fluentassertions.com/objectgraphs/) page in the documentation.

```C#
[TestMethod]
public void Map_FluentAssertions_AssertWithEquivalentTo()
{
    // Act
    var result = UserMapper.Map(_user);

    // Assert
    result
        .Should()
        .BeEquivalentTo(_user, options => options
            // Exclude properties that are not present on BOTH objects (FirstName, LastName, Fullname)
            .ExcludingMissingMembers()
            // Property names are different, state that Username is mapped to Displayname
            .WithMapping<UserDto>(e => e.Username, s => s.DisplayName));

    result.FullName.Should().Be($"{_user.FirstName} {_user.LastName}");
}
```

## Conclusion

Simplify your mapping validation with FluentAssertions. If you're currently using Shouldly, this could be a good reason to think about switching to FluentAssertions. And if you're still using Microsoft's built-in assertion tools, it's definitely worth considering this upgrade!

Visit [Fluent Assertions](https://fluentassertions.com/), and be sure to show your support by giving them a star on Github. Version 7.0 is in development, and it's an open-source project led by passionate developers! Are you impressed by FluentAssertions' validation options? Are you thinking about using it, or are you already using it? Or do you have other ideas for how to handle mapping validation? Feel free to share your thoughts!

## Github

As always, you can find the example code used for this blog post on my [Github](https://github.com/bvkeersop/MappingAssertionDemo).