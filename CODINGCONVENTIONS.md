This document covers ECMAScript coding conventions and style guide for the Spindoctor project and is licenced CC BY-SA 4.0. Feel free to borrow it for your own projects if you find it useful, subject to the terms of that licence. What, you expected non-attribution? I need to publicise this project somehow, and I'm too cool to reddit spam it.

# Programming Principles #

While the intent is that Spindoctor be a functional server for Combadges that can be deployed in a homelab or a hackerspace, it's equally intended as a reference implementation for a Trek-esque Combadge server. Consequently, our coding styles as a project should reflect that intent. More specifically:

## Readability vs Efficiency ##

Spindoctor as a project is not chasing the performant ideal. Wherever possible, we will chase readability, language compliance and elegance over pure performance. That means we'll avoid hacks which are fast but difficult for a layperson to understand. If something is absolutely necessary for the code to operate, we should merge it - but the default position is "there must be a better way".

## Readability vs Brevity ##

In a similar vein to the above, the project biases towards readability over shortness. For example, we generally prefer defined rather than in-line functions, and if someone says "80 character limit" they will get a blank stare. Variable names will be descriptive instead of concise - so `for (let i = 0; i < cars.length; i++)` is not the move - instead `for (let carIndex = 0; carIndex < cars.length; carIndex++)` would be more likely. That said, we're universally going to prefer `cars.forEach()` over either of these. Just because something's shorter doesn't mean it's worse - the important thing is cleanliness and readability.

## Readability vs Documentity ##

I'm going to talk about the importance of Documentation later in this document, and this should not be taken as an excuse to not properly document code, however where there is a "readable" but poorly documented solution and a complex, hard to read but well-documented solution; Readable wins.

## Code should be Classy ##

In case the pun is not clear, `Class()`-y. Wherever it makes sense, we should use Classes to represent objects, not a collection of functions. While the latter is valid JS, and can use similar patterns of inheritence, they're less readable to non-JS coders. Since Classes are standard ECMAScript, we should use them for preference where they are appropriate. Again, this will also prioritise readability over performance - so if it conceptually makes sense for something to be a Class instead of a function then it should be a Class, even if it's a small Class that is slower than just defining the minimal equivalent functions. Probably a good example of this is the `CombadgePacket` subclasses.

## Target ECMAScript Release is "yes" ##

Or less memingly put, whatever the latest version is. At time of writing, that's ES13. That's not to say this code will never be out of date, but if someone notices that something can be re-implemented cleaner using newer ES standards, that is itself a valid reason to implement it.

One caveat on this, is that the code still has to **work**. So, if there's a new ES feature out that NodeJS has not yet implemented, that feature won't get merged until it does. Generally, this is rare - but it's worth noting. An additional note here is that I'm not a qualified pure ECMAScript developer either, and it's probably to be assumed that some non-compliant Javascript will sneak in here and there. However where code is recognised to be non-ES with a valid ES solution available, or a better ES solution is found to existing ES-compliant code then that should be merged.

## Flexibility in it's place, Inflexibility in it's place ##

If you need a practical example of this, you are invited to consider `combadge_packet.mjs`. This is a file with a plethora of Classes defined, each of which has very limited functionality. The code is pretty inflexible, because each class has at most two uses - decode a packet from a communicator, create a packet for a communicator - and it will almost always be called by `Combadge()`. By contrast, the function `externalCallback()` in the `Combadge()` Class does a lot - it's triggered with a lot of different use cases, by different software even - as it's used for the web API as well as for the Agent.

The point is, that where it's appropriate to define something rigidly, that should be done - flexibility for the sake of flexibility is not beneficial. However, flexibility where it makes sense should also be done - and artificial constraint should also be avoided.

## Make good use of inline documentation ##

Where there is a chance of confusion about a Class, Function or line - it should be documented. This is especially true where the function or class will be called with parameters. Is this therefore a hard blocker, where any PR that is not fully documented will automatically fail? No. For one thing, the API of every Class in this software has changed completely at least twice and will probably change a few more before 1.0.0. There's no value in someone spending a month carefully documenting a function that will be rewritten two weeks after merge. That said, expect this to change gradually with an eventual expectation that any changes to mature Modules or Classes will need to be documented accordingly. And in case this is unclear, the intent is that eventually some automatic generator will be used to create an API document on [the project website](https://spindoctor.dev/).

# Collaboration and Process Guidelines #

The most important part of almost any software project is working with others. Whether that's end-users, supervisors or peers. In an open-source project you're likely to hit the trifecta, so it's good to have some general guides on how to work together, and here's ours.

## Issue, Branch, Pull Request, Write, Test, Review, Merge ##

The above should be considered an ideal process to follow to make a change well. Start with an issue - either one that's been raised by someone else or creating a new one to describe the bug/feature you're working on. Then branch mantissa, make a first commit (often a doc change unless it's a small fix!), push and create a PR. Then write the bulk of the work with regular commits so that others can test, review and critique your change, and once the general feel is that it is merge ready, it can be merged!

## Yes, PR is in the correct position in that list ##

The point of a pull request is to allow changes to be vetted before they're merged. Do not present a "perfect" pull request and expect a one-click merge, it should be assumed that changes will always be required. A natural interpretation of this is that you should create pull requests for unfinished, non-functional code and yes - that's an intentional reading. It's far better to get eyes on something early so that discussions can be had and suggestions made - than to get difficult feedback at the end of a very long piece of work that you've sunk your heart into. You should also generally assume that any PR's that are outstanding are completely broken right up until they're merged, especially those written by @mo-g.

This may seem like a somewhat chaotic way of working, but collaboration is always to be preferred to isolation - and seen as beneficial both for code quality for the project and time efficiency for the developer. Feedback is good!

## I shall call him Squishy and he shall be my Squishy! ##

It's a standard practice for the project that each complete change should be a single commit. In other words, get used to the command `git rebase -i origin/mantissa` and typing the letter `f`. That means that individual commits on the repository will be relatively large, and the total number of commits will be relatively small - but it makes stepping through changes to the code in git easier. That said, there's no reason you shouldn't keep a copy of your own commit log, but with a project like this you'll likely find yourself committing, pushing, and then pulling on to a test server quite often. Let us not [speak of @mo-g's commit history](https://xkcd.com/1296/) on unmerged PR's. Consequently, merged commit messages will generally be concise, and descriptive of the whole change, rather than focusing on individual line changes.