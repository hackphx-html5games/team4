var Player = function (game) {
  this.game = game;
  this.imgUrl = "8bit-stache.jpg";
  this.img = new Image();
  this.img.src = this.imgUrl;
  
  this.width = 8;
  this.height = 11;
}

Player.prototype.create = function (bodyDef, fixDef) {
  var game = this.game;
  
  //var bodyDef = new b2BodyDef;
  //var fixDef = new b2FixtureDef;
  fixDef.shape = new b2PolygonShape;
  fixDef.shape.SetAsBox(
      this.width/2 //half width
    , this.height/2 //half height
  );
  
  bodyDef.position.x = Math.random() * game.canvasWidth;
  bodyDef.position.y = game.canvasHeight*.1 + Math.random() * game.canvasHeight*.4;
  bd = game.world.CreateBody(bodyDef);
  
  var data = {
    image: this.img,
    imgUrl: this.imgUrl,
    width: this.width,
    height: this.height,
    isPlayer: true
  };
  
  bd.SetUserData(data);
  f = bd.CreateFixture(fixDef);
  f.SetUserData(data);
  f.SetRestitution(0);
  
  this.obj = bd;
}

Player.prototype.move = function (dir) {
  var obj = this.obj;
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
  
  obj.ApplyImpulse({x: x2, y: y2}, obj.GetWorldCenter());
  this.process();
}


Player.prototype.process = function () {
  this.obj.SetAngularVelocity(0);
  this.obj.SetAngle(0);
}

Player.prototype.render = function () {
  var image = this.image;
  var game = this.game;
  var obj = this.obj;
  var width = this.width;
  var height = this.height;
  var pos = obj.GetPosition();
  
  //this.process();
  
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



