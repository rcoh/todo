var React = require('react/addons');
var _ = require("underscore");

var Login = require('./login');
var NotesPane = require('./notes');
var FireStateMixin = require("./firebase-mixins");


var App = React.createClass({
    componentDidMount: function() {
        
    },

    getInitialState: function() { 
        return {
            isLoggedIn: this.props.firebasePointer.getAuth()
            // TODO: separate react component for login
        }
    },

    onLogin: function(authInfo) {
        this.setState({isLoggedIn: true});
    },

    render: function() {
        if (this.state.isLoggedIn) {
            return <div className="container-fluid toplevel">
                <div className="row">
                    <div className="notes-pane col-md-6">
                        <NotesPane firebasePointer={this.props.firebasePointer.child("notes-pane")} />
                    </div>
                    <div className="todo-pane col-md-6">
                        <TodoPane firebasePointer={this.props.firebasePointer.child("todo-pane")} />
                    </div>
                </div>
            </div>;
        } else {
            return <Login firebasePointer={this.props.firebasePointer} onLogin={this.onLogin} />
        }
    }
});

var TodoPane = React.createClass({
    mixins: [React.addons.LinkedStateMixin, FireStateMixin],
    readOnly: true,

    getInitialState: function() {
        return { todos: {}, _todo: "", _filter: "" };
    },

    todoChange: function(event) {
        this.setState({_todo: event.target.value});
    },

    parseTags: function(todoText) {
        var tags = todoText.split(",");
        return _.map(tags, function(tag){
            return tag.trim();
        });
    },

    addTodo: function() {
        var todoArray = this.parseTags(this.state._todo);
        var newTodo = {
            done: false,
            text: todoArray.shift(), // Removes + returns first item of array
            tags: todoArray,
            version: 1
        };
        this.setState({_todo: ""});
        var newTodoRef = this.props.firebasePointer.child("todos").push();
        newTodoRef.set(newTodo);
        this.incrementVersion();
    },

    remove: function(id) {
        var self = this;
        return function() {
            //alert("hey")
            //var withItemRemoved = React.addons.update(self.state.todos, {$splice: [[index,1]]});
            //console.log("with item removed:", withItemRemoved);
            //self.state.todos.splice(index, 1);
            //self.forceUpdate();
            //self.setState({todos: withItemRemoved});
            self.props.firebasePointer.child("todos").child(id).update({"deleted": true});
            self.incrementVersion();
        };
    },

    handleKeyDown: function(e) {
        if (e.key === 'Enter') {
            this.addTodo();
        }
    },

    tagsMatch: function(tags, filter) {
        return _.some(tags, function(tag) { return tag.indexOf(filter) == 0 });
    },

    render: function() {
        //console.log("rendering todo.", this.state.todos.length);
        var self = this;
        console.log(this.state.todos);
        //debugger;
        var matchingTodos = _.pick(this.state.todos, function(todo) {
            console.log(todo);
            return !todo.deleted && (self.state._filter == "" || self.tagsMatch(todo.tags, self.state._filter));
        });

        var todoDivs = _.map(matchingTodos, function(todo, id) {
            console.log(id)
            return <TodoItem removeFunc={self.remove(id)} firebasePointer={self.props.firebasePointer.child("todos/" + id)} remove={self.remove} key={id} /> 
        });
        return <div>
            <input type="text" className="todo-input" placeholder="Todo?" value={this.state._todo} onChange={this.todoChange} onKeyDown={this.handleKeyDown} />
            <button onClick={this.addTodo} className="add-button btn btn-success">Add</button>
            <input type="text" className="todo-input filter" placeholder="tag-filter" valueLink={this.linkState('_filter')} />
            <div>
                {todoDivs}
            </div>
        </div>;
    }
});

var TodoItem = React.createClass({
    mixins: [FireStateMixin],
    propTypes: {
        removeFunc: React.PropTypes.func.isRequired
    },

    getInitialState: function() {
        return {
            done: false,
            tags: [],
            text: ""
        }
    },

    crossOff: function() {
        this.setState({done: !this.state.done});
    },

    render: function() {
        var className = this.state.done ? "todo-done" : "";
        var doneText = this.state.done ? "Undone" : "Done";
        var tagsText = this.state.tags? this.state.tags.join(', ') : "";
        return <div className="row">
            <div className={className}>
                <div className={className + " col-md-5"}>
                    <input type="checkbox" checked={this.state.done} 
                        onClick={this.crossOff}/>
                    <span className="todo-text">{this.state.text}</span>
                </div>
                <div className="col-md-3">{tagsText}</div>
                <div className="col-md-1 clickable" onClick={this.props.removeFunc}>Remove</div>
            </div>
        </div>;

    }
});

module.exports = App;
