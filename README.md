flightMonitor
=============

A tracking library for FlightJS to monitor event flows


Usage
=====

To install you can just use bower:

    bower install flight-monitor

Use require to load the library before setting up your flight components. This way it can hook into the event listeners.

    var flightMonitor = require('flightMonitor');
    flightMonitor.config.showMethodInfo = false; // overwrite some default options
    
    require('data/documents').attachTo(document, { api: api });
    ...
    

And your logging is already in operation. Flight-monitor logs all events triggered on the site and shows all components reacting to that event. It can show the method used in the component (if the method is named) and it is able to generate a data structure representing the event flow.


Debugging
=========

With flightMonitor you can stop your flight app's event flow and continue step by step. The library can stop all event triggers and callbacks as it is hooked into jQuery's trigger and has control over all callback calls.

    $.flightMonitor.stop();
    
    $.flightMonitor.step();
    /*
      > ui/youComponent is listening for uiSomeEventWasTriggered and calling function (ev, data) { 
      ...
      }
    */
    ...
    
    $.flightMonitor.run();
    
A custom breakOn(pattern) method is being implemented now to allow you to stop on specific events and go step by step from there.
