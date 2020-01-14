# Description

[NodeJS](https://nodejs.org/en/), a JavaScript interpreter that provides access
to the filesystem and can allow running a web server. This software is built on
*NodeJS 10.15.3 LTS*, downloadable at the provided link. Node comes with a tool
called "NPM", which handles package management some other things.

Also used is [Electron](https://electronjs.org/), a project
that allows NodeJS to run inside the browser. You do not need to install this
because it is installed automatically by NPM.

At the project root, only the `admin` directory contains any code. The rest of the files and
folders are just output and input for the tools; thus, from here on any file
named will assumed to be inside the `admin` directory. The `package.json` file
holds settings, commands, and dependencies related to the project. The
`index.js` file is the startup file for electron.

From within the `admin` directory, execute the command `npm start`. This will
run the `index.js` file with access to the electron API. The first window that
is opened is the *Game Editor*, which is implemented within the `admin`
subdirectory. From the *Server > New Server* menu item, you can open a
different window, which has three buttons (hopefully they are labeled well
enough that they need no explanation). When the *Start Server* button is
clicked, it starts a server running on port 3003 of localhost.

The UI for the client application and the game editor window use a "Virtual
DOM" which allows a more declarative way of updating the browser DOM while
maintaining good performance. Facebook's *React* library uses a virtual DOM
heavily. The `common/vdom.js` is a homemade virtual DOM implementation based on
the [Part
1](https://medium.com/@deathmood/how-to-write-your-own-virtual-dom-ee74acc13060)
and [Part
2](https://medium.com/@deathmood/write-your-virtual-dom-2-props-events-a957608f5c76).

Although many virtual DOM library users also use JSX, which is an extension of
JavaScript that allows using HTML within JS code, it has the downside that it
requires a preprocessor to produce Javascript from this HTML. Instead, we opted
to just use function calls to create a *Domain-Specific Language*. The
important functions are `div`, which allows creating a `<div>` element with a
certain class and a bunch of children.

This virtual DOM library is all you need to understand the client page, but the
game editor code also uses *Lenses*, which is a lesser known programming
pattern. We used [this library](https://github.com/calmm-js/partial.lenses),
the README of which has excessive documentation. Recommended reading also
includes [this
article](https://medium.com/javascript-inside/an-introduction-into-lenses-in-javascript-e494948d1ea5).
We apologize for using this pattern if you find it to esoteric to be productive.
We found it to be pretty helpful, and it allowed us to make a lot of
modifications quite easily. When working at such a high-level of abstraction,
you don't often see code break in odd ways, which is always a pleasant feeling.

If you find these coding styles annoying, you will be refreshed by the server
window code, which uses normal HTML for the UI, since nothing needs to be
dynamic.

