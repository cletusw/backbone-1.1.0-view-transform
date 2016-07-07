/**
 * Fixes breaking change in Backbone 1.1.0 by appending the following to the begining of the initialize method of Backbone Views
 *
 *   // Backbone 1.1.0 - Backbone Views no longer automatically attach options passed to the constructor as this.options
 *   // See http://mikefowler.me/2013/12/17/reinstating-attached-view-options-in-backbone-1.1.0/
 *   if (this.options) {
 *     options = _.extend({}, _.result(this, 'options'), options);
 *   }
 *
 *   this.options = options;
 *   // End Backbone 1.1.0
 *
 * The local `options` variable is replaced with the name of the first argument to this initialize method. If none found, one is created.
 * 
 * Setup:
 *   * Install jscodeshift (https://github.com/facebook/jscodeshift#install)
 *       npm install -g jscodeshift
 * 
 * Run:
 *     jscodeshift path/to/source/files/ -t path/to/backbone-1.1.0-view-transform.js
 */

module.exports = function (file, api) {
  const removeThisSentinel = '____REMOVE_THIS____';
  const blankLineSentinel = '____INSERT_BLANK_LINE_HERE____';
  const printOptions = {
    quote: 'single'
  };
  const j = api.jscodeshift;
  return j(file.source)
    .find(j.FunctionExpression)
    .filter(path => {
      return path.parent.value.type === 'Property'
        && path.parent.value.key.name === 'initialize'
        && path.parent.parent.value.type === 'ObjectExpression'
        && path.parent.parent.parent.value.type === 'CallExpression'
        && j.match(path.parent.parent.parent.value, {
         callee: {
           object: {
             object: {
               name: 'Backbone'
             },
             property: {
               name: 'View'
             }
           },
           property: {
             name: 'extend'
           }
         }
       });
    })
    .forEach(path => {
      if (!path.get('params', 0).value) {
        path.get('params').unshift(j.identifier('options'));
      }
      var firstParamName = path.get('params', 0).value.name;
      var output = [
        j.ifStatement(
          j.memberExpression(
            j.thisExpression(),
            j.identifier('options')
          ),
          j.blockStatement([
            j.expressionStatement(
              j.assignmentExpression(
                '=',
                j.identifier(firstParamName),
                j.callExpression(
                  j.memberExpression(
                    j.identifier('_'),
                    j.identifier('extend')
                  ), [
                    j.objectExpression([]),
                    j.callExpression(
                      j.memberExpression(
                        j.identifier('_'),
                        j.identifier('result')
                      ), [
                        j.thisExpression(),
                        j.literal('options')
                      ]
                    ),
                    j.identifier(firstParamName)
                  ]
                )
              )
            )
          ])
        ),
        j.expressionStatement(
          j.assignmentExpression(
            '=',
            j.memberExpression(
              j.thisExpression(),
              j.identifier('options')
            ),
            j.identifier(firstParamName)
          )
        ),
        j.expressionStatement(
          j.identifier(removeThisSentinel) // For formatting. Removed after toSource 
        ),
        j.expressionStatement(
          j.identifier(blankLineSentinel) // For formatting. Removed after toSource
        )
      ];
      output[0].comments = [
        j.commentLine(' Backbone 1.1.0 - Backbone Views no longer automatically attach options passed to the constructor as this.options'),
        j.commentLine(' See http://mikefowler.me/2013/12/17/reinstating-attached-view-options-in-backbone-1.1.0/'),
      ];
      output[2].comments = [
        j.commentLine(' End Backbone 1.1.0', false, true)
      ];
      path.get('body', 'body').unshift(...output);
    })
    .toSource(printOptions)
    .replace(new RegExp(`${removeThisSentinel};`, 'g'), '')
    .replace(new RegExp(`[ \r\t]+${blankLineSentinel};`, 'g'), '');
};
