/**
 * A Menu can be used to offer a structure of commands and actions to the user. It should only be added to controls
 * such as {@link module:jidejs/ui/control/ContextMenu}, {@link modujle:jidejs/ui/control/MenuBar} or Menu itself.
 *
 * @module jidejs/ui/control/Menu
 * @extends module:jidejs/ui/control/Labeled
 * @extends module:jidejs/ui/Container
 */
define([
	'jidejs/base/Class', 'jidejs/base/DOM', 'jidejs/base/ObservableProperty', 'jidejs/ui/control/Labeled',
	'jidejs/ui/control/ContextMenu', 'jidejs/ui/Pos', 'jidejs/base/Util'
], function(Class, DOM, Observable, Labeled, ContextMenu, Pos, _) {
	/**
	 * Creates a new Menu.
	 *
	 * @memberof module:jidejs/ui/control/Menu
	 * @param {object} config The configuration.
	 * @constructor
	 * @alias module:jidejs/ui/control/Menu
	 */
	function Menu(config) {
		installer(this);
		this.content = new ContextMenu();
		Labeled.call(this, _.defaults(config || {}, { tabIndex: 0 }));
		this.content.visibleProperty.bindBidirectional(this.showingProperty);
		this.showingProperty.subscribe(function(event) {
			if(!event.value) {
				this.classList.remove('armed');
				this.focus();
			} else {
				this.content.setLocation(this, Pos.RIGHT);
				this.classList.add('armed');
			}
		}, this);
		if(this.showing) {
			this.content.setLocation(this, Pos.RIGHT);
			this.classList.add('armed');
		}
		this.on('click', function(e) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		});
		this.classList.add('jide-menu');
	}
	Class(Menu).extends(Labeled).def({
		dispose: function() {
			Labeled.prototype.dispose.call(this);
			installer.dispose(this);
		},

		/**
		 * A list of menu items and sub menus displayed by this menu.
		 *
		 * @readonly
		 * @type module:jidejs/base/ObservableList
		 */
		get children() {
			return this.content.children;
		},
		/**
		 * `true`, if the menu is currently showing its children; `false`, otherwise.
		 * @type boolean
		 * @readonly
		 */
		showing: false,
		/**
		 * `true`, if the menu is currently showing its children; `false`, otherwise.
		 * @type module:jidejs/base/ObservableProperty
		 * @readonly
		 */
		showingProperty: null,

		/**
		 * Display the children as a popup at the given, relative, position.
		 *
		 * @param {module:jidejs/ui/Pos} pos The relative position of the child popup.
		 */
		show: function(pos) {
			this.showing = true;
			this.content.setLocation(this, typeof pos !== 'undefined' ? pos : Pos.RIGHT);
		}
	});
	var installer = Observable.install(Menu, 'showing');

	return Menu;
});