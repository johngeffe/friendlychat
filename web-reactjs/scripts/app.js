var SnackBar = React.createClass({
    render: function () {
        return (
            <div>
                <div id="must-signin-snackbar" className="mdl-js-snackbar mdl-snackbar" >
                    <div className="mdl-snackbar__text"></div>
                    <button className="mdl-snackbar__action" type="button"></button>
                </div >
            </div>
        )
    }
});

var MessageTextForm = React.createClass({
    onChange: function (e) {
        this.setState({ text: e.target.value });
    },
    getInitialState: function () {
        return { text: '', btnState: false, messages: [] };
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
            var data = {
                message: 'You must sign-in first',
                timeout: 2000
            };
            this.signInSnackbar = document.getElementById('must-signin-snackbar');
            this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
        }
    },
    componentWillMount: function () {
        this.firebaseRefs = firebase.database().ref('messages');
        this.auth = firebase.auth();
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
            <form id="message-form" action="#">
                <div className="mdl-textfield mdl-js-textfield mdl-textfield--floating-label">
                    <input className="mdl-textfield__input" type="text" id="message" onChange={this.onChange} value={this.state.text}/>
                    <label className="mdl-textfield__label" htmlFor="message">Message...</label>
                </div>
                <button id="submit" disabled={!this.state.btnState} type="submit" onClick={this.handleSubmit} className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect">
                    Send
                </button>
            </form>
        )
    }
});

var MessageImageForm = React.createClass({
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
            imgElement.src = FriendlyChat.LOADING_IMAGE_URL; // Display a loading image first.
            this.storage.refFromURL(imageUri).getMetadata().then(function (metadata) {
                imgElement.src = metadata.downloadURLs[0];
            });
        } else {
            imgElement.src = imageUri;
        }
    },
    saveImageMessage: function (event) {
        var file = event.target.files[0];
        // Clear the selection in the file picker input.
        this.imageForm.reset();
        if (!file.type.match('image.*')) {
            var data = {
                message: 'You can only share images',
                timeout: 2000
            };
            //         this.signInSnackbar = document.getElementById('must-signin-snackbar');
            //         this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
            console.log(data.message);
            return;
        }
    },
    handleClick: function (e) {
        e.preventDefault();
        var file = e.target.files[0];
        console.log(file);
        if (!file.type.match('image.*')) {
            var data = {
                message: 'You can only share images',
                timeout: 2000
            };
            this.signInSnackbar = document.getElementById('must-signin-snackbar');
            this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
            return;
        }
        if (this.auth.currentUser) {
            var currentUser = this.auth.currentUser;
            console.log(currentUser.displayName);
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
            var data = {
                message: 'You must sign-in first',
                timeout: 2000
            };
            this.signInSnackbar = document.getElementById('must-signin-snackbar');
            this.signInSnackbar.MaterialSnackbar.showSnackbar(data);
        }
    },
    render: function () {
        return (
            <form id="image-form" action="#">
                <input id="mediaCapture" type="file" accept="image/*,capture=camera" onChange={this.handleClick} />
                <button id="submitImage" title="Add an image" onClick={function () {
                    this.mediaCapture.click();
                }.bind(this) } className="mdl-button mdl-js-button mdl-button--raised mdl-js-ripple-effect mdl-color--amber-400 mdl-color-text--white">
                    <i className="material-icons">image</i>
                </button>
            </form>
        )
    }
});

