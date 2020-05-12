# Using JSON Web Tokens (JWT)

## Big Ideas
1. Difference between AuthN (authentication) and AuthZ (authorization)
    
    * Permission vs Authority 
        
        * AuthN - who are you? 
        
            * Like logging in
        
        * AuthZ - what do you want?
        
            * Gains access to specific things

2. **Salting** in the context of hashing is a random string that is attached to the front or the back of the password. 
    
    * When you hash it, you hash your password along with that random string. That way, your hashes are unique. 
    
    
    * It protects against rainbow tables.

3. How would you create a AuthN Flow? 

    * Create a Login endpoint, where it accepts a username and a password in req.body

    * Lookup the user from the database by the username. 

        * If they don't exist, return an error.

    * If the user exists, hash the password and compare it to what we have in the database.

        * If the comparison fails, then the password we received from the req.body is incorrect and the login fails. We could send a message stating "wrong password."

        * If the hashes do match, that means we have the correct username and the correct password. The user is authenticated at that point.

    * Create a new session and send it back as a cookie. Express-session does this automatically behind the scenes. It sets that session, saves it in the memory, and sends the data back as a cookie.

        * The client (Insomnia, the browser, etc) is going to store that cookie in its cookie jar and then it will automatically send that back up on all the subsequent requests. 

4. **Session** is like a virtual handstamp, wristband, or ticket stub that allows you to come back inside. It's just a piece of data that is store in memory or in a database that has information about the authentication so that the server remembers that you logged in. 

5. **Cookies** are a way for a client to persist a small chunk of data locally. It's kind of like local storage. It stores this data in something called a _cookie jar_. Then, on every subsequent request to an API, the client automatically sends all of the local data - all the cookies in the cookie jar - as a request header. It does all this automatically, behind the scenes.

    * When a new session is created, the server is going to send back the session ID inside of a cookie. That cookie is set locally on a client in local storage. Then that client is considered logged in. For now on, when that client makes a request to the API, it's sending that cookie back and that cookie contains the session ID so that it can validate that the user is actually logged in.

    * The `req.session.user = user` line in auth-router is just creating a new session using Express-Session. We just assign to that object.

6. How to Create an AuthZ Flow? 
    <br>    
    If we have an endpoint that we want to protect and only allow logged in users access to this endpoint, how do we create that authorization flow?

    * Take a look in users-router. We have an endpoint that is restricted to logged in users. We're just using some middleware. 
    
    * The restrict middleware just checks to see if there is a session. If there isn't, it sends a 401 error message. Otherwise, the user is granted access to the resource. 

    * We just use this restrict middleware on any endpoint that we want protected as an authorized endpoint.

7. What's one specific problem with this whole approach/flow of Authentication and Authorization? Think specifically about where the data is getting stored. We're just storing the sessions in memory. They're not being stored in a database. 

    * So what happens if our app gets super popular and our server just can't handle the traffic? You'd want to scale up your app to run on multiple servers at the same time. This is referred to as _horizontal scaling_.

        * You have to have a central place for sessions. 

        * Multiple servers don't share memory. They all have their own memory.

        * We have to make sure each session has access to that session store wherever it may be. Otherwise, a user could be potentially logged in on one of the servers and not be logged in on another for the same app.

        * Solution: Store your sessions in a database and make sure all your servers are connected to the same database.

    * But in our case, SQLite is a file-based DBMS so that DB file can't easily be shared. Therefore, we need a way to handle authorization in a stateless way. JSON Web Tokens could help with this.

