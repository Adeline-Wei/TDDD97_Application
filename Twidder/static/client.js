var socket = "";
var PORT = "5000";

notificationHandler = function(signal){
    if (signal == "BYE") {
        signOut('KICK');
    }
    else if (signal == "NEW_LOGIN" || signal == "NEW_LOGOUT") {
        showChart();
    }
    else if (signal == "NEW_POST") {
        showChart();
    }
};

displayWelcomeView = function(){
	var wv = document.getElementById("welcomeview");
    document.body.innerHTML = wv.text;
};

displayProfileView = function(){
    var pv = document.getElementById("profileview");
    document.body.innerHTML = pv.text;
	
	// Show the default tab
	document.getElementById('Home').style.display = "block";
	getUserData('Home');
    showChart();
};

window.onload = function(){
    console.log("onload");
	if (localStorage.getItem("token") == null) {
		displayWelcomeView();	
	}
    else {
        if (localStorage.getItem("reload")) {
            var email = localStorage.getItem("email");
            var token = localStorage.getItem("token");
            socket = new WebSocket("ws://127.0.0.1:"+PORT+"/send_notification");
            socket.onopen = function() {
                console.log("REFRESH");
                socket.send(JSON.stringify({"signal":"NOTIFY_LOGIN","data":[email, token]}));
            }
            socket.onmessage = function (event) {
                console.log(event.data);
                notificationHandler(event.data);
            }
            socket.onerror = function (error) {
                console.log(error);
            }
        }
        displayProfileView();

    }
};

window.onbeforeunload = function(e) {
    if (localStorage.getItem("token")) {
        localStorage.setItem("reload", true);
    }
};
//========================== WELCOME VIEW ==========================//

//Sign In
sendSignInInformation = function(){
    var email = document.getElementsByName("emailsignin")[0].value;
    var password = document.getElementsByName("pwsignin")[0].value;
    var infoObj = JSON.stringify({
        'email':email,
        'password':password
    });
    var con = new XMLHttpRequest();
    con.onreadystatechange = function() {
        if (con.readyState == 4 && con.status == 200) {
            console.log("[Success] SIGN_IN ("+con.readyState+")");
            var response = JSON.parse(con.responseText);
            if (response['status'] == 200) {
                socket = new WebSocket("ws://127.0.0.1:"+PORT+"/send_notification");
                socket.onopen = function() {
                    console.log("SEND LOGIN NOTIFICATION");
                    socket.send(JSON.stringify({"signal":"NOTIFY_LOGIN","data":[email, response['token']]}));
                }
                socket.onmessage = function (event) {
                    console.log("[ONMESSAGE] ", event.data);
                    notificationHandler(event.data);
                }
                socket.onerror = function (error) {
                    console.log(error);
                }
                document.getElementById("signInAlert").innerHTML = "";
                localStorage.setItem('token', response['token']);
                localStorage.setItem('email', email);
                displayProfileView();
            }
            else {
                document.getElementById("signInAlert").innerHTML = "Sign in failed";
            }
        }
        else {
            console.log("[Error] SIGN_IN ("+con.readyState+")");
        }
    }
    con.open("POST", '/sign_in', true);
    con.setRequestHeader("Content-Type", "application/json");
    con.send(infoObj);
};

signInValidation = function() {
    var password = document.getElementsByName("pwsignin")[0].value;
    if (password.length < 5){
        document.getElementById("signInAlert").innerHTML = "Password should be more than 5";
        return false;
    }
    sendSignInInformation();
};

