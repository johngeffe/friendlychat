import React from 'react';
import ReactDOM from 'react-dom';
import Firebase from 'firebase';
import ReactFireMixin from 'reactfire';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'; // used in main app
import injectTapEventPlugin from 'react-tap-event-plugin';
import AppBar from 'material-ui/AppBar'; // used in Header
import Snackbar from 'material-ui/Snackbar'; // used in Messages
import RaisedButton from 'material-ui/RaisedButton'; // used in Messages
import FlatButton from 'material-ui/FlatButton'; // used in header
import TextField from 'material-ui/TextField'; // used in forms
import IconButton from 'material-ui/IconButton'; // used in forms
import Image from 'material-ui/svg-icons/image/image'; // used in forms
import CommunicationChatBubbleOutline from 'material-ui/svg-icons/communication/chat-bubble-outline'; // used in forms
import ActionAccountCircle from 'material-ui/svg-icons/action/account-circle'; // used header
import Avatar from 'material-ui/Avatar';
import Paper from 'material-ui/Paper';

import {FbKeys} from '../private/apikeys.js';

/*
This is an attempt to prevent them from being pushed to github
// private/apiKeys.js file format:

const FbKeys = {
  apiKey: "< your api key>",
  authDomain: "< your authDomain >",
  databaseURL: "https://< your firebase DB >.firebaseio.com",
  storageBucket: "< your firebase storage bucket>.appspot.com",
};

export {FbKeys};
*/

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

var config = FbKeys;
firebase.initializeApp(config);

var MessageImageForm = React.createClass({
    getInitialState: function () {
        return { message: 'snack bar message', open: false };
    },
    componentWillMount: function () {
        this.firebaseRefs = firebase.database().ref('messages');
        this.auth = firebase.auth();
        this.storage = firebase.storage();
    },
    componentDidMount: function () {
        this.mediaCapture = document.getElementById('mediaCapture');
    },
    setImageUrl: function (imageUri, imgElement) {
        if (imageUri.startsWith('gs://')) {
            this.storage.refFromURL(imageUri).getMetadata().then(function (metadata) {
                imgElement.src = metadata.downloadURLs[0];
            });
        } else {
            imgElement.src = imageUri;
        }
    },
    saveImageMessage: function (event) {
        var file = event.target.files[0];
        this.imageForm.reset();
        if (!file.type.match('image.*')) {
            this.setState({ open: true, message: 'You can only share images' });
            return;
        }
    },
    handleClick: function (e) {
        e.preventDefault();
        var file = e.target.files[0];
        if (!file.type.match('image.*')) {
            this.setState({ open: true, message: 'You can only share images' });
            return;
        }
        if (this.auth.currentUser) {
            var currentUser = this.auth.currentUser;
            this.firebaseRefs.push({
                email: currentUser.email,
                name: currentUser.displayName,
                photoURL: currentUser.photoURL,
                providerData: currentUser.providerData,
                providerId: currentUser.providerId,
                timestamp: firebase.database.ServerValue.TIMESTAMP,
                uid: currentUser.uid
            }).then(function (data) {
                // Upload the image to Firebase Storage.
                var uploadTask = this.storage.ref(currentUser.uid + '/' + firebase.database.ServerValue.TIMESTAMP + '/' + file.name)
                    .put(file, { 'contentType': file.type });
                // Listen for upload completion.
                uploadTask.on('state_changed', null, function (error) {
                    console.error('There was an error uploading a file to Firebase Storage:', error);
                }, function () {
                    // Get the file's Storage URI and update the chat message placeholder.
                    var filePath = uploadTask.snapshot.metadata.fullPath;
                    data.update({ imageUrl: this.storage.ref(filePath).toString() });
                }.bind(this));
            }.bind(this));
        } else {
            this.setState({ open: true, message: 'You must sign-in first' });
        }
    },
    render: function () {
        return (
            <form action="#" style={{
                display: 'flex',
                flexDirection: 'row',
                float: 'auto',
                width: '48px',
                height: '67px'
            }}>
                <input id="mediaCapture" hidden={true} type="file" accept="image/*,capture=camera" onChange={this.handleClick} />
                <IconButton  onTouchTap={function () { this.mediaCapture.click(); }.bind(this) }
                    iconStyle={{
                        width: 48,
                        height: 48,
                        position: 'in-line',
                        color: '#FFC400',
                        paddingTop: '12px'
                    }}>
                    <Image />
                </IconButton>
                <Snackbar
                    open={this.state.open}
                    message={this.state.message}
                    autoHideDuration={2000}
                    onRequestClose={this.handleRequestClose}
                    />
            </form>
        )
    }
});

