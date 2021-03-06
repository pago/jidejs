/**
 * A ChoiceBox is a control that allows the user to choose between multiple options.
 *
 * It is, therefore, a lot like a {@link module:jidejs/ui/control/PopupButton} or a
 * {@link module:jidejs/ui/control/ComboBox} but is still different from both.
 *
 * As opposed to a {@link module:jidejs/ui/control/PopupButton PopupButton}, the choices it offers should not be commands.
 * They are options and should be treated as such. If the options are different commands, then the use of a PopupButton
 * is recommended instead.
 *
 * Unlike the {@link module:jidejs/ui/control/ComboBox} it can not be editable, thus custom user data is not permitted.
 * If the user should be able to enter custom data, use a ComboBox instead.
 *
 * @module jidejs/ui/control/ChoiceBox
 * @extends module:jidejs/ui/Control
 */
define(['jidejs/base/Class', 'jidejs/base/ObservableProperty', 'jidejs/base/Util',
		'jidejs/base/DOM', 'jidejs/base/ObservableList', 'jidejs/ui/Control', 'jidejs/ui/Skin', 'jidejs/ui/Pos',
		'jidejs/ui/control/SingleSelectionModel', 'jidejs/ui/control/Popup', 'jidejs/ui/control/ListView',
		'jidejs/ui/control/Cell'
], function(Class, Observable, _, DOM, ObservableList, Control, Skin, Pos, SingleSelectionModel, Popup, ListView, Cell) {
		"use strict";

		var template = (function() {
			var base = document.createElement('div');
			var label = document.createElement('span');
			label.className = 'jide-choicebox-label';
			var button = document.createElement('span');
			button.className = 'jide-choicebox-button';
			button.innerHTML = '&#x25bc;';
			base.appendChild(label);
			base.appendChild(button);
			return base;
		}());

		/**
		 * Creates a new Skin for a given ChoiceBox.
		 *
		 * @memberof module:jidejs/ui/control/ChoiceBox
		 * @param {module:jidejs/ui/control/ChoiceBox} choiceBox The ChoiceBox
		 * @param {Element?} element The HTML element that should be used as the root of the DOM structure.
		 * @constructor
		 * @extends module:jidejs/ui/Skin
		 * @namespace
		 */
		function ChoiceBoxSkin(choiceBox, element) {
			Skin.call(this, choiceBox);
			this.element = element || template.cloneNode(true);
			this.autoHideHandler = function(e) {
				if(!DOM.isInElement(this.element, { x:e.pageX, y:e.pageY})
						&& !DOM.isInElement(this.popup.element, {x: e.pageX, y: e.pageY})) {
					this.component.showing = false;
				}
			}.bind(this);
		}
		Class(ChoiceBoxSkin).extends(Skin).def({
			install: function() {
				var choiceBox = this.component;
				var listView = this.listView = new ListView({
					selectionModel: choiceBox.selectionModel,
					items: choiceBox.items,
					cellFactory: choiceBox.cellFactory,
					converter: choiceBox.converter
				});
				var popup = this.popup = new Popup({
					content: listView,
					autoHide: true,
					consumeAutoHidingEvents: false
				});
				popup.classList.add('jide-choicebox-popup');

				var element = this.element;
				var label = element.firstChild;
				var button = element.lastChild;

				this.bindings = [
					listView.cellFactoryProperty.bind(choiceBox.cellFactoryProperty),
					listView.converterProperty.bind(choiceBox.converterProperty),
					choiceBox.on({
						click: function(e) {
							choiceBox.showing = !choiceBox.showing;
						}
					}),
					popup.visibleProperty.bind(choiceBox.showingProperty),
					choiceBox.showingProperty.subscribe(function(event) {
						if(event.value) {
							var box = DOM.getBoundingBox(element);
							var width = (box.right - box.left)+"px";
							if(popup.element.style.minWidth !== width) {
								popup.element.style.minWidth = width;
							}
							popup.setLocation(choiceBox, Pos.BOTTOM);
							document.body.addEventListener('click', this.autoHideHandler, true);
						} else {
							document.body.removeEventListener('click', this.autoHideHandler, true);
						}
					}, this),
					listView.selectionModel.selectedItemProperty.subscribe(function(event) {
						label.innerHTML = choiceBox.converter(event.value);
						choiceBox.showing = false;
					})
				];
				label.innerHTML = choiceBox.converter(listView.selectionModel.selectedItem);
			},
			dispose: function() {
				this.bindings.forEach(function(binding) {
					if(binding) binding.dispose();
				});
				delete this.bindings;
				this.popup.dispose();
				this.listView.dispose();
				delete this.popup;
				delete this.listView;
			}
		});

		/**
		 * Creates a new ChoiceBox from the given configuration.
		 *
		 *
		 * @memberof module:jidejs/ui/control/ChoiceBox
		 * @param {object} config The configuration.
		 * @param {array<object>} config.items The options that should be displayed to the user.
		 * @param {module:jidejs/ui/control/SelectionModel?} config.selectionModel The SelectionModel that
		 * 		should be used by the ChoiceBox. The default choice is a SingleSelectionModel.
		 * @constructor
		 * @alias module:jidejs/ui/control/ChoiceBox
		 */
		function ChoiceBox(config) {
			installer(this);

			config = _.defaults(config || {}, { tabIndex: 0 });
			if(!config.skin) config.skin = new ChoiceBox.Skin(this, config.element);

			if(!config.items) this.items = new ObservableList();
			else if(Array.isArray(config.items)) this.items = new ObservableList(config.items);
			else this.items = config.items; // assume config.items is an ObservableList
			delete config.items;

			if(config.selectionModel) this.selectionModel = config.selectionModel;
			else this.selectionModel = new SingleSelectionModel(this.items);
			delete config.selectionModel;

			Control.call(this, config);
			this.classList.add('jide-choicebox');
		}
		Class(ChoiceBox).extends(Control).def({
			dispose: function() {
				Control.prototype.dispose.call(this);
				installer.dispose(this);
			},

			/**
			 * The list of items that the user can choose between.
			 * @type module:jidejs/base/ObservableList
			 */
			items: null,
			/**
			 * The SelectionModel used internally.
			 * @readonly
			 */
			selectionModel: null,
			/**
			 * Creates a new Cell that is displayed in the popup of the ChoiceBox.
			 *
			 * If you would like to change the display of the popup, you should override this method and configure
			 * a custom Cell.
			 *
			 * @returns {module:jidejs/ui/control/Cell}
			 */
			cellFactory: function() {
				var cell = new Cell();
				cell.converterProperty.bind(this.converterProperty);
				return cell;
			},
			/**
			 * The factory that creates a new Cell for the ListView.
			 * @type module:jidejs/base/ObservableProperty
			 * @see module:jidejs/ui/control/ChoiceBox#cellFactory
			 */
			cellFactoryProperty: null,

			/**
			 * Converts the currently selected value into a `string` that can be displayed directly
			 * by the ChoiceBox.
			 *
			 * This method must support cases where there is no selection, i.e. the value passed to it is `null` or
			 * `undefined`.
			 *
			 * @param {*} o The currently selected value.
			 * @returns {string} A `string` representation of the value.
			 */
			converter: function(o) { return ""+(o || "None"); },
			/**
			 * Contains the converter used by the ChoiceBox.
			 *
			 * @see module:jidejs/ui/control/ChoiceBox#converter
			 * @type {module:jidejs/base/ObservableProperty}
			 */
			converterProperty: null,
			/**
			 * `true`, if the ChoiceBox is currently showing its popup; `false`, otherwise.
			 *
			 * @readonly
			 * @type boolean
			 */
			showing: false,
			/**
			 * `true`, if the ChoiceBox is currently showing its popup; `false`, otherwise.
			 *
			 * @see module:jidejs/ui/control/ChoiceBox#showing
			 * @type module:jidejs/base/ObservableProperty
			 */
			showingProperty: null
		});
		var installer = Observable.install(ChoiceBox, 'value', 'converter', 'showing', 'cellFactory');
		/**
		 * Contains the default Skin used by all ChoiceBoxes. By replacing this value, you can specify the skin
		 * that will be used by every **new** ChoiceBox but it will not change that of old ones.
		 * @type {module:jidejs/ui/control/ChoiceBox.Skin}
		 */
		ChoiceBox.Skin = ChoiceBoxSkin;
		return ChoiceBox;
});