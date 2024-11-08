// namespace:
this.JVG = this.JVG||{};


(function() {
/**
*
* @class SubscriberBar
* @extends Container
* @constructor
**/
var FlashBlobHandler = function() {
    this.initialize();
}
var p = FlashBlobHandler.prototype;

//public properties:

//public methods:
    p.initialize = function() {
        
    }
    
    p.onConnectedToService = function ( appId, joinAs ) {
        JVG.swf.onConnectedToService( appId, joinAs );
    }
    
    p.onDisconnectedFromService = function( error ) {
        JVG.swf.onDisconnectedFromService( error );
    }
    
    p.onRoomCreated = function( roomId ) {
        JVG.swf.onRoomCreated( roomId );
    }
    
    p.onCreateRoomFail = function( roomId ) {
        JVG.swf.onCreateRoomFail( roomId );
    }
    
    p.onRoomJoined = function( roomId ) {
        JVG.swf.onRoomJoined( roomId );
    }
    
    p.onJoinRoomFail = function( roomId ) {
        JVG.swf.onJoinRoomFail( roomId );
    }
    
    p.onCustomerJoinedRoom = function( userId, name ) {
        JVG.swf.onCustomerJoinedRoom( userId, name );
    }
    
    p.onCustomerSentMessage = function( userId, message ) {
        JVG.swf.onCustomerSentMessage( userId, message );
    }
    
    p.onRoomBlobChanged = function( blob ) {
        JVG.swf.onRoomBlobChanged( blob );
    }
    
    p.onCustomerBlobChanged = function( blob ) {
        JVG.swf.onCustomerBlobChanged( blob );
    }
    
    p.onRoomDestroyed = function() {
        JVG.swf.onRoomDestroyed();
    }

    p.onRoomLocked = function() {
        JVG.swf.onRoomLocked();
    }

    p.onLockRoomFail = function() {
        JVG.swf.onLockRoomFail();
    }
    
    p.onStartSessionResult = function( success, module, name, response ) {
        JVG.swf.onStartSessionResult( success, module, name, response );
    }
    
    p.onStopSessionResult = function( success, module, name, response ) {
        JVG.swf.onStopSessionResult( success, module, name, response );
    }
    
    p.onGetSessionStatusResult = function( success, module, name, response ) {
        JVG.swf.onGetSessionStatusResult( success, module, name, response );
    }
    
    p.onSendSessionMessageResult = function( success, module, name ) {
        JVG.swf.onSendSessionMessageResult( success, module, name );
    }

JVG.FlashBlobHandler = FlashBlobHandler;
}());
