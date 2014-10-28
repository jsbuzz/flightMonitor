define(
  [],
  function() {

		'use strict';

		var debuggerTemplate;
		debuggerTemplate = {

			attachTo : function(debugAction) {
				var element = debugAction.element,
					posTarget = $(!element || (element === document) ? document.body : element).get(0),
					pos = posTarget.getBoundingClientRect();

				this.$template.find('.step').attr('title', debugAction.toString());

				this.$highlight.css({
					left: pos.left,
					top: pos.top,
					width: pos.width,
					height: pos.height
				}).show();

				this.$highlight.find('span').css({
					backgroundColor: 'navy',
					color: 'white',
					padding: 5,
					fontSize: '15px'
				}).text(debugAction.component);

				this.$template.css({
					left: document.documentElement.clientWidth/2 - this.$template.width()/2,
					bottom: 0
				}).show();
			},

			hide: function() {
				this.$template.hide();
				this.$highlight.hide();
			},

			onClick: null,

			$template : $('<div id="flightMonitor-debugger"><b class="step">Step</b> | <b class="continue">Continue</b></div>')
						.css({
							zIndex: 99999,
							cursor: 'pointer',
							position: 'fixed',
							padding: '10px',
							borderRadius: '4px',
							backgroundColor: 'navy',
							color: 'white',
							display: 'none'
						})
						.appendTo(document.body)
						.click(function(ev) {
							var method = ev.target.className;
							method && typeof $.flightMonitor[method] === 'function' && $.flightMonitor[method]();
						}),

			$highlight : $('<div id="flightMonitor-highlight"><span></span></div>')
						.css({
							zIndex: 99998,
							position: 'fixed',
							border: '1px dashed red',
							display: 'none',
							padding: '0',
							margin: '0',
							fontSize: '15px'
						})
						.appendTo(document.body)
		};

		return debuggerTemplate;
	}
);