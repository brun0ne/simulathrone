class Cursor{
    constructor(){
        this.x = 0;
        this.y = 0;
        this.deltaX = 0;
        this.deltaY = 0;

        this.press = 0;
    }
}

class RGBA{
    constructor(r, g, b, a){
        if(a == null)
            a = 1;
        if(r == null)
            r = 0;
        if(g == null)
            g = 0;
        if(b == null)
            b = 0;

        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    color(){
        return "rgba(" + this.r + "," + this.g + "," + this.b + "," + this.a + ")";
    }
}