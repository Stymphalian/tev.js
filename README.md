#Tiny Event Library (tev)
A small library for creating and managing custom events. Based on the the fucking awesome "eve.js" from [Dimitry Baranovsky](https://github.com/adobe-webplatform/eve)

#Example
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
