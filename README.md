todo
====

A basic, ugly, and mostly functional todo app I created for myself after struggling to find one that fit my specific needs. Current Features:

* Basic todo items with tagging + filtering
* Notes + ace editor + full screen
* Users / login, etc.

## Using It ##
An instance of this is hosted and maintained by me at https://glaring-fire-654.firebaseapp.com/. If a lot of people start using this for some strange reason I may ask for donations. I currently make no claims towards the durability of any data that you put in here (although I do use it myself, so that says something). 

## Developing ##
To contribute, simply clone the repository, then run:
```
# First install node
npm install -g browserify
npm install -g watchify
npm install
rundev.sh
```

`rundev` will run a dev server and will autocompile changes with browserify. If you want to user your own firebase, just change the firebase string in `main.js`.
