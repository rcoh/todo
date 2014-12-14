var React = require("react/addons");
var FireStateMixin = require("./firebase-mixins");
var _ = require("underscore");
var moment = require('moment');
var microdate = require('./micro-date');

var TodoPane = React.createClass({
    mixins: [React.addons.LinkedStateMixin, FireStateMixin],
    readOnly: true,

    getInitialState: function() {
        return { todos: {}, _todo: "", _filter: "", minimized: {} };
    },

    todoChange: function(event) {
        this.setState({_todo: event.target.value});
    },

    parseTags: function(todoText) {
        var tags = todoText.split(",");
        var ret = {
            item: tags.shift(),
            tags: [],
            dateStr: null,
            dateMoment: null
        };


        _.forEach(tags, function(tag){
            var trimmed = tag.trim();
            var dateOfTag = microdate.parseNL(trimmed);
            console.log(dateOfTag);
            if (dateOfTag) {
               ret.dateStr = trimmed;
               ret.dateMoment = dateOfTag;
            } else {
               ret.tags.push(trimmed);
            }
        });
        return ret;
    },

    addTodo: function() {
        var tagInfo = this.parseTags(this.state._todo);
        var newTodo = {
            done: false,
            text: tagInfo.item, // Removes + returns first item of array
            tags: tagInfo.tags,
            dateStr: tagInfo.dateStr,
            dateMoment: microdate.serialize(tagInfo.dateMoment),
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

    toggleMinimized: function(key) {
        this.props.firebasePointer.child("minimized").child(key).transaction(function(v) {
            return !v;
        });
        this.incrementVersion();
    },

    render: function() {
        var self = this;

        var matchingTodos = _.pick(this.state.todos, function(todo) {
            return !todo.deleted && (self.state._filter == "" || self.tagsMatch(todo.tags, self.state._filter));
        });

        var today = moment();
        var todoMap = {}
        var todosWithIds = _.map(matchingTodos, function(value, key) {
            return {id: key, value: value};
        });

        var relativeTodos = _.groupBy(todosWithIds, function(todo) {
            var todoDate = microdate.load(todo.value.dateMoment);
            if (todo.value.dateMoment == null) {
                return "nodate";
            } else if (todoDate.isBefore(today, 'day')) {
                return "before";
            } else if (todoDate.isSame(today, 'day')) {
                return "today";
            } else {
                return "after";
            }
        });

        var sectionOrder = ["before", "today", "after","nodate"];
        var sections = {"before": "Before Today", "today": "Today", "after": "Later", "nodate": "No date"};
        var self = this;
        var renderedSections = _.map(sectionOrder, function(key) {
            var text = sections[key];
            var minimized = self.state.minimized[key];
            var todos = relativeTodos[key];
            if (todos) {
                if (minimized) {
                    todos = [];
                }
                var todoDivs = _.map(todos, function(todoObj) {
                    var todo = todoObj.value;
                    var id = todoObj.id;
                    return <TodoItem removeFunc={self.remove(id)} firebasePointer={self.props.firebasePointer.child("todos/" + id)} remove={self.remove} key={id} /> 
                });

                // TODO: replace with icons
                var plusMinus = minimized ? "+" : "-";

                return <div key={key} className="row">
                    <h4>
                        <span className="plusminus" onClick={_.partial(self.toggleMinimized, key)}>{plusMinus}</span>
                        {text}
                    </h4>
                    {todoDivs}
                </div>;
            } else {
                return <div key={key}></div>
            }
        });
   
        return <div>
            <input type="text" className="todo-input" placeholder="Todo?" value={this.state._todo} onChange={this.todoChange} onKeyDown={this.handleKeyDown} />
            <button onClick={this.addTodo} className="add-button btn btn-success">Add</button>
            <input type="text" className="todo-input filter" placeholder="tag-filter" valueLink={this.linkState('_filter')} />
            <div>
                {renderedSections}
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
            dateMoment: null,
            dateStr: null,
            text: ""
        }
    },

    crossOff: function() {
        this.setState({done: !this.state.done});
    },

    render: function() {
        var className = this.state.done ? "todo-done" : "";
        var doneText = this.state.done ? "Undone" : "Done";
        var tagsText = this.state.tags ? this.state.tags.join(', ') : "";

        var sep = tagsText ? ", " : "";
        var dateTag = this.state.dateStr ? this.state.dateStr + sep: "";
        var tagField = <span>
            <span className="datetag">{dateTag}</span><span>{tagsText}</span>
        </span>
        return <div className="row">
            <div className={className}>
                <div className={className + " col-md-5"}>
                    <input type="checkbox" checked={this.state.done} 
                        onChange={this.crossOff}/>
                    <span className="todo-text">{this.state.text}</span>
                </div>
                <div className="col-md-3">{tagField}</div>
                <div className="col-md-1 clickable" onClick={this.props.removeFunc}>Remove</div>
            </div>
        </div>;

    }
});

module.exports = TodoPane;