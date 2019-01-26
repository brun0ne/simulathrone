class Object {
    constructor(x, y, r, c){ // x, y, radius, color
        this.x = x;
        this.y = y;
        this.r = r;

        if(c == null)
            this.c = "red";
        else
            this.c = c;

        this.id = INC_ID;
        INC_ID++;

        for(var key in world.obj_vars){ // clone object vars
            if(world.obj_vars.hasOwnProperty(key)){
                this[key] = world.obj_vars[key];
            }
        }
    }

    draw(){
        s.ctx.beginPath();
        s.ctx.arc(this.x * s.camera.p - s.camera.x + s.w/2, this.y * s.camera.p - s.camera.y+s.h/2, this.r * s.camera.p, 0, 2 * Math.PI);
        s.ctx.fillStyle = this.c;
        s.ctx.fill();

        var lw = this.r * s.camera.p / 10;
        if(lw < 1.5)
            lw = 1.5;
        s.ctx.lineWidth = lw;

        s.ctx.strokeStyle = "white";
        s.ctx.stroke();
    }

    update(){
        if(this.r < 0)
            this.r = 0;

        this.draw();

        for(var key in world.laws){
            if(world.laws.hasOwnProperty(key)){
                try{
                    world.laws[key](this);
                }
                catch(e){
                    console.log("Error in the law '" + key + "': " + e);
                }
            }
        }
    }

    collide(r){
        var a, x, y;

        if(r == null)
            r = this.r;

        for(var i = 0; i < world.objects.length; i++){
            if(this.id == world.objects[i].id)
                continue; // skip itself
            if(world.objects.length <= 1)
                break;

            a = r + world.objects[i].r;
            x = this.x - world.objects[i].x;
            y = this.y - world.objects[i].y;

            if(a > Math.sqrt((x * x) + (y * y))) {
                return world.objects[i]; // return collided object
            }
        }

        return false;
    }

    repel(vx1, vy1, vx2, vy2, obj, mult1, mult2){  
        var cx1 = this.x;
        var cx2 = obj.x;
        var cy1 = this.y;
        var cy2 = obj.y;

        if(mult1 == null)
            mult1 = 1;
        if(mult2 == null)
            mult2 = 1;
        
        var d = Math.sqrt(Math.pow(cx1 - cx2, 2) + Math.pow(cy1 - cy2, 2)); 
        var nx = (cx2 - cx1) / d; 
        var ny = (cy2 - cy1) / d; 
        var p = 2 * (vx1 * nx + vy1 * ny - vx2 * nx - vy2 * ny) / 
                (mult1 + mult2);
        vx1 = vx1 - p * mult1 * nx;
        vy1 = vy1 - p * mult1 * ny;
        vx2 = vx2 + p * mult2 * nx;
        vy2 = vy2 + p * mult2 * ny;

        return {vx1: vx1, vx2: vx2, vy1: vy1, vy2: vy2};
    }

    del(){
       world.delObj(this.id);
    }
}