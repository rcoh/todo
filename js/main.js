var React = require('react/addons');
var App = require('./app');

var firebasePointer = new Firebase("https://glaring-fire-654.firebaseio.com/");
React.renderComponent(
    <App firebasePointer={firebasePointer}/>,
    document.getElementById('container')
);
