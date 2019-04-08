sap.ui.define([
  'sap/ui/thirdparty/jquery',
  'sap/base/Log',
  'sap/ui/core/UIComponent',
  'sap/ui/Device',
  'sap/m/MessageToast',
  'mlauffer/goto/sydney/australia/model/models',
  'sap/m/CustomListItem',
  'sap/ui/core/ComponentSupport'
], function($, Log, UIComponent, Device, MessageToast, models) {
  'use strict';

  const Component = UIComponent.extend('mlauffer.goto.sydney.australia.Component', {
    metadata : {
      manifest : 'json'
    }
  });

  /**
   * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
   * In this method, the FLP and device models are set and the router is initialized.
   * @public
   * @override
   */
  Component.prototype.init = function() {
    this._custom = {
      logger: Log.getLogger('mlauffer.goto.sydney.australia'),
      isOffline: false,
      resourceBundle: null
    };
    this._setModels();
    this._isAppOffline();

    UIComponent.prototype.init.apply(this, arguments);

    //Initiate router after loading maps and Sync ResourceBundle
    const router = this.getRouter();
    this._setResourceBundleSync()
      .then(function() {
        if (window.google && window.google.maps) {
          router.initialize();
        } else {
          const apiKey = 'GOOGLE_MAPS_API_KEY';
          $.getScript('https://maps.googleapis.com/maps/api/js?key=' + apiKey)
            .always(function() {
              router.initialize();
            });
        }
      });
  };

  /**
   * The component is destroyed by UI5 automatically.
   * @public
   * @override
   */
  Component.prototype.destroy = function() {
    this._custom = null;
    UIComponent.prototype.destroy.apply(this, arguments);
  };

  /**
   * This method can be called to determine whether the sapUiSizeCompact or sapUiSizeCozy
   * design mode class should be set, which influences the size appearance of some controls.
   * @public
   * @return {string} css class, either 'sapUiSizeCompact' or 'sapUiSizeCozy' - or an empty string if no css class should be set
   */
  Component.prototype.getContentDensityClass = function() {
    if (this._sContentDensityClass === undefined) {
      // check whether FLP has already set the content density class; do nothing in this case
      if (jQuery(document.body).hasClass('sapUiSizeCozy') || jQuery(document.body).hasClass('sapUiSizeCompact')) {
        this._sContentDensityClass = '';
      } else if (!Device.support.touch) { // apply "compact" mode if touch is not supported
        this._sContentDensityClass = 'sapUiSizeCompact';
      } else {
        // "cozy" in case of touch support; default for most sap.m controls, but needed for desktop-first controls like sap.ui.table.Table
        this._sContentDensityClass = 'sapUiSizeCozy';
      }
    }
    return this._sContentDensityClass;
  };

  Component.prototype._setModels = function() {
    this.setModel(models.createDeviceModel(), 'device');
  };

  Component.prototype._getResourceBundleAsync = function() {
    return this.getModel('i18n').getResourceBundle()
      .then(function(resourceBundle) {
        return resourceBundle;
      });
  };

  Component.prototype._setResourceBundleSync = function() {
    return this._getResourceBundleAsync()
      .then(function(resourceBundle) {
        this._custom.resourceBundle = resourceBundle;

      }.bind(this))
      .catch(function(err) {
        Log.error(err.toString());
      });
  };

  Component.prototype._isAppOffline = function() {
    const model = this.getModel('app');
    fetch(window.location.href + '.offline.test')
      .then()
      .catch(function() {
        this._custom.isOffline = true;
        model.setProperty('/isOffline', true);
        //MessageToast.show(this.getModel('i18n').getResourceBundle().getText('btOfflineTooltip'));
        this._getResourceBundleAsync()
          .then(function(resourceBundle) {
            MessageToast.show(resourceBundle.getText('btOfflineTooltip'));
          })
          .catch(function(err) {
            Log.error(err.toString());
          });
      }.bind(this));
  };

  return Component;
});
