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

	addNote: function() {
		var name = "note" + Math.random().toString(36).substring(7);
		this.state.notes[name] = "";
		this.setState({notes: this.state.notes});
		this.firebase.child("notes").set(this.state.notes);
	},

	render: function() {
		var notes = _.map(this.state.notes, function(text, noteId) {
			console.log(text, noteId);
			return <Note key={noteId} noteId={noteId} />;
		});
		console.log(notes);
		return <div><button onClick={this.addNote}>Add Note</button> 
				<div>{notes}</div>
			   </div>
	}
});

var Note = React.createClass({
	propTypes: {
		noteId: React.PropTypes.number,
	},

	componentWillMount: function() {
		console.log("mounting");
		this.firebase = new Firebase("https://glaring-fire-654.firebaseio.com/");
		var self = this;
		this.firebase.child("notes/" + this.props.noteId).on("value", function(snapshot) {
			self.setState({text: snapshot.val()});
			console.log("updating");
			console.log(self.state)
		});
	},

	onTextUpdate: function(event) {
		this.setState({text: event.target.value});
		this.firebase.child("notes/" + this.props.noteId).set(event.target.value);
	},

	render: function() {
		console.log(this.state);
		return <div>
			{this.props.noteId}
			<textarea rows="4" cols="50" onChange={this.onTextUpdate} value={this.state.text}>
		
			</textarea>		
		</div>;
	}
});