+++
author = "Bart van Keersop"
title = 'Stop Using Public Classes'
featuredImage = "images/stop_using_public_classes/banner.png"
featuredImagePreview = "images/stop_using_public_classes/banner_thumb.png"
date = 2023-12-19
draft = false
tags = ["C#", "Tutorials", "Fundamentals"]
categories = ["Tutorials", "Fundamentals"]
summary = "Why you should embrace the default internal access modifier"
+++

# Introduction

Today, let's delve into a common practice that might be causing more harm than good in your C# projects – the widespread inclination to default classes to public. Now, I'll confess, the title is a bit clickbaity, and the correct statement should probably be, "Stop defaulting to public classes." While it's easy to just mark everything as `public`, I'm here to argue why you should embrace the `internal` access modifier.

# The Internal Modifier: A Brief Overview

To kick things off, let's clarify the purpose of the internal access modifier according to [Microsoft's documentation](https://learn.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/access-modifiers) it allows access within the same assembly but not from external assemblies. This means internal types or members can be accessed only by code within the same compilation.

In the realm of Object-Oriented Programming, we're no strangers to the concept of "Encapsulation" – hiding internal state and functionality, permitting access solely through designated functions. While we religiously apply this principle on an object level, it's time to question why we often neglect it on an assembly level.

# The Predicament of Overexposure

Now, you might wonder, why bother with assembly encapsulation? Two words: "Breaking Changes." Anything marked as public is fair game for external assemblies, and altering a class intended for internal use can wreak havoc in assemblies that reference it. This issue becomes particularly pronounced when your assembly is exposed as a NuGet package, leaving you in the dark about what classes others might reference.

Consider a straightforward scenario: a project generating toys, with a `CLI component` interacting with users and a `ToyCreator module` handling toy creation. The `RandomToyCreator` class implements the `ICreateToys` interface, relying on the `EnumRandomizer` class with an unintended `public` modifier.

```C#
public class RandomToyCreator : ICreateToys
{
    private readonly IEnumRandomizer _enumRandomizer;

    public RandomToyCreator(IEnumRandomizer enumRandomizer)
    {
        _enumRandomizer = enumRandomizer;
    }

    public IEnumerable<Toy> CreateToys(int numberOfToys) => 
        Enumerable.Range(1, numberOfToys)
        .Select(_ => CreateToy());

    public Toy CreateToy() => new()
    {
        ToyType = _enumRandomizer.GetRandomEnumValue<ToyType>(),
        Color = _enumRandomizer.GetRandomEnumValue<Color>()
    };
}

public class EnumRandomizer : IEnumRandomizer
{
    private readonly Random _random;

    public EnumRandomizer()
    {
        _random = new Random();
    }

    public TEnum GetRandomEnumValue<TEnum>() where TEnum : Enum
    {
        if (!typeof(TEnum).IsEnum)
        {
            throw new ArgumentException("Type parameter must be an enumeration type.");
        }

        Array enumValues = Enum.GetValues(typeof(TEnum));
        int randomIndex = _random.Next(enumValues.Length);

        return (TEnum)enumValues.GetValue(randomIndex)!;
    }
}
```

This design flaw exposes the `EnumRandomizer` class when it should have remained internal. If changes are needed in the EnumRandomizer logic, it becomes a breaking change for any assembly referencing it, complicating updates without causing unintended side effects.

Even though this example is easy, it's important to understand that not sticking to this rule can make things get messy quickly. Small changes are okay, but in real situations, changes can be complicated and hard to handle.

A nugget of wisdom here: start with everything internal. Gradually make elements public as needed, guided by the compiler's friendly reminder of ["Inconsistent accessibility"](https://learn.microsoft.com/en-us/dotnet/csharp/fundamentals/tutorials/oop).

# Unit Tests and InternalsVisibleTo
"But Bart," you may protest, "how can I test internal classes if they're not public?" Fear not! Enter InternalsVisibleTo, a nifty attribute that allows access to internal members for testing purposes. You can apply it at the class level or, for a more project-wide approach, include it in your .csproj fil as follows:

```C#
<ItemGroup>
    <AssemblyAttribute Include="System.Runtime.CompilerServices.InternalsVisibleToAttribute">
    <_Parameter1>Foo.Bar.Test.Unit</_Parameter1>
    </AssemblyAttribute>
</ItemGroup>
```

For more details, check out this [informative blog post](https://www.meziantou.net/declaring-internalsvisibleto-in-the-csproj.htm).

# Conclusion

1. Embrace the Default: Classes are internal by default for a reason; resist the urge to make them public without necessity.
2. Testing Wisdom: Utilize InternalsVisibleTo to test your internal classes effectively.
3. Compiler as a Guide: When exposing functionality, let the compiler be your compass, guiding you to mark only what needs to be public.

I'm curious to see how maybe developers already do this. For those who don't, was this convincing enough? Let me know and feel free to ask questions!

# Github

As always, you can explore a practical example in the [accompanying project](https://github.com/bvkeersop/InternalClassModifierExample) on my GitHub. Happy coding!