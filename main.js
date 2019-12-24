var s;
var world;
var cursor;

var INC_ID = 1; // increment objects ID
var INC_C_ID = 1; // increment categories ID
var INC_Z_INDEX = 1;

function Start() {
    var canvas = document.getElementById("canvas");
    canvas.width = document.body.clientWidth;
    canvas.height = Math.max(window.innerHeight, document.body.clientHeight);
    s = new Scr(canvas);

    cursor = new Cursor();

    world = new World();
    world.start();

    Update();
}

function Update() {
    world.update();

    s.updateInfo();

    if(document.hidden == false){
        requestAnimationFrame(Update);
    }
    else{
        setTimeout("requestAnimationFrame(Update)", 1000);
    }
}

$(document).ready(function(){
    $("#world_settings").draggable();
    $("#world_settings").resizable();
    $("#category_settings").draggable();
    $("#category_settings").resizable();
    $("#ai_edit_window").draggable();
    $("#ai_edit_window").resizable();

    $(".window").mousedown(function(){
        $(this).css("z-index", INC_Z_INDEX);
        INC_Z_INDEX++;
    });

    Start();

    preset(1); // LOAD PRESET
});

window.onresize = function(){
    s.canvas.width = document.body.clientWidth;
    s.canvas.height = Math.max(window.innerHeight, document.body.clientHeight);

    s.w = s.canvas.width;
    s.h = s.canvas.height;
}

// HELPERS

function random(min, max) {
    return Math.round(Math.random() * (max - min) ) + min;
}

function distance(o1, o2){
    dX = o1.x - o2.x;
    dY = o1.y - o2.y;

    return Math.sqrt(dX*dX + dY*dY);
}

function tryf(name, func){
    try{
        func();
    }
    catch(e){
        alert("Error in the " + name + " function: " + e);
    }
}

var customVars = {
    "_COLOR":"c",
    "_POS_X":"x",
    "_POS_Y":"y",
    "_RADIUS":"r"
};

function load_js(src){
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.src = src;
    head.appendChild(script);
}

// KEYBOARD

$("textarea").keydown(function(e) {
    if(e.keyCode === 9){ // TAB
        var start = this.selectionStart;
        var end = this.selectionEnd;

        var $this = $(this);
        var value = $this.val();
        
        $this.val(value.substring(0, start)
                    + "\t"
                    + value.substring(end));

        this.selectionStart = this.selectionEnd = start + 1;
        e.preventDefault();
    }
});

// CAMERA

window.addEventListener("wheel", event => {
    if(s.camera.dock === false){
        const delta = Math.sign(event.deltaY);
        if(delta > 0){
            // down
            s.camera.p *= 0.9;
            s.camera.x *= 0.9;
            s.camera.y *= 0.9;
        }
        else{
            // up
            s.camera.p *= 1.1;
            s.camera.x *= 1.1;
            s.camera.y *= 1.1;
        }
    }
});

var md = false;
$("#canvas").mousedown(function(){
    md = true;
    if(s.camera.dock === false && s.tool === "hand"){
        document.body.style.cursor = "grabbing";
    }

    if(cursor == null)
        return false;

    cursor.press = true;
});
$(document).mouseup(function(){
    md = false;

    if(s.camera.dock === false && s.tool === "hand"){
        document.body.style.cursor = "default";
    }
    else if(s.tool === "info"){
        for(var i = 0; i < world.objects.length; i++){
            var x = (world.objects[i].x * s.camera.p) - s.camera.x + s.w/2;
            var y = (world.objects[i].y * s.camera.p) - s.camera.y + s.h/2;
            var r = world.objects[i].r * s.camera.p;

            if(cursor.x > x - r && cursor.x < x + r && cursor.y > y - r && cursor.y < y + r){ // box clicked
                s.getInfo(world.objects[i].id, i);
                break;
            }
        }
    }

    if(cursor == null)
        return false;

    cursor.press = false;
});
document.addEventListener('mousemove', function (event) {
    const directionX = event.movementX || event.mozMovementX || event.webkitMovementX || 0;
    const directionY = event.movementY || event.mozMovementY || event.webkitMovementY || 0;
    
    if(md && s.camera.dock === false && s.tool === "hand"){
        s.camera.x -= directionX;
        s.camera.y -= directionY;
    }

    if(cursor == null)
        return false;

    cursor.x = event.pageX;
    cursor.y = event.pageY;
    cursor.deltaX = event.directionX;
    cursor.deltaY = event.directionY;
});

// PRESETS

function preset(i){
    if(i == 0){
        world.addLaw("movement", function(obj){
var size = 5000;
if(obj.x - obj.r < -size){
    obj.speedX = -obj.speedX;
    obj.x = -size + obj.r;
}
if(obj.x + obj.r > size){
    obj.speedX = -obj.speedX;
    obj.x = size - obj.r;
}
if(obj.y - obj.r < -size){
    obj.speedY = -obj.speedY;
    obj.y = -size + obj.r;
}
if(obj.y + obj.r > size){
    obj.speedY = -obj.speedY;
    obj.y = size - obj.r;
}

obj.x += obj.speedX * world.time;
obj.y += obj.speedY * world.time;
        });

        world.addLaw("collisions", function(obj){
c = obj.collide(obj.r);
if(c){
    x = obj.repel(obj.speedX, obj.speedY, c.speedX, c.speedY, c, obj.r, c.r);
    obj.speedX = x.vx1;
    obj.speedY = x.vy1;
    c.speedX = x.vx2;
    c.speedY = x.vy2;
    
    var m = 0.3;
    obj.x -= x.vx1*m*world.time;
    obj.y -= x.vy1*m*world.time;
    c.x -= x.vx2*m*world.time;
    c.y -= x.vy2*m*world.time;
    
    if(obj.c === "blue")
        obj.c = "red";
    else
        obj.c = "blue";
    if(c.c === "blue")
        c.c = "red";
    else
        c.c = "blue";
}
        });

        world.addObjVar("speedX", 5);
        world.addObjVar("speedY", 5);

        world.addComponent();

        var minX = -5000, maxX = 5000;
        var minY = -5000, maxY = 5000;

        for(var i = 0; i < 1000; i++){
            var r = random(15, 25);
            var x = random(minX + r, maxX - r);
            var y = random(minY + r, maxY - r);
            world.objects.push(new Obj(x, y, r, "red", world.spawn.category));
        }

        world.time = 5;
        s.toggleCamera();
        s.camera.p = 0.2;
    }
    else if(i == 1){
        world.addLaw("movement", function(obj){})

        world.addObjVar("speedX", 5);
        world.addObjVar("speedY", 5);

        world.addComponent();
    }
}
