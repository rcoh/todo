var React = require("react/addons");
var FireStateMixin = require("./firebase-mixins");
var _ = require("underscore");
var AceEditor = require('./ace-editor');

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

module.exports = NotesPane;