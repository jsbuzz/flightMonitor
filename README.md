flightMonitor
=============

A useful library for FlightJS to monitor and debug event flows.
Provides more information than the basic flight debug tool and gives you the ability to break/step/continue execution of your event flow. The library cannot be used together with the default flight debug tool, as it is overwriting some parts of it.


Usage
=====

To install you can just use bower:

    bower install flight-monitor

In order to use the library, please make sure you have the following rule in your requireJS paths config:

    flight: 'bower_components/flight'

Use require to load the library before setting up your flight components. This way it can hook into the event listeners.

    var flightMonitor = require('bower_components/flight-monitor/flight-monitor');
    flightMonitor.config.showMethodInfo = false; // overwrite some default options
    
    // components to track
    require('data/myDataComponent').attachTo(document);
    ...
    

And your logging is already in operation. Flight-monitor logs all events triggered on the site and shows all components reacting to that event. It can show the method used in the component (if the method is named) and it is able to generate a data structure representing the event flow.


Debugging
=========

With flightMonitor you can stop your flight app's event flow and continue step by step. The library can stop all event triggers and callbacks as it is hooked into jQuery's trigger and has control over all callback calls.

    $.flightMonitor.stop();
    
    $.flightMonitor.step();
    /* console:
      > ui/yourComponent is listening for uiSomeEventWasTriggered and calling function (ev, data) { 
      ...
      }
    */
    ...
    
    $.flightMonitor.run();
    
A custom breakOn(pattern) method is being implemented now to allow you to stop on specific events and go step by step from there.
