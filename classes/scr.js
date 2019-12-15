class Scr {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");

        this.w = this.canvas.width;
        this.h = this.canvas.height;

        this.camera = {x: 0, y: 0, p: 1};
        this.camera.dock = true;

        this.tool = "hand";
        this.info = 0;
        this.infoIndex = 0;
    }

    toggleCamera(){
        if(this.camera.dock === false){
            this.camera = {x: 0, y: 0, p: 1, dock: true};
            $("#toggle_camera").html("undock");
        }
        else{
            this.camera.dock = false;
            $("#toggle_camera").html("dock");
        }
    }

    changeTool(x){
        $("#tool_hand").css("text-decoration", "none");
        $("#tool_info").css("text-decoration", "none");

        if(x === "hand"){
            $("body").css("cursor", "default");
            $("#tool_hand").css("text-decoration", "underline");
        }
        else if(x === "info"){
            $("body").css("cursor", "help");
            $("#tool_info").css("text-decoration", "underline");
        }
        else
            return false;
        
        this.tool = x;
    }

    getInfo(id, index){
        if(id == null || index == null){
            // close info
            this.info = 0;
            $("#info_box").css("display", "none");
        }
        else{
            this.info = id;
            this.infoIndex = index;
            $("#info_object_id").html(id);
            $("#info_box").css("display", "block");
        }
    }

    updateInfo(){
        if(this.info !== 0){
            if(world.objects[this.infoIndex] == null){ // propably deleted
                getInfo(); // close
                return false;
            }

            $("#info_x").html(Math.round(world.objects[this.infoIndex].x * 100) / 100); // round to 2 dec places
            $("#info_y").html(Math.round(world.objects[this.infoIndex].y * 100) / 100);
        }
    }
}