// Sign Up
sendSignUpInformation = function(){
    var email = document.getElementsByName("email")[0].value;
    var password = document.getElementsByName("pwsignup")[0].value;
    var firstname = document.getElementsByName("firstname")[0].value;
    var familyname = document.getElementsByName("familyname")[0].value;
    var gender = document.getElementsByName("gender")[0].value;
    var city = document.getElementsByName("city")[0].value;
    var country = document.getElementsByName("country")[0].value;

    var infoObj = JSON.stringify({
        'email':email,
        'password':password,
        'firstname':firstname,
        'familyname':familyname,
        'gender':gender,
        'city':city,
        'country':country
    });
    var con = new XMLHttpRequest();

    con.onreadystatechange = function () {
        if (con.readyState == 4 && con.status == 200) {
            var response = JSON.parse(con.responseText);
            console.log("response:"+response);
            if (response['status'] == 200) {
                var infoObj2 = JSON.stringify({
                    'email':email,
                    'password':password
                });
                console.log("infoObj2:"+infoObj2);
                var con2 = new XMLHttpRequest();
                con2.onreadystatechange = function() {
                    if (con2.readyState == 4 && con2.status == 200) {
                        var response2 = JSON.parse(con2.responseText);
                        console.log("Token:" + response2['token']);
                        localStorage.setItem('token', response2['token']);
                        localStorage.setItem('email', email);
                        if (socket == "") {
                            socket = new WebSocket("ws://127.0.0.1:5001/send_notification");
                            socket.onopen = function () {
                                socket.send(JSON.stringify({"signal": "NOTIFY_LOGIN", "data": [email, response2['token']]}));
                            }
                        }
                        displayProfileView();
                    }
                }
                con2.open("POST", '/sign_in', true);
                con2.setRequestHeader("Content-Type", "application/json");
                con2.send(infoObj2);
            }
            else {
                console.log("[Error] The second step in SIGN_UP." + response['status']);
            }
        }
        else {
        }
    };
    con.open("POST", '/sign_up', true);
    con.setRequestHeader("Content-Type", "application/json");
    con.send(infoObj);
};

signUpValidation = function() {
	document.getElementById("signUpAlert").innerHTML = "";	// Empty any alert in the SIGN_UP function
    var password1 = document.getElementsByName("pwsignup")[0].value;
    var password2 = document.getElementsByName("repeatpsw")[0].value;
    if (password1.length < 5){
        document.getElementById("signUpAlert").innerHTML = "Password should be more than 5";
        return false;
    }
    if (password1 != password2){
        document.getElementById("signUpAlert").innerHTML = "Password is incorrect";
        return false;
    }
    sendSignUpInformation();
};

//========================== PROFILE VIEW ==========================//
openTab = function(evt, tabName) {
     // Get all elements with class="tabcontent" and hide them
     var i, tabcontent, tablinks;

     tabcontent = document.getElementsByClassName("tabcontent");
     for (i = 0; i < tabcontent.length; i ++){
        tabcontent[i].style.display = "none";
     }

     // Get all elements with class="tablinks" and remove the class "active"
     tablinks = document.getElementsByClassName("tablinks");
     for (i = 0; i < tablinks.length; i ++){
         tablinks[i].classList.remove("active");
     }

	// Show the current tab, and add an "active" class to the link that opened the tab
	document.getElementById(tabName).style.display = "block";
    evt.currentTarget.classList.add("active");
	 
	if (tabName == "Home") {
		getUserData(tabName);
		getUserMessages(tabName);
	}
	// Decide to show the rest of elements except email search bar.
	else if (tabName == "Browse") {
		document.getElementById("ifUserFounded").style.display = 'none';
        if (document.getElementById("userEmail").value) {
            getUserData("Browse");
        }
	}
};