var MessageTextForm = React.createClass({
    componentWillMount: function () {
        this.firebaseRefs = firebase.database().ref('messages');
        this.auth = firebase.auth();
    },
    onChange: function (e) {
        this.setState({ text: e.target.value });
    },
    getInitialState: function () {
        return { text: '', btnState: false, messages: [], message: 'snack bar message', open: false };
    },
    handleSubmit: function (e) {
        e.preventDefault();
        if (this.auth.currentUser) {
            var currentUser = this.auth.currentUser;
            if (this.state.text && this.state.text.trim().length !== 0) {
                this.firebaseRefs.push({
                    email: currentUser.email,
                    name: currentUser.displayName,
                    photoURL: currentUser.photoURL,
                    providerData: currentUser.providerData,
                    providerId: currentUser.providerId,
                    text: this.state.text,
                    timestamp: firebase.database.ServerValue.TIMESTAMP,
                    uid: currentUser.uid
                });
                this.setState({
                    text: ''
                });
            }
        } else {
            this.setState({ open: true, message: 'You must sign-in first' });
        }
    },
    handleRequestClose: function () {
        this.setState({
            open: false,
        })
    },
    componentDidUpdate: function () {
        // enables/disables submit button based on length of input value.
        // only setState if necessary or render loop will occur.
        if ((this.state.text.length > 0) && (this.state.btnState == false)) {
            this.setState({ btnState: true });
        } else {
            if ((this.state.text.length == 0) && (this.state.btnState == true)) {
                this.setState({ btnState: false });
            }
        }
    },
    render: function () {
        return (
            <div>
                <form action="#"
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        float: 'left',
                        width: 'calc(100% - 60px)',
                        height: '67px',
                    }} >
                    <TextField type="text"
                        value={this.state.text}
                        onChange={this.onChange}
                        floatingLabelText={'Message...'}
                        floatingLabelFixed={false}
                        style={{
                            padding: '0 16px 0 16px',
                            marginTop: '0px',
                            alignItems: 'flex-start',
                            width: 'calc(100% - 120px)'
                        }}
                        />
                    <RaisedButton label="send"
                        style={{
                            width: '120px',
                            margin: '30px 0 0 30px'
                        }}
                        disabled={!this.state.btnState}
                        onTouchTap={this.handleSubmit}
                        />
                </form>
                <MessageImageForm />
                <Snackbar
                    open={this.state.open}
                    message={this.state.message}
                    autoHideDuration={2000}
                    onRequestClose={this.handleRequestClose}
                    />
            </div>
        )
    }
});


