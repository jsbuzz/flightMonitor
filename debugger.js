define(
  [],
  function() {

		'use strict';

		var debuggerTemplate;
		debuggerTemplate = {
			attachTo : function(debugAction) {
				var element = debugAction.element,
					pos = $(!element || (element === document) ? document.body : element).position();

				this.$template.find('.step').attr('title', debugAction.toString());

				this.$template.css({
					left: pos.left,
					top: pos.top
				}).show();
			},
			hide: function() {
				this.$template.hide();
			},
			onClick: null,
			$template : $('<div id="flightMonitor-debugger"><b class="step">Step</b> | <b class="continue">Continue</b></div>')
						.css({
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
							//typeof debuggerTemplate.onClick === 'function' && debuggerTemplate.onClick.call($.flightMonitor);
						})
		};

		return debuggerTemplate;
	}
);