// Home & Browse
getUserData = function(tabName) {
	var token = localStorage.getItem("token");
    if (tabName == "Home") {
        var con = new XMLHttpRequest();
        con.onreadystatechange = function() {
            if (con.readyState == 4 && con.status == 200) {
                console.log("[Success] GET_USER_DATA ("+con.readyState+")");
                var response = JSON.parse(con.responseText);
                var data = "Email: " + response['data']['email'] + "<br>" + "Firstname: " + response['data']['firstname'] + "<br>" + "Familyname: " + response['data']['familyname'] + "<br>" + "Gender: " + response['data']['gender'] + "<br>" + "City: " + response['data']['city'] + "<br>" + "Country: " + response['data']['country'] + "<br>";
                document.getElementById("userData"+tabName).innerHTML = data;
                getUserMessages('Home');
            }
            else {
                //console.log("[Error] GET_USER_DATA ("+con.readyState+")");
            }
        }
        con.open("GET", '/get_user_data_by_token?token='+token, true);
        con.send(null);
    }
    else {
        var email = document.getElementById("userEmail").value;
        var con = new XMLHttpRequest();
        con.onreadystatechange = function() {
            if (con.readyState == 4 && con.status == 200) {
                var response = JSON.parse(con.responseText);
                console.log("[Success] GET_USER_DATA ("+con.readyState+")");
                if (response['status'] == 200) {
                    document.getElementById("browseAlert").innerHTML = "";
			        document.getElementById("ifUserFounded").style.display = 'block';
			        var data = "Email: " + response['result'][0] + "<br>" + "Firstname: " + response['result'][2] + "<br>" + "Familyname: " + response['result'][3] + "<br>" + "Gender: " + response['result'][4] + "<br>" + "City: " + response['result'][5] + "<br>" + "Country: " + response['result'][6] + "<br>";
                    document.getElementById("userData"+tabName).innerHTML = data;
                    getUserMessages('Browse');
                }
                else {
                    document.getElementById("browseAlert").innerHTML = "No such user.";
			        document.getElementById("ifUserFounded").style.display = 'none';
			        document.getElementById("userEmail").value = "";
                }
            }
            else {
                //console.log("[Error] GET_USER_DATA ("+con.readyState+")");
            }
        }
        con.open("GET", '/get_user_data_by_email?token='+token+'&email='+email, true);
        con.send(null);
    }
};

getUserTextarea = function(tabName) {
	var token = localStorage.getItem("token");
	var text = document.getElementById("userTextarea"+tabName).value;
    var notified_email = "";
	if (text != "") {
		var email = "";
		if (tabName == "Home") {
            email = "";
            notified_email = localStorage.getItem('email');
		}
		else {
            email = document.getElementById("userEmail").value;
            notified_email = email;
        }
        var infoObj = JSON.stringify({
            'token':token,
            'email':email,
            'message':text
        });
        var con = new XMLHttpRequest();
        con.onreadystatechange = function() {
            if (con.readyState == 4 && con.status == 200) {
                var response = JSON.parse(con.responseText);
                console.log("[Success] GET_USER_TEXTAREA ("+con.readyState+")");
                document.getElementById("userTextarea"+tabName).value = "";
                socket.send(JSON.stringify({"signal":"NOTIFY_POST", "data":[notified_email, token]}));
            }
            else {
                //console.log("[Error] GET_USER_TEXTAREA ("+con.readyState+")");
            }
        }
        con.open("POST", '/post_message', true);
        con.setRequestHeader("Content-Type", "application/json");
        con.send(infoObj);
    }
};

getUserMessages = function(tabName) {
	var token = localStorage.getItem("token");
	if (tabName == "Home"){
        var con = new XMLHttpRequest();
        con.onreadystatechange = function() {
            if (con.readyState == 4 && con.status == 200) {
                var response = JSON.parse(con.responseText);
                console.log("[Success] GET_USER_MESSAGES ("+con.readyState+")");
                objs = response['messages'];
                console.log(objs);
	            var messages = "";
	            for (var i in objs) {
		            messages = messages+"<div draggable='true' ondragstart='drag(event)' id='drag"+i+"'>"+(objs[i][0]+"said: "+objs[i][1]+"</div>");
	            }
	            document.getElementById("userMessages"+tabName).innerHTML = messages;
            }
            else {
                //console.log("[Error] GET_USER_MESSAGES ("+con.readyState+")");
            }
        }
        con.open("GET", '/get_user_messages_by_token?token='+token, true);
        con.send(null);
	}
	else {
		var email = document.getElementById("userEmail").value;
        var con = new XMLHttpRequest();
        con.onreadystatechange = function() {
            if (con.readyState == 4 && con.status == 200) {
                var response = JSON.parse(con.responseText);
                console.log("[Success] GET_USER_MESSAGES ("+con.readyState+")");
                objs = response['messages'];
	            var messages = "";
	            for (var i in objs) {
		            messages = messages + (objs[i][0] + " said: " + objs[i][1] + "<br>");
	            }
	            document.getElementById("userMessages"+tabName).innerHTML = messages;
            }
            else {
                //console.log("[Error] GET_USER_MESSAGES ("+con.readyState+")");
            }
        }
        con.open("GET", '/get_user_messages_by_email?token='+token+'&email='+email, true);
        con.send(null);
	}
};


