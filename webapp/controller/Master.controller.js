sap.ui.define([
  'sap/m/GroupHeaderListItem',
  'sap/m/MessageToast',
  'sap/ui/model/json/JSONModel',
  'sap/ui/model/Filter',
  'sap/ui/model/FilterOperator',
  'mlauffer/goto/sydney/australia/controller/BaseController'
], function(GroupHeaderListItem, MessageToast, JSONModel, Filter, FilterOperator, BaseController) {
  'use strict';

  const viewModelName = 'masterView';
  const Master = BaseController.extend('mlauffer.goto.sydney.australia.controller.Master', {
    _list: null
  });

  /**
   * Called when the master list controller is instantiated. It sets up the event handling for the master/detail
   * communication and other lifecycle tasks.
   * @public
   */
  Master.prototype.onInit = function() {
    this._list = this.getView().byId('list');
    this.createViewModel(viewModelName, {
      isFilterBarVisible: false,
      filterBarLabel: '',
      busy: true,
      title: this.getResourceBundle().getText('masterTitleCount', [0]),
      isAddButtonEnabled: true,
      isOffline: this.getOwnerComponent()._custom.isOffline
    });

    this.getRouter().getTarget('master').attachDisplay(this._onMasterMatched, this);
    this.getRouter().attachBypassed(this._onBypassed, this);
  };

  /**
   * Sets the busy indicator to true when update of list data is triggered
   * @function
   * @public
   */
  Master.prototype.onUpdateStarted = function() {
    this.getModel(viewModelName).setProperty('/busy', true);
  };

  /**
   * After list data is available, this handler method updates the
   * master list counter and hides the pull to refresh control, if
   * necessary.
   * @param {sap.ui.base.Event} evt the update finished event
   * @public
   */
  Master.prototype.onUpdateFinished = function(evt) {
    this._updateListItemCount(evt.getParameter('total'));
    this.getView().byId('pullToRefresh').hide();
  };

  /**
   * Event handler for the master search field. Applies current
   * filter value and triggers a new search. If the search field's
   * 'refresh' button has been pressed, no new search is triggered
   * and the list binding is refresh instead.
   * @param {sap.ui.base.Event} evt the search event
   * @public
   */
  Master.prototype.onSearch = function(evt) {
    if (evt.getParameter('refreshButtonPressed')) {
      this.onRefresh();
      return;
    }
    const filters = [];
    const query = evt.getParameter('query');
    if (query) {
      filters.push(new Filter({
        filters: [
          new Filter('route_short_name', FilterOperator.Contains, query),
          new Filter('route_long_name', FilterOperator.Contains, query)
        ],
        and: false
      }));
    }
    this._applyFilterSearch(filters);
    this._updateFilterBar(query);
  };

  /**
   * Event handler for the list selection event
   * Get the list item, either from the listItem parameter or from the event's source itself
   * Will depend on the device-dependent mode.
   * @param {sap.ui.base.Event} evt the list selectionChange event
   * @public
   */
  Master.prototype.onSelectionChange = function(evt) {
    const context = (evt.getParameter('listItem'))
      ? evt.getParameter('listItem').getBindingContext() : evt.getSource().getBindingContext();
    this._showDetail(context);
  };

  /**
   * Event handler for the map button press event
   * Navigate to map view
   * @param {sap.ui.base.Event} evt the button press event
   * @public
   */
  Master.prototype.onPressMap = function() {
    this.getRouter().getTargets().display('map', 'master');
  };

  /**
   * Event handler for the bypassed event, which is fired when no routing pattern matched.
   * If there was an object selected in the master list, that selection is removed.
   * @public
   */
  Master.prototype._onBypassed = function() {
    this._list.removeSelections(true);
  };

  /**
   * If the master route was hit (empty hash) we have to set
   * the hash to to the first item in the list as soon as the
   * listLoading is done and the first item in the list is known
   * @private
   */
  Master.prototype._onMasterMatched = function() {
    this._list.removeSelections(true);
    this.setStopMapMarkers(this.getModel().getProperty('/Stops'));
    this.displayMarkers();
  };

  /**
   * Shows the selected item on the detail page
   * On phones a additional history entry is created
   * @param {sap.ui.model.Context} context selected item context
   * @private
   */
  Master.prototype._showDetail = function(context) {
    this.setSelectedRoutePath(context.getPath());
    this.getRouter().getTargets().display('trips');
  };

  /**
   * Sets the item count on the master list header
   * @param {int} totalItems the total number of items in the list
   * @private
   */
  Master.prototype._updateListItemCount = function(totalItems) {
    if (this._list.getBinding('items').isLengthFinal()) {
      const title = this.getResourceBundle().getText('masterTitleCount', [totalItems]);
      this.getModel(viewModelName).setProperty('/title', title);
      this.getModel(viewModelName).setProperty('/busy', false);
    }
  };

  /**
   * Internal helper method to apply both filter and search state together on the list binding
   * @function
   * @private
   * @param {array} filters Filters to be applied
   */
  Master.prototype._applyFilterSearch = function(filters) {
    this._list.getBinding('items').filter(filters, 'Application');
  };

  /**
   * Internal helper method that sets the filter bar visibility property and the label's caption to be shown
   * @param {string} query the selected filter value
   * @private
   */
  Master.prototype._updateFilterBar = function(query) {
    const oViewModel = this.getModel(viewModelName);
    const isFilterBarVisible = !!(query);
    oViewModel.setProperty('/isFilterBarVisible', isFilterBarVisible);
    oViewModel.setProperty('/filterBarLabel', this.getResourceBundle().getText('filterBarText', [query]));
  };

  /**
   * Returns a group header with agency name
   * @param {string} group the selected agency ID
   * @return {sap.m.GroupHeaderListItem} group header with agency name
   * @private
   */
  Master.prototype.getGroupHeader = function(group) {
    return new GroupHeaderListItem({ title: this._getAgency(group.key).agency_name });
  };

  /**
   * Get agency by ID
   * @param {string} agencyId agency ID
   * @return {object} Agency
   * @private
   */
  Master.prototype._getAgency = function(agencyId) {
    const agencies = this.getModel().getProperty('/Agency');
    return agencies.find(function(agency) {
      return agency.agency_id === agencyId;
    });
  };

  Master.prototype._offline = function() {
    MessageToast.show('Seems you are offline. Everything is still accessible, but the maps...');
  };

  return Master;
});
