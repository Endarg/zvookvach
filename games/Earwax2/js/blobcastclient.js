function BlobCastClient(cfg) {
    if (!cfg) {
        cfg = {};
    }
    this.myUserId = cfg.userId;
    this.server = cfg.hasOwnProperty('server') ? cfg.server : 'http://blobcast.jackboxgames.com';
    this.appId = cfg.hasOwnProperty('appId') ? cfg.appId : undefined;
    this.delegate = null;
    this.currentRoomId = null;
    this.isConnected = false;
    this.retries = 0;
    this.maxRetries = 7;
    this.joinAs = "player";
}

BlobCastClient.prototype.createActionPacket = function(action, extras) {
    var packet = extras ? extras : {};
    
    packet.type = "Action";
    
    packet.appId = this.appId;
    packet.userId = this.myUserId;
    packet.action = action;
    
    return packet;
};

BlobCastClient.prototype.connectToService = function(roomId, successCallback, failCallback) {
    console.log("ConnectToService");
    this.disconnectFromService();
    
    var url = this.server + '/room';
    var _this = this;

    if(roomId) {
        url += "/" + roomId;
    }
    
    $.ajax({
        url: url,
        type: 'GET',
        crossDomain: true,
        dataType: 'json',
        success: function(data)
        {
            if(data.error) {
                failCallback(data.error);
                return;
            }
            
            if ( data.hasOwnProperty('joinAs') ) {
                _this.joinAs = data.joinAs;
            }

            if (data.hasOwnProperty('apptag')) {
                _this.appTag = data.apptag;
            }

            if (data.hasOwnProperty('appid')) {
                _this.appId = data.appid;
            }

            console.log(data);
            var serverName = data.server;
            _this.socket = io.connect(serverName + ":38202", { 
                    'sync disconnect on unload': true,
                    'force new connection': true,
                    'max reconnection attempts': _this.maxRetries,
                    'reconnection limit': 4000,
                    'reconnection delay': 500
                }
            );

            _this.socket.on("connect", function() { 
                //Fired upon a successful connection.
                //alert( "[BlobcastClient] Socket connect w/ " + _this.myUserId )
                console.log("[BlobcastClient] Socket connect.");
                _this.retries = 0;
                if ( _this.isConnected == false )
                {
                    successCallback( _this.appId, _this.joinAs ); 
                    _this.isConnected = true;
                }
            });

            _this.socket.on("error", function( err ) {
                //Fired upon a connection error.
                //alert( "[BlobcastClient] Socket error w/ " + _this.myUserId );
                console.log("[BlobcastClient] Socket error =>"+err+".");
            });

            _this.socket.on("reconnect", function( attempts ) { 
                // Fired upon successful reconnection. 
                //alert( "[BlobcastClient] Socket reconnect w/ " + _this.myUserId );
                _this.retries = 0;
                console.log("[BlobcastClient] Socket reconnect #"+attempts+".");
            });

            _this.socket.on("reconnect_attempt", function() {
                //Fired upon an attempt to reconnect.
                //alert( "[BlobcastClient] Socket reconnect_attempt w/ " + _this.myUserId );
                console.log("[BlobcastClient] Socket reconnect_attempt.");
            });

            _this.socket.on("reconnecting", function( attempts ) {
                //Fired upon an attempt to reconnect.
                //alert( "[BlobcastClient] Socket reconnecting w/ " + _this.myUserId );
                console.log("[BlobcastClient] Socket reconnecting #"+attempts+".");
                if ( _this.retries == _this.maxRetries ) {
                    setTimeout( function() { 
                        if ( _this.socket ) {
                            _this.delegate.onDisconnectedFromService(); 
                            _this.socket = null;
                            console.log("[BlobcastClient] Socket max # of retries hit!  Disconnecting.");
                        }
                    }, 5000 );
                }
                _this.retries++;
            });

            _this.socket.on("reconnect_error", function( err ) {
                //Fired upon a reconnection attempt error.
                //alert( "[BlobcastClient] Socket reconnect_error w/ " + _this.myUserId );
                console.log("[BlobcastClient] Socket reconnect_error => "+err+".");
            });

            _this.socket.on("reconnect_failed", function() {
                //Fired when couldn’t reconnect within reconnectionAttempts
                //alert( "[BlobcastClient] Socket reconnect_failed w/ " + _this.myUserId );
                console.log("[BlobcastClient] Socket reconnect_failed.");
                if ( _this.socket ) {
                    _this.delegate.onDisconnectedFromService();
                    _this.socket.disconnect();
                    _this.socket = null;
                    console.log("[BlobcastClient] Socket done attempting to reconnect!  Disconnecting.");
                }
            });

            _this.socket.on("disconnect", function() { 
                //Fired upon a disconnection.
                //alert( "[BlobcastClient] Socket disconnect w/ " + _this.myUserId );
                _this.isConnected = false;
                _this.retries = 0;
                console.log("[BlobcastClient] Socket disconnect.");
            });

            _this.socket.on("msg", function (data) { 
                //console.log("[BlobcastClient] Socket msg w/ " + data );
                _this.onDataReceived(data); 
            });
        },
        error: function(data) {
            failCallback(data);
            _this.socket = null;
        }
    });
};