var MessageItems = React.createClass({
    componentDidMount: function () {
        this.database = firebase.database();
        this.auth = firebase.auth();
        this.storage = firebase.storage();
    },
    getInitialState: function () {
        return { imgSrc: '' }
    },
    render: function () {
        //setTimeout(function() {this.classList.add('visible')}, 1);
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
                    <div className="message-container" key={myKey} ref={function (element) {
                        if (element) {
                            setTimeout(function () { element.classList.add('visible') }, 1);
                        }
                    } }>
                        <div className="spacing"><div className="pic" style={divStyle} ></div></div>
                        <div className="message">{myText}</div>
                        <div className="name">{message.name} || {myKey}</div>
                    </div>
                );
            } else if (message.imageUrl) {
                if (message.imageUrl.startsWith('gs://')) {
                    return (
                        <div className="message-container" key={myKey} ref={function (element) {
                            if (element) {
                                setTimeout(function () { element.classList.add('visible') }, 5);
                            }
                        } }>
                            <div className="spacing"><div className="pic" style={divStyle} ></div></div>
                            <div className="message"><img ref={function (element) {
                                firebase.storage().refFromURL(message.imageUrl).getMetadata().then(function (metadata) {
                                    element.src = metadata.downloadURLs[0];
                                });
                            } } /></div>
                            <div className="name">{message.name} || {myKey}</div>
                        </div>
                    )
                } else {
                    return (
                        <div className="message-container" key={myKey} ref={function (element) {
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
        return (
            <main className="mdl-layout__content mdl-color--grey-100">
                <div id="messages-card-container" className="mdl-cell mdl-cell--12-col mdl-grid">
                    <div id="messages-card" className="mdl-card mdl-shadow--2dp mdl-cell mdl-cell--12-col mdl-cell--6-col-tablet mdl-cell--6-col-desktop">
                        <div className="mdl-card__supporting-text mdl-color-text--grey-600">
                            <MessageList />
                            <MessageTextForm {...this.props} />
                            <MessageImageForm {...this.props} />
                        </div>
                    </div>
                </div>
            </main>
        )
    }
});

var UserContainer = React.createClass({
    componentWillMount: function () {
        this.database = firebase.database();
        this.auth = firebase.auth();
        this.storage = firebase.storage();
    },
    getInitialState: function () {
        var divStyle = {
            backgroundImage: 'url(/images/profile_placeholder.png)'
        };
        return { uAuth: false, userName: 'No User', photoStyle: divStyle, photoURL: 'url(/images/profile_placeholder.png)' };
    },
    componentDidMount: function () {
        this.auth.onAuthStateChanged(function (user) {
            if (user) {
                var profilePicUrl = user.photoURL;
                var userName = user.displayName;
                var divStyle = {
                    backgroundImage: 'url(' + (profilePicUrl || '/images/profile_placeholder.png') + ')'
                };
                this.setState({ uAuth: true, userName: userName, photoStyle: divStyle, photoURL: profilePicUrl });
            } else {
                var divStyle = {
                    backgroundImage: 'url(/images/profile_placeholder.png)'
                };
                this.setState({ uAuth: false, userName: '', photoStyle: divStyle, photoURL: 'url(/images/profile_placeholder.png)' });
            }
        }.bind(this));
    },
    clickHandler: function () {
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
            <div id="user-container">
                <div hidden={!this.state.uAuth} id="user-pic" style={this.state.photoStyle}></div>
                <div hidden={!this.state.uAuth} id="user-name" >{this.state.userName}</div>
                <button hidden={!this.state.uAuth} id="sign-out" onClick={this.clickHandler} className="mdl-button mdl-js-button mdl-js-ripple-effect mdl-color-text--white">
                    Sign-out
                </button>
                <button hidden={this.state.uAuth} id="sign-in" onClick={this.clickHandler} className="mdl-button mdl-js-button mdl-js-ripple-effect mdl-color-text--white">
                    <i className="material-icons">account_circle</i>Sign-in with Google
                </button>
            </div>
        )
    }
});

var HeaderSection = React.createClass({
    render: function () {
        return (
            <header className="mdl-layout__header mdl-color-text--white mdl-color--light-blue-700">
                <div className="mdl-cell mdl-cell--12-col mdl-cell--12-col-tablet mdl-grid">
                    <div className="mdl-layout__header-row mdl-cell mdl-cell--12-col mdl-cell--12-col-tablet mdl-cell--12-col-desktop">
                        <h3><i className="material-icons">chat_bubble_outline</i> Friendly Chat ReactJS</h3>
                    </div>
                    <UserContainer />
                </div>
            </header>
        )
    }
});

var MainApp = React.createClass({
    componentWillMount: function () {
        this.database = firebase.database();
        this.auth = firebase.auth();
        this.storage = firebase.storage();
    },
    componentDidMount: function () {
        // this is necessary for Material Design Lite.
        componentHandler.upgradeDom();
    },
    render: function () {
        return (
            <div className="demo-layout mdl-layout mdl-js-layout mdl-layout--fixed-header">
                <HeaderSection />
                <MessageContainer />
                <SnackBar />
            </div>
        )
    }
})

ReactDOM.render(<MainApp />, document.getElementById('mainApp'));