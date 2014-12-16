var React = require('react/addons');
var _ = require("underscore");

var Login = require('./login');
var NotesPane = require('./notes');
var TodoPane = require('./todo');
var FireStateMixin = require("./firebase-mixins");
var log = require('./logging');


var App = React.createClass({
    componentDidMount: function() {
        
    },

    getInitialState: function() { 
        var auth = this.props.firebasePointer.getAuth() 
        return {
            isLoggedIn: auth,
            uid:  auth ? auth.uid : null
            // TODO: separate react component for login
        }
    },

    onLogin: function(authInfo) {
        log.info(authInfo)
        this.setState({isLoggedIn: true, uid: authInfo.uid});
    },

    logout: function() {
        this.props.firebasePointer.unauth();
        location.reload();
    },

    render: function() {
        if (this.state.isLoggedIn) {
            return <div className="container-fluid toplevel">
                <div className="row">
                    <div className="notes-pane col-md-6">
                        <NotesPane firebasePointer={this.props.firebasePointer.child(this.state.uid).child("notes-pane")} />
                    </div>
                    <div className="todo-pane col-md-5">
                        <TodoPane firebasePointer={this.props.firebasePointer.child(this.state.uid).child("todo-pane")} />
                    </div>
                    <div className="logout col-md-1">
                        <button className="btn btn-warning" onClick={this.logout}>Logout</button>
                    </div>
                </div>
            </div>;
        } else {
            return <Login firebasePointer={this.props.firebasePointer} onLogin={this.onLogin} />
        }
    }
});


module.exports = App;
