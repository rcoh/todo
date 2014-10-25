/** @jsx React.DOM */

var FireStateMixin = {
	propTypes: {
		firebasePointer: React.PropTypes.object.isRequired
	},

	getInitialState: function() { return {
		"hackToLetStateBeEmpty": "yup"
	}},

    componentDidMount: function() {
    	var self = this;
    	this.props.firebasePointer.on("value", function(snapshot) {
    		if (self.isMounted()) {
    			self.setState(snapshot.val());
    		}
    	});
    },

    componentDidUpdate: function(prevProps, prevState) {
    	var stateToSerialize = _.pick(this.state, function(value, key) {
    		return !key.indexOf("_") == 0;
    	});
		this.props.firebasePointer.set(stateToSerialize);
	},
}

var App = React.createClass({
	mixins: [FireStateMixin],

	render: function() {
		return <div>
			<div className="notes-pane">
				<NotesPane firebasePointer={this.props.firebasePointer.child("notes-pane")} />
			</div>
			<div className="todo-pane">
				<TodoPane firebasePointer={this.props.firebasePointer.child("todo-pane")} />
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
			self.state.todos[index].done = true;
			self.forceUpdate();
		};
	},

	remove: function(index) {
		var self = this;
		return function() {
			self.state.todos.splice(index, 1);
			self.forceUpdate();
		};
	},

	render: function() {
		var self = this;
		var todoDivs = this.state.todos.map(function(todo, index) {
			var className = todo.done ? "todo-done" : "";
			return <div key={index} className={className}>{todo.text} ({index}) 
				| <span onClick={self.crossOff(index)}>Done</span> | <span onClick={self.remove(index)}>Remove</span>
			</div>;
		});
		return <div>
			Todo: 
			<input type="text" value={this.state._todo} onChange={this.todoChange} />
			<button onClick={this.addTodo}>Add Todo</button>
			<div>
				{todoDivs}
			</div>
		</div>;
	}
});

var NotesPane = React.createClass({

	mixins: [FireStateMixin],
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
				return <div key={"point-" + noteId}>{note.name} (selected)</div>;
			} else {
				return <div key={"point-" + noteId} onClick={self.selectNote(noteId)}>{note.name}</div>;
			}
		});
		
		var noteId = this.state._selectedNote;
		var selectedNote = noteId != null ? <Note key={noteId} noteId={noteId} 
			firebasePointer={this.props.firebasePointer.child("notes/" + noteId)} /> : <div></div>;
	

		return <div>
					<button onClick={this.addNote}>Add Note</button>
					<input type="text" value={this.state._title} onChange={this.titleChange} />
					<div>{notes}</div>
					{selectedNote}
			   </div>;
	}
});

var Note = React.createClass({
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
			<textarea rows="4" cols="50" onChange={this.onTextUpdate} value={this.state.text}>
		
			</textarea>		
		</div>;
	}
});
