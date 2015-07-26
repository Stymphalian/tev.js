var Get = [];
var Want = ["f1", "f1", "f4", "f2", "f1", "f2", "f3", "f5", "f1", "f2", "f3", "f5", "f1", "f4", "f2", "f1", "f1", "f4", "f4", "f3", "f6"];
var log = function(str){Get.push(str); }

function CompareStringArrays(want,get){
    if( want.length !== get.length){
        console.log("want.length != get.length");
        return false;
    }

    for(var i = 0, len= want.length; i < len; ++i){
        if(want[i] !== get[i]){
            console.log("want["+i+"] != get["+i+"]");
            return false;
        }
    }
    return true;
}

var f1 = function(){log("f1");}
var f2 = function(){log("f2");}
var f3 = function(){log("f3");}
var f4 = function(){log("f4");}
var f5 = function(){log("f5");}
var f6 = function(){log("f6"); tev.Stop();}

// console.log(tev);
tev.On("f1",f1);
tev.On("f1.f2",f2);
tev.On("f1.*.f3",f3);
tev.On("*.f4",f4);
tev.Repeat(2,"*.*.f5",f5);
tev("f1");
tev("*.*");
tev("f1.f2.*");
tev("f1.f2.*");
tev("*.*.f5");

tev.Off("f1.f2",f2);
tev("f1.f2");
tev.On("f1.f2",f2);
tev.On("f1.f2",f3);
tev.Off("f1.f2");
tev("f1.f2");
// tev("*");
tev.Off("*");
tev("*");
tev("*.*");
tev("*.*.*");
tev.Off("*");
tev.Off("*.*");
tev.Off("*.*.*");

tev.On("f6",f6);
tev.On("*.f2",f2);
tev.On("*.*.f3",f3);
tev("*.*.*",this);

// console.log(Get);
CompareStringArrays(Want,Get);

/*
var f1 = function(){console.log("f1");}
var f2 = function(){console.log("f2");}
var f3 = function(){console.log("f3");}

tev.On("f1",f1);
tev.On("f1.f2",f2);

// repeat an event only a certain number of time ( ie. once())
// Note the use of the wildcard. f3 will be called after any event
// along the chain f1.f2
tev.Repeat(1,"f1.f2.*",f3);

// call the functions along the chain f1.*.*
tev("f1.*.*");
// f1
// f2
// f3

// f3 only repeats once.
tev("f1.*.*");
// f1
// f2

// we remove the event handler on "f1"
tev.Off("f1");
tev("f1.*.*");
// f2
*/