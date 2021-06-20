(self.webpackChunkbachelor_thesis_code=self.webpackChunkbachelor_thesis_code||[]).push([[834],{834:function(e,t,i){"use strict";var r,n=this&&this.__extends||(r=function(e,t){return(r=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(e,t){e.__proto__=t}||function(e,t){for(var i in t)Object.prototype.hasOwnProperty.call(t,i)&&(e[i]=t[i])})(e,t)},function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Class extends value "+String(t)+" is not a constructor or null");function i(){this.constructor=e}r(e,t),e.prototype=null===t?Object.create(t):(i.prototype=t.prototype,new i)}),o=this&&this.__makeTemplateObject||function(e,t){return Object.defineProperty?Object.defineProperty(e,"raw",{value:t}):e.raw=t,e},s=this&&this.__createBinding||(Object.create?function(e,t,i,r){void 0===r&&(r=i),Object.defineProperty(e,r,{enumerable:!0,get:function(){return t[i]}})}:function(e,t,i,r){void 0===r&&(r=i),e[r]=t[i]}),a=this&&this.__setModuleDefault||(Object.create?function(e,t){Object.defineProperty(e,"default",{enumerable:!0,value:t})}:function(e,t){e.default=t}),u=this&&this.__importStar||function(e){if(e&&e.__esModule)return e;var t={};if(null!=e)for(var i in e)"default"!==i&&Object.prototype.hasOwnProperty.call(e,i)&&s(t,e,i);return a(t,e),t},h=this&&this.__read||function(e,t){var i="function"==typeof Symbol&&e[Symbol.iterator];if(!i)return e;var r,n,o=i.call(e),s=[];try{for(;(void 0===t||t-- >0)&&!(r=o.next()).done;)s.push(r.value)}catch(e){n={error:e}}finally{try{r&&!r.done&&(i=o.return)&&i.call(o)}finally{if(n)throw n.error}}return s},l=this&&this.__spreadArray||function(e,t){for(var i=0,r=t.length,n=e.length;i<r;i++,n++)e[n]=t[i];return e},c=this&&this.__importDefault||function(e){return e&&e.__esModule?e:{default:e}};Object.defineProperty(t,"__esModule",{value:!0}),t.LineAtTPlotter=t.BSplineGraphPlotter=t.CurveTypeControls=t.KnotVectorControls=t.DeBoorControlPointInfluenceVisualization=t.BSplineDemo=void 0;var d=u(i(35)),p=i(479),f=i(539),g=c(i(399)),m=function(e){function t(t,i,r){var n=this;return(n=e.call(this,t,0,1,i,r)||this).minDegree=0,n._degree=2,n.scheduledKnotValueChanges=[],n._curveType="clamped B-Spline",n._knotVector=n.createKnotVector(),n._basisFunctionData=[],n.updateKnotVectorAndBasisFunctions(),n.setCurve(new b(n.p5,n)),n.setCurveDrawingVisualization(new v(n.p5,n)),new y(n.p5,n,n.controlsContainerId),n}return n(t,e),Object.defineProperty(t.prototype,"degree",{get:function(){return this._degree},enumerable:!1,configurable:!0}),t.prototype.increaseDegree=function(){this._degree++,this.notifyObservers("degreeChanged"),this.updateKnotVectorAndBasisFunctions()},t.prototype.decreaseDegree=function(){this._degree>this.minDegree&&(this._degree--,this.notifyObservers("degreeChanged"),this.updateKnotVectorAndBasisFunctions())},Object.defineProperty(t.prototype,"maxDegree",{get:function(){return this.controlPoints.length-1},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"degreeValid",{get:function(){return this.degree>=this.minDegree&&this.degree<=this.maxDegree},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"knotVector",{get:function(){return this._knotVector},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"knotVectorValid",{get:function(){var e=this.controlPoints.length-1+(this.degree+1);return this.knotVector.every((function(e,t,i){return!i[t+1]||e<=i[t+1]}))&&this.knotVector.length==e+1},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"valid",{get:function(){return this.controlPoints.length>0&&this.degreeValid&&this.knotVectorValid},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"curveInvalidMessage",{get:function(){var e=[];return this.degree>this.maxDegree&&e.push("At least "+(this.degree+1)+" control points are needed for a B-Spline of degree "+this.degree+"\n        Add "+(this.degree-this.maxDegree)+" more control point"+(this.degree-this.maxDegree==1?"":"s")+(this.degree>0?" or reduce the degree":"")),this.degree<this.minDegree&&e.push("A curve cannot have negative degree"),""+e.join("\n")},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"basisFunctions",{get:function(){return this._basisFunctionData.map((function(e){return e.map((function(e){return e.basisFunction}))}))},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"basisFunctionsAsLaTeXString",{get:function(){return this._basisFunctionData.map((function(e){return e.map((function(e){return e.basisFunctionAsLaTeXString}))}))},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"basisFunctionData",{get:function(){return this._basisFunctionData},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"clamped",{get:function(){var e=this.degree;return this.knotVector.slice(0,e+1).every((function(e,t,i){return e===i[0]}))&&this.knotVector.slice(-e).every((function(e,t,i){return e===i[0]}))},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"open",{get:function(){return!this.clamped},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"curveDomain",{get:function(){return[this.firstTValueWhereCurveDefined,this.lastTValueWhereCurveDefined]},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"curveDefinedAtCurrentT",{get:function(){return this.t>=this.firstTValueWhereCurveDefined&&this.t<=this.lastTValueWhereCurveDefined},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"firstTValueWhereCurveDefined",{get:function(){var e=this.degree;return this.knotVector[e]},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"firstKnotIndexWhereCurveDefined",{get:function(){return this.degree},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"lastTValueWhereCurveDefined",{get:function(){var e=this.degree,t=this.knotVector.length-1;return this.knotVector[t-e]-Number.EPSILON},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"lastKnotIndexWhereCurveDefined",{get:function(){return this.firstKnotIndexWhereCurveUndefined-1},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"firstTValueWhereCurveUndefined",{get:function(){var e=this.degree,t=this.knotVector.length-1;return this.knotVector[t-e]},enumerable:!1,configurable:!0}),Object.defineProperty(t.prototype,"firstKnotIndexWhereCurveUndefined",{get:function(){var e=this.degree;return this.knotVector.length-1-e},enumerable:!1,configurable:!0}),t.prototype.setKnotVectorValue=function(e,t){var i,r;if(e<0||e>=this.knotVector.length)console.warn("BSplineCurve.setKnotVectorValue(): index "+e+" is invalid!");else{var n=p.clamp(t,null!==(i=this.knotVector[e-1])&&void 0!==i?i:0,null!==(r=this.knotVector[e+1])&&void 0!==r?r:Number.MAX_VALUE);this.scheduleKnotValueChange(e,n)}},t.prototype.scheduleKnotValueChange=function(e,t){this.scheduledKnotValueChanges=this.scheduledKnotValueChanges.filter((function(t){return t.i!==e})),this.scheduledKnotValueChanges.push({i:e,newVal:t})},t.prototype.draw=function(){var t=this;e.prototype.draw.call(this),this.scheduledKnotValueChanges.length>0&&(this.scheduledKnotValueChanges.forEach((function(e){0==e.i&&(t._tMin=e.newVal),e.i==t.knotVector.length-1&&(t._tMax=e.newVal),t.knotVector[e.i]=e.newVal})),this.scheduledKnotValueChanges=[],this.updateBasisFunctions(),this.notifyObservers("knotVectorChanged"))},Object.defineProperty(t.prototype,"curveType",{get:function(){return this._curveType},set:function(e){this._curveType=e,this.updateDegree(),this.updateKnotVectorAndBasisFunctions(),this.notifyObservers("curveTypeChanged")},enumerable:!1,configurable:!0}),t.prototype.additionalCtrlPtAmountChangeHandling=function(){this.updateDegree(),this.updateKnotVectorAndBasisFunctions()},t.prototype.updateDegree=function(){"Bézier"==this.curveType&&(this._degree=this.controlPoints.length-1,this.notifyObservers("degreeChanged"))},t.prototype.updateKnotVectorAndBasisFunctions=function(){this.updateKnotVector(),this.updateBasisFunctions(),this.scheduledKnotValueChanges=[],this.notifyObservers("knotVectorChanged")},t.prototype.updateKnotVector=function(){this._knotVector=this.createKnotVector()},t.prototype.updateBasisFunctions=function(){this._basisFunctionData=this.createBasisFunctions()},t.prototype.createKnotVector=function(){var e=this,t=this.degree+1,i=this.controlPoints.length-1;if(i<0)return[];var r=i+t;if("open B-Spline"==this.curveType)return p.createArrayOfEquidistantAscendingNumbersInRange(r+1,this.tMin,this.tMax);if("clamped B-Spline"==this.curveType||"Bézier"==this.curveType){var n=this.degree,o=l([],h(Array(n+1).keys())),s=o.map((function(t){return e.tMin})),a=o.map((function(t){return e.tMax})),u=p.createArrayOfEquidistantAscendingNumbersInRange(r+1-2*n,this.tMin,this.tMax).slice(1,-1);return l(l(l([],h(s)),h(u)),h(a))}return p.createArrayOfEquidistantAscendingNumbersInRange(r+1,this.tMin,this.tMax)},t.prototype.createBasisFunctions=function(){var e=this.controlPoints.length-1,t=this.degree+1,i=this.degree,r=this.knotVector,n=e+t;if(e<0)return[];for(var s=[[]],a=function(e){s[0][e]={basisFunction:function(t){return r[e]<=t&&t<r[e+1]?1:0},basisFunctionAsLaTeXString:String.raw(V||(V=o(["[N_{",",0} = ",""],["\\[N_{",",0} = ",""])),e,r[e]==r[e+1]?String.raw(_||(_=o(["(0 \text{ as } [t_",", t_",") \text{ does not exist})"],["\\(0 \\text{ as } [t_",", t_",") \\text{ does not exist}\\)"])),e,e+1):String.raw(S||(S=o(["\begin{cases} 1,& \text{if} t_{","} leq x < t_{","} \\ 0,& \text{otherwise} end{cases} ]"],["\\begin{cases} 1,& \\text{if} t_{","} \\leq x < t_{","} \\\\ 0,& \\text{otherwise} \\end{cases} \\]"])),e,e+1))}},u=0;u<n;u++)a(u);for(var h=function(e){s[e]=[];for(var t=function(t){var i=r[t+e]-r[t],n=0==i,a=r[t+e+1]-r[t+1],u=0==a;s[e][t]={basisFunction:function(o){return(o-r[t])/(n?1:i)*s[e-1][t].basisFunction(o)+(r[t+e+1]-o)/(u?1:a)*s[e-1][t+1].basisFunction(o)},basisFunctionAsLaTeXString:String.raw(A||(A=o(["[N_{",",","}(t) = \frac{ t - t_{","} } { t_{","} - t_{","} } cdot N_{",", ","}(t) + \frac{ t_{","} - t } { t_{","} - t_{","} } cdot N_{",", ","}(t) \n                        ","\n                        ","]"],["\\[N_{",",","}(t) = \\frac{ t - t_{","} } { t_{","} - t_{","} } \\cdot N_{",", ","}(t) + \\frac{ t_{","} - t } { t_{","} - t_{","} } \\cdot N_{",", ","}(t) \n                        ","\n                        ","\\]"])),t,e,t,t+e,t,t,e-1,t+e+1,t+e+1,t+1,t+1,e-1,n?String.raw(O||(O=o(["t_{","} - t_{","} := 1\text{ as division by zero is not defined }"],["t_{","} - t_{","} := 1\\text{ as division by zero is not defined }"])),t+e,t):"",u?String.raw(P||(P=o(["t_{","} - t_{","} := 1\text{ as division by zero is not defined }"],["t_{","} - t_{","} := 1\\text{ as division by zero is not defined }"])),t+e+1,t+1):"")}},i=0;i<s[e-1].length-1;i++)t(i)},l=1;l<=i;l++)h(l);return s},t.prototype.getPointOnCurveByEvaluatingBasisFunctions=function(e,t){var i=this;return this.controlPoints.map((function(e){return e.position})).reduce((function(r,n,o){return d.Vector.add(r,d.Vector.mult(n,i.basisFunctions[e][o](t)))}),this.p5.createVector(0,0))},t.prototype.getPointOnCurveWithDeBoorsAlgorithm=function(e){return this.getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo(e).pt},t.prototype.getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo=function(e){var t=this,i=this.degree,r=this.controlPoints.map((function(e){return e.position}));if(e==this.tMin&&this.firstTValueWhereCurveDefined==this.tMin)return{pt:r[0],tempPtsCreatedDuringEvaluation:[[]]};if(e==this.tMax&&this.firstTValueWhereCurveUndefined==this.tMax)return{pt:r[r.length-1],tempPtsCreatedDuringEvaluation:[[]]};var n=this.knotVector.slice(0,-1).findIndex((function(i,r){return i<=e&&e<t.knotVector[r+1]}));if(-1==n)return console.warn("getPointOnCurveUsingDeBoorsAlgorithm() called with invalid value "+e),{tempPtsCreatedDuringEvaluation:[[]],pt:this.p5.createVector(0,0)};var o=this.knotVector.filter((function(t){return t==e})).length,s=i-o;if(s<0)return{tempPtsCreatedDuringEvaluation:[[]],pt:r[n]};for(var a=[r.slice(n-i,n-o+1).map((function(e){return e.copy()}))],u=0,h=1;h<=s;h++){a[h]=[];for(var l=n-i+h;l<=n-o;l++){var c=(e-this.knotVector[l])/(this.knotVector[l+i-h+1]-this.knotVector[l]);u=l-n+i,a[h][u]=d.default.Vector.add(d.default.Vector.mult(a[h-1][u-1],1-c),d.default.Vector.mult(a[h-1][u],c))}}return{pt:a[s][u],tempPtsCreatedDuringEvaluation:a}},t}(f.CurveDemo);t.BSplineDemo=m;var b=function(e){function t(t,i){var r=e.call(this,t,i)||this;return r.bSplineDemo=i,r.noOfEvaluationSteps=400,r.bSplineDemo.subscribe(r),r}return n(t,e),t.prototype.draw=function(){var e=this;if(this.demo.valid){var t=this.evaluationSteps.map((function(t){return e.bSplineDemo.getPointOnCurveWithDeBoorsAlgorithm(t)}));0===this.bSplineDemo.degree?t.slice(0,-1).forEach((function(t){return p.drawCircle(e.p5,t,e.color,1.25*e.demo.basePointDiameter)})):t.slice(0,-1).forEach((function(i,r){return p.drawLineVector(e.p5,i,t[r+1],e.color,2*e.demo.baseLineWidth)}))}},t.prototype.update=function(e){this.evaluationSteps=this.calculateEvaluationSteps()},t}(f.Curve),v=function(e){function t(t,i,r,n,o){var s=e.call(this,t,i,r,n)||this;return s.bSplineDemo=i,s.sketch=o,s.knotMarkerColor=s.p5.color(150),s.fallBackSketchBackgroundColor=s.p5.color(230),s}return n(t,e),t.prototype.draw=function(){if(this.bSplineDemo.degree,this.demo.valid)if(this.drawInfluenceOfCurrentlyActiveCtrlPt(),this.bSplineDemo.degree>0&&this.drawKnotMarkers(),this.bSplineDemo.curveDefinedAtCurrentT){var e=this.bSplineDemo.getPointOnCurveAndTemporaryCtrlPtsCreatedUsingDeBoorsAlgo(this.bSplineDemo.t);this.drawDeBoorVisualization(e.tempPtsCreatedDuringEvaluation),this.drawPointAtT(e.pt)}else p.renderTextWithSubscript(this.p5,"This "+(this.bSplineDemo.open?"open":"clamped")+" B-Spline curve is only defined in the interval [t_{"+this.bSplineDemo.firstKnotIndexWhereCurveDefined+"}, t_{"+this.bSplineDemo.firstKnotIndexWhereCurveUndefined+"}) = ["+ +this.bSplineDemo.firstTValueWhereCurveDefined.toFixed(2)+", "+ +this.bSplineDemo.firstTValueWhereCurveUndefined.toFixed(2)+")",10,this.p5.height-20)},t.prototype.drawKnotMarkers=function(){var e=this;this.bSplineDemo.knotVector.forEach((function(t,i){if(!(i<e.bSplineDemo.firstKnotIndexWhereCurveDefined||i>e.bSplineDemo.firstKnotIndexWhereCurveUndefined)){var r=e.bSplineDemo.getPointOnCurveWithDeBoorsAlgorithm(t);p.drawSquare(e.p5,r,e.knotMarkerColor,.75*e.bSplineDemo.basePointDiameter),e.bSplineDemo.showPointLabels&&p.renderTextWithSubscript(e.p5,"t_{"+i+"}",r.x-20,r.y-10)}}))},t.prototype.drawPointAtT=function(e){p.drawCircle(this.p5,e,this.colorOfPointOnCurve,1.5*this.bSplineDemo.basePointDiameter)},t.prototype.drawDeBoorVisualization=function(e){var t=this;e.length<=2||e.forEach((function(e){e.slice(0,-1).forEach((function(i,r){return p.drawLineVector(t.p5,i,e[r+1],t.color,t.bSplineDemo.baseLineWidth)})),e.forEach((function(e){return p.drawCircle(t.p5,e,t.color,t.bSplineDemo.basePointDiameter)}))}))},t.prototype.drawInfluenceOfCurrentlyActiveCtrlPt=function(){var e=this,t=this.bSplineDemo.controlPoints.slice(),i=t.findIndex((function(e){return e.hovering||e.dragging}));if(-1!=i){var r=i,n=t[r],o=this.bSplineDemo.degree,s=this.bSplineDemo.basisFunctions[o][i],a=this.bSplineDemo.knotVector,u=p.createArrayOfEquidistantAscendingNumbersInRange(100,a[Math.max(r,this.bSplineDemo.firstKnotIndexWhereCurveDefined)],a[Math.min(r+o+1,this.bSplineDemo.firstKnotIndexWhereCurveUndefined)]).map((function(t){return{pos:e.bSplineDemo.getPointOnCurveWithDeBoorsAlgorithm(t),activeCtrlPtInfluence:s(t)}}));u.slice(0,-1).forEach((function(t,i){var r,o;p.drawLineVector(e.p5,t.pos,u[i+1].pos,null!==(o=null===(r=e.sketch)||void 0===r?void 0:r.backgroundColor)&&void 0!==o?o:e.fallBackSketchBackgroundColor,2*e.demo.baseLineWidth),p.drawLineVector(e.p5,t.pos,u[i+1].pos,n.color,2*e.demo.baseLineWidth*t.activeCtrlPtInfluence)}))}},t}(f.CurveDrawingVisualization),y=function(){function e(e,t,i){var r=this;this.demo=t,this.container=e.createDiv(),i&&this.container.parent(i),this.container.class("flex-row center-cross-axis disable-dbl-tap-zoom prevent-text-select"),this.container.id("degree-controls"),this.degreeText=e.createSpan("degree: "+this.demo.degree),this.degreeText.parent(this.container),this.degreeText.id("degree-text"),this.increaseDegreeButton=e.createButton('<span class="material-icons">add</span>'),this.increaseDegreeButton.parent(this.container),this.increaseDegreeButton.mouseClicked((function(){return r.increaseDegreeButtonClicked()})),this.decreaseDegreeButton=e.createButton('<span class="material-icons">remove</span>'),this.decreaseDegreeButton.parent(this.container),this.decreaseDegreeButton.mouseClicked((function(){return r.decreaseDegreeButtonClicked()})),this.updateVisibility(),this.demo.subscribe(this)}return Object.defineProperty(e.prototype,"visible",{set:function(e){this.container.style("visibility",e?"visible":"hidden")},enumerable:!1,configurable:!0}),e.prototype.update=function(e){if("controlPointsChanged"===e&&this.updateVisibility(),"degreeChanged"===e&&(this.updateDegreeText(),this.updateDecreaseDegreeButtonDisabled()),"curveTypeChanged"===e)if("Bézier"==this.demo.curveType){var t="For Bézier curves the degree is always n (depends on the number of control points)";this.increaseDegreeButton.attribute("disabled","true"),this.decreaseDegreeButton.attribute("disabled","true"),this.increaseDegreeButton.attribute("title",t),this.decreaseDegreeButton.attribute("title",t)}else this.increaseDegreeButton.removeAttribute("title"),this.decreaseDegreeButton.removeAttribute("title"),this.increaseDegreeButton.removeAttribute("disabled"),this.updateDecreaseDegreeButtonDisabled()},e.prototype.updateDecreaseDegreeButtonDisabled=function(){this.demo.degree===this.demo.minDegree?this.decreaseDegreeButton.attribute("disabled","true"):"Bézier"!=this.demo.curveType&&this.decreaseDegreeButton.removeAttribute("disabled")},e.prototype.increaseDegreeButtonClicked=function(){this.demo.increaseDegree()},e.prototype.decreaseDegreeButtonClicked=function(){this.demo.decreaseDegree()},e.prototype.updateVisibility=function(){this.visible=this.demo.valid},e.prototype.updateDegreeText=function(){this.degreeText.html("degree: "+this.demo.degree)},e}(),x=function(e){function t(t,i,r){void 0===r&&(r=!0);var n=e.call(this,t,i,r)||this;return n.bSplineDemo=i,i.subscribe(n),n}return n(t,e),t.prototype.update=function(e){"controlPointsChanged"!=e&&"degreeChanged"!=e&&"knotVectorChanged"!=e&&"rangeOfTChanged"!=e||this.updateInfluenceDataAndBars()},t.prototype.getCurrentControlPointInfluenceDataPoints=function(){var e=this;return this.bSplineDemo.controlPoints.map((function(t,i){return{controlPoint:t,currentCtrlPtInfluence:function(){return e.bSplineDemo.basisFunctions[e.bSplineDemo.degree][i](e.bSplineDemo.t)}}}))},t}(f.ControlPointInfluenceVisualization);t.DeBoorControlPointInfluenceVisualization=x;var C=function(){function e(e,t){this.bSplineDemo=e,this.parentContainerId=t,this.knotInputElements=[],e.subscribe(this),this.updateKnotVectorDisplay()}return e.prototype.update=function(e){"knotVectorChanged"==e&&this.updateKnotVectorDisplay()},e.prototype.updateKnotVectorDisplay=function(){var e=this;if(this.bSplineDemo.valid){this.knotInputElements=this.bSplineDemo.knotVector.map((function(t,i,r){var n=document.createElement("input");return n.type="number",n.setAttribute("step","any"),n.value=(+t.toFixed(2)).toString(),n.addEventListener("focus",(function(){return n.value=r[i].toString()})),n.addEventListener("blur",(function(){var t,o,s=null!==(t=r[i-1])&&void 0!==t?t:0,a=null!==(o=r[i+1])&&void 0!==o?o:Number.MAX_VALUE,u=p.clamp(+n.value,s,a);e.bSplineDemo.scheduleKnotValueChange(i,u),n.value=u.toString()})),n}));var t=document.createElement("tr"),i=[];this.knotInputElements.forEach((function(e,r){var n=document.createElement("th");n.innerText=String.raw(T||(T=o(["(t_{","})"],["\\(t_{","}\\)"])),r),t.appendChild(n);var s="knot-"+r;n.id=s,i.push("#"+s)}));var r=document.createElement("tr");this.knotInputElements.forEach((function(e){var t=document.createElement("td");t.appendChild(e),r.appendChild(t)}));var n=document.getElementById(this.parentContainerId);if(n){this.tableContainer&&n.removeChild(this.tableContainer),this.tableContainer=document.createElement("div"),this.tableContainer.id="knot-table-container";var s=document.createElement("table");s.appendChild(t),s.appendChild(r),s.id="knot-table",this.tableContainer.appendChild(s),n.appendChild(this.tableContainer),MathJax.typeset(i)}else console.warn("couldn't create table for knot vector, parent container id invalid!")}else this.tableContainer&&(this.tableContainer.style.visibility="hidden")},e}();t.KnotVectorControls=C;var D=function(){function e(e,t){var i=this;this.bSplineDemo=e,this.parentContainerId=t,this.radioButtons=[],e.subscribe(this);var r="curveType";this.radioButtons=l([],h(Array(3))).map((function(e,t){var i,n=document.createElement("input");return n.type="radio",n.name=r,n.id="radio-btn-"+t,i=0==t?"open B-Spline":1==t?"clamped B-Spline":"Bézier",n.value=i,n})),this.checkBoxForm=document.createElement("form"),this.checkBoxForm.addEventListener("change",(function(){var e=new FormData(i.checkBoxForm).get(r);e?i.bSplineDemo.curveType=e.toString():console.warn("Could not find form field curveType")})),this.radioButtons.forEach((function(e){var t=document.createElement("div"),r=document.createElement("label");r.appendChild(e);var n=document.createElement("span");n.innerText=e.value,r.appendChild(n),t.appendChild(r),i.checkBoxForm.appendChild(t)})),this.container=document.createElement("div");var n=document.createElement("span");n.innerText="curve type:",this.container.appendChild(n),this.container.appendChild(this.checkBoxForm);var o=document.getElementById(this.parentContainerId);o?(o.appendChild(this.container),this.updateVisibility(),this.updateSelectedCheckboxes()):console.warn("couldn't create table for knot vector, parent container id invalid!")}return e.prototype.update=function(e){"curveTypeChanged"==e&&this.updateSelectedCheckboxes(),this.updateVisibility()},e.prototype.updateVisibility=function(){this.bSplineDemo.valid?this.container.style.removeProperty("visibility"):this.container.style.visibility="hidden"},e.prototype.updateSelectedCheckboxes=function(){var e=this;this.radioButtons.forEach((function(t){return t.checked=t.value==e.bSplineDemo.curveType}))},e}();t.CurveTypeControls=D;var B=function(){function e(e,t){var i=this;this.p5=e,this.bSplineDemo=t,this.noOfStepsXAxis=700,this.xValues=[],this.dataPoints=[],this._axisRulerOffsetFromBorder=this.p5.width/15,this.rulerMarkerSize=.075*this._axisRulerOffsetFromBorder,this._distMinToMaxXAxis=this.p5.width-1.5*this._axisRulerOffsetFromBorder,this.distMinToMaxYAxis=this.p5.height-1.5*this._axisRulerOffsetFromBorder,this.axisRulerAndLabelColor=e.color(30),this.curveDomainBorderColor=e.color(120),this.computeBSplineCurves(),setTimeout((function(){return i.redraw()}),100),t.subscribe(this)}return Object.defineProperty(e.prototype,"distMinToMaxXAxis",{get:function(){return this._distMinToMaxXAxis},enumerable:!1,configurable:!0}),Object.defineProperty(e.prototype,"axisRulerOffsetFromBorder",{get:function(){return this._axisRulerOffsetFromBorder},enumerable:!1,configurable:!0}),e.prototype.update=function(e){"controlPointsChanged"!==e&&"knotVectorChanged"!==e&&"rangeOfTChanged"!==e||(this.computeBSplineCurves(),this.redraw())},e.prototype.redraw=function(){this.p5.redraw()},e.prototype.computeBSplineCurves=function(){var e=this,t=this.bSplineDemo.controlPoints;if(t.length<1)return this.xValues=[],void(this.dataPoints=[]);var i=this.bSplineDemo.basisFunctions,r=this.bSplineDemo.degree;this.xValues=p.createArrayOfEquidistantAscendingNumbersInRange(this.noOfStepsXAxis,this.bSplineDemo.tMin,this.bSplineDemo.tMax),this.dataPoints=t.map((function(t,n){return{yValues:e.xValues.map((function(e){return i[r][n](e)})),controlPoint:t}}))},e.prototype.draw=function(){this.bSplineDemo.valid?(this.drawBSplineCurves(),this.drawAxisRulersAndLabels(),this.drawBordersOfCurveDomain()):this.renderInfoText()},e.prototype.drawBSplineCurves=function(){var e=this;this.dataPoints.forEach((function(t){var i=t.controlPoint.color,r=t.controlPoint.hovering||t.controlPoint.dragging?4:1.5;t.yValues.forEach((function(t,n,o){if(n!==o.length-1){var s=e.xValues[n]/(e.bSplineDemo.tMax-e.bSplineDemo.tMin),a=o[n+1],u=e.xValues[n+1]/(e.bSplineDemo.tMax-e.bSplineDemo.tMin),h=s*e._distMinToMaxXAxis+e._axisRulerOffsetFromBorder,l=e.p5.height-e._axisRulerOffsetFromBorder-t*e.distMinToMaxYAxis,c=u*e._distMinToMaxXAxis+e._axisRulerOffsetFromBorder,d=e.p5.height-e._axisRulerOffsetFromBorder-a*e.distMinToMaxYAxis;p.drawLineXYCoords(e.p5,h,l,c,d,i,r)}}))}))},e.prototype.drawAxisRulersAndLabels=function(){p.drawLineXYCoords(this.p5,this._axisRulerOffsetFromBorder,this.p5.height-this._axisRulerOffsetFromBorder,this.p5.width,this.p5.height-this._axisRulerOffsetFromBorder,this.axisRulerAndLabelColor,1),p.drawLineXYCoords(this.p5,this._axisRulerOffsetFromBorder,this.p5.height-this._axisRulerOffsetFromBorder,this._axisRulerOffsetFromBorder,0,this.axisRulerAndLabelColor,1),this.drawRulerMarkersAndLabelsXAxis(),this.drawRulerMarkersAndLabelsYAxis()},e.prototype.drawRulerMarkersAndLabelsXAxis=function(){for(var e=this,t=this.bSplineDemo.knotVector,i=t.map((function(t){return t/(e.bSplineDemo.tMax-e.bSplineDemo.tMin)*e._distMinToMaxXAxis})),r=0;r<i.length;r++)p.drawLineXYCoords(this.p5,this._axisRulerOffsetFromBorder+i[r],this.p5.height-this._axisRulerOffsetFromBorder,this._axisRulerOffsetFromBorder+i[r],this.p5.height-this._axisRulerOffsetFromBorder+this.rulerMarkerSize,this.axisRulerAndLabelColor,1),this.p5.push(),this.p5.textAlign(this.p5.CENTER),p.renderTextWithSubscript(this.p5,"t_{"+r+"}",this._axisRulerOffsetFromBorder+i[r],this.p5.height-this._axisRulerOffsetFromBorder/3),this.p5.text(+t[r].toFixed(2),this._axisRulerOffsetFromBorder+i[r],this.p5.height-this._axisRulerOffsetFromBorder/1.5),this.p5.pop()},e.prototype.drawRulerMarkersAndLabelsYAxis=function(){for(var e=this.distMinToMaxYAxis/10,t=1;t<=10;t++)p.drawLineXYCoords(this.p5,this._axisRulerOffsetFromBorder-(5===t||10===t?2*this.rulerMarkerSize:this.rulerMarkerSize),this.p5.height-this._axisRulerOffsetFromBorder-t*e,this._axisRulerOffsetFromBorder,this.p5.height-this._axisRulerOffsetFromBorder-t*e,this.axisRulerAndLabelColor,1);this.p5.push(),this.p5.textAlign(this.p5.CENTER),this.p5.text("0.5",this._axisRulerOffsetFromBorder/2,this.p5.height-this._axisRulerOffsetFromBorder-5*e),this.p5.text("1",this._axisRulerOffsetFromBorder/2,this.p5.height-this._axisRulerOffsetFromBorder-10*e),this.p5.textAlign(this.p5.LEFT,this.p5.CENTER),p.renderTextWithSubscript(this.p5,"c_{i,n}",this._axisRulerOffsetFromBorder/10,1.5*this._axisRulerOffsetFromBorder+this.distMinToMaxYAxis/2),this.p5.pop()},e.prototype.drawBordersOfCurveDomain=function(){p.drawLineXYCoords(this.p5,this.axisRulerOffsetFromBorder+this.bSplineDemo.firstTValueWhereCurveDefined*this.distMinToMaxXAxis,this.p5.height-this._axisRulerOffsetFromBorder,this.axisRulerOffsetFromBorder+this.bSplineDemo.firstTValueWhereCurveDefined*this.distMinToMaxXAxis,this.p5.height-this.distMinToMaxYAxis-this.axisRulerOffsetFromBorder,this.curveDomainBorderColor,1),p.drawLineXYCoords(this.p5,this.axisRulerOffsetFromBorder+this.bSplineDemo.lastTValueWhereCurveDefined*this.distMinToMaxXAxis,this.p5.height-this._axisRulerOffsetFromBorder,this.axisRulerOffsetFromBorder+this.bSplineDemo.lastTValueWhereCurveDefined*this.distMinToMaxXAxis,this.p5.height-this.distMinToMaxYAxis-this.axisRulerOffsetFromBorder,this.curveDomainBorderColor,1)},e.prototype.renderInfoText=function(){this.p5.push(),this.p5.textAlign(this.p5.CENTER),this.p5.text("Add more control points to the canvas on the left!\nThe B-spline basis functions will then show up here.",this.p5.width/2,this.p5.height/2),this.p5.pop()},e}();t.BSplineGraphPlotter=B;var _,S,V,O,P,A,T,w=function(){function e(e,t,i){this.p5=e,this.bSplineDemo=t,this.graphPlotter=i,this.lineThroughTColor=this.p5.color(g.default.errorColor)}return e.prototype.draw=function(){this.bSplineDemo.showCurveDrawingVisualization&&this.bSplineDemo.valid&&this.drawLineAtT()},e.prototype.drawLineAtT=function(){if(!(this.bSplineDemo.controlPoints.length<=0)){var e=this.bSplineDemo.t,t=this.graphPlotter.axisRulerOffsetFromBorder+e/(this.bSplineDemo.tMax-this.bSplineDemo.tMin)*this.graphPlotter.distMinToMaxXAxis;p.drawLineXYCoords(this.p5,t,0,t,this.p5.height,this.lineThroughTColor,2)}},e}();t.LineAtTPlotter=w}}]);