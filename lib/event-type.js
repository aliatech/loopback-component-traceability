'use strict';

/*
 * Class to represent a generic event type. Also keeps a pool of type subclasses.
 * A event type implements custom event behavior.
 * Copyright (c) 2018. ALIA Technologies S.L.
 * Project: loopback-component-traceability
 * File: lib/event-type.js
 * Author: Juan Costa <juancosta@alialabs.com>
 */

const _ = require('lodash');

module.exports = class EventType {

  /**
   * Get default options for an event type.
   * This is for default event types like create, update and remove.
   * @param {String} typeName
   * @returns {Object|null} Default options or null if the type is unknown.
   */
  static getTypeDefaultOptions (typeName) {
    switch (typeName) {
      case 'create':
        return {
          message: 'a %(objectType)s %(objectName)s was created',
        };
      case 'update':
        return {
          message: 'a %(objectType)s %(objectName)s was updated',
        };
      case 'remove':
        return {
          message: 'a %(objectType)s %(objectName)s was removed',
        };
      default:
        return null;
    }
  }

  /**
   * Add a new event type.
   * @param {String} typeName
   * @param {Object|Boolean} options Type options if object or enable/disable flag if boolean
   * @returns {EventType} EventType instance
   */
  static addType (typeName, options) {
    let pool = EventType.pool;
    if (!pool) pool = EventType.pool = {};
    const customType = EventType.createType(typeName, options);
    pool[typeName] = customType;
    return customType;
  }

  /**
   * Get an existing event type.
   * @param {String} typeName
   * @returns {EventType|undefined}
   */
  static getType (typeName) {
    return _.get(EventType.pool, typeName);
  }

  /**
   * Get an empty event type.
   * @param {String} typeName
   * @returns {EventType}
   */
  static getDefaultType (typeName) {
    return new EventType({type: typeName});
  }

  /**
   * Create a new instance initialized with defaults.
   * @param {String} typeName
   * @param {Object} options
   * @returns {EventType}
   */
  static createType (typeName, options) {
    if (_.isBoolean(options)) {
      options = {enabled: options};
    }
    options.type = typeName;
    const baseOptions = EventType.getTypeDefaultOptions(typeName);
    options = _.merge({}, baseOptions, options);
    return new EventType(options);
  }

  /**
   * EventType constructor.
   * @param {Object} [options]
   */
  constructor (options = {}) {
    this.setOptions(options);
  }

  /**
   * Set type options.
   * @param {Object} options Dictionary of options
   */
  setOptions (options) {
    this.__options = options;
    this.type = _.get(options, 'type');
    this.enabled = _.get(options, 'enabled') !== false;
    this.details = _.get(options, 'details');
    this.message = _.get(options, 'message');
  }

  /**
   * Whether the type is enabled.
   * @returns {boolean}
   */
  isEnabled () {
    return this.enabled !== false;
  }

  /**
   * Get defaults for event details dictionary.
   * @returns {Object}
   */
  getDefaultDetails () {
    return _.mapValues(this.details, 'default');
  }

  /**
   * Get a copy of the event type.
   * @param {Object} [options] Clone with custom options
   * @returns {EventType}
   */
  clone (options = {}) {
    options = _.merge({}, this.__options, options);
    return EventType.createType(this.type, options);
  }

  /**
   * Whether an event details is valid for an event type.
   * @param {ModelEvent} event
   * @param {Function} next passes the first error found and a valid flag
   */
  validateDetails (event, next) {
    const details = event.getDetails();
    _.each(this.details, (propConfig, prop) => {
      const value = _.get(details, prop);
      if (value === undefined && propConfig.required === true) {
        return next(new Error(`'details.${prop}' is required`), false);
      }
    });
    next(null, true);
  }

};
