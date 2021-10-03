(self.webpackChunkbachelor_thesis_code=self.webpackChunkbachelor_thesis_code||[]).push([[324],{1390:function(e,t,n){"use strict";var i=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.CurveDrawingVisualization=void 0;var r=i(n(6399));t.CurveDrawingVisualization=function(e,t,n,i){this.p5=e,this.demo=t,this.onlyDrawPointOnCurve=!1,this.color=null!=n?n:e.color("#E1B000"),this.colorOfPointOnCurve=null!=i?i:e.color(r.default.errorColor)}},921:function(e,t,n){"use strict";var i=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.CurveDemo=void 0;var r=i(n(6399)),o=n(7449),s=n(1925),a=n(6442),u=function(){function e(e,t,n,i,r){this.p5=e,this._t=0,this._controlPoints=[],this._showPointLabels=!1,this._showPointPositions=!1,this._showCurveDrawingVisualization=!0,this.showInfluenceVisForCurrentlyActiveCtrlPt=!1,this._positionDisplayMode="normalized coordinates",this.lastHoverState=!1,this.lastDraggingState=!1,this.noControlPointsMessage="Click or touch anywhere on the canvas to add a point",this.observers=[],this._tMin=t,this._tMax=n,this._basePointDiameter=.015*e.width,this._baseLineWidth=.0025*e.width,this.controlPointColors=this.initControlPointColors(),this.showPointLabels=!1,this.showPointPositions=!1,this.positionDisplayMode="pixel coordinates";var o=this.p5.createDiv();this.controlsContainerId="t-controls-container",o.id(this.controlsContainerId),i&&o.parent(i),o.class("flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select"),this.controlsForT=new a.ControlsForParameterT(e,this,this.controlsContainerId,r)}return Object.defineProperty(e.prototype,"curve",{get:function(){return this._influenceVisForActiveCtrlPt||(this._curve=this.initCurve()),this._curve},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"influenceVisForActiveCtrlPt",{get:function(){return this._influenceVisForActiveCtrlPt||(this._influenceVisForActiveCtrlPt=this.initInfluenceVisForActiveCtrlPt()),this._influenceVisForActiveCtrlPt},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"tMin",{get:function(){return this._tMin},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"tMax",{get:function(){return this._tMax},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"t",{get:function(){return this._t},set:function(e){this._t=e,this._t>this.tMax&&(this._t=this.tMin),this.t<this.tMin&&(this._t=this.tMax),this.controlsForT.updateSlider()},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"controlPoints",{get:function(){return this._controlPoints},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"basePointDiameter",{get:function(){return this._basePointDiameter},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"baseLineWidth",{get:function(){return this._baseLineWidth},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"showPointLabels",{get:function(){return this._showPointLabels},set:function(e){this._showPointLabels=e,this._controlPoints.forEach((function(t){return t.showLabel=e}))},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"showPointPositions",{get:function(){return this._showPointPositions},set:function(e){this._showPointPositions=e,this._controlPoints.forEach((function(t){return t.showPosition=e}))},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"showCurveDrawingVisualization",{get:function(){return this._showCurveDrawingVisualization},set:function(e){var t=this._showCurveDrawingVisualization;this._showCurveDrawingVisualization=e,t!==e&&this.notifyObservers("showCurveDrawingVisualizationChanged")},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"shouldDrawInfluenceVisForCurrentlyActiveCtrlPt",{get:function(){return this.showInfluenceVisForCurrentlyActiveCtrlPt&&(this.hovering||this.dragging)},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"positionDisplayMode",{get:function(){return this._positionDisplayMode},set:function(e){this._positionDisplayMode=e,this._controlPoints.forEach((function(t){return t.positionDisplayMode=e}))},enumerable:!1,configurable:!0}),e.prototype.setCurveDrawingVisualization=function(e){this.curveDrawingVisualization=e},e.prototype.handleMousePressed=function(){if(0===this.controlPoints.length){var e=this.createCtrlPtAtPos(this.p5.mouseX,this.p5.mouseY);return this.addCtrlPtAtIndex(e,0),void e.handleMousePressed()}for(var t=this.controlPoints.slice(),n=0;n<t.length;n++){var i=t[n];if(i.handleMousePressed(),i.dragging)break}},e.prototype.handleMouseReleased=function(){this.controlPoints.forEach((function(e){return e.handleMouseReleased()}))},e.prototype.handleTouchStarted=function(){if(0!==this.controlPoints.length)for(var e=this.controlPoints.slice(),t=0;t<e.length;t++){var n=e[t];if(n.handleTouchStarted(),n.dragging)break}else{var i=this.p5.touches;if(0===i.length)console.warn("touches was unexpectedly empty");else{var r=this.createCtrlPtAtPos(i[0].x,i[0].y);this.addCtrlPtAtIndex(r,0),r.handleTouchStarted()}}},e.prototype.handleTouchReleased=function(){this.controlPoints.forEach((function(e){return e.handleTouchReleased()}))},Object.defineProperty(e.prototype,"hovering",{get:function(){var e,t=this.controlPoints.some((function(e){return e.hovering}));return t!=this.lastHoverState&&(this.lastHoverState=t,null===(e=this.onHoverChange)||void 0===e||e.call(this)),t},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"dragging",{get:function(){var e,t=this.controlPoints.some((function(e){return e.dragging}));return t!=this.lastDraggingState&&(this.lastDraggingState=t,null===(e=this.onDraggingChange)||void 0===e||e.call(this)),t},enumerable:!1,configurable:!0}),e.prototype.draw=function(){var e,t,n;this.controlsForT.updateT(),0!==this.controlPoints.length?(this.valid?(null===(e=this.curve)||void 0===e||e.draw(),this.showInfluenceVisForCurrentlyActiveCtrlPt&&(null===(t=this.influenceVisForActiveCtrlPt)||void 0===t||t.draw()),this.showCurveDrawingVisualization&&(null===(n=this.curveDrawingVisualization)||void 0===n||n.draw())):this.displayMessage(this.curveInvalidMessage),this.drawControlPoints()):this.displayMessage(this.noControlPointsMessage)},e.prototype.drawControlPoints=function(){this.controlPoints.forEach((function(e){return e.draw()}))},Object.defineProperty(e.prototype,"curveInvalidMessage",{get:function(){return"The curve is invalid/undefined"},enumerable:!1,configurable:!0}),e.prototype.displayMessage=function(e){this.p5.push(),this.p5.textAlign(this.p5.CENTER),this.p5.text(e,this.p5.width/2,this.p5.height/2),this.p5.pop()},e.prototype.addElementAfter=function(e){var t=this.controlPoints.findIndex((function(t){return t===e}));if(-1!==t){var n=this.p5.touches,i=n.length>0,r=i?n[0].x:this.p5.mouseX,o=i?n[0].y:this.p5.mouseY,s=this.createCtrlPtAtPos(r,o);this.addCtrlPtAtIndex(s,t+1),i?s.handleTouchStarted():s.handleMousePressed()}else console.warn("could not find provided element in control vertices of bezier, cancelling adding...")},e.prototype.createCtrlPtAtPos=function(e,t){var n=new s.DragVertex(this.p5,this.p5.createVector(e,t));return n.baseRadius=this.basePointDiameter/2,n.stroke=!1,n.editable=!0,n.showLabel=this._showPointLabels,n.showPosition=this._showPointPositions,n.positionDisplayMode=this._positionDisplayMode,n.assignTo(this),n},e.prototype.addCtrlPtAtIndex=function(e,t){this._controlPoints.splice(t,0,e),e.color=this.getColorForCtrlPtAtIndex(t),e.activeColor=e.color,this.handleCtrlPtAmountChange()},e.prototype.remove=function(e){this._controlPoints=this._controlPoints.filter((function(t){return t!==e}));var t=this.controlPointColors.findIndex((function(t){return t.color===e.color}));-1!==t&&(this.controlPointColors[t].taken=!1),this.handleCtrlPtAmountChange()},e.prototype.handleCtrlPtAmountChange=function(){var e=this.controlPoints.length;this._controlPoints.forEach((function(e,t){return e.label="P_{"+t+"}"})),this.controlsForT.visible=e>1,this.additionalCtrlPtAmountChangeHandling(),this.notifyObservers("controlPointsChanged")},e.prototype.initControlPointColors=function(){return[this.p5.color(r.default.primaryColor),this.p5.color(o.lightenDarkenColor(r.default.successColor,15)),this.p5.color("#6727e2"),this.p5.color("#ff6600"),this.p5.color("#c85d84"),this.p5.color("#11e8db"),this.p5.color("#62421c"),this.p5.color("#4e7165"),this.p5.color("#1c087b")].map((function(e){return{color:e,taken:!1}}))},e.prototype.getColorForCtrlPtAtIndex=function(e){var t,n=this.controlPointColors.findIndex((function(e){return!e.taken})),i=-1!==n,r=null===(t=this.controlPoints[e+1])||void 0===t?void 0:t.color;if(!i||r&&this.controlPointColors.map((function(e){return e.color})).includes(r)){var s=this.p5.color(o.randomColorHexString()),a=null,u=null;for(e>0&&(a=this.controlPoints[e-1].color),e<this.controlPoints.length-1&&(u=this.controlPoints[e+1].color);a&&o.areColorsTooSimilar(s,a)||u&&o.areColorsTooSimilar(s,u)||o.luminanceFromP5Color(s)>180;)a&&console.log("color of previous control point: "+a.toString()),u&&console.log("color of next control point: "+u.toString()),s=this.p5.color(o.randomColorHexString());return s}var c=this.controlPointColors[n];return c.taken=!0,c.color},e.prototype.subscribe=function(e){this.observers.push(e)},e.prototype.unsubscribe=function(e){this.observers=this.observers.filter((function(t){return t!==e}))},e.prototype.notifyObservers=function(e){this.observers.forEach((function(t){return t.update(e)}))},e}();t.CurveDemo=u},3317:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.DegreeControls=void 0;var n=function(){function e(e,t,n){var i=this;this.demo=t,this.container=e.createDiv(),n&&this.container.parent(n),this.container.class("flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select"),this.container.id("degree-controls"),this.degreeText=e.createSpan("degree: "+this.demo.degree),this.degreeText.parent(this.container),this.degreeText.id("degree-text"),this.increaseDegreeButton=e.createButton('<span class="material-icons">add</span>'),this.increaseDegreeButton.parent(this.container),this.increaseDegreeButton.mouseClicked((function(){return i.increaseDegreeButtonClicked()})),this.decreaseDegreeButton=e.createButton('<span class="material-icons">remove</span>'),this.decreaseDegreeButton.parent(this.container),this.decreaseDegreeButton.mouseClicked((function(){return i.decreaseDegreeButtonClicked()})),this.updateVisibility(),this.demo.subscribe(this)}return Object.defineProperty(e.prototype,"visible",{set:function(e){this.container.style("visibility",e?"visible":"hidden")},enumerable:!1,configurable:!0}),e.prototype.update=function(e){if("controlPointsChanged"===e&&this.updateVisibility(),"degreeChanged"===e&&(this.updateDegreeText(),this.updateDecreaseDegreeButtonDisabled()),"curveTypeChanged"===e)if("emulated Bézier"==this.demo.curveType){var t="For Bézier curves the degree is always n (depends on the number of control points)";this.increaseDegreeButton.attribute("disabled","true"),this.decreaseDegreeButton.attribute("disabled","true"),this.increaseDegreeButton.attribute("title",t),this.decreaseDegreeButton.attribute("title",t)}else this.increaseDegreeButton.removeAttribute("title"),this.decreaseDegreeButton.removeAttribute("title"),this.increaseDegreeButton.removeAttribute("disabled"),this.updateDecreaseDegreeButtonDisabled()},e.prototype.updateDecreaseDegreeButtonDisabled=function(){this.demo.degree===this.demo.minDegree?this.decreaseDegreeButton.attribute("disabled","true"):"emulated Bézier"!=this.demo.curveType&&this.decreaseDegreeButton.removeAttribute("disabled")},e.prototype.increaseDegreeButtonClicked=function(){this.demo.increaseDegree()},e.prototype.decreaseDegreeButtonClicked=function(){this.demo.decreaseDegree()},e.prototype.updateVisibility=function(){this.visible=this.demo.valid},e.prototype.updateDegreeText=function(){this.degreeText.html("degree: "+this.demo.degree)},e}();t.DegreeControls=n},7806:function(e,t,n){"use strict";var i,r=this&&this.__extends||(i=function(e,t){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])})(e,t)},function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");function n(){this.constructor=e}i(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n)});Object.defineProperty(t,"__esModule",{value:!0}),t.BSplineVisualization=void 0;var o=n(6761),s=function(e){function t(t,n,i,r,o){var s=e.call(this,t,n,i,r)||this;return s.bSplineDemo=n,s.sketch=o,s.knotMarkerColor=s.p5.color(150),s.knotMarkerLabelColor=s.p5.color("#f400a3"),s.knotMarkerLabelBackgroundColor=s.p5.color(255,255,255,190),s}return r(t,e),t.prototype.draw=function(){if(this.demo.valid)if(this.bSplineDemo.degree>0&&this.drawKnotMarkers(),this.bSplineDemo.curveDefinedAtCurrentT){var e=this.bSplineDemo.getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo(this.bSplineDemo.t);this.drawDeBoorVisualization(e.tempPtsCreatedDuringEvaluation),this.drawPointAtT(e.pt)}else o.renderTextWithSubscript(this.p5,"This "+(this.bSplineDemo.open?"open":"clamped")+" B-Spline curve is only defined in the interval [t_{"+this.bSplineDemo.firstKnotIndexWhereCurveDefined+"}, t_{"+this.bSplineDemo.firstKnotIndexWhereCurveUndefined+"}) = ["+ +this.bSplineDemo.firstTValueWhereCurveDefined.toFixed(2)+", "+ +this.bSplineDemo.firstTValueWhereCurveUndefined.toFixed(2)+")",10,this.p5.height-20)},t.prototype.drawKnotMarkers=function(){var e=this,t=0;this.bSplineDemo.knotVector.forEach((function(n,i,r){if(void 0!==r[i-1]&&r[i-1]!==n&&(t=0),t+=1,!(i<e.bSplineDemo.firstKnotIndexWhereCurveDefined||i>e.bSplineDemo.firstKnotIndexWhereCurveUndefined||r[i+1]&&r[i+1]==n)){var s=e.bSplineDemo.getPointOnCurveWithDeBoorsAlgorithm(n);if(o.drawSquare(e.p5,s,e.knotMarkerColor,.75*e.bSplineDemo.basePointDiameter),e.bSplineDemo.showPointLabels&&0!==e.bSplineDemo.knotVector[i]){var a=s.x-(t>1?60:40),u=s.y+10,c="t="+ +e.bSplineDemo.knotVector[i].toFixed(2)+(t>1&&(r[i+1]&&r[i+1]!==n||null==r[i+1])?" ("+t+"x)":""),l=e.p5.textWidth(c);e.p5.push(),e.p5.fill(e.knotMarkerLabelBackgroundColor),e.p5.noStroke(),e.p5.rectMode(e.p5.CENTER),e.p5.rect(a+l/2,u,l+6,18),e.p5.pop(),o.renderTextWithSubscript(e.p5,c,a,u,e.knotMarkerLabelColor)}}}))},t.prototype.drawPointAtT=function(e){o.drawCircle(this.p5,e,this.colorOfPointOnCurve,1.5*this.bSplineDemo.basePointDiameter)},t.prototype.drawDeBoorVisualization=function(e){var t=this;e.length<=2||e.forEach((function(e){e.slice(0,-1).forEach((function(n,i){return o.drawLineVector(t.p5,n,e[i+1],t.color,t.bSplineDemo.baseLineWidth)})),e.forEach((function(e){return o.drawCircle(t.p5,e,t.color,t.bSplineDemo.basePointDiameter)}))}))},t}(n(1390).CurveDrawingVisualization);t.BSplineVisualization=s},324:function(e,t,n){"use strict";var i,r=this&&this.__extends||(i=function(e,t){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var n in t)Object.prototype.hasOwnProperty.call(t,n)&&(e[n]=t[n])})(e,t)},function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");function n(){this.constructor=e}i(e,t),e.prototype=null===t?Object.create(t):(n.prototype=t.prototype,new n)}),o=this&&this.__makeTemplateObject||function(e,t){return Object.defineProperty?Object.defineProperty(e,"raw",{value:t}):e.raw=t,e},s=this&&this.__createBinding||(Object.create?function(e,t,n,i){void 0===i&&(i=n),Object.defineProperty(e,i,{enumerable:!0,get:function(){return t[n]}})}:function(e,t,n,i){void 0===i&&(i=n),e[i]=t[n]}),a=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),u=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var n in e)"default"!==n&&Object.prototype.hasOwnProperty.call(e,n)&&s(t,e,n);return a(t,e),t},c=this&&this.__read||function(e,t){var n="function"==typeof Symbol&&e[Symbol.iterator];if(!n)return e;var i,r,o=n.call(e),s=[];try{for(;(void 0===t||t-- >0)&&!(i=o.next()).done;)s.push(i.value)}catch(e){r={error:e}}finally{try{i&&!i.done&&(n=o.return)&&n.call(o)}finally{if(r)throw r.error}}return s},l=this&&this.__spreadArray||function(e,t){for(var n=0,i=t.length,r=e.length;n<i;n++,r++)e[r]=t[n];return e};Object.defineProperty(t,"__esModule",{value:!0}),t.BSplineDemo=void 0;var h,d,p,f,g,v,b=u(n(4035)),m=n(9516),y=n(2289),P=n(921),C=n(7806),_=n(3317),D=n(2560),w=n(1306),V=function(e){function t(t,n,i,r){void 0===r&&(r=!0);var o=this;return(o=e.call(this,t,0,1,n,i)||this).minDegree=0,o._degree=2,o.scheduledKnotValueChanges=[],o._curveType="clamped",o._knotVector=o.createKnotVector(),o._basisFunctionData=[],o.updateKnotVectorAndBasisFunctions(),o.setCurveDrawingVisualization(new C.BSplineVisualization(o.p5,o)),new _.DegreeControls(o.p5,o,o.controlsContainerId),o}return r(t,e),Object.defineProperty(t.prototype,"degree",{get:function(){return this._degree},enumerable:!1,configurable:!0}),t.prototype.increaseDegree=function(){this._degree++,this.notifyObservers("degreeChanged"),this.updateKnotVectorAndBasisFunctions()},t.prototype.decreaseDegree=function(){this._degree>this.minDegree&&(this._degree--,this.notifyObservers("degreeChanged"),this.updateKnotVectorAndBasisFunctions())},Object.defineProperty(t.prototype,"maxDegree",{get:function(){return this.controlPoints.length-1},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"degreeValid",{get:function(){return this.degree>=this.minDegree&&this.degree<=this.maxDegree},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"knotVector",{get:function(){return this._knotVector},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"knotVectorValid",{get:function(){var e=this.controlPoints.length-1+(this.degree+1);return this.knotVector.every((function(e,t,n){return!n[t+1]||e<=n[t+1]}))&&this.knotVector.length==e+1},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"valid",{get:function(){return this.controlPoints.length>0&&this.degreeValid&&this.knotVectorValid},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"curveInvalidMessage",{get:function(){var e=[];return this.degree>this.maxDegree&&e.push("At least "+(this.degree+1)+" control points are needed for a B-Spline of degree "+this.degree+"\n        Add "+(this.degree-this.maxDegree)+" more control point"+(this.degree-this.maxDegree==1?"":"s")+(this.degree>0?" or reduce the degree":"")),this.degree<this.minDegree&&e.push("A curve cannot have negative degree"),""+e.join("\n")},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"ctrlPtInfluenceFunctions",{get:function(){return this._basisFunctionData.map((function(e){return e.influenceFunction}))},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"ctrlPtInfluenceFuncsAsLaTeXStrings",{get:function(){return this._basisFunctionData.map((function(e){return e.influenceFunctionAsLaTeXString}))},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"ctrlPtInfluenceFunctionData",{get:function(){return this._basisFunctionData},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"basisFunctions",{get:function(){return this._basisFunctionData.map((function(e){return e.influenceFunction}))},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"basisFunctionsAsLaTeXStrings",{get:function(){return this._basisFunctionData.map((function(e){return e.influenceFunctionAsLaTeXString}))},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"basisFunctionData",{get:function(){return this._basisFunctionData},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"clamped",{get:function(){var e=this.degree;return this.knotVector.slice(0,e+1).every((function(e,t,n){return e===n[0]}))&&this.knotVector.slice(-e).every((function(e,t,n){return e===n[0]}))},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"open",{get:function(){return!this.clamped},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"curveDomain",{get:function(){return[this.firstTValueWhereCurveDefined,this.lastTValueWhereCurveDefined]},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"curveDefinedAtCurrentT",{get:function(){return this.t>=this.firstTValueWhereCurveDefined&&this.t<=this.lastTValueWhereCurveDefined},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"firstTValueWhereCurveDefined",{get:function(){var e=this.degree;return this.knotVector[e]},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"firstKnotIndexWhereCurveDefined",{get:function(){return this.degree},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"lastTValueWhereCurveDefined",{get:function(){var e=this.degree,t=this.knotVector.length-1;return this.knotVector[t-e]-Number.EPSILON},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"lastKnotIndexWhereCurveDefined",{get:function(){return this.firstKnotIndexWhereCurveUndefined-1},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"firstTValueWhereCurveUndefined",{get:function(){var e=this.degree,t=this.knotVector.length-1;return this.knotVector[t-e]},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"firstKnotIndexWhereCurveUndefined",{get:function(){var e=this.degree;return this.knotVector.length-1-e},enumerable:!1,configurable:!0}),t.prototype.setKnotVectorValue=function(e,t){var n,i;if(e<0||e>=this.knotVector.length)console.warn("BSplineCurve.setKnotVectorValue(): index "+e+" is invalid!");else{var r=y.clamp(t,null!==(n=this.knotVector[e-1])&&void 0!==n?n:0,null!==(i=this.knotVector[e+1])&&void 0!==i?i:Number.MAX_VALUE);this.scheduleKnotValueChange(e,r)}},t.prototype.scheduleKnotValueChange=function(e,t){this.scheduledKnotValueChanges=this.scheduledKnotValueChanges.filter((function(t){return t.i!==e})),this.scheduledKnotValueChanges.push({i:e,newVal:t})},t.prototype.draw=function(){var t=this;if(e.prototype.draw.call(this),this.scheduledKnotValueChanges.length>0){var n=!1;this.scheduledKnotValueChanges.forEach((function(e){0==e.i&&(t._tMin=e.newVal),e.i==t.knotVector.length-1&&(t._tMax=e.newVal,n=!0),t.knotVector[e.i]=e.newVal})),this.scheduledKnotValueChanges=[],this.updateBasisFunctions(),this.notifyObservers("knotVectorChanged"),n&&this.notifyObservers("rangeOfTChanged")}},Object.defineProperty(t.prototype,"curveType",{get:function(){return this._curveType},set:function(e){this._curveType=e,this.updateDegree(),this.updateKnotVectorAndBasisFunctions(),this.notifyObservers("curveTypeChanged")},enumerable:!1,configurable:!0}),t.prototype.additionalCtrlPtAmountChangeHandling=function(){this.updateDegree(),this.updateKnotVectorAndBasisFunctions()},t.prototype.updateDegree=function(){"emulated Bézier"==this.curveType&&(this._degree=this.controlPoints.length-1,this.notifyObservers("degreeChanged"))},t.prototype.updateKnotVectorAndBasisFunctions=function(){this.updateKnotVector(),this.updateBasisFunctions(),this.scheduledKnotValueChanges=[]},t.prototype.updateKnotVector=function(){this._knotVector=this.createKnotVector(),this.notifyObservers("knotVectorChanged")},t.prototype.updateBasisFunctions=function(){this._basisFunctionData=this.createBasisFunctions(),this.notifyObservers("ctrlPtInfluenceFunctionsChanged")},t.prototype.createKnotVector=function(){var e=this,t=this.degree+1,n=this.controlPoints.length-1;if(n<0)return[];var i=n+t;if("open"==this.curveType)return m.createArrayOfEquidistantAscendingNumbersInRange(i+1,this.tMin,this.tMax);if("clamped"==this.curveType||"emulated Bézier"==this.curveType){var r=this.degree,o=l([],c(Array(r+1).keys())),s=o.map((function(t){return e.tMin})),a=o.map((function(t){return e.tMax})),u=m.createArrayOfEquidistantAscendingNumbersInRange(i+1-2*r,this.tMin,this.tMax).slice(1,-1);return l(l(l([],c(s)),c(u)),c(a))}return m.createArrayOfEquidistantAscendingNumbersInRange(i+1,this.tMin,this.tMax)},t.prototype.createBasisFunctions=function(){var e=this,t=this.controlPoints.length-1,n=this.degree+1,i=this.degree,r=this.knotVector,s=t+n;if(t<0)return[];for(var a=[[]],u=function(e){a[0][e]={basisFunction:function(t){return r[e]<=t&&t<r[e+1]?1:0},basisFunctionAsLaTeXString:String.raw(p||(p=o(["[N_{",",0} = ",""],["\\[N_{",",0} = ",""])),e,r[e]==r[e+1]?String.raw(h||(h=o(["(0 \text{ as } [t_",", t_",") \text{ does not exist})"],["\\(0 \\text{ as } [t_",", t_",") \\text{ does not exist}\\)"])),e,e+1):String.raw(d||(d=o(["\begin{cases} 1,& \text{if} t_{","} leq x < t_{","} \\ 0,& \text{otherwise} end{cases} ]"],["\\begin{cases} 1,& \\text{if} t_{","} \\leq x < t_{","} \\\\ 0,& \\text{otherwise} \\end{cases} \\]"])),e,e+1))}},c=0;c<s;c++)u(c);for(var l=function(e){a[e]=[];for(var t=function(t){var n=r[t+e]-r[t],i=0==n,s=r[t+e+1]-r[t+1],u=0==s;a[e][t]={basisFunction:function(o){return(o-r[t])/(i?1:n)*a[e-1][t].basisFunction(o)+(r[t+e+1]-o)/(u?1:s)*a[e-1][t+1].basisFunction(o)},basisFunctionAsLaTeXString:String.raw(v||(v=o(["[N_{",",","}(t) = \frac{ t - t_{","} } { t_{","} - t_{","} } cdot N_{",", ","}(t) + \frac{ t_{","} - t } { t_{","} - t_{","} } cdot N_{",", ","}(t) \n                        ","\n                        ","]"],["\\[N_{",",","}(t) = \\frac{ t - t_{","} } { t_{","} - t_{","} } \\cdot N_{",", ","}(t) + \\frac{ t_{","} - t } { t_{","} - t_{","} } \\cdot N_{",", ","}(t) \n                        ","\n                        ","\\]"])),t,e,t,t+e,t,t,e-1,t+e+1,t+e+1,t+1,t+1,e-1,i?String.raw(f||(f=o(["t_{","} - t_{","} := 1\text{ as division by zero is not defined }"],["t_{","} - t_{","} := 1\\text{ as division by zero is not defined }"])),t+e,t):"",u?String.raw(g||(g=o(["t_{","} - t_{","} := 1\text{ as division by zero is not defined }"],["t_{","} - t_{","} := 1\\text{ as division by zero is not defined }"])),t+e+1,t+1):"")}},n=0;n<a[e-1].length-1;n++)t(n)},b=1;b<=i;b++)l(b);return a[this.degree].map((function(t,n){return{controlPoint:e.controlPoints[n],influenceFunction:t.basisFunction,influenceFunctionAsLaTeXString:t.basisFunctionAsLaTeXString}}))},t.prototype.getPointOnCurve=function(e){return this.getPointOnCurveWithDeBoorsAlgorithm(e)},t.prototype.getPointOnCurveByEvaluatingBasisFunctions=function(e){var t=this;return this.controlPoints.map((function(e){return e.position})).reduce((function(n,i,r){return b.Vector.add(n,b.Vector.mult(i,t.ctrlPtInfluenceFunctions[r](e)))}),this.p5.createVector(0,0))},t.prototype.getPointOnCurveWithDeBoorsAlgorithm=function(e){return this.getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo(e).pt},t.prototype.getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo=function(e){var t=this,n=this.degree,i=this.controlPoints.map((function(e){return e.position}));if(e==this.tMin&&this.firstTValueWhereCurveDefined==this.tMin)return{pt:i[0],tempPtsCreatedDuringEvaluation:[[]]};if(e==this.tMax&&this.firstTValueWhereCurveUndefined==this.tMax)return{pt:i[i.length-1],tempPtsCreatedDuringEvaluation:[[]]};var r=this.knotVector.slice(0,-1).findIndex((function(n,i){return n<=e&&e<t.knotVector[i+1]}));if(-1==r)return console.warn("getPointOnCurveUsingDeBoorsAlgorithm() called with invalid value "+e),{tempPtsCreatedDuringEvaluation:[[]],pt:this.p5.createVector(0,0)};var o=this.knotVector.filter((function(t){return t==e})).length,s=n-o;if(s<0)return{tempPtsCreatedDuringEvaluation:[[]],pt:i[r]};for(var a=[i.slice(r-n,r-o+1).map((function(e){return e.copy()}))],u=0,c=1;c<=s;c++){a[c]=[];for(var l=r-n+c;l<=r-o;l++){var h=(e-this.knotVector[l])/(this.knotVector[l+n-c+1]-this.knotVector[l]);u=l-r+n,a[c][u]=b.default.Vector.add(b.default.Vector.mult(a[c-1][u-1],1-h),b.default.Vector.mult(a[c-1][u],h))}}return{pt:a[s][u],tempPtsCreatedDuringEvaluation:a}},t.prototype.initCurve=function(){return new w.Curve(this.p5,this)},t.prototype.initInfluenceVisForActiveCtrlPt=function(){return new D.InfluenceVisualizerForActiveControlPoint(this.p5,this)},t}(P.CurveDemo);t.BSplineDemo=V},2560:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.InfluenceVisualizerForActiveControlPoint=void 0;var i=n(9516),r=n(6761),o=n(324),s=function(){function e(e,t){this.p5=e,this.demo=t}return e.prototype.draw=function(){this.demo.shouldDrawInfluenceVisForCurrentlyActiveCtrlPt&&this.drawInfluenceOfCurrentlyActiveCtrlPt()},e.prototype.drawInfluenceOfCurrentlyActiveCtrlPt=function(){var e,t=this.demo.controlPoints.slice(),n=t.findIndex((function(e){return e.hovering||e.dragging}));if(-1!=n){var r=n,s=t[r],a=this.demo.ctrlPtInfluenceFunctionData,u=null===(e=a.find((function(e){return e.controlPoint===s})))||void 0===e?void 0:e.influenceFunction;if(u)if(this.demo instanceof o.BSplineDemo){var c=this.demo.knotVector,l=this.demo.degree,h=i.createArrayOfEquidistantAscendingNumbersInRange(100,c[Math.max(r,this.demo.firstKnotIndexWhereCurveDefined)],c[Math.min(r+l+1,this.demo.firstKnotIndexWhereCurveUndefined)]);if("ctrlPtWeights"in this.demo){var d=a.map((function(e){return e.influenceFunction})).reduce((function(e,t){return function(n){return e(n)+t(n)}}),(function(){return 0}));this.drawInfluenceLine(h,s,(function(e){return u(e)/d(e)}))}else this.drawInfluenceLine(h,s,u)}else h=i.createArrayOfEquidistantAscendingNumbersInRange(100,this.demo.tMin,this.demo.tMax),this.drawInfluenceLine(h,s,u);else console.warn("influence function for control point not found!")}else console.warn("active control point not found!")},e.prototype.drawInfluenceLine=function(e,t,n){var i=this;e.forEach((function(e,o,s){o!==s.length-1&&r.drawLineVector(i.p5,i.demo.getPointOnCurve(e),i.demo.getPointOnCurve(s[o+1]),t.color,2*i.demo.baseLineWidth*n(e))}))},e}();t.InfluenceVisualizerForActiveControlPoint=s},6442:(e,t)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.ControlsForParameterT=void 0;var n=function(){function e(t,n,i,r){var o=this;this.p5=t,this.demo=n,this.baseAnimationSpeedPerFrame=.005,this.currAnimationSpeedMultiplierIndex=e.animationSpeedMultipliers.findIndex((function(e){return 1===e})),this._animationRunning=!1,this.speedCompensationForSizeOfTInterval=this.demo.tMax-this.demo.tMin,this.controlsForTContainer=t.createDiv(),i&&this.controlsForTContainer.parent(i),this.controlsForTContainer.class("flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select full-width"),this.controlsForTContainer.id("controls-for-t"),this.sliderLabel=t.createSpan("t: "+this.demo.t.toFixed(2)),this.sliderLabel.parent(this.controlsForTContainer),this.slider=this.createSlider(),this.slowerButton=t.createButton('<span class="material-icons">fast_rewind</span>'),this.slowerButton.parent(this.controlsForTContainer),this.slowerButton.mouseClicked((function(){return o.rewindClicked()})),this.playPauseButton=t.createButton('<span class="material-icons">play_arrow</span>'),this.playPauseButton.parent(this.controlsForTContainer),this.playPauseButton.mouseClicked((function(){return o.animationRunning=!o.animationRunning})),n.subscribe(this),this.updateVisibility(),this.fasterButton=t.createButton('<span class="material-icons">fast_forward</span>'),this.fasterButton.parent(this.controlsForTContainer),this.fasterButton.mouseClicked((function(){return o.fastForwardClicked()})),r&&(this.baseAnimationSpeedPerFrame*=r)}return Object.defineProperty(e.prototype,"visible",{set:function(e){this.controlsForTContainer.style("visibility",e?"visible":"hidden")},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"animationRunning",{get:function(){return this._animationRunning},set:function(e){this._animationRunning=e,this._animationRunning?this.playPauseButton.html('<span class="material-icons">pause</span>'):this.playPauseButton.html('<span class="material-icons">play_arrow</span>')},enumerable:!1,configurable:!0}),e.prototype.createSlider=function(){var e=this,t=this.p5.createSlider(this.demo.tMin,this.demo.tMax,this.demo.t,0);return t.style("flex-grow","2"),t.mousePressed((function(){return e.animationRunning=!1})),t.parent(this.controlsForTContainer),t},e.prototype.update=function(e){"controlPointsChanged"!==e&&"showCurveDrawingVisualizationChanged"!==e||this.updateVisibility(),"rangeOfTChanged"===e&&(this.speedCompensationForSizeOfTInterval=this.demo.tMax-this.demo.tMin,this.updateSliderRange())},e.prototype.updateVisibility=function(){this.visible=this.demo.showCurveDrawingVisualization&&this.demo.valid},e.prototype.updateSliderRange=function(){this.slider.remove(),this.slider=this.createSlider(),this.slowerButton.parent(this.controlsForTContainer),this.playPauseButton.parent(this.controlsForTContainer),this.fasterButton.parent(this.controlsForTContainer)},e.prototype.updateT=function(){this.animationRunning?this.demo.t+=this.baseAnimationSpeedPerFrame*this.speedCompensationForSizeOfTInterval*e.animationSpeedMultipliers[this.currAnimationSpeedMultiplierIndex]:this.demo.t=+this.slider.value()},e.prototype.updateSlider=function(){this.sliderLabel.html("t: "+this.demo.t.toFixed(2)),this.slider.value(this.demo.t)},e.prototype.fastForwardClicked=function(){this.animationRunning=!0,this.currAnimationSpeedMultiplierIndex<e.animationSpeedMultipliers.length-1&&this.currAnimationSpeedMultiplierIndex++},e.prototype.rewindClicked=function(){this.animationRunning=!0,this.currAnimationSpeedMultiplierIndex>0&&this.currAnimationSpeedMultiplierIndex--},e.animationSpeedMultipliers=[-4,-2,-1.5,-1,-.5,-.25,-.125,.125,.25,.5,1,1.5,2,4],e}();t.ControlsForParameterT=n},1306:(e,t,n)=>{"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Curve=void 0;var i=n(9516),r=n(324),o=n(6761),s=function(){function e(e,t,n,r){this.p5=e,this.demo=t,this._noOfEvaluationSteps=null!=n?n:100,this.evaluationSteps=i.createArrayOfEquidistantAscendingNumbersInRange(this.noOfEvaluationSteps,this.demo.firstTValueWhereCurveDefined,this.demo.lastTValueWhereCurveDefined),this.color=null!=r?r:e.color(30)}return Object.defineProperty(e.prototype,"noOfEvaluationSteps",{get:function(){return this._noOfEvaluationSteps},set:function(e){this._noOfEvaluationSteps=e,this.calculateEvaluationSteps()},enumerable:!1,configurable:!0}),e.prototype.calculateEvaluationSteps=function(){return i.createArrayOfEquidistantAscendingNumbersInRange(this.noOfEvaluationSteps,this.demo.firstTValueWhereCurveDefined,this.demo.lastTValueWhereCurveDefined)},e.prototype.draw=function(){var e=this;if(this.demo.valid&&!this.demo.shouldDrawInfluenceVisForCurrentlyActiveCtrlPt){var t=this.evaluationSteps.map((function(t){return e.demo.getPointOnCurve(t)}));this.demo instanceof r.BSplineDemo&&0===this.demo.degree?t.slice(0,-1).forEach((function(t){return o.drawCircle(e.p5,t,e.color,1.25*e.demo.basePointDiameter)})):t.slice(0,-1).forEach((function(n,i){return o.drawLineVector(e.p5,n,t[i+1],e.color,2*e.demo.baseLineWidth)}))}},e.prototype.update=function(e){this.evaluationSteps=this.calculateEvaluationSteps()},e}();t.Curve=s}}]);