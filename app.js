/** @jsx React.DOM */
var React = require('react/addons');
var Login = require('./login');
var AceEditor = require('./react-ace');
var _ = require("underscore");

var FireStateMixin = {
	propTypes: {
		firebasePointer: React.PropTypes.object.isRequired,
	},

	version: 0,
    persistedVersion: -1,

    getSyncState: function() {
        if (this.version > this.persistedVersion) {
            console.log(this.version, this.persistedVersion);
            return "lagging";
        } else if (this.version == this.persistedVersion) {
            return "sync";
        } else {
            return "error";
        }
    },

	getInitialState: function() { return {
		hackToLetStateBeEmpty: true,
	}},

    componentDidMount: function() {
    	var self = this;
    	this.props.firebasePointer.on("value", function(snapshot) {
    		var snapshotVal = snapshot.val();
    		if (snapshotVal == null) {
    			console.warn("Null version: ", self);
    			return
    		}
    		var snapshotVersion = snapshotVal.version;
    		delete snapshotVal.version;
    		if (self.isMounted() && snapshotVersion > self.version) {
    			console.log("updating version: ", snapshotVersion);
    			self.version = snapshotVersion;
    			self.needsPersist = false;
    			self.setState(snapshotVal);
    			if (snapshotVal == null) {
    				var publics = publicVals(this.state);
    				console.warn("snapshut is null, what should I do?", publics);
    			}
    		}
    	});
    },

    publicVals: function(state) {
    	return _.pick(state, function(value, key) {
    		return !key.indexOf("_") == 0;
    	});	
    },

    componentDidUpdate: function(prevProps, prevState) {

    	if (_.isEqual(prevState, this.state)) {
    		console.log("states equal");
    		return;
    	}

    	if (this.readOnly) {
    		console.log("read only")
    		return;
    	}
    	if (!this.needsPersist) {
    		this.needsPersist = true;
    		return;
    	}
    	var stateToSerialize = this.publicVals(this.state);
    	this.version += 1;
    	var newState = React.addons.update(stateToSerialize, {version: {$set: this.version}});
   		var self = this;
    	console.log(newState.version, this.version);
		this.props.firebasePointer.transaction(function(currentState) {
			console.log("running a tx", currentState.version, newState.version);
			if (newState.version > currentState.version) {
				console.log("persisting", newState);
                self.persistedVersion = newState.version;
				return newState;
			} else {
				console.warn("Tried to update a stale version");
				return currentState;
			}
		});

	},

	incrementVersion: function() {
		this.props.firebasePointer.child("version").transaction(function(version) {
			return (version || 0) + 1;
		})
	}
}

var App = React.createClass({
	//mixins: [FireStateMixin],
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

var NotesPane = React.createClass({

	mixins: [FireStateMixin],
	readOnly: true,

	getInitialState: function() {
		return {
			notes: {},
			_selectedNote: null,
			_title: ""
		};
	},

	addNote: function(name) {
		var name = this.state._title;
		var id = Math.random().toString(36).substring(7);
		this.state.notes[id] = {name: name, text: ""};
		this.setState({notes: this.state.notes, _title: "", _selectedNote: id});
		//debugger;
		var updatedData = {}
		updatedData[id] = {name: name, text: "", version: 1}
		this.props.firebasePointer.child("notes").update(updatedData);
		this.incrementVersion();
	},

	deleteNote: function() {
		var index = this.state._selectedNote;
		this.setState({_selectedNote: null});
		this.props.firebasePointer.child("notes").child(index).update({"deleted": true});
		this.incrementVersion();
	},

	selectNote: function(noteId) {
		var self = this;
		return function() {
			console.log("clicked");
			self.setState({_selectedNote: noteId});
		};
	},

	titleChange: function(event) {
		this.setState({_title: event.target.value});
	},

	render: function() {
		var self = this;
		var nonDeletedNotes = _.pick(this.state.notes, function(note, noteId) {
			return !note.deleted;
		});
		
		var notes = _.map(nonDeletedNotes, function(note, noteId) {
			if (noteId == self.state._selectedNote) {
				return <div key={"row" + noteId} className="row note-item note-selected">
					<div key={"point-" + noteId} className="col-md-8">{note.name}</div>
					<div className="note-delete col-md-4 clickable" onClick={self.deleteNote}>Delete</div>
				</div>;
			} else {
				return <div key={"point-" + noteId} className="note-unselected note-item" onClick={self.selectNote(noteId)}>{note.name}</div>;
			}
		});
		
		var noteId = this.state._selectedNote;
		console.log("noteid: ", noteId);
		var selectedNote = noteId != null ? <NoteEditor key={noteId} noteId={noteId} 
			firebasePointer={this.props.firebasePointer.child("notes/" + noteId)} /> : <div></div>;
	

		return <div className="row">
					<div className="notes-list col-md-4">
						<input type="text" placeholder="Title" className="note-title" value={this.state._title} onChange={this.titleChange} />
						<button className="btn btn-success add-button" onClick={this.addNote}>Add</button>
						{notes}
					</div>
					<div className="note-edit col-md-8">
						{selectedNote}
					</div>
			   </div>;
	}
});

var NoteEditor = React.createClass({
	mixins: [FireStateMixin],
	propTypes: {
		noteId: React.PropTypes.string.isRequired
	},

	getInitialState: function() {
		return {name: "", text: "", _fullScreen: false};
	},

	onTextUpdate: function(text) {
		this.setState({text: text});
	},

	toggleFullscreen: function() {
		this.setState({_fullScreen: true});
	},

	leaveFullscreen: function() {
		this.setState({_fullScreen: false});
	},

	render: function() {
		console.log("parent", this.state._fullScreen);
		return <div>
			<h4>
			{this.state.name}|<span className="clickable" onClick={this.toggleFullscreen}>Fullscreen</span>
			</h4>{this.getSyncState()}
			<div className="editor-textarea" >
				<AceEditor onChange={this.onTextUpdate} startingText={this.state.text} 
				fullScreen={this.state._fullScreen}
				exitFullScreen={this.leaveFullscreen}
				/>
			</div>
		</div>;
	}
});

module.exports = App;
