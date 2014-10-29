/** @jsx React.DOM */

var FireStateMixin = {
	propTypes: {
		firebasePointer: React.PropTypes.object.isRequired,
	},

	version: 0,

	getInitialState: function() { return {
		hackToLetStateBeEmpty: true,
	}},

    componentDidMount: function() {
    	var self = this;
    	this.props.firebasePointer.on("value", function(snapshot) {
    		var snapshotVal = snapshot.val();
    		var snapshotVersion = snapshotVal.version;
    		delete snapshotVal.version;
    		if (self.isMounted() && snapshotVersion > self.version) {
    			console.log("updating version: ", snapshotVersion);
    			self.version = snapshotVersion;
    			self.needsPersist = false;
    			
    			self.replaceState(self.ensureAllValuesPresent(snapshotVal));
    		}
    	});
    },

    ensureAllValuesPresent: function(stateSnapshot) {
    	var privates = this.privateVals(this.state);
    	var withInitial = React.addons.update(this.getInitialState(), {$merge: stateSnapshot});
    	return React.addons.update(withInitial, {$merge: privates});
    },

    privateVals: function(state) {
    	return _.pick(state, function(value, key) {
    		return key.indexOf("_") == 0;
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
	render: function() {
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
	}
});

var TodoPane = React.createClass({
	mixins: [FireStateMixin],

	getInitialState: function() {
		return { todos: [], _todo: "" };
	},

	todoChange: function(event) {
		this.setState({_todo: event.target.value});
	},

	addTodo: function() {
		this.state.todos.push({done: false, text: this.state._todo});
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

	render: function() {
		//console.log("rendering todo.", this.state.todos.length);
		var self = this;
		var todoDivs = this.state.todos.map(function(todo, index) {
			var className = todo.done ? "todo-done" : "";
			var doneText = todo.done ? "Undone" : "Done";
			return <div className="row">
				<div key={index} className={className}>
					<div className="col-md-1 clickable" onClick={self.crossOff(index)}>{doneText}</div>
					<div className={className + " col-md-7"}>{todo.text}</div>
					<div className="col-md-1 clickable" onClick={self.remove(index)}>Remove</div>
				</div>
			</div>;
		});
		return <div>
			<input type="text" className="todo-input" placeholder="Todo?" value={this.state._todo} onChange={this.todoChange} onKeyDown={this.handleKeyDown} />
			<button onClick={this.addTodo} className="add-button btn btn-success">Add</button>
			<div>
				{todoDivs}
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
		
		var notes = _.map(this.state.notes, function(note, noteId) {
			
			if (noteId == self.state._selectedNote) {
				return <div key={"point-" + noteId} className="note-selected note-item">{note.name}</div>;
			} else {
				return <div key={"point-" + noteId} className="note-unselected note-item" onClick={self.selectNote(noteId)}>{note.name}</div>;
			}
		});
		
		var noteId = this.state._selectedNote;
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
		return {name: "Loading...", text: "Loading..." };
	},

	onTextUpdate: function(event) {
		this.setState({text: event.target.value});
	},

	render: function() {
		return <div>
			<div>
			Note Name: {this.state.name}
			</div>
			<textarea className="editor-textarea" onChange={this.onTextUpdate} value={this.state.text}>
		
			</textarea>		
		</div>;
	}
});
