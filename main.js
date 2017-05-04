window.onload = function(){
            
    //global vars and event listeners
    var favorites = ["ESL_SC2", "OgamingSC2", "cretetion", "freecodecamp", "storbeck", "habathcx", "RobotCaleb", "noobs2ninjas", "brunofin", "comster404"];                    
    var currentState = "all"; 
    var buttonsLocked = false; //lock button while searching
    var users = [];
    var requestsToComplete, requestsCompleted = 0; //used to determine when all results are retrieved from server
    document.getElementById("search-bar").addEventListener("keyup", searchUserLocal);
    document.getElementById("search-btn").addEventListener("click", searchUserOnServer);
    var serverSearch = document.getElementById("server-search");
    var yourFavs = document.getElementById("your-favs");        
    var buttons = document.getElementById("button-box").children;            
    for(var i=0; i < buttons.length; i++)
    {
        buttons[i].addEventListener("click", function(){                
            if(!buttonsLocked)
            {
                for(var j=0; j < buttons.length; j++)
                    buttons[j].classList.remove("pushed");

                this.classList.add("pushed");

                //clean panel
                var resultsBox = document.getElementById("results-cont");
                while(resultsBox.firstChild) 
                    resultsBox.removeChild(resultsBox.firstChild);

                setGlobalState(this.id, favorites.length * 2);

                for(var i=0; i < favorites.length; i++)
                    createUserObj(favorites[i]);
            }
        });
    }

    //on search initiation set the global state and n of requests to perform
    function setGlobalState(state, toComplete)
    {
        buttonsLocked = true;
        users = [];
        currentState = state;
        requestsToComplete = toComplete;
    }

    function resetGlobalState()
    {
        requestsToComplete = 0;
        requestsCompleted = 0;
        buttonsLocked = false;
    }

    //tha actual ajax call
    function sendRequest(user, type, callback)
    {
        var requestURL = "https://wind-bow.gomix.me/twitch-api/" + type + "/" + user.userName + "?callback=?";

        $.ajax({
            url: requestURL,
            dataType: "json",
            success: function(data){
                requestsCompleted++;
                //console.log(data);
                // var result = JSON.parse(data);
                callback.call(callback, user, data);
            },
            error: function( data ){
                console.log("Error", data);
                requestsCompleted++;
                dismissResult();
            }
        });        
    }

    //initiate the process of creating an user obj with all the necessary info
    function createUserObj(name)
    {
        var userObj = {userName:name};
        sendRequest(userObj, "channels", setChannelInfo);
    }

    function setChannelInfo(user, data)
    {
        user.channelInfo = data;                 
        sendRequest(user, "streams", setStreamInfo);
    }

    function setStreamInfo(user, data)
    {
        user.streamInfo = data; 
        users.push(user);

        if(requestsCompleted >= requestsToComplete)
        {
            resetGlobalState();
            filterUsers();  
        }
    }

    //select the users to display in the proper panel based on status (online, offline, ecc...) 
    function filterUsers()
    {                
        if(currentState === "online" || currentState === "offline")
        {
            var mustBeOnline = currentState === "online" ? true : false;

            users = users.filter(function(item){
                return (item.streamInfo.stream !== null) === mustBeOnline;
            });
        }

        fillResultBox();
    }

    //creates all user 'cards' to display in the panel and add relative info
    function fillResultBox()
    {                
        for(var i=0; i < users.length; i++)
        { 
            var resultClone = document.getElementById("clone-01").cloneNode(true);
            var parent = document.getElementById("results-cont");
            var link = resultClone.firstElementChild;
            var header = resultClone.firstElementChild.firstElementChild;
            resultClone.id = users[i].userName;
            var status;
            var color;

            if(users[i].channelInfo.error === "Not Found")
            {
                color = "grey";
                status = "NOT FOUND";
            }
            else
            {
                if(users[i].streamInfo.stream !== null)
                {    
                    color = "green";
                    status = users[i].streamInfo.stream.channel.status;
                }
                else
                {
                    color = "red";
                    status = "offline";
                }
            }

            if(currentState === "single_request")
            {
                parent = serverSearch;
                resultClone.classList.add("shadow");
                addButtonsFunctionality(resultClone, status)
            }

            header.getElementsByTagName('h4')[0].innerHTML = users[i].userName;
            link.href = "https://www.twitch.tv/" + users[i].userName;
            header.getElementsByTagName('div')[0].style.backgroundColor = color;
            resultClone.getElementsByTagName('p')[0].innerHTML = status;
            parent.appendChild(resultClone);
        }
    }

    //activates the card buttons if the expected result is a non-favorite user
    function addButtonsFunctionality(clone, status)
    {
        var buttons = clone.getElementsByTagName("button");
        buttons[0].addEventListener("click", addToFavs);
        buttons[0].style.display = status !== "NOT FOUND" ? "inline-block" : "none"; 
        buttons[1].style.display = "inline-block";
        buttons[1].addEventListener("click", dismissResult);                
    }

    //search locally for a user on the currently opened panel
    function searchUserLocal()
    {
        var typed = this.value.toString().toLowerCase(); 
        var results = document.getElementById("results-cont").children;

        if(typed.length >= 2)
        {                      
            for(var j=0; j < results.length; j++)
            {
                if(results[j].id.substr(0, typed.length).toLocaleLowerCase() !== typed)
                    results[j].style.display = "none";
                else
                    results[j].style.display = "flex";
            }
        } 
        else
        {
           for(var i=0; i < results.length; i++)
                results[i].style.display = "flex";
        }                
    }

    //inititate search for user not prensent in favorites
    function searchUserOnServer(e)
    {
        e.preventDefault();
        var toSearch = document.getElementById("search-bar").value;

        if(favorites.indexOf(toSearch) < 0)
        {   
            while(serverSearch.firstChild)
                serverSearch.removeChild(serverSearch.firstChild);

            yourFavs.style.display = "none";
            serverSearch.html = "";
            serverSearch.style.display = "inline-block";
            setGlobalState("single_request", 2);
            createUserObj(toSearch);
        }
        else
            searchUserLocal();
    }

    //add new user to favorites
    function addToFavs()
    {
        favorites.push(users[0].userName);
        dismissResult();
    }

    //close new user search result
    function dismissResult()
    {
        serverSearch.style.display = "none";                
        yourFavs.style.display = "flex";
    }

    //sets intial state on all and perform related search
    buttons[0].classList.add("pushed");
    setGlobalState("all", favorites.length * 2);
    for(var i=0; i < favorites.length; i++)
        createUserObj(favorites[i]);            

};