BlobCastClient.prototype.isAudience = function() {
    return this.joinAs == "audience";
};

BlobCastClient.prototype.isPlayer = function() {
    return this.joinAs == "player";
};

BlobCastClient.prototype.createRoom = function() {
    var _this = this;
    this.connectToService(null, 
        function() { 
            _this.send(_this.createActionPacket("CreateRoom")); 
        },
        function() {
            _this.delegate.onCreateRoomFail();
        }
    );
};

BlobCastClient.prototype.joinRoom = function(roomId, name) {
    if(!roomId || !name || roomId.length == 0 || name.length == 0) {
        this.delegate.onJoinRoomFail(new Error('Invalid name or room id'));
        return;
    }
    
    var _this = this;
    this.connectToService(roomId, function( appId, joinType ) { 
        _this.send(_this.createActionPacket("JoinRoom", { roomId : roomId, name : name, appId: appId, joinType: joinType } )); 
    },
    function(err) {
        _this.delegate.onJoinRoomFail(err);
    });
};

BlobCastClient.prototype.disconnectFromService = function() {
    if(this.socket) {
        console.log("DisconnectfromService");
        this.socket.disconnect();
        this.socket = null;
    }
};

BlobCastClient.prototype.send = function(packet) {
    this.socket.emit("msg", packet);
};

BlobCastClient.prototype.leaveRoom = function() {
    if(!this.currentRoomId) {
        return;
    }
    this.send(this.createActionPacket("LeaveRoom"));
    this.currentRoomId = null;
};

BlobCastClient.prototype.setRoomBlob = function(blob) {
    if(!this.currentRoomId) {
        return;
    }
    
    this.send(this.createActionPacket("SetRoomBlob", { roomId : this.currentRoomId, blob : blob } )); 
};

BlobCastClient.prototype.setCustomerBlob = function(userId, blob) {
    if(!this.currentRoomId) {
        return;
    }
    
    this.send(this.createActionPacket("SetCustomerBlob", { roomId : this.currentRoomId, customerUserId : userId, blob : blob } )); 
};

BlobCastClient.prototype.sendMessageToRoomOwner = function(message) {
    if(!this.currentRoomId) {
        return;
    }
    
    this.send(this.createActionPacket("SendMessageToRoomOwner", { roomId : this.currentRoomId, userId : this.myUserId, message : message }) ); 
};

BlobCastClient.prototype.startSession = function(module, name, options) {
    if(!this.currentRoomId) {
        return;
    }
    
    this.send(this.createActionPacket("StartSession", { userId : this.myUserId, roomId : this.currentRoomId, module: module, name : name, options: options }) ); 
};

