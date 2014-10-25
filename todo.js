/** @jsx React.DOM */

var FireStateMixin = {
	propTypes: {
		firebasePointer: React.PropTypes.object.isRequired
	},

    componentDidMount: function() {
    	var self = this;
    	this.props.firebasePointer.on("value", function(snapshot) {
    		if (self.isMounted()) {
    			self.setState(snapshot.val());
    		}
    	});
    },

    componentDidUpdate: function(prevProps, prevState) {
		this.props.firebasePointer.set(this.state);
	},
}

var NotesPane = React.createClass({

	mixins: [FireStateMixin],
	getInitialState: function() {
		return {
			notes: {},
			selectedNote: null
		};
	},

	addNote: function(name) {
		var name = "note";
		var id = Math.random().toString(36).substring(7);
		this.state.notes[id] = {name: name, text: ""};
		this.setState({notes: this.state.notes});
	},

	selectNote: function(noteId) {
		var self = this;
		return function() {
			console.log("clicked");
			self.setState({selectedNote: noteId});
		};
	},

	render: function() {
		var self = this;
		
		var notes = _.map(this.state.notes, function(note, noteId) {
			if (noteId == self.state.selectedNote) {
				return <p key={"point-" + noteId}>{noteId} (selected)</p>;
			} else {
				return <p key={"point-" + noteId} onClick={self.selectNote(noteId)}>{noteId}</p>;
			}
		});
		
		var noteId = this.state.selectedNote;
		var selectedNote = noteId != null ? <Note key={noteId} noteId={noteId} 
			firebasePointer={this.props.firebasePointer.child("notes/" + noteId)} /> : <div></div>;
		

		return <div>
					<button onClick={this.addNote}>Add Note</button>
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
			{this.state.name}
			<textarea rows="4" cols="50" onChange={this.onTextUpdate} value={this.state.text}>
		
			</textarea>		
		</div>;
	}
});
