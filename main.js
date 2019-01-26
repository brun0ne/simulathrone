var s;
var world;
var cursor;

var INC_ID = 1;

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
    s.ctx.fillStyle = "black";
    s.ctx.fillRect(0, 0, s.w, s.h);

    world.update();

    s.updateInfo();

    requestAnimationFrame(Update);
}

$(document).ready(function(){
    Start();
});

window.onresize = function(){
    s.canvas.width = document.body.clientWidth;
    s.canvas.height = Math.max(window.innerHeight, document.body.clientHeight);

    s.w = s.canvas.width;
    s.h = s.canvas.height;
}

function random(min, max) {
    return Math.round(Math.random() * (max - min) ) + min;
}

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