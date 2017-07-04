(function(global) {

    var transitionComponent = function (containerId, logo) 
    {
        this.counter = 0;
        this.states = [];
        this.$list = null;
        this.logo = logo;

        this.$container = null;
        this.setupActions(containerId);
        this.updateControlStates();
    }
    
    transitionComponent.prototype.setupActions = function(containerId) {
        var $container = $(containerId);
        this.$list = $container.children("ul");

        var self = this;
        var $nameInput = $container.children("#tr_state_name");
        $container.children("#tr_add").on("click", function() {
            var name = $nameInput.val();
            self.addState(name);
        });
        $container.children("#tr_run").on("click", function () {
            self.runTransition();
        });
        $container.children("#tr_remove").on("click", function () { self.removeAll(); });

        this.$container = $container;
    }
    
    transitionComponent.prototype.runTransition = function (nextOrder) {
        if (!nextOrder) {
            nextOrder = 1;
            this.logo.setState(this.states[0].state);
        }
        var currentState = this.states[nextOrder-1];
        var nextState = this.states[nextOrder];
        this.logo.transitTo(nextState.state, currentState.duration, currentState.delay);
        nextOrder = nextOrder + 1;
        var self = this;
        if (nextOrder < this.states.length) {
            var totalDuration = currentState.duration + currentState.delay + 20;
            setTimeout(function() {
                self.runTransition(nextOrder);
            }, totalDuration);
        }
    }
    
    transitionComponent.prototype.removeAll = function () {
        this.$list.empty();
        this.states = [];
        this.counter = 0;
        this.updateControlStates();
    }
    
    transitionComponent.prototype.addState = function (name) {
        name = name || "state_" + this.counter;
        var settings = this.logo.getState();
        var state = {
            id: this.counter,
            name: name,
            state: settings,
            duration: 600,
            delay: 600
        };
        this.states.push(state);
        this.renderState(state);
        this.counter++;
        this.updateControlStates();
    }
    
    transitionComponent.prototype.removeState = function (id, el) {
        var stateId = -1;
        for (var i = 0; i < this.states.length; i++) {
            if (this.states[i].id === id) {
                stateId = i;
                break;
            }
        }
        this.states.splice(stateId, 1);
        console.log(this.states);
        $(el).remove();
        this.updateControlStates();
    }
    
    transitionComponent.prototype.renderState = function (state) {
        var self = this;
        var $item = $("<li class='state'/>");
        $item.append($("<p/>").text(state.name));

        var $delay = $item.append($("<p/>"));
        $delay.append($("<text/>").text("State duration"));
        $delay.append(
            $('<input type="number" name="tr_delay">')
                .val(state.delay)
                .on("change", function () {
                    state.delay = parseInt($(this).val());
                }));

        var $duration = $item.append($("<p/>"));
        $duration.append($("<text/>").text("Transition duration"));
        $duration.append(
            $('<input type="number" name="tr_duration">')
            .val(state.duration)
            .on("change", function () {
                state.duration = parseInt($(this).val());
            }));

        $item.append($("<button>")
            .text("Remove")
            .on("click", function () {
                self.removeState(state.id, $item);
            }));
        $item.data("id", state.id);
        this.$list.append($item);
    }
    
    transitionComponent.prototype.updateControlStates = function() {
        var isRunDisabled = this.states.length < 2;
        var isCleanDisabled = !this.states.length;
        this.$container.children("#tr_run").attr("disabled", isRunDisabled);
        this.$container.children("#tr_remove").attr("disabled", isCleanDisabled);
    }

    global.TransitionComponent = transitionComponent;

})(window);