var MessageItems = React.createClass({
    componentWillMount: function () {
        this.database = firebase.database();
        this.auth = firebase.auth();
    },
    getInitialState: function () {
        return { imgSrc: '' }
    },
    render: function () {
        var createItem = function (message, index) {
            var divStyle = { backgroundImage: 'url(' + message.photoURL + ')' };
            var myKey = message['.key'];
            if (message.picUrl) {
                var divStyle = { backgroundImage: 'url(' + message.picUrl + ')' };
            }
            if (message.text) {
                var myText = message.text;
                myText.replace(/\n/g, '<br>');
                return (
                    <div className="message-container" key={myKey} style={{ paddingLeft: '10px' }} ref={function (element) {
                        if (element) {
                            setTimeout(function () { element.classList.add('visible') }, 1);
                        }
                    } }>
                        <div style={{
                            display: 'table-cell',
                            verticalAlign: 'top',
                        }}><div className="pic" style={divStyle} ></div></div>
                        <div style={{
                            display: ' table-cell',
                            width: 'calc(100% - 40px)',
                            padding: '5px 0 5px 10px'
                        }}>{myText}</div>
                        <div style={{
                            display: 'inline - block',
                            width: '100 %',
                            paddingLeft: '40px',
                            color: '#bbb',
                            fontStyle: 'italic',
                            fontSize: '12px',
                            boxSizing: 'border-box',
                        }}>{message.name} || {myKey}</div>
                    </div >
                );
            } else if (message.imageUrl) {
                if (message.imageUrl.startsWith('gs://')) {
                    return (
                        <div className="message-container" style={{ paddingLeft: '10px' }} key={myKey} ref={function (element) {
                            if (element) {
                                setTimeout(function () { element.classList.add('visible') }, 1);
                            }
                        } }>
                            <div className="spacing"><div className="pic" style={divStyle} ></div></div>
                            <div className="message"><img ref={function (element) {
                                // why do I have to use firebase.storage() directly here?
                                firebase.storage().refFromURL(message.imageUrl).getMetadata().then(function (metadata) {
                                    element.src = metadata.downloadURLs[0];
                                });
                            } } /></div>
                            <div className="name">{message.name} || {myKey}</div>
                        </div>
                    )
                } else {
                    return (
                        <div className="message-container" style={{ paddingLeft: '10px' }} key={myKey} ref={function (element) {
                            if (element) {
                                setTimeout(function () { element.classList.add('visible') }, 1);
                            }
                        } }>
                            <div className="spacing"><div className="pic" style={divStyle} ></div></div>
                            <div className="message"><img src={message.imageUrl} /></div>
                            <div className="name">{message.name} || {myKey}</div>
                        </div>
                    )
                }
            }
        };
        return (
            <div id="messages">
                <span id="message-filler"></span>
                { this.props.messages.map(createItem) }
            </div>
        );
    }
});

var MessageList = React.createClass({
    // reactfire database mixin helper
    // https://github.com/firebase/reactfire
    mixins: [ReactFireMixin],
    getInitialState: function () {
        return {
            messages: []
        }
    },
    cancelCallBack: function () {
        // clears message field if not authorized by Firebase (logged out)
        this.setState({ messages: [] });
    },
    initFb: function () {
        this.firebaseRefs = firebase.database().ref('messages');
        this.firebaseRefs.off();
        this.bindAsArray(this.firebaseRefs.limitToLast(12), 'messages', this.cancelCallBack);
    },
    componentWillUnmount: function () {
        this.firebaseRefs.off();
    },
    componentWillMount: function () {
        this.initFb();
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                this.initFb();
            }
        }.bind(this));
    },
    componentDidUpdate: function () {
        // scroll the message window.  Does not work well (at all) with images.
        this.messageList = document.getElementById('messages');
        this.messageList.scrollTop = this.messageList.scrollHeight;
    },
    render: function () {
        return (
            <MessageItems messages={ this.state.messages } />
        )
    }
});

var MessageContainer = React.createClass({
    render: function () {
        // Had to remove the "mdl-card" class from the message-card element.
        // it was interfering with the Material-ui Snackbar component.
        // an overflow element was being set to hidden.  I have not been
        // able to locate it in the css files.
        return (
            <main>
                <Paper style={{
                    minWidth: '427px',
                    width: '488px',
                    margin: '24px',
                    height: '703px'
                }}>
                    <MessageList />
                    <MessageTextForm/>
                </Paper>
            </main>
        )
    }
});

