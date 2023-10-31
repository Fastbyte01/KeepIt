<p align="center">
<a href="https://codefund.io/properties/513/visit-sponsor">
<img src="https://codefund.io/properties/513/sponsor" />
</a>
</p>

# preval.macro

This is a [`babel-plugin-macros`][babel-plugin-macros] macro for
[`babel-plugin-preval`][babel-plugin-preval].

Please see those projects for more information.

## Installation

This module is distributed via [npm][npm] which is bundled with [node][node] and
should be installed as one of your project's `devDependencies`:

```
npm install --save-dev preval.macro
```

You'll also need to install and configure
[`babel-plugin-macros`][babel-plugin-macros] if you haven't already.

## Usage

Once you've
[configured `babel-plugin-macros`](https://github.com/kentcdodds/babel-plugin-macros/blob/master/other/docs/user.md)
you can import/require `preval.macro`. For example:

```js
import preval from 'preval.macro'

const one = preval`module.exports = 1 + 2 - 1 - 1`
```

**Note**:

[`babel-plugin-preval`][babel-plugin-preval] allows you to have a few more APIs
than you have with this macro, but this macro comes with all the benefits of
using [`babel-plugin-macros`][babel-plugin-macros] (which you can read about in
the `babel-plugin-macros` docs).

[npm]: https://www.npmjs.com/
[node]: https://nodejs.org
[babel-plugin-macros]: https://github.com/kentcdodds/babel-plugin-macros
[babel-plugin-preval]: https://github.com/kentcdodds/babel-plugin-preval
