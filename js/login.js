var React = require('react');
var Login = React.createClass({
	propTypes: {
		onLogin: React.PropTypes.func.isRequired,
		firebasePointer: React.PropTypes.object.isRequired
	},

	getInitialState: function() {
		return {
			email: "",
			password: "",
			error: ""
		}
	},

	passwordChanged: function(e) {
		this.setState({password: e.target.value});
	},

	emailChanged: function(e) {
		this.setState({email: e.target.value});
	},

	login: function() {
		var self = this;
		this.props.firebasePointer.authWithPassword({
			email : this.state.email,
			password : this.state.password
		}, function(error, authData) {
		  if (error === null) {
		    // user authenticated with Firebase
		    console.log("User ID: " + authData.uid + ", Provider: " + authData.provider);
		    self.props.onLogin(authData);
		  } else {
		    console.log("Error authenticating user:", error);
		    self.setState({error: error.message});
		  }
		});
	},

	doNothing: function(e) {
		console.log(e)
		e.preventDefault();
	},

	render: function() {
		return <div className="container">
				<form role="form" onSubmit={this.doNothing}>
				  <div className="form-group">
				    <label>Email address</label>
				    <input onChange={this.emailChanged} type="email" className="form-control" id="exampleInputEmail1" placeholder="Enter email" />
				  </div>
				  <div className="form-group">
				    <label>Password</label>
				    <input onChange={this.passwordChanged} type="password" className="form-control" id="exampleInputPassword1" placeholder="Password" />
				  </div>
				  <button className="btn btn-default" onClick={this.login}>Login</button>
				</form>
				{this.state.error}
		</div>;
	}
});

module.exports = Login;