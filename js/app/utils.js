window.requestAnimFrame = (function(){
          return  window.requestAnimationFrame       || 
                  window.webkitRequestAnimationFrame || 
                  window.mozRequestAnimationFrame    || 
                  window.oRequestAnimationFrame      || 
                  window.msRequestAnimationFrame     || 
                  function(/* function */ callback, /* DOMElement */ element){
                    window.setTimeout(callback, 1000 / 60);
                  };
    })();


var b2Vec2 = Box2D.Common.Math.b2Vec2
  , b2AABB = Box2D.Collision.b2AABB
	,	b2BodyDef = Box2D.Dynamics.b2BodyDef
	,	b2Body = Box2D.Dynamics.b2Body
	,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	,	b2Fixture = Box2D.Dynamics.b2Fixture
	,	b2World = Box2D.Dynamics.b2World
	,	b2MassData = Box2D.Collision.Shapes.b2MassData
	,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
	,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
  , b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
  , b2JointDef = Box2D.Dynamics.Joints.b2JointDef
  ;


//http://js-tut.aardon.de/js-tut/tutorial/position.html
function getElementPosition(element) {
  var elem=element, tagname="", x=0, y=0;
  
  while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
    y += elem.offsetTop;
    x += elem.offsetLeft;
    tagname = elem.tagName.toUpperCase();
    
    if(tagname == "BODY")
      elem=0;
    
    if(typeof(elem) == "object") {
      if(typeof(elem.offsetParent) == "object")
        elem = elem.offsetParent;
    }
  }
  
  return {x: x, y: y};
}



// $(document).bind("keydown", function (event) { console.log(event.keyCode); });
var Keys = {
  LEFT: 37,
  RIGHT: 39,
  UP: 38,
  DOWN: 40,
  SPACE: 32,
  ENTER: 13,
  COMMAND: 91,
  CONTROL: 17,
  SHIFT: 16,
  OPTION: 18,
  BACKSPACE: 8,
  W: 87,
  A: 65,
  S: 83,
  D: 68
};

var keysDown = {};
var captureKeys = {};
function onKeyDown (event) {
  keysDown[event.keyCode] = true;
  $(document).trigger("keydown"+event.keyCode);
  if (captureKeys.hasOwnProperty(event.keyCode) && captureKeys[event.keyCode] == true) {
    event.preventDefault();
    return false;
  }
}
function onKeyUp (event) {
  keysDown[event.keyCode] = false;
  $(document).trigger("keyup"+event.keyCode);
  if (captureKeys.hasOwnProperty(event.keyCode) && captureKeys[event.keyCode] == true) {
    event.preventDefault();
    return false;
  }
}
function captureKey (keyCode) {
  captureKeys[keyCode] = true;
}
function keyIsDown (keyCode) {
  return keysDown.hasOwnProperty(keyCode) && keysDown[keyCode] == true;
}
$(document).bind("keydown", onKeyDown);
$(document).bind("keyup", onKeyUp);
