# Grap-Pics

This project is about using two APIs to grab given amount of animes' picture into user's getpocket website. Here it also use the "3-legged" OAuth for the authorization for user. I will mention it later on. This is the first project with javascript which finish on my own. So if having any problem or suggestion, happy contact me.

Now, I will start the introduction for this project. First of all, you need to register a new account in getpocket.com for the following access. Then, you will need to create a new app in getpocket which will allow you to do actions to your personal page of getpocket. You will get the consumer key from it, the consumer key will use in later step. So you will need to put that consumer key into the auth/credential.json file. Besides that, you also need to decide a redirect URL starts with "http://localhost:3000/". You can add anything you want after the '/'. After that, the browser will redirect to the authorization page of getpocket for you. If you didn't sign in yet, you will be required to do so first, then you will need to finish the authorization. After a while, if there is no error occur, you can go to your personal page of getpocket and refresh it. Finally you will see pictures for your given amount. 

Here I omit some details for the project. If you are interested at the details, you can go to sequenceDiagram file to check it out! 