// Account
changePassword = function() {
    var oldPassword = document.getElementsByName("oldpw")[0].value;
    var newPassword = document.getElementsByName("newpw")[0].value;
	if (newPassword.length < 5){
        document.getElementById("accountAlert").innerHTML = "The length of password should be more than 5.";
        return false;
    }
	var token = localStorage.getItem("token");
    var infoObj = JSON.stringify({
        'token':token,
        'old_pw':oldPassword,
        'new_pw':newPassword
    });
    var con = new XMLHttpRequest();
    con.onreadystatechange = function() {
        if (con.readyState == 4 && con.status == 200) {
            var response = JSON.parse(con.responseText);
            console.log("[Success] CHANGE_PASSWORD ("+con.readyState+")");
            if (response['status'] == 200) {
                document.getElementById("accountAlert").innerHTML = "Password changed!";
            }
            else {
                document.getElementById("accountAlert").innerHTML = "Password change failed";
            }
        }
        else {
            //console.log("[Error] CHANGE_PASSWORD ("+con.readyState+")");
        }
    }
    con.open("POST", '/change_password', true);
    con.setRequestHeader("Content-Type", "application/json");
    con.send(infoObj);
};

signOut = function(flag) {  // GOOD, KICK
    console.log("SIGN_OUT");
	var token = localStorage.getItem('token');
    var email = localStorage.getItem('email');
    var con = new XMLHttpRequest();
        con.onreadystatechange = function() {
            if (con.readyState == 4 && con.status == 200) {
                var response = JSON.parse(con.responseText);
                console.log("[Success] SIGN_OUT ("+con.readyState+")");
                if (flag == 'GOOD'){
                    socket.send(JSON.stringify({"signal":"NOTIFY_LOGOUT", "data":[email,token]}));
                }
                localStorage.removeItem('token');
                localStorage.removeItem('email');
                localStorage.removeItem('reload');
                displayWelcomeView();
            }
            else {
                //console.log("[Error] SIGN_OUT ("+con.readyState+")");
            }
        }
        con.open("GET", '/sign_out?token='+token, true);
        con.send(null);
};

addViewedTime = function() {
    var viewed_email = document.getElementById("userEmail").value;
    var token = localStorage.getItem("token");
    var con = new XMLHttpRequest();
    con.onreadystatechange = function() {
        if (con.readyState == 4 && con.status == 200) {
            var response = JSON.parse(con.responseText);
            console.log("[Success] ADD_VIEWED_TIME ("+con.readyState+")");
            socket.send(JSON.stringify({'signal':"NOTIFY_POST", 'data':[viewed_email,token]}))
        }
        else {
            //console.log("[Error] SHOW_CHART ("+con.readyState+")");
        }
    }
    con.open("GET", '/add_viewed_time?viewed_email='+viewed_email, true);
    con.send(null);
};

showChart = function() {
    var email = localStorage.getItem('email');
    var con = new XMLHttpRequest();
    con.onreadystatechange = function() {
        if (con.readyState == 4 && con.status == 200) {
            var response = JSON.parse(con.responseText);
            console.log("[Success] SHOW_CHART ("+con.readyState+")");
            var data = [{"label":"online","value":response['num_cur_onlines']},{"label":"post","value":response['num_posts']},{"label":"view","value":response['num_views']}]
            console.log(data);
            d3.select(".chart").selectAll("div").remove();
            d3.select(".chart").selectAll("div").data(data).enter().append("div").text(function(d){return d.label;}).append("div").style("width", function(d) { return d.value * 10 + "px"; }).text(function(d) { return d.value; });
        }
        else {
            //console.log("[Error] SHOW_CHART ("+con.readyState+")");
        }
    }
    con.open("GET", '/show_chart?email='+email, true);
    con.send(null);
};

// Drag and Drop
allowDrop = function(ev) {
    ev.preventDefault();
};

drag = function(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
};

drop = function(ev) {
    ev.preventDefault();
    var id = ev.dataTransfer.getData("text");
    var data = document.getElementById(id).innerHTML;
    var real_data = data.substring(data.search(":")+2);
    document.getElementById("userTextareaHome").value = real_data;
}
