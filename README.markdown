#ChatSafe

A secure chat room service based on Node.js, Socket.io and AngularJS with AES encryption

##How to use ChatSafe

The following steps will allow you to use ChatSafe securely:

  1.  Use private/incognito browsing mode.

  2.  Create a chat using the box on the homepage.

  3.  Send the address of the newly created chat to anyone you want to chat with. This address contains the
      key to the chat, so keep it safe. I recommend using <a href="https://privnote.com/">privnote</a> to send 
      the address.

  4.  Once everyone has joined the chat, click the 'lock chat' button on the left of the chat page.

  5.  When you finish your conversation, click 'unlock chat' and when prompted click 'yes' to clear all messages 
      from the chat.

##How it works

  When you create a chat, a random key is generated and stored in the hash part of the URL. That's the part which
  your browser can see but is not sent over the internet to the server. This key used to encrypt your messages 
  in your browser before they are sent to the server. Once the message reaches the other members of the chat,
  their browsers will get the key from the URL you sent them to join the chat, and use it to decrypt the message
  back to its original form.

  All encryption is done using the <a href="https://github.com/mdp/gibberish-aes">Gibberish AES</a> library, so it
  follows the 256 bit AES specification. Because all encryption is done in the browser, not even the ChatSafe server 
  can read messages, as it does not have the encryption key.

  In case somebody does manage to get your chat URL, with the key to decrypt the messages, the lock feature can be used
  to stop any new members from joining the chat, so they cannot access the messages. The chat is deleted from the server
  once all members have left.

##Why was ChatSafe created

  People have a right to communicate in private without being tracked, recorded or monitored. Chatsafe provides 
  a simple, fast, browser-based instant messaging service for people to do this.</p><p> You shouldn't have to trust any
  external service to protect your communication data. With ChatSafe, even if somebody has access to our servers
  they cannot read your messages.

##Who Created ChatSafe

  ChatSafe was created by 
  <a href="http://www.davidtimms.co.uk">David Timms</a>,
  a student and web developer from Bristol, UK. If you have any questions or feedback about the site, send me a message on 
  <a href="http://www.davidtimms.co.uk">my website</a>.

##Can I trust you?

  You don't have to. ChatSafe is open source software, meaning anybody can 
  <a href="https://github.com/DavidTimms/ChatSafe">view the source code</a>, so you can check that it does what I say it does.
  
##SSL connection

ChatSafe now uses an SSL connection for an extra layer of security. If you wish to host your own version, put the SSL keys in the ```keys``` folder: *ssl.key* for private, *ssl.crt* for the certificate and for CA *ca.unified.pem*.
