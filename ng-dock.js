/* based on  https://github.com/dardino/ngDock
   - added support for ng-show; 
   - added literal dock values: "top" is allowed instead of  "'top'"
   - renamed dock-ref attribute to dock-panel
   - renamed some variables in Javascript
*/
angular.module('ngDock', [])
  .factory('dock', function () {
      var dockTypes = ['left', 'right', 'top', 'bottom', 'fill'];
      return {
          dockPanels: {},
          dockTypes: dockTypes,
          handlesByDock: {
              "top": "rect",
              "left": "e",
              "right": "w",
              "bottom": "n"
          },
          Area: (function () {
              function setPosition(style, rect, dockType) {
                  style.position = 'absolute';
                  if (dockType !== "bottom") style.top = rect.top; else { style.top = 'auto'; }
                  if (dockType !== "left") style.right = rect.right; else { style.right = 'auto'; }
                  if (dockType !== "right") style.left = rect.left; else { style.left = 'auto'; }
                  if (dockType !== "top") style.bottom = rect.bottom; else { style.bottom = 'auto'; }
              }
              function decreaseSize($element, dockType, rect) {
                  if (!$element.is(':visible')) return;
                  if ("top|bottom".indexOf(dockType) != -1) size = $element.outerHeight(true);
                  if ("left|right".indexOf(dockType) != -1) size = $element.outerWidth(true);
                  if (dockType === "bottom") rect.bottom += size;
                  if (dockType === "left") rect.left += size;
                  if (dockType === "right") rect.right += size;
                  if (dockType === "top") rect.top += size;
              }
              function removeClasses($element) {
                  var i = dockTypes.length;
                  while (i--) {
                      $element.removeClass("dock-" + dockTypes[i]);
                  }
              }
              function update($element, dockType, rect) {
                  var style = {};
                  removeClasses($element);
                  setPosition(style, rect, dockType);
                  $element.addClass("dock-" + dockType);
                  $element.css(style);
                  decreaseSize($element, dockType, rect);
              }
              var Area = function ($div, $scope) {
                  function evalDockType($dockType) {
                      var dockType = $dockType;
                      if (dockTypes.indexOf(dockType) == -1) {
                          // not a valid dock type: may be an expression;
                          dockType = $scope.$eval($dockType);
                      }

                      if (dockTypes.indexOf(dockType) == -1) {
                          // still not a valid dock type: bail
                          throw { message: "invalid dock value '" + dockType + "'. Valid values are: " + dockTypes.join(', ') };
                      }

                      return dockType;
                  }

                  var rect = {
                      top: 0,
                      bottom: 0,
                      left: 0,
                      right: 0
                  };

                  var childList = [];
                  this.addChild = function ($element, $dockType) {
                      var dockType = evalDockType($dockType);  
                      childList.push({
                          element: $element,
                          dockType: $dockType, // not evaluated version, may be an expression
                          order: childList.length
                      });
                      update($element, dockType, rect);
                  };
                  this.refresh = function (isDelayed) {

                      for (var i = 0; i < childList.length; i++) {
                          childList[i].dockCalculated = evalDockType(childList[i].dockType);
                      }

                      function doUpdate() {
                          rect.top = 0;
                          rect.bottom = 0;
                          rect.left = 0;
                          rect.right = 0;

                          for (var i = 0; i < childList.length; i++) {
                              update(childList[i].element, childList[i].dockCalculated, rect);
                          }
                      }

                      if (isDelayed) {
                          setTimeout(doUpdate);
                      } else {
                          doUpdate();
                      }
                  };

                  var _this = this;
                  $(window).resize(function () {
                      _this.refresh(false);
                  });
                  $scope.$watch(function () {
                      // must delay; if we don't, we won't see the effect of any ng-show changes
                      _this.refresh(true);
                  });
              };
              return Area;
          })()
      };
  })
  .directive('dockPanel', function (dock) {
      return {
          restrict: "A",
          controller: function ($scope, $element) {
              $scope.__dock_ref_id = String(Math.random()).replace(/\./g, "");
              dock.dockPanels[$scope.__dock_ref_id] = new dock.Area($element, $scope);
          },
          scope: true
      };
  })
  .directive('dock', function (dock) {
      return {
          restrict: "A",
          controller: function ($scope, $element) {
              var dp = $element.attr('dock');
              $scope.__dock_id = String(Math.random()).replace(/\./g, "");
              var area = dock.dockPanels[$scope.$parent.__dock_ref_id];
              area.addChild($element, dp);
          },
          scope: true
      };
  })
 