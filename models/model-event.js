'use strict';

/*
 * ModelEvent Model.
 * Copyright (c) 2018. ALIA Technologies S.L.
 * Project: loopback-component-traceability
 * File: models/model-event.js
 * Author: Juan Costa <juancosta@alialabs.com>
 */

const EventType = require('../lib/event-type');
const _ = require('lodash');
const sprintf = require('sprintf-js').sprintf;

module.exports = function (ModelEvent) {
  //============================================================================================================
  //  SETUP
  //============================================================================================================

  /**
   * Setup dynamic relations.
   * This is called by the component initializer.
   * @param {Options} options Component options
   */
  ModelEvent.setupRelations = function (options) {
    // Attach author relation
    ModelEvent.belongsTo(options.userModelName, {
      description: 'User that triggered the event',
      as: 'author',
      foreignKey: 'authorId',
    });
  };

  //============================================================================================================
  //  CONSTANTS
  //============================================================================================================

  //============================================================================================================
  //  VALIDATION METHODS
  //============================================================================================================

  // Validate details.
  ModelEvent.validateAsync('details', function (reject, resolve) {
    const event = this;
    process.nextTick(() => {
      event.typeSpec.validateDetails(event, (err, valid) => {
        return !err && valid === true ? resolve() : reject(err);
      });
    });
  }, {message: 'Details dictionary is not valid'});

  //============================================================================================================
  //  OPERATION HOOKS
  //============================================================================================================

  // Compile message before save
  ModelEvent.observe('before save', (ctx, next) => {
    const inst = ctx.instance || ctx.currentInstance;
    if (!inst) return next();
    inst.compileMessage();
    next();
  });

  //============================================================================================================
  //  STATIC METHODS
  //============================================================================================================

  /**
   * Get a new instance.
   * @param {Object} data
   * @returns {ModelEvent}
   */
  ModelEvent.getInstance = function (data = {}) {
    const inst = new ModelEvent();
    inst.setType(data.type);
    inst.resetDetails();
    if (data.object) {
      inst.setObject(data.object);
    }
    if (data.message) {
      inst.setMessageTemplate(data.message);
    }
    if (data.author) {
      inst.setAuthor(data.author);
    }
    if (data.details) {
      inst.extendDetails(data.details);
    }
    return inst;
  };

  //============================================================================================================
  //  INSTANCE METHODS
  //============================================================================================================

  /**
   * Set involved object.
   * @param {ModelTraceable} object
   */
  ModelEvent.prototype.setObject = function (object) {
    this.object(object);
    const mixinOpts = object.getTraceableOptions();
    this.objectName = object[mixinOpts.displayProperty];
    if (this.typeSpec) {
      const modelDetails = object.getTraceableModelDetails(this.typeSpec);
      this.extendDetails(modelDetails);
    }
  };

  /**
   * Set type.
   * @param {EventType|String|false} type EventType instance or type name
   */
  ModelEvent.prototype.setType = function (type) {
    let typeObject;
    if (type instanceof EventType) {
      typeObject = type;
    } else if (_.isString(type)) {
      typeObject = EventType.getType(type) || EventType.getDefaultType(type);
    }
    this.typeSpec = typeObject;
    this.type = typeObject.type;
    // Take from event type those properties that were not set yet
    if (!this.messageTemplate) {
      this.messageTemplate = typeObject.message;
    }
  };

  /**
   * Set message template.
   * @param {String} template
   */
  ModelEvent.prototype.setMessageTemplate = function (template) {
    this.messageTemplate = template;
  };

  /**
   * Set message.
   * @param {String} message
   */
  ModelEvent.prototype.setMessage = function (message) {
    this.message = message;
  };

  /**
   * Compile message template to generate the real message.
   */
  ModelEvent.prototype.compileMessage = function () {
    if (!this.messageTemplate) return;
    const props = this.toJSON();
    let message = '';
    try {
      message = sprintf(this.messageTemplate, props);
    } catch (e) {
      //
    }
    this.setMessage(message);
  };

  /**
   * Set author.
   * @param {User|string} author User instance or user id
   */
  ModelEvent.prototype.setAuthor = function (author) {
    if (_.isString(author)) {
      this.authorId = author;
    } else {
      this.author(author);
    }
  };

  /**
   * Reset details to defaults.
   */
  ModelEvent.prototype.resetDetails = function () {
    this.setDetails(this.typeSpec.getDefaultDetails());
  };

  /**
   * Set details dictionary.
   * @param {Object} details
   */
  ModelEvent.prototype.setDetails = function (details) {
    this.details = details;
  };

  /**
   * Extend details dictionary
   * @param {Object} details
   */
  ModelEvent.prototype.extendDetails = function (details) {
    details = _.merge({}, this.getDetails(), details);
    this.setDetails(details);
  };

  /**
   * Get details dictionary.
   * @returns {Object}
   */
  ModelEvent.prototype.getDetails = function () {
    return this.details;
  };

  /**
   * Whether the event can be saved.
   * @returns {Boolean}
   */
  ModelEvent.prototype.isRegistrable = function () {
    return this.typeSpec.isEnabled();
  };
};
