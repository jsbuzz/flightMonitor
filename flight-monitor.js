define(

  [
  	'flight/lib/compose',
    'flight/lib/registry',
    'flight/lib/debug'
  ],

  function(compose, registry, debug) {

		'use strict';

		// flightMonitor object
		var debugActions = [];
		var flightMonitor = {
			__trackingId : 1,
			__stopFlow : false,
			__stopPattern : null,
			_stopOn : function(eventName) {
				if(this.__stopFlow) {
					return true;
				}
				else if(!eventName || !this.__stopPattern) {
					return false;
				}
				else if(eventName.match(this.__stopPattern)) {
					flightMonitor.config.log(
						'%cStopped on event ' + eventName,
						'color: red;'
					);

					return (this.__stopFlow = true);
				}
			},
			_trackingId : function() {
				return this.__trackingId++;
			},

			// public interface
			eventTree: {},
			componentNodes : {},
		    config: {
		    	// default logging options
		    	showElementInfo : true,
		    	showMethodInfo  : true,

		    	// extra options - if all turned on logging is a little too much
		    	showEventId : false,
		    	showMixins  : false,
		    	showStopped : false,
		    	log         : function() { console.log.apply(console, arguments); }
		    },
		    stop : function() {
		    	this.__stopFlow = true;
		    },
		    breakOn : function(pattern) {
		    	this.__stopPattern = pattern;
		    },
		    step : function() {
		    	this.__stopFlow = true;
		    	if(!debugActions.length) {
		    		console.log('No events captured');
		    		return;
		    	}
		    	debugActions.shift().trigger();
		    },
		    continue: function() {
		    	if(!debugActions.length) {
		    		console.log('No events captured');
		    		return;
		    	}

		    	this.__stopFlow = false;
		    	while(debugActions.length && !this.__stopFlow) {
		    		debugActions.shift().trigger();
		    	}
		    },
		    run : function() {
		    	this.__stopPattern = false;
		    	this.continue();
		    }
		};

		// turn on flight debugger in silent mode to force flight to use the withLogging mixin
		debug.enable(true);
		debug.events.logNone();

		// overwrite compose.mixin to capture withLogging mixin
		var lastComponent = null;
		var _mixin = compose.mixin;
		compose.mixin = function(component, mixins) {
			for(var i=0; i < mixins.length; i++) {
				if(mixins[i] && mixins[i].name === 'withLogging') {
					mixins[i] = function flightMonitor() {
						this.before('trigger', function() {
						    lastComponent = this;
						});
					}
				}
			}
			return _mixin.apply(this, arguments);
		};

		// debugger item for stepping the event flow
		function debugAction(type) {
			this.type = type;
			if(this.type === 'callback') {
				var componentName = arguments[1],
					fn = arguments[2],
					ev = arguments[3],
					data = arguments[4];

				this.trigger = function() {
					flightMonitor.config.log(
						'  >',
						componentName,
						'is listening for',
						ev.type,
						'and calling',
						fn.target.name ? fn.target.name: fn.target.toString()
					);
					fn.call(fn, ev, data);
				};
			} else {
				var component = arguments[1],
					$element = arguments[2],
				    event = arguments[3],
			        data = arguments[4];

				this.trigger = function() {
					lastComponent = component;
			    	$element.trigger(event,data,true);
				};
			}
		}

		// node generator for the eventTree data structure
		function createNode(type, name) {
	        var node = {
	            type: type,
	            name: name,
				addChild : function(node) {
			        (this.children || (this.children=[])).push(node);
			        return node;
			    }
	        };

	        return node;
	    }

		// click triggers a clean tracking
		document.addEventListener('click', function(ev) {
			var eventNode = createNode('event', ev.type);

			flightMonitor.eventTree = createNode('component', 'User');
		    flightMonitor.eventTree.addChild(eventNode);

		    ev.trackingId = flightMonitor._trackingId();
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

			// parts[0] will be always 'flightMonitor'
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

		// monitor trigger calls
		$.fn.trigger = function(event, data, force) {
			event = (typeof event === 'string' ? $.Event(event) : event);

			if(flightMonitor._stopOn(event.type) && !force) {
				flightMonitor.config.showStopped && flightMonitor.config.log(
					'%cstopped event ' + event.type,
					'color: red;'
				);

				debugActions.push(new debugAction('trigger', lastComponent, this, event, data));
				return ;
			}

			event.trackingId = flightMonitor._trackingId();
			var eventId = flightMonitor.config.showEventId ? '(#' + event.trackingId + ')' : '';
			var elementInfo = flightMonitor.config.showElementInfo ? this.get(0) : '';

		    if(lastComponent) {
		    	var eventNode = createNode('event', event.type);
		    	var componentIndex = lastComponent.componentIdentity || lastComponent.identity;
		    	var componentName = getComponentName(componentIndex);
		    	var componentNode = flightMonitor.componentNodes[componentName];

		        componentNode && componentNode.addChild(eventNode);
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
				var instanceIndex = callback.context.identity,
					componentIndex = instanceIndex;

				// as Flight is not kind enough to help us connect the instance to a component,
				// we have to do it for ourselves...
				if(instanceIndex >= registry.components.length) {
					componentIndex = registry.components.length-1;
					callback.context.componentIdentity = componentIndex;
				}

				return originalFnOn.call(this, type, function(ev, data) {

					var fnName = callback.target.name;
					var componentName = getComponentName(componentIndex);
					var trackingId = ev.trackingId || ev.originalEvent && ev.originalEvent.trackingId;
					var eventNode = ev.node || ev.originalEvent && ev.originalEvent.node;

					if(flightMonitor._stopOn()) {
						flightMonitor.config.showStopped && flightMonitor.config.log(
							'%cstopped callback ' + (fnName || 'anonymus'),
							'color: red;'
						);
						debugActions.push(new debugAction('callback', componentName, callback, ev, data));
						ev.preventDefault();
						return ;
					}

					if(trackingId && eventNode) {
						var componentNode = createNode('component', componentName);

			            eventNode && eventNode.addChild(componentNode);
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