var AppRight = React.createClass({
    componentWillMount: function () {
        this.auth = firebase.auth();
    },
    getInitialState: function () {
        return {
            uAuth: false, picSrc: '', userName: '', userContainer: {}
        };
    },
    componentDidMount: function () {
        this.auth.onAuthStateChanged(function (user) {
            if (user) {
                var profilePicUrl = user.photoURL;
                var userName = user.displayName;
                this.setState({
                    uAuth: true, userName: userName, picSrc: profilePicUrl
                });
            } else {
                this.setState({
                    uAuth: false, userName: '', picSrc: ''
                });
            }
        }.bind(this));
    },
    clickHandler: function () {
        console.log('click');
        if (!this.auth.currentUser) {
            var provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('https://www.googleapis.com/auth/plus.login');
            this.auth.signInWithPopup(provider).then(function (result) {
                var token = result.credential.accessToken;
                var authUser = result.user;
            }).catch(function (error) {
                // Handle Errors here.
                var errorCode = error.code;
                var errorMessage = error.message;
                // The email of the user's account used.
                var email = error.email;
                // The firebase.auth.AuthCredential type that was used.
                var credential = error.credential;
                // [START_EXCLUDE]
                if (errorCode === 'auth/account-exists-with-different-credential') {
                    alert('You have already signed up with a different auth provider for that email.');
                    // If you are using multiple auth providers on your app you should handle linking
                    // the user's accounts here.
                } else {
                    console.error(error);
                }
            });
        } else {
            this.auth.signOut();
        }
    },
    render: function () {
        return (
            <div>
                <FlatButton label='Sign-in with google' onTouchTap={this.clickHandler} hidden={this.state.uAuth} style={{
                    color: '#FFFFFF',
                    fontSize: '16px',
                    top: '13px',
                    right: '-20px',
                    position: 'relative',
                }} >
                    <ActionAccountCircle style={{
                        color: '#FFFFFF',
                        width: 36,
                        height: 36,
                        top: '-1px',
                        right: '-12px',
                        position: 'relative'
                    }}  />
                </FlatButton>
                <Avatar src={this.state.picSrc} hidden={!this.state.uAuth}
                    style={{
                        position: 'relative',
                        right: '0px',
                        top: '10px',
                        width: '40px',
                        height: '40px',
                        backgroundSize: '40px',
                        backgroundRepeat: 'no-repeat',
                        boarderRadius: '20px'
                    }} />
                <span style={{
                    fontSize: '16px',
                    position: 'relative',
                    top: '10px',
                    paddingLeft: '20px'
                }}>{this.state.userName}</span>
                <FlatButton label={'Sign-out'} onTouchTap={this.clickHandler} hidden={!this.state.uAuth} style={{
                    color: '#FFFFFF',
                    fontSize: '16px',
                    paddingLeft: '10px',
                    paddingRight: '10px',
                    justifyContent: 'flex-end',
                    top: '10px',
                    position: 'relative'
                }}>
                </FlatButton>
            </div>
        )
    }
});

var HeaderSection = React.createClass({
    render: function () {
        return (
            <header>
                <AppBar
                    title={'Friendly Chat ReactJS'}
                    iconElementLeft={<CommunicationChatBubbleOutline style={
                        {
                            width: 38,
                            height: 38,
                            color: '#FFFFFF',
                            top: '14px',
                            position: 'relative'
                        }
                    }/>}
                    iconElementRight={<AppRight />}
                    style={{
                        backgroundColor: '#0288D1',
                        color: '#FFFFFF',
                        minHeight: '72px',
                        paddingLeft: '40px'
                    }}
                    titleStyle={{ fontSize: '32px', paddingTop: '6px' }}
                    />
            </header>
        )
    }
});

var MainAppWrapper = React.createClass({
    render: function () {
        return (
            <div>
                <HeaderSection />
                <MessageContainer />
            </div>
        )
    }
});

var MainApp = React.createClass({
    render: function () {
        return (
            <div>
                <MuiThemeProvider>
                    <MainAppWrapper/>
                </MuiThemeProvider>
            </div>
        )
    }
});

ReactDOM.render(<MainApp />, document.getElementById('mainApp'));