BlobCastClient.prototype.stopsession = function(module, name) {
    if(!this.currentRoomId) {
        return;
    }
    
    this.send(this.createActionPacket("StopSession", { userId : this.myUserId, roomId : this.currentRoomId, module: module, name : name }) ); 
};

BlobCastClient.prototype.getSessionStatus = function(module, name) {
    if(!this.currentRoomId) {
        return;
    }
    
    this.send(this.createActionPacket("GetSessionStatus", { userId : this.myUserId, roomId : this.currentRoomId, module: module, name : name }) ); 
};

BlobCastClient.prototype.sendSessionMessage = function(module, name, message) {
    if(!this.currentRoomId) {
        return;
    }
    
    this.send(this.createActionPacket("SendSessionMessage", { userId : this.myUserId, roomId : this.currentRoomId, module: module, name : name, message : message }) ); 
};

BlobCastClient.prototype.onDataReceived = function(data) {
    if(data.type == "Result") {
        if(data.action == "CreateRoom") {
            if(data.success) {
                this.currentRoomId = data.roomId;
                
                if(this.delegate && this.delegate.onRoomCreated) {
                    this.delegate.onRoomCreated(this.currentRoomId);
                }
            }
            else {
                if(this.delegate && this.delegate.onCreateRoomFail) {
                    this.delegate.onCreateRoomFail(new Error(data.error));
                }
            }
        }
        else if(data.action == "JoinRoom") {
            if(data.success) {

                if ( !this.currentRoomId ) {
                    this.currentRoomId = data.roomId;
                
                    if(this.delegate && this.delegate.onRoomJoined) {
                        this.delegate.onRoomJoined(this.currentRoomId);
                    }
                } else {
                    this.currentRoomId = data.roomId;
                
                    if(this.delegate && this.delegate.onRoomRejoined) {
                        this.delegate.onRoomRejoined(this.currentRoomId);
                    }
                }
            }
            else {
                if(this.delegate && this.delegate.onJoinRoomFail) {
                    this.delegate.onJoinRoomFail(new Error(data.error));
                }
            }
        }
        else if(data.action == "LockRoom") {
            if(data.success) {
                this.delegate.onRoomLocked();
            }
            else {
                this.delegate.onLockRoomFail();
            }
        }
        else if(data.action == "StartSession") {
            this.delegate.onStartSessionResult( data.success, data.module, data.name, data.response );
        }
        else if(data.action == "StopSession") {
            this.delegate.onStopSessionResult( data.success, data.module, data.name, data.response );
        }
        else if(data.action == "GetSessionStatus") {
            this.delegate.onGetSessionStatusResult( data.success, data.module, data.name, data.response );
        }
        else if(data.action == "SendSessionMessage") {
            this.delegate.onSendSessionMessageResult( data.success, data.module, data.name );
        }
    }
    else if(data.type == "Event") {
        if(this.currentRoomId != data.roomId) {
            return;
        }
        
        if(data.event == "CustomerJoinedRoom") {
            if(this.delegate && this.delegate.onCustomerJoinedRoom) {
                this.delegate.onCustomerJoinedRoom(data.customerUserId, data.customerName);
            }
        }
        else if(data.event == "CustomerMessage") {
            if(this.delegate && this.delegate.onCustomerSentMessage) {
                this.delegate.onCustomerSentMessage(data.userId, data.message);
            }
        }
        if(data.event == "RoomBlobChanged") {
            if(this.delegate && this.delegate.onRoomBlobChanged) {
                this.delegate.onRoomBlobChanged(data.blob);
            }
        }
        else if(data.event == "CustomerBlobChanged") {
            if(this.delegate && this.delegate.onCustomerBlobChanged) {
                this.delegate.onCustomerBlobChanged(data.blob);
            }
        }
        else if(data.event == "RoomDestroyed") {
            if(this.delegate && this.delegate.onRoomDestroyed) {
                this.delegate.onRoomDestroyed();
            }
            this.socket.disconnect();
            this.currentRoomId = null;
        }
    }
};