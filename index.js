const { count } = require("console");
const fs = require("fs");
const http = require("http");
const https = require("https");
const url = require("url");
const port = 3000;
const server = http.createServer();
const {consumerKey,redirectUrl} = require('./auth/credentials.json');
const info = [];
var nsfw = new Boolean(false); 
const Count = [];


server.on("request", connection_handler);
function connection_handler(req, res){
    console.log(`New Request for ${req.url} from ${req.socket.remoteAddress}`);
    if(req.url === "/"){
        const form = fs.createReadStream('html/userform.html');             //when user is visiting the root page, he(she) will require to fill in(choose) a number from 1 to 1000(actually the number can be larger, 
		res.writeHead(200,{'Content-Type':'text/html'});                    //but I don't want to make it too massy, because 1000 random animes' cover image link are not even easy to read in our pocket webpage.
	    form.pipe(res);
    }
    else if(req.url.startsWith("/aniapi")){
        const myURL = new URL(req.url, "http://localhost:3000");            //when the user finish the form from the previous step, the browser will go to the url we set for it, here is localhost:3000/aniapi;
        number = myURL.searchParams.get("number");                          //then I will take out the input number from the user and put it into a new array Count[]
		Count.push(number);
		if(info.length >= 2){                               
			get_anime(res);                                                 //if user already have the access_token for pocket, then skip the authorization steps, go to aniapi to get the animes
		}
		else request_access_token(res);
    }
	else if(req.url.startsWith("/redirect")){
		convert_access_token(info[0],res);                                  //after the browser redirect to this url, then convert the request_token into access_token
	}
    else{
		res.writeHead(404,{"Content-Type":"text/plain"});
		res.end("404 not Found");
	}
}

function stream_to_message(stream, callback, ...args){
	let body = "";
	stream.on("data", chunk => body += chunk);
	stream.on("end", ()=> callback(body, ...args));
}

function request_access_token(res){	
	const data = JSON.stringify({                                            //here, send a request in POST method to pocket, in order to get the request_token back
		consumer_key: consumerKey,
		redirect_uri: redirectUrl
	})
	let token_endpoint = "https://getpocket.com/v3/oauth/request";              
	let options = {
		method:"POST",
		headers : {
			"Content-Type":`application/json; charset=UTF-8`,
			"X-Accept":`application/json`
		}
	}

	//const token_request_time = new Date();
	const token_request = https.request(token_endpoint, options);
	token_request.once("error", err => {throw err});
	token_request.once("response", (token_stream) => stream_to_message(token_stream, request_code, res));
	token_request.write(data);
	token_request.end();
}

function request_code(code_object ,res){
	console.log("API 1 has been called");
    const received_token = JSON.parse(code_object);                            //after receive the request_token object, parse it out and push the code into the info[], because the code is required for
    const code = received_token.code;                                          //the following authorization
	info.push(code);
	redirect_to_pocket(code,res);
}

function redirect_to_pocket(code,res){
	const endPoint = `https://getpocket.com/auth/authorize?request_token=${code}&redirect_uri=${redirectUrl}`;        //redireact to the pocket user authorization webpage
	res.writeHead(302, {Location: `${endPoint}`});
	res.end();
}

function convert_access_token(code, res){
	//console.log(code);
	const method_url = "https://getpocket.com/v3/oauth/authorize";              //here send a request in POST method to pocket, in order to get the access_token back, here it require the consumer_key and 
	const options = {                                                           //code 
		method:"POST",
		headers : {
			"Content-Type":`application/json; charset=UTF-8`,
			"X-Accept":`application/json`
		}
	};
	const pocket_access_token = JSON.stringify({
		"consumer_key": consumerKey,
		"code": code
	});
    //console.log(pocket_access_token);
	const access_request = https.request(method_url, options);
	access_request.once("error", err => {throw err});
	access_request.once("response", (token_stream) => stream_to_message(token_stream, receive_access_token, res));
	access_request.write(pocket_access_token);
	access_request.end();
}

function receive_access_token(access_token_object, res){
	console.log("API 1 has been called");
	//console.log(access_token_object);
	const received_temp = JSON.parse(access_token_object);                      //after return back the access_token object, parse it out and push it into the info[], so that we can use it later on
    info.push(received_temp.access_token);
	//console.log(info);
	get_anime(res);
}

function get_anime(res){
	const temp = Count[Count.length-1];
	const endpoint = `https://api.aniapi.com/v1/random/anime/${temp}/${nsfw}`;     //now, send a request to aniapi in GET method, so that can get certain random animes infomation back 
	const options = {
		method:"GET",
	};
	const random_request = https.request(endpoint, options);
	random_request.once("error", err => {throw err});
	random_request.once("response", (random_request_stream) => stream_to_message(random_request_stream, recived_search_result, res));
	random_request.end();
}

function recived_search_result(received_object,res){
	console.log("API 2 has been called");
	const received_data = JSON.parse(received_object).data;                       //becasue the return object is in json list, so we take out the data[] which has the value we want
    const arr = [];                                                                  
    for(let i=0; i < received_data.length; i++){
		let temp1 = {};                                                          //here we need a new array to store the action,url and name
		temp1["action"] = "add";
		//temp1["item_id"] = received_data[i].anilist_id;
		temp1["title"] = received_data[i].titles.en;
		temp1["url"] = received_data[i].cover_image;
		arr.push(temp1);
	}
	//console.log(cover_urls);
	//console.log(info);
	add_results_to_pocket(arr,res);
}

function add_results_to_pocket(arr, res){
	const myUrl = "https://getpocket.com/v3/send";                                //send a request to pokect in POST method, so that it follow the action we set to modify users list in pocket webpage,
    const options = {                                                             //for this project, basically just want the add action
		method: "POST",
		headers: {
			"Content-Type": `application/json; charset=UTF-8`
		}
	};
	const authorization = JSON.stringify({
		"consumer_key": consumerKey,
		"access_token": info[1],
        "actions": arr
	});
	//console.log(authorization);
	const add_request = https.request(myUrl, options);
	add_request.once("error", err => {throw err});
	add_request.once("response", (add_result_stream) => stream_to_message(add_result_stream, add_search_result, res));
	add_request.end(authorization);
}

function add_search_result(result_object, res){
	console.log("API 1 has been called");
	//console.log(result_object);                                                   
	res.writeHead(302, {Location: `https://app.getpocket.com/`});                 //at last, redireact to the pocket user webpage to display the items that user just add in
	res.end();
}

server.on("listening", listening_handler);
server.listen(port);
function listening_handler(){
    console.log(`Now Listening on Port ${port}`);
}

