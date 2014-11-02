/** @jsx React.DOM */

var React = require('react');
var AceEditor = React.createClass({
	propTypes: {
		onChange: React.PropTypes.func,
		startingText: React.PropTypes.string,
		fullScreen: React.PropTypes.bool.isRequired,
		exitFullScreen: React.PropTypes.func
	},

	getInitialState: function() {
		return {
			acePointer: null
		};
	},

	componentWillUpdate: function(newProps, nextState) {
		if (newProps.startingText != this.editor.getValue()) {
			this.writtenText = newProps.startingText;
			this.loading = true;
			this.editor.setValue(newProps.startingText, -1);
		} else {
			this.loading = false;
		}

		if (newProps.fullScreen && this.props.fullScreen == false) {
			this.refs.editor.getDOMNode().className = "editor-fullscreen ace_editor ace-tm";
			this.editor.resize();
			this.editor.focus();
			//this.editor.container.webkitRequestFullscreen();
		}
	},

	keyDown: function() {
		console.log("key");
	},

	render: function() {	
		return <div key="editoreditor" className="editor" ref="editor"></div>;
	},

	componentDidMount: function() {
		var editorNode = this.refs.editor.getDOMNode();
		var editor = ace.edit(editorNode);
		editor.renderer.setShowGutter(false);
		editor.focus();
		this.editor = editor;
		var self = this;
		editor.getSession().on('change', function(e) {
			if (self.props.onChange) {
				var text = editor.getValue();
				if (text != self.writtenText && self.loading == false) {
					self.props.onChange(editor.getValue());
				} else if (text == self.writtenText) {
					self.loading = false;
				} else {
					//console.log(self.loading, self.writtenText, text);
				}	
			};
		});
		
		editor.commands.addCommand({
		    name: 'exitFullScreen',
		    bindKey: {win: 'Ctrl+E',  mac: 'Ctrl+E'},
		    exec: function(editor) {
		        if (self.props.fullScreen) {
					self.refs.editor.getDOMNode().className = "editor ace_editor ace-tm";
					self.editor.resize();
					self.props.exitFullScreen();
					self.editor.focus();
				}
		    },
		    readOnly: true // false if this command should not apply in readOnly mode
		});
		
		this.setState({acePointer: editor});

	}
});

module.exports = AceEditor;