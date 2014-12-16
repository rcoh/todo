var React = require("react/addons");
var _ = require("underscore");
var log = require("./logging");

var FireStateMixin = {
    propTypes: {
        firebasePointer: React.PropTypes.object.isRequired,
    },

    version: 0,

    getSyncState: function() {
        return "TODO";
    },



    getInitialState: function() { return {
        hackToLetStateBeEmpty: true,
    }},

    componentDidMount: function() {
        var self = this;
        this.props.firebasePointer.on("value", function(snapshot) {
            var snapshotVal = snapshot.val();
            if (snapshotVal == null) {
                log.warn("Null version: ", self);
                return
            }
            var snapshotVersion = snapshotVal.version;
            delete snapshotVal.version;
            if (self.isMounted() && snapshotVersion > self.version) {
                log.info("updating version: ", snapshotVersion);
                self.version = snapshotVersion;
                self.needsPersist = false;
                self.setState(snapshotVal);
                if (snapshotVal == null) {
                    var publics = publicVals(this.state);
                    log.warn("snapshut is null, what should I do?", publics);
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
            log.debug("states equal");
            return;
        }

        if (this.readOnly) {
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

module.exports = FireStateMixin;