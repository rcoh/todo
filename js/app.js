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

    getInitialState: function() {
        return { todos: [], _todo: "", _filter: "" };
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
        this.state.todos.push({
            done: false,
            text: todoArray.shift(), // Removes + returns first item of array
            tags: todoArray
        });
        this.setState({todos: this.state.todos, _todo: ""});
    },

    crossOff: function(index) {
        var self = this;
        return function() {
            var indexUpdate = {}
            indexUpdate[index] = {done: {$apply: function(v) { return !v; }}};
            var newState = React.addons.update(self.state, {todos: indexUpdate});
            console.log(newState);
            self.setState(newState);
        };
    },

    remove: function(index) {
        var self = this;
        return function() {
            var withItemRemoved = React.addons.update(self.state.todos, {$splice: [[index,1]]});
            console.log("with item removed:", withItemRemoved);
            //self.state.todos.splice(index, 1);
            //self.forceUpdate();
            self.setState({todos: withItemRemoved});
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
        var matchingTodos = _.filter(this.state.todos, function(todo) {
            //console.log(todo);
            return todo && (self.state._filter == "" || self.tagsMatch(todo.tags, self.state._filter));
        });

        var todoDivs = matchingTodos.map(function(todo, index) {
            return <TodoItem done={todo.done} text={todo.text} tags={todo.tags} index={index}
                      crossOff={self.crossOff} remove={self.remove} key={index} /> 
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
    propTypes: {
        done: React.PropTypes.bool,
        text: React.PropTypes.string,
        tags: React.PropTypes.array,
        index: React.PropTypes.number,
        crossOff: React.PropTypes.func,
        remove: React.PropTypes.func,
    },

    render: function() {
        var className = this.props.done ? "todo-done" : "";
        var doneText = this.props.done ? "Undone" : "Done";
        var tagsText = this.props.tags? this.props.tags.join(', ') : "";
        return <div className="row">
            <div className={className}>
                <div className={className + " col-md-5"}>
                    <input type="checkbox" defaultChecked={this.props.done} 
                        onClick={this.props.crossOff(this.props.index)}/>
                    <span className="todo-text">{this.props.text}</span>
                </div>
                <div className="col-md-3">{tagsText}</div>
                <div className="col-md-1 clickable" onClick={this.props.remove(this.props.index)}>Remove</div>
            </div>
        </div>;

    }
});



module.exports = App;
