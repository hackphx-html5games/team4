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


var world;
var canvas;
var context;
var canvasWidth;
var canvasHeight;
var thePlayer = false;
var globalRestitution = 0.2;

var stageScale = 10;

var world;

var   b2Vec2 = Box2D.Common.Math.b2Vec2
 ,  b2AABB = Box2D.Collision.b2AABB
	,	b2BodyDef = Box2D.Dynamics.b2BodyDef
	,	b2Body = Box2D.Dynamics.b2Body
	,	b2FixtureDef = Box2D.Dynamics.b2FixtureDef
	,	b2Fixture = Box2D.Dynamics.b2Fixture
	,	b2World = Box2D.Dynamics.b2World
	,	b2MassData = Box2D.Collision.Shapes.b2MassData
	,	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape
	,	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape
	,	b2DebugDraw = Box2D.Dynamics.b2DebugDraw
 ,  b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef
 , b2JointDef = Box2D.Dynamics.Joints.b2JointDef
 ;

var GRAVITY = 30;
var gravity = new b2Vec2(0, GRAVITY);

function init() {
  canvasWidth = window.innerWidth - 10;
  canvasHeight = window.innerHeight - 10;
  
  canvas = document.getElementById("game-canvas");
  context = canvas.getContext("2d");
    
  canvas.style.width = (canvasWidth+1) + "px";
  canvas.style.height = (canvasHeight+1) + "px";
    
  canvas.setAttribute("width", canvasWidth+1);
  canvas.setAttribute("height", canvasHeight+1);
         
  canvasWidth /= stageScale;
  canvasHeight /= stageScale;
  
  //create world and gravity
  GRAVITY = 30;
  gravity = new b2Vec2(0, GRAVITY);
  world = new b2World(
    gravity    //gravity
    ,  true                 //allow sleep
  );
  
  var fixDef = new b2FixtureDef;
  fixDef.density = 10.0;
  fixDef.friction = 1.9;
  fixDef.restitution = globalRestitution;
    
  var bodyDef = new b2BodyDef;
    
  //create ground
  bodyDef.type = b2Body.b2_staticBody;
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(canvasWidth, canvasHeight*.01);
  bodyDef.position.Set(canvasWidth*.01, canvasHeight);
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  bodyDef.position.Set(canvasWidth, canvasHeight*.01);
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  fixDef.shape.SetAsBox(canvasWidth*.01, canvasHeight);
  bodyDef.position.Set(canvasWidth*.01, canvasHeight);
  world.CreateBody(bodyDef).CreateFixture(fixDef);
  bodyDef.position.Set(canvasWidth, canvasHeight);
  world.CreateBody(bodyDef).CreateFixture(fixDef);
    
  //create some objects
  bodyDef.type = b2Body.b2_dynamicBody;
  var objects = [];
  window.objects = objects;
  for(var i = 0; i < 10; ++i) {
    objWidth = Math.round(canvasWidth*.1 * (Math.random() + 0.1));
    objHeight = Math.round(canvasWidth*.1 * (Math.random() + 0.1));
    if(Math.random() > 0.5) {
      fixDef.shape = new b2PolygonShape;
      fixDef.shape.SetAsBox(
          objWidth/2 //half width
        , objHeight/2 //half height
      );
    } else {
      fixDef.shape = new b2CircleShape(
        objWidth/2 //radius
      );
      objHeight = objWidth;
    }
    bodyDef.position.x = Math.random() * canvasWidth;
    bodyDef.position.y = canvasHeight*.1 + Math.random() * canvasHeight*.4;
    bd = world.CreateBody(bodyDef);
    
    var img = new Image();
    var imgUrl;
    if (!thePlayer) {
      imgUrl = "8bit-stache.jpg";
      thePlayer = bd;
    } else {
      imgUrl = "http://placehold.it/"+(objWidth*stageScale)+"x"+(objHeight*stageScale);
    }
    img.src = imgUrl;
    var data = {
      id: i,
      image: img,
      imgUrl: imgUrl,
      width: objWidth,
      height: objHeight,
      isPlayer: (thePlayer ? false : true)
    };
    (function (data, img) {
      img.onload = function () {
        data.loaded = true;
      }
    })(data, img);
    
    bd.SetUserData(data);
    objects.push(bd);
    f = bd.CreateFixture(fixDef);
    f.SetUserData(data);
    if (data.isPlayer == true) {
      f.SetRestitution(0);
    } else {
      f.SetRestitution(globalRestitution);
    }
  }
    
  //setup debug draw
  var debugDraw = new b2DebugDraw();
	debugDraw.SetSprite(context);
	debugDraw.SetDrawScale(stageScale);
	debugDraw.SetFillAlpha(0.5);
	debugDraw.SetLineThickness(1.0);
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
	world.SetDebugDraw(debugDraw);
    
  //window.setInterval(update, 1000 / 60);
  requestAnimFrame(update);
    
  //mouse
    
  var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint, movementJoint;
  var canvasPosition = getElementPosition(canvas);
    
  document.addEventListener("mousedown", function(e) {
    isMouseDown = true;
    handleMouseMove(e);
    document.addEventListener("mousemove", handleMouseMove, true);
  }, true);
         
   document.addEventListener("mouseup", function() {
      document.removeEventListener("mousemove", handleMouseMove, true);
      isMouseDown = false;
      mouseX = undefined;
      mouseY = undefined;
   }, true);
  
  function handleMouseMove(e) {
    mouseX = (e.clientX - canvasPosition.x) / stageScale;
    mouseY = (e.clientY - canvasPosition.y) / stageScale;
  };
  
  function getBodyAtMouse() {
    mousePVec = new b2Vec2(mouseX, mouseY);
    var aabb = new b2AABB();
    aabb.lowerBound.Set(mouseX - 0.01, mouseY - 0.01);
    aabb.upperBound.Set(mouseX + 0.01, mouseY + 0.01);
    
    // Query the world for overlapping shapes.
    
    selectedBody = null;
    world.QueryAABB(getBodyCB, aabb);
    return selectedBody;
  }
  
  function getPlayer() {
    if (thePlayer) {
      return thePlayer;
    }
    for (b = world.GetBodyList(); b; b = b.GetNext()) {
      if (b.GetType() == b2Body.b2_dynamicBody) {
        var pos = b.GetPosition();
        var data = b.GetUserData();
        if (data.isPlayer) {
          return b;
        }
      }
    }
  }
  
  var lastPlayerContact = Date.now();
  function playerIsTouching () {
    return lastPlayerContact > Date.now()-200;
  }
  function getPlayerContacts () {
    var player = getPlayer();
    var nowTouching = false;
    
    var contacts = player.GetContactList();
    if (!contacts) {
      return;
    }
    count = 0;
    while (contacts) {
      if (contacts && contacts.contact && contacts.contact.IsTouching && contacts.contact.IsTouching()) {
        if (contacts.contact.IsTouching()) {
          lastPlayerContact = Date.now();
        }
      }
      //count++;
      contacts = contacts.next;
    }
    
    //console.log("Count: "+count);
  }
  //setInterval(getPlayerContacts, 200);
  
  function getBodyCB(fixture) {
    if(fixture.GetBody().GetType() != b2Body.b2_staticBody) {
      if(fixture.GetShape().TestPoint(fixture.GetBody().GetTransform(), mousePVec)) {
        selectedBody = fixture.GetBody();
        return false;
      }
    }
    return true;
  }
    
  //update
    
  function move(dir) {
    getPlayerContacts();
    
    if (!playerIsTouching()) {
      return;
    }
    
    var player = getPlayer();
    var pos = player.GetPosition();
    var _x = pos.x;
    var x2 = 0;
    var _y = pos.y;
    var y2 = 0;
    
    var movementAmount = 2 * player.GetMass();
    
    if (dir == "left") {
      _x -= movementAmount;
      x2 = -movementAmount;
    } else
    if (dir == "right") {
      _x += movementAmount;
      x2 = movementAmount;
    } else {
      _y -= movementAmount;
      y2 = -movementAmount;
    }
    
    player.ApplyImpulse({x: x2, y: y2}, player.GetWorldCenter());
    
    player.SetAngularVelocity(0);
    player.SetAngle(0);
  }
    
  function update() {
    var player = getPlayer();
    
    player.SetAngularVelocity(0);
    player.SetAngle(0);
    
    if (movementJoint) {
      world.DestroyJoint(movementJoint);
      movementJoint = null;
    }
      
    if (keyIsDown(Keys.LEFT)) {
      move("left");
    } else
    if (keyIsDown(Keys.RIGHT)) {
      move("right");
    } else {
      if (movementJoint) {
        world.DestroyJoint(movementJoint);
        movementJoint = null;
      }
    }
      
    if(isMouseDown && (!mouseJoint)) {
      var body = getBodyAtMouse();
      if(body) {
        var md = new b2MouseJointDef();
        md.bodyA = world.GetGroundBody();
        md.bodyB = body;
        md.target.Set(mouseX, mouseY);
        md.collideConnected = true;
        md.maxForce = 500.0 * body.GetMass();
        mouseJoint = world.CreateJoint(md);
        body.SetAwake(true);
      }
    }
      
    if (mouseJoint) {
      if (isMouseDown) {
        mouseJoint.SetTarget(new b2Vec2(mouseX, mouseY));
      } else {
        world.DestroyJoint(mouseJoint);
        mouseJoint = null;
      }
    }
    
    window.world = world;
    world.Step(1 / 60, 10, 10);
    world.DrawDebugData();
    world.ClearForces();
    
    //context.clearRect(0, 0, canvasWidth*stageScale+1, canvasHeight*stageScale+1);
    for (b = world.GetBodyList(); b; b = b.GetNext()) {
      if (b.GetType() == b2Body.b2_dynamicBody) {
        var pos = b.GetPosition();
          
        /** /
        if (pos.x < -2 || pos.x > width) {
            
          b.SetLinearVelocity(new b2Vec2(0, 0));
          b.SetAngularVelocity(0);
            
          b.SetPositionAndAngle(new b2Vec2(38, 0), 0);

        }
        /**/
          
        var data = b.GetUserData();
        if (data && data.image) {
          context.save();
          context.translate(pos.x*stageScale, pos.y*stageScale);
          context.rotate(b.GetAngle());
          context.drawImage(data.image, -data.width*stageScale/2, -data.height*stageScale/2, data.width*stageScale, data.height*stageScale);
          context.restore();
        }
      }
    }
      
    requestAnimFrame(update);
  };
         
  //helpers
         
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
   
  function wakeAllBody() {
    for (b = world.GetBodyList() ; b; b = b.GetNext()) {
      if (b.GetType() == b2Body.b2_dynamicBody) {
        b.SetAwake(true);
      }
    }
  }
  // Defines the direction of gravity
  function setGravity(direction) {
    if (direction === "UP") {
      gravity.y = -GRAVITY;
      gravity.x = 0;
    }
    else if (direction === "DOWN") {
      gravity.y = GRAVITY;
      gravity.x = 0;
    }
    else if (direction === "LEFT") {
      gravity.x = -GRAVITY;
      gravity.y = 0;
    }
    else if (direction === "RIGHT") {
      gravity.x = GRAVITY;
      gravity.y = 0;
    }
  }
  
  $("#gravityRight").click(function () {
     wakeAllBody();
     setGravity("RIGHT");
  });
  $("#gravityLeft").click(function () {
     wakeAllBody();
     setGravity("LEFT");
  });
  $("#gravityUp").click(function () {
     wakeAllBody();
     setGravity("UP");
  });
  $("#gravityDown").click(function () {
     wakeAllBody();
     setGravity("DOWN");
  });
};


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
  BACKSPACE: 8
};
  
var keysDown = {};
var captureKeys = {};
function onKeyDown (event) {
  keysDown[event.keyCode] = true;
  if (captureKeys.hasOwnProperty(event.keyCode) && captureKeys[event.keyCode] == true) {
    event.preventDefault();
    return false;
  }
}
function onKeyUp (event) {
  keysDown[event.keyCode] = false;
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
  
captureKey(Keys.UP);
captureKey(Keys.DOWN);
captureKey(Keys.LEFT);
captureKey(Keys.RIGHT);
captureKey(Keys.BACKSPACE);

$(document).ready(function() {
  init();
});