8. **JSON Web Tokens** are sort of like a pre-authorized key card. 

    * They're also referred to as [JWTs](https://jwt.io/introduction/) or pronounced as _JOT_. It's a way for 2 parties to exchange JSON data securely without any shared state. 
    
    * It actually relies on cryptographic hashing, the same concept of when we hashed our passwords. It uses hashing to digitally sign the data and to make sure it was never ever tampered with.

    * Instead of having to verify a session in memory or database like we did before, if we're using JWTs then the server can know right away if the user's been authorized or not, just by looking at the token. It doesn't have to look up anything in memory, a database, or a file. It can just tell by looking at this token.

    * It is stateless. It does not have to save anything on the server.

    * The JWT itself is just a long string that consists of 3 chunks: `header.payload.signature`

        * A header is a base64-encoded (alphanumeric with special characters in it) object that contains 2 values:

            * Algorithm type - [HS256](https://auth0.com/blog/brute-forcing-hs256-is-possible-the-importance-of-using-strong-keys-to-sign-jwts/#JWT-Signing-Algorithms)

            * Type - in this case, it's just a JWT

            ```
            base64({
                algorithm: "HS256",
                type: "JWT"
            })
            ```
        
        * A payload - the data you want to pass back and forth between the server. It's also known as "claims." Claims is just a fancy word for user permissions. You can give it an ID and privileges associated with that ID.
            
            * This information is not private and is easily changed by anyone.Someone could take a JWT, decode it, and change their access level to unlimited when it wasn't supposed to be. 
        
            ```
            base64({
                membershipId: "12345",
                accessLevel: "unlimited",
            })
            ```
        
        * A signature - the most important piece of the token. The signature prevents unauthorized changes to the payload with cryptographic hashing. Just like when we could verify passwords when hashing, we can also verify any type of data, including objects. 
            
            * In our case, all the signature is is a hash of the header and the payload and a secret string that only the server knows about. 
            
            * The signature is really useful because it tells us if anything has ever changed in the header or the payload since the time we signed in (since the time that token was generated). We can tell if this data has been tampered with or changed at all.
            
            * If the signature doesn't match the payload, the payload does not get updated in the event we change our accessLevel from "basic" to "unlimited."
            
            ```
            hash(header + payload + secretString)
            ```

    * Scroll down to the Debugger on the [JWT homepage](https://jwt.io/). You will see that we have an example of an encoded and decoded example of a JWT. 

        * If you change things in the payload, you will see the encoded JWT changes as well.

        * Now go down to the Verify Signature section and create a secretString.

        * We can now use these tokens for authentication in a _stateless_ way. 

9. The New Authentication Flow using Tokens (in place of sessions)

    * The client sends the credentials to the server (the username and password from the Login endpoint)

    * Server is going to verify those credentials (look up the user, check the password hash)

    * Server generates a new JWT for the client

    * Server sends back the JWT as a header

    * The client stores the JWT in local storage

    * Client then sends that JWT back up on every subsequent request.

    * Server verifies the JWT is valid by checking the signature in the hash (no state is required)

    * If the signature is valid, the server provides access to the resource. Otherwise it sends back an error code 

10. Responsibilities of the Server and the Client in the AuthN Flow:
    
    * The responsibility of the _server_ in the AuthN Flow is to produce/generate the token, send it back to the client, read the token when it comes back, decode it and check the signature, and verify it.
    
    * It's the responsibility of the _client_ to store that token locally and send it back up on every request.

11. The biggest difference now between having to lookup a session in memory/database to verify that user is authorized, we just have to validate the JWT signature. It does not require any kind of network request - just a quick, cryptographic check. And if the user is valid, we know the user was properly authenticated. 

12. Drawbacks of Stateless Authentication - What's a potential problem of using JWTs instead of Sessions? 

    * **_It's nearly impossible to log the user out._**

        * We're not storing anything on the server side (nothing in the database or the memory). We're not storing any sessions anywhere. Once we issue that token - once we generate it and send it back - that user is logged in and we don't have any way to force them to log out.

        * A Couple Ways to Overcome this Drawback:
            
            * As a way to help with this drawback, we can give JWT expiration dates. 
            
            * Or you could use a method to create a "blacklist" of all the logged out tokens in your database and check against that list to see if anyone's logged out with that specific token. 

            * Or you can use JWTs _alongside_ sessions at the same time. Then use the JWT to store the session.

```
Stopping Point on Video, just after 5 minute break 

46:26
```