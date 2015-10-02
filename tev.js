// Tev is a tiny library for manipulating custom user events.
// Specify dependencies between events using a 'chain' selector.
// For example
//      var f1 = function(){console.log("f1");}
//      var f2 = function(){console.log("f2");}
//      var f3 = function(){console.log("f3");}
//      tev.On("f1",f1);
//      tev.On("f1.*",f2);
//          Note the use of the wildcard operator.
//          f2 will be fired for any event which is a child of f1.
//      tev.On("f1.f3",f3);
//      tev("*.*");
//          after emitting this event, all three functions (f1,f2,f3)
//          will be called.
// Author: Jordan Yu
// Date: July 26th,2015
;(function(root,factory){
    if(typeof module != "undefined" && module.exports){
        module.exports = factory();
    }else if( typeof define === "function" && define.amd){
        define([],factory);
    }else{
        root.tev = factory();
    }
})(this,function() {
    // Aliases to make stuff easier for me.
    var has = Object.hasOwnProperty;

    // Emit all the events along the entire selector chain.
    // @Args:
    // selector:string - Selector specifying the event to be fired.
    // scope (optional) - Context when calling the function. Default 'this'
    // data (optional) - User defined data to pass to the event callbacks.
    // @Return:
    // returns the tev object.
    // @Example:
    //   f1.*.f2
    //     fires all events hooked onto f1 or *
    //     fires all children events of f1
    //     fire all events names f2 which is a child of f1
    function tev(selector,scope,data){
        scope = scope || this;
        var callback = (function(node){
            // We were requested to stop propogation. So just escape
            if(tev.stopFlag){return;}

            // call every function attached to this node.
            for(var i = 0, len = node.f.length; i < len; ++i){
                var func = node.f[i];
                func.call(scope,data);

                // if this is a repeated function
                // decrement the counter and remove if necessary.
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

        // note that we bind the scope of the callback to 'this' so that
        // we have the selector,scope and data variables in our closure.
        }).bind(this);

        tev.traverse(selector,tev.root,callback);
        tev.stopFlag = false;
        return tev;
    }

    // private variables used to operate the event library.
    tev.root = { f:[],repeats:{}, nodes:{}};
    tev.seperator = /[\.]/;
    tev.stopFlag = false;

    // Hook the function onto the specified event.
    // @Args:
    // selector:string - the event in which to listen to.
    // func - the callback function to attach to the event.
    //   function(data){...}
    //     data is any user specified object provided when emitting th event.
    //     otherwise it is undefined.
    // @Return:
    // The tev object.
    tev.On = function(selector,func){
        var node = tev.leafNode(tev.root,selector);
        node.f.push(func);
        return tev;
    }


    // Remove the listener(s) from the event.
    // @Args:
    // selector:string - A selector specifying the callback to be removed.
    // func (optional) - the function pointer to be removed.
    //   if not provided the default behavior is to remove ALL functions
    //   attached to the selector.
    // @Return:
    // The tev object.
    // @Example:
    //   tev.On("f1.f2",f2);
    //   tev.On("f1.f3",f3);
    //   tev.On("f1.*",f4);
    //   tev.Off("f1.*",f2);    // remove f2 from "f1.f2" event
    //   tev.Off("f1.*");       // remove all callbacks attached to "f1.*"
    tev.Off = function(selector,func){
        var tokens = selector.split(tev.seperator);
        tev.traverse(selector,tev.root,(function(node,index){
            // not a leaf node, so we can skip.
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
        // Note that we bind the callback function to 'this' in order to include
        // the 'selector' and 'func' variables into the closure.

        return tev;
    };

    // Hook the function onto the specified event. Only fire the event 'times'
    //   number of times before removing the callback from the event.
    // @Args:
    // times:int - the number of times to fire the event, before
    //   automatically removing the handler from the listeners list.
    // selector:string - the event in which to listen to.
    // func - the callback function to attach to the event.
    //   function(data){...}
    //     data is any user specified object provided when emitting the event.
    //     otherwise it is undefined.
    // @Return:
    // The tev object.
    tev.Repeat = function(times,selector,func){
        var node = tev.leafNode(tev.root,selector);
        node.f.push(func);
        node.repeats[func] = times;
        return tev;
    };

    // Stop the propogation of the emitted event.
    // Note this is not re-entrant.
    // @return - the tev object
    tev.Stop = function(){
        tev.stopFlag = true;
        return tev;
    }


    // Private function used to return the leaf node specified by the selector
    // It will create nodes along the path if they do not exist.
    // @Args:
    // root - The node in which to start the search.
    // selector:string - the string of the event names.
    // @Return:
    // The leaf node specified by the selector
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

    // Private function which performs a BFS along all the nodes specified by
    // the selector. Starts the search from the provided root node.
    // @Args:
    // selector:string - the selector string specifying the nodes to visit.
    // root - The node in which to start the traversal.
    // callback - function(node:Object, index:int) {...}
    //   The user specified callback function which is called for every node
    //   along the selector path. node is the node which is being processed.
    //   index is the int index into the selector string in which the node was
    //   processed at.
    tev.traverse = function(selector, root, callback) {

        // Internal function which returns a list of children nodes which match
        // the given key.
        // @param current - the node which holds the children to search.
        // @param key: string - name of the event in which to collect the nodes.
        function getNodes(current,key){
            // If there exists a wildcard node, then add it to the list.
            var output = []
            if (has.call(current.nodes, "*")) {
                output = [current.nodes["*"]]
            }

            if(key === "*"){
                // wildcard operator.
                // Return all children nodes
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
        // Record node and index into the tokens array in which to process.
        queue.push([tev.root,0]);

        var i, ilen;
        while(queue.length != 0){
            // pop the front.
            var cand = queue.splice(queue.length-1,1)[0];
            var node = cand[0];
            var index = cand[1];
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

    // Return the result of this factory function.
    tev.Version = "1.0.0";
    return tev;
});
//boo!
