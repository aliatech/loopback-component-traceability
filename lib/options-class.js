'use strict';

/*
 * Class to manage and centralize component options.
 * Copyright (c) 2018. ALIA Technologies S.L.
 * Project: loopback-component-traceability
 * File: lib/options-class.js
 * Author: Juan Costa <juancosta@alialabs.com>
 */

const _ = require('lodash');

module.exports = class Options {

  /**
   * Create a new instance initialized with defaults.
   * @param {Object} app
   * @returns {Options}
   */
  static create (app) {
    const inst = new Options(app);
    inst.reset();
    return inst;
  }

  /**
   * Get defaults.
   * @returns {{userModel: String}}
   */
  static get defaults () {
    return {
      userModel: 'User',
      eventModel: 'ModelEvent',
      displayProperty: 'name',
      events: {
        create: true,
        update: true,
        remove: true,
      },
    };
  }

  /**
   * @param {Object} app
   */
  constructor (app) {
    this.app = app;
  }

  /**
   * Reset with defaults.
   */
  reset () {
    this.set(Options.defaults);
  }

  /**
   * Set options.
   * @param {Object} options
   */
  set (options) {
    this.options = options;
  }

  /**
   * Extend options.
   * @param {Object} options
   */
  extend (options) {
    options = _.merge({}, Options.defaults, options);
    this.set(options);
  }

  /**
   * Get the userModel name.
   * @returns {String}
   */
  get userModelName () {
    return this.options.userModel;
  }

  /**
   * Get the userModel class.
   * @returns {Class}
   */
  get userModel () {
    return this.app.models[this.userModelName];
  }

  /**
   * Get the events option.
   * @returns {Object}
   */
  get events () {
    return this.options.events;
  }

};
