sap.ui.define([
  'sap/ui/model/Filter',
  'sap/ui/model/FilterOperator',
  'mlauffer/goto/sydney/australia/controller/BaseController'
], function(Filter, FilterOperator, BaseController) {
  'use strict';

  const viewModelName = 'tripsView';
  const Trips = BaseController.extend('mlauffer.goto.sydney.australia.controller.Trips', {
    _list: null
  });

  /**
   * Called when the master list controller is instantiated. It sets up the event handling for the master/detail
   * communication and other lifecycle tasks.
   * @public
   */
  Trips.prototype.onInit = function() {
    this._list = this.getView().byId('list');
    this.createViewModel(viewModelName, {
      isFilterBarVisible: false,
      filterBarLabel: '',
      busy: true,
      title: this.getResourceBundle().getText('tripsTitle'),
      selectedPath: null,
      selectedRouteType: null,
      isOffline: this.getOwnerComponent()._custom.isOffline
    });

    this.getRouter().getTarget('trips').attachDisplay(this._onDisplayTarget, this);
  };

  /**
   * Sets the busy indicator to true when update of list data is triggered
   * @function
   * @public
   */
  Trips.prototype.onUpdateStarted = function() {
    this.getModel(viewModelName).setProperty('/busy', true);
  };

  /**
   * After list data is available, this handler method updates the
   * master list counter and hides the pull to refresh control, if
   * necessary.
   * @param {sap.ui.base.Event} evt the update finished event
   * @public
   */
  Trips.prototype.onUpdateFinished = function(evt) {
    this._updateListItemCount(evt.getParameter('total'));
  };


  /**
   * Event handler for the list selection event
   * Get the list item, either from the listItem parameter or from the event's source itself
   * Will depend on the device-dependent mode.
   * @param {sap.ui.base.Event} evt the list selectionChange event
   * @public
   */
  Trips.prototype.onSelectionChange = function(evt) {
    const context = (evt.getParameter('listItem')) ?
      evt.getParameter('listItem').getBindingContext() : evt.getSource().getBindingContext();
    this._showDetail(context);
  };

  /**
   * Event handler for the map button press event
   * Navigate to map view
   * @param {sap.ui.base.Event} evt the button press event
   * @public
   */
  Trips.prototype.onPressMap = function() {
    this.getRouter().getTargets().display('map', 'trips');
  };

  /**
   * If the master route was hit (empty hash) we have to set
   * the hash to to the first item in the list as soon as the
   * listLoading is done and the first item in the list is known
   * @private
   */
  Trips.prototype._onDisplayTarget = function() {
    this._list.removeSelections(true);
    const filters = [];
    const route = this.getModel().getProperty(this.getSelectedRoutePath());
    let query = route.route_id;
    if (query) {
      filters.push(new Filter('route_id', FilterOperator.EQ, query));
      query = route.route_short_name + ' ' + route.route_long_name;
    }
    this.getModel(viewModelName).setProperty('/selectedPath', this.getSelectedRoutePath());
    this.getModel(viewModelName).setProperty('/selectedRouteType', route.route_type);
    this._getTripStops(route.route_id);
    this._applyFilterSearch(filters);
    this._updateFilterBar(query);
    this.setRealtimeRoute(route.route_id);
  };

  /**
   * Shows the selected item on the detail page
   * On phones a additional history entry is created
   * @param {sap.ui.model.Context} context selected item context
   * @private
   */
  Trips.prototype._showDetail = function(context) {
    this.setSelectedTripPath(context.getPath());
    this.getRouter().getTargets().display('stops');
  };

  /**
   * Sets the item count on the master list header
   * @private
   */
  Trips.prototype._updateListItemCount = function() {
    if (this._list.getBinding('items').isLengthFinal()) {
      this.getModel(viewModelName).setProperty('/busy', false);
    }
  };

  /**
   * Internal helper method to create filters objects
   * @function
   * @private
   * @param {string} routeId String to be used in the query
   */
  Trips.prototype._getTripStops = function(routeId) {
    const stops = this.getStopsByRoute(routeId);
    this.setStopMapMarkers(stops);
    this.displayMarkers();
  };

  /**
   * Internal helper method to apply both filter and search state together on the list binding
   * @function
   * @private
   * @param {array} filters Filters to be applied
   */
  Trips.prototype._applyFilterSearch = function(filters) {
    this._list.getBinding('items').filter(filters, 'Application');
  };

  /**
   * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
   * @param {string} info the selected filter value
   * @private
   */
  Trips.prototype._updateFilterBar = function(info) {
    const viewModel = this.getModel(viewModelName);
    viewModel.setProperty('/filterBarLabel', this.getResourceBundle().getText('tripsFilterBarText', [info]));
  };

  return Trips;
});
