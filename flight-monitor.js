define(

  [
    'flight/lib/registry',
    'flight/lib/debug'
  ],

  function(registry, debug) {

		'use strict';

		// turn on flight debugger in silent mode to catch function checkSerializable
		debug.enable(true);
		debug.events.logNone();

		// flightMonitor object
		var flightMonitor = {
			_trackingId : 1,
			trackingId : function() {
				return this._trackingId++;
			},
			eventTree: {},
			componentNodes : {},
			createNode : function(type, name) {
		        var node = {
		            type: type,
		            name: name
		        };

		        return node;
		    },
		    addNodeChild : function(parent, node) {
		        if(!parent) {
		            return;
		        }
		        (parent.children || (parent.children=[])).push(node);
		        return node;
		    },
		    config: {
		    	// default logging options
		    	showElementInfo : true,
		    	showMethodInfo  : true,

		    	// extra options - if all turned on logging is a little too much
		    	showEventId : false,
		    	showMixins  : false,
		    	log         : function() { console.log.apply(console, arguments); }
		    }
		};

		// click triggers a clean tracking
		document.addEventListener('click', function(ev) {
			var eventNode = flightMonitor.createNode('event', ev.type);

			flightMonitor.eventTree = flightMonitor.createNode('component', 'User');
		    flightMonitor.addNodeChild(flightMonitor.eventTree, eventNode);

		    ev.trackingId = flightMonitor.trackingId();
		    ev.node = eventNode;

		    var eventId = flightMonitor.config.showEventId ? '(#' + ev.trackingId + ')' : '';

		    var elementInfo = flightMonitor.config.showElementInfo ? ev.target : '';
		    flightMonitor.config.log(
		    	'%c'+ev.type + eventId + ' triggered by the User' + (elementInfo ? ' on' : ''),
		    	'color: red;',
		    	elementInfo
		    );
		}, true);


		// get component info and create a name
		function getComponentName(componentIndex) {
			var componentName = registry.components[componentIndex].component.toString(),
				parts = componentName.split(', ');

			componentName = parts[1];
			if(flightMonitor.config.showMixins) {
				componentName += (parts.length > 2 ? '[' + parts.slice(2).join(',') + ']' : '');
			}

			if(registry.components[componentIndex].attachedTo[0] === document) {
				componentName = 'data/' + componentName;
			} else {
				componentName = 'ui/' + componentName;
			}

			return componentName;
		}

		// this, my friends, is the biggest and ugliest hacks of all times...
		var _call = Function.prototype.call;
		var lastComponent = null;
		Function.prototype.call = function(component) {
			if(this.name === 'checkSerializable') {
				lastComponent = component;
			}

			return _call.apply(this, arguments);
		};

		// monitor trigger calls
		$.fn.trigger = function(event, data) {
			event = (typeof event === 'string' ? $.Event(event) : event);

			event.trackingId = flightMonitor.trackingId();
			var eventId = flightMonitor.config.showEventId ? '(#' + event.trackingId + ')' : '';
			var elementInfo = flightMonitor.config.showElementInfo ? this.get(0) : '';

		    if(lastComponent) {
		    	var eventNode = flightMonitor.createNode('event', event.type);
		    	var componentName = getComponentName(lastComponent.identity);

		        flightMonitor.addNodeChild(flightMonitor.componentNodes[componentName], eventNode);
		        event.node = eventNode;

		        flightMonitor.config.log(
		        	'%c' + event.type + eventId + ' triggered by ' + componentName, 'color: blue;',
		        	(elementInfo ? ' on' : ''),
		        	elementInfo
		        );
		    } else {
		    	flightMonitor.config.log(
		    		'%c' + event.type + eventId + ' triggered from outside', 'color: navy;',
		    		(elementInfo ? ' on' : ''),
		    		elementInfo
		    	);
		    }

		    lastComponent = false;
		    return this.each(function() {
		        $.event.trigger( event, data, this );
		    });
		};

		// monitor event listeners
		var originalFnOn = $.fn.on;
		$.fn.on = function(type, callback) {
			var element = this;
			// is it a flight event handler?
			if(typeof callback === 'function' && callback.target && callback.context) {
				var component = callback.context;
				return originalFnOn.call(this, type, function(ev, data) {
					var fnName = callback.target.name;
					var componentName = getComponentName(component.identity);
					var trackingId = ev.trackingId || ev.originalEvent && ev.originalEvent.trackingId;
					var eventNode = ev.node || ev.originalEvent && ev.originalEvent.node;

					if(trackingId && eventNode) {
						var componentNode = flightMonitor.createNode('component', componentName);

			            flightMonitor.addNodeChild(eventNode, componentNode);
			            flightMonitor.componentNodes[componentName] = componentNode;
			            componentNode.method = fnName;
					}

					var eventId = flightMonitor.config.showEventId ? '(#' + trackingId + ')' : '';
					var methodInfo = flightMonitor.config.showMethodInfo && fnName ? 'and calls ' + fnName : '';
					var elementInfo = flightMonitor.config.showElementInfo ? element.get(0) : '';
					flightMonitor.config.log(
						'  >',
						componentName,
						'is listening for',
						ev.type + eventId + (elementInfo ? ' on' : ''),
						elementInfo,
						methodInfo
					);

					return callback(ev, data);
				});
			}
			return originalFnOn.apply(this, arguments);
		};

		$.flightMonitor = flightMonitor;
		return flightMonitor;
	}
);
