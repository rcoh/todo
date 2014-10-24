/** @jsx React.DOM */
var NotesPane = React.createClass({
	getInitialState: function() {
		return {notes: {}};
	},

	componentWillMount: function() {
		this.firebase = new Firebase("https://glaring-fire-654.firebaseio.com/");
		var self = this;
		this.firebase.child("notes").on("value", function(snapshot) {
			self.setState({notes: snapshot.val()});
			console.log("updating");
			console.log(self.state.notes);
		});
		//this.firebase.set({notes: {"note1": "hello!"}});
	},

	addNote: function(name) {
		var name = "note";
		var id = Math.random().toString(36).substring(7);
		this.state.notes[id] = {name: name, text: ""};
		this.setState({notes: this.state.notes});
		this.firebase.child("notes").set(this.state.notes);
	},

	render: function() {
		var notes = _.map(this.state.notes, function(text, noteId) {
			console.log("IDID:", noteId);
			return <Note key={noteId} noteId={noteId} />;
		});

		return <div><button onClick={this.addNote}>Add Note</button>
				<div>{notes}</div>
			   </div>
	}
});

var Note = React.createClass({
	propTypes: {
		noteId: React.PropTypes.number.isRequired,
	},

	componentWillMount: function() {
		console.log("mounting");
		this.firebase = new Firebase("https://glaring-fire-654.firebaseio.com/");
		var self = this;
		this.firebase.child("notes/" + this.props.noteId).on("value", function(snapshot) {
			self.setState(snapshot.val());
			console.log("note updating with nodeId:", self.props.noteId, self.state);
			//console.log(self.state)
		});
	},

	componentDidUpdate: function(prevProps, prevState) {
		this.firebase.child("notes/" + this.props.noteId).set(this.state);
	},

	onTextUpdate: function(event) {
		this.setState({text: event.target.value});
		console.log("text update:", event.target.value, this.state.text);
	},

	render: function() {
		return <div>
			{this.state.name}
			<textarea rows="4" cols="50" onChange={this.onTextUpdate} value={this.state.text}>
		
			</textarea>		
		</div>;
	}
});