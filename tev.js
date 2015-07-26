;(function(root,factory){
    if(typeof module != "undefined" && module.exports){
        module.exports = factory();
    }else if( typeof define === "function" && define.amd){
        define([],factory);
    }else{
        root.tev = factory();
    }
})(this,function() {
    var has = Object.hasOwnProperty;

    function tev(selector,scope,data){
        scope = scope || this;
        var callback = (function(node){
            // We were requested to not propogate.
            if(tev.stopFlag){return;}

            // for every function attached to this node call the function.
            for(var i = 0, len = node.f.length; i < len; ++i){
                var func = node.f[i];
                func.call(scope,data);

                // if a repeated function, decrement and remove if necessary.
                if(has.call(node.repeats,func)){
                    node.repeats[func] -= 1;
                    if( node.repeats[func] === 0){
                        // remove from the repeats
                        node.f.splice(i,1);
                        delete node.repeats[func];
                    }
                }

                // we want to stop the events from propogating..
                if(tev.stopFlag){break;}
            }
        }).bind(this);

        tev.traverse(selector,tev.root,callback);
        tev.stopFlag = false;
    }
    tev.Stop = function(){
        tev.stopFlag = true;
    }

    tev.root = { f:[],repeats:{}, nodes:{}};
    tev.seperator = /[\.]/;
    tev.stopFlag = false;

    // Return the leaf node specified by this selector.
    tev.leafNode = function(root,selector){
        var tokens = selector.split(tev.seperator);
        var node = root;

        for(var i =0, len = tokens.length; i < len; ++i){
            var key = tokens[i];
            if( has.call(node.nodes,key) === false){
                // if the key doesn't exist, then just create one.
                node.nodes[key] = {f:[],nodes:{},repeats:{}};
            }
            node = node.nodes[key];
        }
        return node;
    }

    tev.On = function(selector,func){
        var node = tev.leafNode(tev.root,selector);
        node.f.push(func);
        return tev;
    }

    tev.Off = function(selector,func){
        var tokens = selector.split(tev.seperator);
        tev.traverse(selector,tev.root,(function(node,index){
            // not a leaf node.
            if( index < tokens.length-1){return;}

            if( func ){
                // a specific function was requested to be removed.
                for(var i = 0, len = node.f.length; i < len; ++i){
                    if( node.f[i] === func){
                       node.f.splice(i,1);
                       if( has.call(node.repeats,func)){
                            delete node.repeats[func];
                       }
                    }
                }

            }else{
                // no specific function was requested to be removed.
                // so just remove all the methods.
                node.f = [];
                node.repeats = {};
            }

        }).bind(this));
    };

    tev.Repeat = function(times,selector,func){
        var node = tev.leafNode(tev.root,selector);
        node.f.push(func);
        node.repeats[func] = times;
        return tev;
    };

    tev.traverse = function(selector,root, callback){
        function getNodes(current,key){
            var output = ( has.call(current.nodes,"*") ) ?  [current.nodes["*"]] : [];

            if(key === "*"){
                output = [];
                for(var k in current.nodes){
                    if(has.call(current.nodes,k)){
                        output.push(current.nodes[k]);
                    }
                }
                return output;
            }else if(has.call(current.nodes,key)){
                output.push(current.nodes[key]);
                return output;
            }else{
                return output;
            }
        }

        var tokens = selector.split(tev.seperator);
        var queue = [];
        queue.push([tev.root,0]);

        var i, ilen;
        while(queue.length != 0){
            var cand = queue.splice(queue.length-1,1)[0];  // pop from front
            var node = cand[0];
            var index = cand[1]
            var key = tokens[index];

            // do the callback on these nodes
            var nodes = getNodes(node,key);
            for(i = 0, ilen = nodes.length; i < ilen; ++i){
                callback(nodes[i],index);
            }

            // don't need to process anymore children.
            if( index >= tokens.length){continue;}

            // add the children of these nodes.
            for(i = 0, ilen = nodes.length; i < ilen; ++i){
                queue.push([nodes[i],index+1]);
            }
        }
    }

    return tev;
});
