var Player = function (game) {
  this.game = game;
  this.imgUrl = "8bit-stache.jpg";
  this.img = new Image();
  this.img.src = this.imgUrl;
  
  this.width = 8;
  this.height = 11;
}

Player.prototype.create = function () {
  var game = this.game;
  
  //var bodyDef = new b2BodyDef;
  //var fixDef = new b2FixtureDef;
  game.bodyDef.type = b2Body.b2_dynamicBody;
  
  game.fixDef.shape = new b2PolygonShape;
  game.fixDef.shape.SetAsBox(
      this.width/2 //half width
    , this.height/2 //half height
  );
  
  game.bodyDef.position.x = Math.random() * game.canvasWidth;
  game.bodyDef.position.y = game.canvasHeight*.1 + Math.random() * game.canvasHeight*.4;
  bd = game.world.CreateBody(game.bodyDef);
  
  var data = {
    image: this.img,
    imgUrl: this.imgUrl,
    width: this.width,
    height: this.height,
    isPlayer: true
  };
  
  bd.SetUserData(data);
  game.fixDef.restitution = 0;
  f = bd.CreateFixture(game.fixDef);
  f.SetUserData(data);
  
  this.obj = bd;
}

Player.prototype.move = function (dir) {
  var obj = this.obj;
  var game = this.game;
  
  this.process();
  
  if (!this.isTouching()) {
    return;
  }
  
  var pos = obj.GetPosition();
  var _x = pos.x;
  var x2 = 0;
  var _y = pos.y;
  var y2 = 0;
  
  var movementAmount = 2 * obj.GetMass();
  
  if (dir == "left") {
    angle = game.gravityAngle+Math.PI/2;
  } else
  if (dir == "right") {
    angle = game.gravityAngle-Math.PI/2;
  } else {
    return;
  }
  
  var _x = Math.cos(angle) * movementAmount;
  var _y = Math.sin(angle) * movementAmount;
  
  obj.ApplyImpulse({x: _x, y: _y}, obj.GetWorldCenter());
  this.process();
}


Player.prototype.process = function () {
  var game = this.game;
  
  this.obj.SetAngularVelocity(0);
  this.obj.SetAngle(game.gravityAngle-Math.PI/2);
}

Player.prototype.render = function () {
  var image = this.image;
  var game = this.game;
  var obj = this.obj;
  var width = this.width;
  var height = this.height;
  var pos = obj.GetPosition();
  
  this.process();
  
  game.context.save();
  game.context.translate(pos.x*game.STAGE_SCALE, pos.y*game.STAGE_SCALE);
  game.context.rotate(obj.GetAngle());
  game.context.drawImage(this.img, 
    -width*game.STAGE_SCALE/2, 
    -height*game.STAGE_SCALE/2, 
    width*game.STAGE_SCALE, 
    height*game.STAGE_SCALE
  );
  game.context.restore();
}

Player.prototype.isTouching = function () {
  this.getContacts();
  return this.lastContact > Date.now()-200;
}

Player.prototype.getContacts = function () {
  var contacts = this.obj.GetContactList();
  if (!contacts) {
    return;
  }
  while (contacts) {
    if (contacts && contacts.contact && contacts.contact.IsTouching && contacts.contact.IsTouching()) {
      if (contacts.contact.IsTouching()) {
        this.lastContact = Date.now();
      }
    }
    contacts = contacts.next;
  }
}



