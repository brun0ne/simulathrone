var WEIGHT_MIN = -100;
var WEIGHT_MAX = 100;
// (/ 100)

class AI{
    constructor(){
        this.inputs = []; // table of names of variables in *obj*
        this.layers = [];
        this.outputs = []; // -||-
        this.ID = -1; // it's set after creation

        this.layer_size = 5;

        this.INC_INPUT_ID = 0;
        this.INC_OUTPUT_ID = 0;
    }

    // INPUTS

    addInput(ref){
        if(ref == null)
            ref = "_CHOOSE";

        this.inputs.push(new Input(this.INC_INPUT_ID, ref, 0));
        this.INC_INPUT_ID++;

        this.initWeights();
        world.updateAIEditWindow();
    }

    delInput(ID){
        for(var i = 0; i < this.inputs.length; i++){
            if(this.inputs[i].ID == ID){
                this.inputs.splice(i, 1);
                break;
            }
        }
        this.initWeights();
        world.updateAIEditWindow();
    }

    setInput(ID){
        for(var i = 0; i < this.inputs.length; i++){
            if(this.inputs[i].ID == ID){
                this.inputs[i].ref = $("#ai_input_" + ID).val();
                break;
            }
        }
        this.initWeights();
        world.updateAIEditWindow();
    }

    // LAYERS

    addLayer(){
        this.layers.push(new Layer());

        this.layers[this.layers.length-1].setSize(this.layer_size);
        this.initWeights();

        world.updateAIEditWindow();

        if(this.layers.length == 1)
            this.initOutputWeights();
    }

    delLayer(){
        if(this.layers.length > 0)
            this.layers.pop();
        
        this.initWeights();

        world.updateAIEditWindow();

        if(this.layers.length == 0)
            this.initOutputWeights();
    }

    setLayers(){ // add neurons to layers so all have layer_size of them
        for(var i = 0; i < this.layers.length; i++){
            while(this.layers[i].neurons.length < this.layer_size){
                this.layers[i].neurons.push(new Neuron(0));
            }
        }
    }

    changeLayerSize(size){
        if(size == null){
            size = prompt("Layer size", this.layer_size);
        }

        if(isNaN(size)) // not a number
            return false;

        this.layer_size = +size;
        world.updateAIEditWindow();

        this.setLayers();
        this.initWeights();
        this.initOutputWeights();
    }

    // OUTPUTS

    addOutput(ref){
        if(ref == null)
            ref = "_CHOOSE";

        this.outputs.push(new Output(this.INC_OUTPUT_ID, ref, 0));
        this.INC_OUTPUT_ID++;

        world.updateAIEditWindow();
        this.initOutputWeights();
    }

    delOutput(ID){
        for(var i = 0; i < this.outputs.length; i++){
            if(this.outputs[i].ID == ID){
                this.outputs.splice(i, 1);
                break;
            }
        }
        this.initOutputWeights();
        world.updateAIEditWindow();
    }

    setOutput(ID){
        for(var i = 0; i < this.outputs.length; i++){
            if(this.outputs[i].ID == ID){
                this.outputs[i].ref = $("#ai_output_" + ID).val();
                break;
            }
        }
        world.updateAIEditWindow();
    }

    // FUNCTIONS

    update(obj){
        // INPUTS
        for(var i = 0; i < this.inputs.length; i++){
            if(this.inputs[i].ref[0] === "_"){
                // CUSTOM
                let key = customVars[this.inputs[i].ref];

                this.inputs[i].val = obj[key];
            }
            else if(this.inputs[i].ref[0] === "@"){
                // VARS
                let key = this.inputs[i].ref.substr(1); // remove @

                this.inputs[i].val = obj[key];
            }
        }

        // LAYERS
        var prev = this.inputs;
        for(var i = 0; i < this.layers.length; i++){
            this.layers[i].update(prev);
            prev = this.layers[i].neurons;
        }

        // OUTPUTS
        for(var i = 0; i < this.outputs.length; i++){
            if(this.layers.length > 0)
                this.outputs[i].update(this.layers[this.layers.length-1].neurons);
        }
    }

    initWeights(){
        var w = this.inputs.length;

        for(var i = 0; i < this.layers.length; i++){
            this.layers[i].initWeights(w);
            w = this.layers[i].neurons.length;
        }
    }

    initOutputWeights(){
        if(this.layers.length == 0)
            var w = 0;
        else
            var w = this.layers[this.layers.length-1].neurons.length; // length of the last layer

        for(var i = 0; i < this.outputs.length; i++){
            this.outputs[i].initWeights(w);
        }
    }

