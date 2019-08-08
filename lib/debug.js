'use strict';

const debugNamespace = 'loopback-component-traceability';

module.exports = {

  /**
   * Create a debugger with a specific name
   * @param {String} name
   * @returns {Object}
   */
  create: (name = null) => {
    let key = debugNamespace;
    if (name) {
      key += `:${name}`;
    }
    return require('debug')(key);
  },

};
