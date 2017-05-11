# Backbone 1.1.0 View Transform

Codemod to fix breaking change in Backbone 1.1.0 by appending the following to the begining of the initialize method of Backbone Views

```javascript
// Backbone 1.1.0 - Backbone Views no longer automatically attach options passed to the constructor as this.options
// See http://mikefowler.me/2013/12/17/reinstating-attached-view-options-in-backbone-1.1.0/
if (this.options) {
  options = _.extend({}, _.result(this, 'options'), options);
}

this.options = options;
// End Backbone 1.1.0
```

The local `options` variable is replaced with the name of the first argument to this initialize method. If none found, one is created.

## Setup
 * Install jscodeshift (https://github.com/facebook/jscodeshift#install)
    ```
    npm install -g jscodeshift
    ```

## Run
```
jscodeshift path/to/source/files/ -t path/to/backbone-1.1.0-view-transform.js
```

## License

MIT
