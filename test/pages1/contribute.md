## Contribute

### Contents
<!-- MarkdownTOC -->

- [How](#how)
- [Notes](#notes)
- [Annotated Example](#annotated-example)

<!-- /MarkdownTOC -->

<a name="how"></a>
### How
If you would like to help out, just create [JSDoc](http://usejsdoc.org) formatted comment
blocks like the annotated one below. You can submit them as pull requests, email them to me,
or link to a Gist you created. I don't really care, just as long as you follow the formatting
style. I don't want to have to rewrite every comment block I get. If you aren't sure, just
follow the formatting of the blocks I did. Each API should have at least one doc block completed
by me using the proper formatting.

The only tag I would like everyone other than me to add is the __*`@author`*__ tag. I don't want credit for someone else's work, so make sure you give yourself the credit you deserve.

When you're ready to dive in, take a look at the TODO list below. That has most of the required stuff listed.

<a name="notes"></a>
### Notes
1. The pretty syntax highlighting is just to make viewing the source docs on the website a more enjoyable experience.
2. For long URLs, use [Google's URL Shortener](https://goo.gl/). No AdFly or any of that crap.
3. You really should familiarize yourself with [JSDoc](http://usejsdoc.org) before jumping in here. It's kind of important to the whole task of documenting the API.
4. If you're not sure why I have formatted doc blocks the way I have, just ask. I assure you I have good reason (mostly).
5. Try to keep line lengths to 100 characters or less.  
<br/>

<a name="annotated-example"></a>
### Annotated Example
Did I mention that you should be {@link getLevel} familiar with [JSDoc](http://usejsdoc.org) before having a go?

```
// &#9660;&#9660; comment block MUST begin like this (note the two asterisks instead of one)
/**
 *
 * &#64;todo todo tags always go first so they are easy to find when the todo is todone
 *
 * &#64;deprecated use {&#64;link APIName.someOtherFunction} instead
 *
 * &#64;author      Your Name -or- {&#64;link http://yoursite.com|Your Name}
 * &#64;function    functionName
 * &#64;description A description of what the function does. First letter capitalized;
 *              include final punctuation.
 *
 * &#64;param  {type} foo                 - brief description of foo (no caps, no punctuation)
 * &#64;param  {type} [bar=default value] - brief description of the optional (enclosed in [])
 *                                      param 'bar' with a default value provided
 *
 * &#64;return {type}                     - brief description of the return value
 *
 * &#64;example
 * <caption>Credit: {&#64;link https://short_url_from.goo.gl|Suzie Codewriter}</caption> // &#9668; not needed if you wrote the code
 *
 * // code examples MUST begin with a line comment just like this
 * clientMessage("I'm a code example!");
 *
 *////
// &#9650;&#9650; comment block MUST end with 4 forward slashes (used for syntax highlighting regex)
```