    clone(src){ // src - AI object
        // length checks
        if(src.layers.length != this.layers.length || src.outputs.length != this.outputs.length){ // not all but kinda
            console.log("Length error");
            return false;
        }

        // layers
        for(var i = 0; i < src.layers.length; i++){
            for(var o = 0; o < src.layers[i].neurons.length; o++){
                for(var p = 0; p < src.layers[i].neurons[o].weights.length; p++){
                    this.layers[i].neurons[o].weights[p] = src.layers[i].neurons[o].weights[p];
                }
            }
        }
        // outputs
        for(var i = 0; i < src.outputs.length; i++){
            for(var o = 0; o < src.outputs[i].weights.length; o++){
                this.outputs[i].weights[o] = src.outputs[i].weights[o];
            }
        }
    }

    mutate(max){ // max - range of mutation (/ 100)
        // layers

        var w = this.inputs.length;

        for(var i = 0; i < this.layers.length; i++){
            this.layers[i].mutate(w, max);
            w = this.layers[i].neurons.length;
        }

        // outputs

        if(this.layers.length == 0)
            var w = 0
        else
            var w = this.layers[this.layers.length-1].neurons.length; // length of the last layer

        for(var i = 0; i < this.outputs.length; i++){
            this.outputs[i].mutateWeights(w, max);
        }
    }
}

class Input{
    constructor(ID, ref, val){
        this.ID = ID;

        this.ref = ref; // ref is the name of a variable in *obj* which is passed TO val every frame
        this.val = val;
    }
}

class Output{
    constructor(ID, ref, val){
        this.ID = ID;

        this.ref = ref; // ref is the name of a variable in *obj* which is passed FROM val every frame
        this.val = val;

        this.weights = [];
    }

    initWeights(count){
        if(count < 0)
            return false;

        this.weights = [];
        for(var i = 0; i < count; i++){
            this.weights.push(random(WEIGHT_MIN, WEIGHT_MAX) / 100); // random between -1 and 1
        }
    }

    mutateWeights(count, max){
        if(count < 0)
            return false;

        for(var i = 0; i < count; i++){
            this.weights[i] += random(-max, max) / 100;
        }
    }

    fillWeights(count){
        if(count < 0)
            return false;

        // too few
        while(this.weights.length < count){
            this.weights.push(random(0, 100) / 100); // random between 0-1
        }

        // too many
        if(this.weights.length > count){
            this.weights.splice(-1, this.weights.length - count);
        }
    }

    update(prev){
        // prev is the last layer
        if(prev.length != this.weights.length){ // sanity check
            console.log("ERROR (OUTPUT): len of prev (" + prev.length + ") != len of weights (" + this.weights.length + ")");
            return false;
        }

        var res = 0;
        for(var i = 0; i < prev.length; i++){
            if(prev[i].val == null || prev[i].val == 0 || prev[i].val == NaN) // skip undefined, 0 and NaN
                continue;
            res += prev[i].val * this.weights[i];
        }
        res /= prev.length;

        this.val = res;

        //console.log(res);
    }
}

class Layer{
    constructor(){
        this.neurons = [];
    }

    setSize(size){
        while(this.neurons.length < size){
            this.neurons.push(new Neuron(0));
        }
    }

    initWeights(count){
        for(var i = 0; i < this.neurons.length; i++){
            this.neurons[i].initWeights(count);
        }
    }

    update(prev){
        for(var i = 0; i < this.neurons.length; i++){
            this.neurons[i].update(prev);
        }
    }

    mutate(count, max){
        for(var i = 0; i < this.neurons.length; i++){
            this.neurons[i].mutateWeights(count, max);
        }
    }
}

class Neuron{
    constructor(val){
        this.val = val;
        this.weights = [];
    }

    initWeights(count){
        if(count < 0)
            return false;

        this.weights = [];
        for(var i = 0; i < count; i++){
            this.weights.push(random(0, 100) / 100); // random between 0-1
        }
    }

    mutateWeights(count, max){
        if(count < 0)
            return false;

        for(var i = 0; i < count; i++){
            this.weights[i] += random(-max, max) / 100;
        }
    }

    fillWeights(count){
        if(count < 0)
            return false;

        // too few
        while(this.weights.length < count){
            this.weights.push(random(WEIGHT_MIN, WEIGHT_MAX) / 100); // random between -1 and 1
        }

        // too many
        if(this.weights.length > count){
            this.weights.splice(-1, this.weights.length - count);
        }
    }

    update(prev){
        if(prev.length != this.weights.length){ // sanity check
            console.log("ERROR (NEURON): len of prev (" + prev.length + ") != len of weights (" + this.weights.length + ")");
            return false;
        }

        var new_val = 0;

        for(var i = 0; i < prev.length; i++){
            if(prev[i].val == null || prev[i].val == 0 || prev[i].val == NaN) // skip undefined, 0 and NaN
                continue;
            new_val += prev[i].val * this.weights[i];
        }

        new_val /= prev.length;
        this.val = new_val;
    }
}