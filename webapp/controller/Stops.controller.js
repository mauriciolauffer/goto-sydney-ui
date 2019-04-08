sap.ui.define([
  'sap/ui/model/Filter',
  'sap/ui/model/FilterOperator',
  'mlauffer/goto/sydney/australia/controller/BaseController'
], function(Filter, FilterOperator, BaseController) {
  'use strict';

  const viewModelName = 'stopsView';
  const Stops = BaseController.extend('mlauffer.goto.sydney.australia.controller.Stops', {
    _list: null
  });

  /**
   * Called when the master list controller is instantiated. It sets up the event handling for the master/detail
   * communication and other lifecycle tasks.
   * @public
   */
  Stops.prototype.onInit = function() {
    this._list = this.getView().byId('list');
    this.createViewModel(viewModelName, {
      isFilterBarVisible: false,
      filterBarLabel: '',
      busy: true,
      title: this.getResourceBundle().getText('stopsTitleCount', [0]),
      selectedPath: null,
      isOffline: this.getOwnerComponent()._custom.isOffline
    });

    this.getRouter().getTarget('stops').attachDisplay(this._onDisplayTarget, this);
  };

  /**
   * Sets the busy indicator to true when update of list data is triggered
   * @function
   * @public
   */
  Stops.prototype.onUpdateStarted = function() {
    this.getModel(viewModelName).setProperty('/busy', true);
  };

  /**
   * After list data is available, this handler method updates the
   * master list counter and hides the pull to refresh control, if
   * necessary.
   * @param {sap.ui.base.Event} evt the update finished event
   * @public
   */
  Stops.prototype.onUpdateFinished = function(evt) {
    this._updateListItemCount(evt.getParameter('total'));
  };


  /**
   * Event handler for the list selection event
   * Get the list item, either from the listItem parameter or from the event's source itself
   * Will depend on the device-dependent mode.
   * @param {sap.ui.base.Event} evt the list selectionChange event
   * @public
   */
  Stops.prototype.onSelectionChange = function(evt) {
    const context = (evt.getParameter('listItem')) ?
      evt.getParameter('listItem').getBindingContext() : evt.getSource().getBindingContext();
    this.setSelectedStopPath(context.getPath());
    this.openTimetableDialog();
  };

  /**
   * Event handler for the map button press event
   * Navigate to map view
   * @param {sap.ui.base.Event} evt the button press event
   * @public
   */
  Stops.prototype.onPressMap = function() {
    this.getRouter().getTargets().display('map', 'stops');
  };

  Stops.prototype._onDisplayTarget = function() {
    const route = this.getModel().getProperty(this.getSelectedRoutePath());
    this._list.removeSelections(true);
    this._filter(this.getSelectedTripPath());
    this.setRealtimeRoute(route.route_id);
  };

  /**
   * Sets the item count on the master list header
   * @param {int} totalItems the total number of items in the list
   * @private
   */
  Stops.prototype._updateListItemCount = function(totalItems) {
    if (this._list.getBinding('items').isLengthFinal()) {
      const title = this.getResourceBundle().getText('stopsTitleCount', [totalItems]);
      this.getModel(viewModelName).setProperty('/title', title);
      this.getModel(viewModelName).setProperty('/busy', false);
    }
  };

  /**
   * Internal helper method to apply both filter and search state together on the list binding
   * @function
   * @private
   * @param {string} path Filters to be applied
   */
  Stops.prototype._filter = function(path) {
    const route = this.getModel().getProperty(this.getSelectedRoutePath());
    const trip = this.getModel().getProperty(path);
    const filters = this._createFilters(trip.route_id, trip.direction_id);
    const info = this.getResourceBundle().getText('stopsFilterBarText', [route.route_short_name, route.route_long_name, trip.trip_headsign]);
    this._applyFilterSearch(filters);
    this._updateFilterBar(info);
  };

  /**
   * Internal helper method to create filters objects
   * @function
   * @private
   * @param {string} routeId Route ID to be used in the query
   * @param {string} directionId Trip Direction ID to be used in the query
   * @return {array} List of filters to be applied
   */
  Stops.prototype._createFilters = function(routeId, directionId) {
    const filters = [];
    if (routeId) {
      const stops = this.getStopsByRouteTripDirection(routeId, directionId);
      this.setStopMapMarkers(stops);
      this.displayMarkers();
      stops.forEach(function(stop) {
        filters.push(new Filter('stop_id', FilterOperator.EQ, stop.stop_id));
      });
    }
    return filters;
  };

  /**
   * Internal helper method to apply both filter and search state together on the list binding
   * @function
   * @private
   * @param {array} filters Filters to be applied
   */
  Stops.prototype._applyFilterSearch = function(filters) {
    this._list.getBinding('items').filter(filters, 'Application');
  };

  /**
   * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
   * @param {string} info the selected filter value
   * @private
   */
  Stops.prototype._updateFilterBar = function(info) {
    const viewModel = this.getModel(viewModelName);
    viewModel.setProperty('/filterBarLabel', info);
  };

  return Stops;
});
