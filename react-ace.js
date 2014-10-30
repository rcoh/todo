/** @jsx React.DOM */
var AceEditor = React.createClass({
	propTypes: {
		onChange: React.PropTypes.func,
		startingText: React.PropTypes.string
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
	},

	render: function() {
		return <div className="editor" ref="editor"></div>;
	},

	componentDidMount: function() {
		var editorNode = this.refs.editor.getDOMNode();
		var editor = ace.edit(editorNode);
		editor.renderer.setShowGutter(false);
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
					console.log(self.loading, self.writtenText, text);
				}	
			};
		});
		this.setState({acePointer: editor});
	}
});