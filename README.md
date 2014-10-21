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

A visualization of the data flow is currenlty under construction by Antonio.
