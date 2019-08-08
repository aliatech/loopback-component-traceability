# Loopback Component Traceability

Module for Loopback Framework that allows to keep a persisted traceability of custom operations over models

## Installation

```
npm i -S github:aliatech/loopback-component-traceability.git#develop
```

Enable and configure component in *component-config.json*

```
"loopback-component-traceability": {
  "userModel": "User" // Model to use as events' author 
}
```

Enable model files in *model-config.json*:

```
"models": [
  ...,
  "../node_modules/@aliatech7loopback-component-traceability/models"
]
```

Enable mixin files in *model-config.json*:

```
"mixins": [
  ...,
  "../node_modules/@aliatech/loopback-component-traceability/mixins"
]
```

Configure models in *model-config.json*:

```
...
"ModelEvent": {
  "dataSource": "db",
  "public": false
},
...
```

> Example: Change collection name in MongoDB

```
"ModelEvent": {
  "dataSource": "db",
  "public": true,
  "options": {
    "mongodb": {
      "collection": "Event"
    }
  }
},
```

### Notes

Enable ACL in your Loopback project if you haven't yet.
To achieve it, create the file *server/boot/authentication.js* with the following code:

```
'use strict';

module.exports = function enableAuthentication(server) {
  // enable authentication
  server.enableAuth();
};

```

### Development

Install development dependences from module root directory only if you want to execute module tests

```
cd node_modules/@aliatech/loopback-component-traceability
npm i --only=dev
```

## Usage

Configure the Traceable mixin in those models that require a traceability.
Add this in the model json file, under "mixins":

```
"mixins": [
  ...,
  "Traceable": true
]
```  

You also can set options:

```
"mixins": [
  ...,
  "Traceable": {
    "displayProperty": "name", // Property used as display of the object
    "events": {
      "create": true, // Enables automatic event create
      "update": true, // Enables automatic event update
      "remove": true // Enables automatic event remove
    }
  }
]
```  
