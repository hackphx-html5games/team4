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


$(document).ready(function() {
  console.log("ready");
  var world;
  var canvas = document.getElementById("game-canvas");
  var context = canvas.getContext("2d");
  var width = window.innerWidth - 10;
  var height = window.innerHeight - 10;
  


  canvas.style.width = (width+1) + "px";
  canvas.style.height = (height+1) + "px";
  
  canvas.setAttribute("width", width+1);
  canvas.setAttribute("height", height+1);
  
  width /= 10;
  height /= 10;
  
  var stageScale = 10;
  
  function init() {
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
      ;
     


      //create world and gravity
     var GRAVITY = 30;
     var gravity = new b2Vec2(0, GRAVITY);
     var world = new b2World(
           gravity    //gravity
        ,  true                 //allow sleep
     );
    
    var fixDef = new b2FixtureDef;
    fixDef.density = 10.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;
    
    var bodyDef = new b2BodyDef;
    
    //create ground
    bodyDef.type = b2Body.b2_staticBody;
    fixDef.shape = new b2PolygonShape;
    fixDef.shape.SetAsBox(width, 2);
    bodyDef.position.Set(10, height);
    world.CreateBody(bodyDef).CreateFixture(fixDef);
    bodyDef.position.Set(width, 1);
    world.CreateBody(bodyDef).CreateFixture(fixDef);
    fixDef.shape.SetAsBox(2, height);
    bodyDef.position.Set(1, height);
    world.CreateBody(bodyDef).CreateFixture(fixDef);
    bodyDef.position.Set(width, height);
    world.CreateBody(bodyDef).CreateFixture(fixDef);
    
    //create some objects
    bodyDef.type = b2Body.b2_dynamicBody;
    var objects = [];
    window.objects = objects;
    for(var i = 0; i < 10; ++i) {
      if(Math.random() > 0.5) {
        fixDef.shape = new b2PolygonShape;
        fixDef.shape.SetAsBox(
            8 * (Math.random() + 0.1) //half width
          , 8 * (Math.random() + 0.1) //half height
        );
      } else {
        fixDef.shape = new b2CircleShape(
          8 * (Math.random() + 0.1) //radius
        );
      }
      bodyDef.position.x = Math.random() * 100;
      bodyDef.position.y = Math.random() * 30;
      bd = world.CreateBody(bodyDef);
      objects.push(bd);
      bd.CreateFixture(fixDef);
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
    
    var mouseX, mouseY, mousePVec, isMouseDown, selectedBody, mouseJoint;
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
      console.debug(selectedBody);
      return selectedBody;
    }
     
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
         
    function update() {
      
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
  
  
  init();
});